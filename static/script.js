// Variables globales para el sistema de autenticación
let usuarioLogueado = null;
let carrito = [];
let productosReserva = [];

// Cargar computadoras y promociones al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarComputadoras();
    cargarPromociones();
    configurarFormularios();
    configurarMenuMobile();
    configurarLogin();
    configurarPanelAdmin();
    cargarMenu();
});

// ========== FUNCIONES PRINCIPALES EXISTENTES ==========

// Cargar lista de computadoras
async function cargarComputadoras() {
    try {
        const response = await fetch('/api/computadoras');
        const computadoras = await response.json();
        
        const container = document.getElementById('computadoras-list');
        const select = document.getElementById('computadora');
        
        container.innerHTML = '';
        select.innerHTML = '<option value="">Selecciona una computadora</option>';
        
        computadoras.forEach(pc => {
            // Crear tarjeta para la computadora
            const card = document.createElement('div');
            card.className = 'computadora-card';
            card.innerHTML = `
                <div class="computadora-header">
                    <span class="computadora-marca">${pc.marca}</span>
                    <span class="computadora-precio">S/. ${pc.precio_hora}/hora</span>
                </div>
                <div class="computadora-modelo">${pc.modelo}</div>
                <div class="${pc.disponible ? 'disponible' : 'no-disponible'}">
                    ${pc.disponible ? '✅ Disponible' : '❌ No disponible'}
                </div>
            `;
            container.appendChild(card);
            
            // Agregar opción al select
            if (pc.disponible) {
                const option = document.createElement('option');
                option.value = pc.id;
                option.textContent = `${pc.marca} ${pc.modelo} - S/. ${pc.precio_hora}/hora`;
                option.setAttribute('data-precio', pc.precio_hora);
                select.appendChild(option);
            }
        });
        
        // Configurar cálculo de precio después de cargar computadoras
        configurarCalculoPrecio();
        
    } catch (error) {
        console.error('Error cargando computadoras:', error);
    }
}

// Cargar promociones
async function cargarPromociones() {
    try {
        const response = await fetch('/api/promociones');
        const promociones = await response.json();
        
        const container = document.getElementById('promociones-list');
        container.innerHTML = '';
        
        promociones.forEach(promo => {
            const card = document.createElement('div');
            card.className = 'promocion-card';
            card.innerHTML = `
                <h3 class="promocion-titulo">${promo.titulo}</h3>
                <p class="promocion-descripcion">${promo.descripcion}</p>
                <div class="promocion-vigencia">${promo.vigencia}</div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error cargando promociones:', error);
    }
}

// Configurar formularios
function configurarFormularios() {
    // Formulario de reserva - MEJORADO con productos
    const formReserva = document.getElementById('form-reserva');
    formReserva.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Verificar si hay usuario logueado
        if (!usuarioLogueado || usuarioLogueado.tipo !== 'cliente') {
            alert('❌ Debes iniciar sesión como cliente para realizar una reserva');
            document.getElementById('login-modal').style.display = 'block';
            return;
        }
        
        const formData = new FormData(this);
        const computadoraId = parseInt(formData.get('computadora'));
        const horas = parseInt(formData.get('horas'));
        
        // Calcular precio correcto desde el backend
        try {
            const responseComputadoras = await fetch('/api/computadoras');
            const computadoras = await responseComputadoras.json();
            const computadora = computadoras.find(pc => pc.id === computadoraId);
            
            if (!computadora) {
                alert('❌ Computadora no encontrada');
                return;
            }
            
            const precioReal = computadora.precio_hora;
            const totalComputadora = precioReal * horas;
            const totalProductos = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
            const totalFinal = totalComputadora + totalProductos;
            
            // Mostrar confirmación con el precio real
            let mensajeConfirmacion = `¿Confirmar reserva?\n\n` +
                `Computadora: ${computadora.marca} ${computadora.modelo}\n` +
                `Horas: ${horas}\n` +
                `Precio por hora: S/. ${precioReal.toFixed(2)}\n` +
                `Total computación: S/. ${totalComputadora.toFixed(2)}`;
            
            if (carrito.length > 0) {
                mensajeConfirmacion += `\n\nProductos:\n${carrito.map(item => 
                    `• ${item.nombre} x${item.cantidad} - S/. ${(item.precio * item.cantidad).toFixed(2)}`
                ).join('\n')}` +
                `\nTotal cafetería: S/. ${totalProductos.toFixed(2)}`;
            }
            
            mensajeConfirmacion += `\n\nTOTAL FINAL: S/. ${totalFinal.toFixed(2)}\n\n¿Deseas continuar?`;
            
            const confirmacion = confirm(mensajeConfirmacion);
            
            if (!confirmacion) {
                return;
            }
            
            const data = {
                computadora_id: computadoraId,
                horas: horas,
                fecha: formData.get('fecha'),
                nombre: usuarioLogueado.nombre,
                telefono: usuarioLogueado.telefono,
                cliente_id: usuarioLogueado.id,
                productos: carrito.map(item => ({
                    id: item.id,
                    cantidad: item.cantidad
                }))
            };
            
            const response = await fetch('/api/reservar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                let mensajeExito = `✅ Reserva realizada con éxito!\n\nID de reserva: ${result.reserva_id}\n`;
                mensajeExito += `Total computación: S/. ${result.total_computadora.toFixed(2)}\n`;
                if (result.total_productos > 0) {
                    mensajeExito += `Total cafetería: S/. ${result.total_productos.toFixed(2)}\n`;
                }
                mensajeExito += `TOTAL: S/. ${result.total.toFixed(2)}`;
                
                alert(mensajeExito);
                formReserva.reset();
                limpiarCarrito();
                calcularPrecio(); // Resetear display de precios
                
                // Actualizar panel admin si está logueado
                if (usuarioLogueado && usuarioLogueado.tipo === 'admin') {
                    actualizarEstadisticas();
                    cargarReservasAdmin();
                }
            } else {
                alert('❌ Error al realizar la reserva: ' + result.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al conectar con el servidor');
        }
    });
    
    // Formulario de taxi
    const formTaxi = document.getElementById('form-taxi');
    formTaxi.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = {
            direccion: formData.get('direccion'),
            referencia: formData.get('referencia'),
            telefono: formData.get('telefono')
        };
        
        try {
            const response = await fetch('/api/solicitar_taxi', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('✅ ' + result.message + '\nNúmero de taxi: ' + result.numero_taxi);
                formTaxi.reset();
            } else {
                alert('❌ Error al solicitar taxi');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Error al conectar con el servidor');
        }
    });
}

// Configurar menú móvil
function configurarMenuMobile() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    hamburger.addEventListener('click', function() {
        navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
    });
    
    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                navMenu.style.display = 'none';
            }
        });
    });
}

// Smooth scroll para enlaces del menú
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ========== SISTEMA DE AUTENTICACIÓN ==========

function configurarLogin() {
    const loginBtn = document.getElementById('login-btn');
    const modal = document.getElementById('login-modal');
    const closeBtn = document.querySelector('.close');
    const formLogin = document.getElementById('form-login');
    
    loginBtn.addEventListener('click', function() {
        modal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    formLogin.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const email = formData.get('email');
        const password = formData.get('password');
        const tipo = formData.get('tipo_usuario');
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, tipo_usuario: tipo })
            });
            
            const result = await response.json();
            
            if (result.success) {
                usuarioLogueado = result.usuario;
                modal.style.display = 'none';
                document.getElementById('login-message').textContent = '';
                
                // Actualizar interfaz según el tipo de usuario
                if (usuarioLogueado.tipo === 'admin') {
                    mostrarPanelAdmin();
                    // Ocultar secciones principales si es admin
                    document.querySelectorAll('section, footer').forEach(el => {
                        el.style.display = 'none';
                    });
                } else {
                    // Mostrar mensaje de bienvenida para clientes
                    mostrarNotificacion(`Bienvenido ${usuarioLogueado.nombre}`);
                    // Mostrar todas las secciones para clientes
                    document.querySelectorAll('section, footer').forEach(el => {
                        el.style.display = 'block';
                    });
                }
                
                // Actualizar botón de login
                actualizarBotonLogin();
                
            } else {
                document.getElementById('login-message').textContent = result.message;
                document.getElementById('login-message').style.color = 'red';
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('login-message').textContent = 'Error al conectar con el servidor';
            document.getElementById('login-message').style.color = 'red';
        }
    });
}

// Función para actualizar el botón de login
function actualizarBotonLogin() {
    const loginBtn = document.getElementById('login-btn');
    if (usuarioLogueado) {
        loginBtn.textContent = `Cerrar Sesión (${usuarioLogueado.nombre})`;
        loginBtn.onclick = cerrarSesion;
        
        // Si es cliente, pre-llenar información en el formulario de reserva
        if (usuarioLogueado.tipo === 'cliente') {
            document.getElementById('nombre').value = usuarioLogueado.nombre;
            document.getElementById('telefono').value = usuarioLogueado.telefono || '';
            
            // Hacer los campos de nombre y teléfono de solo lectura
            document.getElementById('nombre').readOnly = true;
            document.getElementById('telefono').readOnly = true;
        }
    } else {
        loginBtn.textContent = 'Iniciar Sesión';
        loginBtn.onclick = function() {
            document.getElementById('login-modal').style.display = 'block';
        };
        
        // Restaurar campos a editables
        document.getElementById('nombre').readOnly = false;
        document.getElementById('telefono').readOnly = false;
    }
}

// Modificar la función cerrarSesion
function cerrarSesion() {
    usuarioLogueado = null;
    document.getElementById('admin-panel').style.display = 'none';
    
    // Mostrar todas las secciones principales
    document.querySelectorAll('section, footer').forEach(el => {
        el.style.display = 'block';
    });
    
    // Limpiar formulario de reserva
    document.getElementById('form-reserva').reset();
    document.getElementById('nombre').readOnly = false;
    document.getElementById('telefono').readOnly = false;
    
    // Limpiar carrito
    limpiarCarrito();
    
    actualizarBotonLogin();
}

// ========== SISTEMA DE CAFETERÍA ==========

// Cargar menú de productos
async function cargarMenu() {
    try {
        const response = await fetch('/api/productos');
        const productos = await response.json();
        
        const container = document.getElementById('menu-list');
        container.innerHTML = '';
        
        productos.forEach(producto => {
            const card = document.createElement('div');
            card.className = 'producto-card';
            card.setAttribute('data-categoria', producto.categoria);
            card.innerHTML = `
                <div class="producto-header">
                    <h4 class="producto-nombre">${producto.nombre}</h4>
                    <span class="producto-precio">S/. ${producto.precio.toFixed(2)}</span>
                </div>
                <span class="producto-categoria">${producto.categoria}</span>
                <p class="producto-descripcion">${producto.descripcion}</p>
                <button class="btn-agregar" onclick="agregarAlCarrito(${producto.id})">
                    ➕ Agregar al Carrito
                </button>
            `;
            container.appendChild(card);
        });
        
        configurarFiltrosMenu();
        configurarCarrito();
        
    } catch (error) {
        console.error('Error cargando menú:', error);
    }
}

// Configurar filtros del menú
function configurarFiltrosMenu() {
    const botones = document.querySelectorAll('.categoria-btn');
    
    botones.forEach(boton => {
        boton.addEventListener('click', function() {
            // Remover active de todos los botones
            botones.forEach(btn => btn.classList.remove('active'));
            // Agregar active al botón clickeado
            this.classList.add('active');
            
            const categoria = this.getAttribute('data-categoria');
            filtrarMenu(categoria);
        });
    });
}

// Filtrar productos del menú
function filtrarMenu(categoria) {
    const productos = document.querySelectorAll('.producto-card');
    
    productos.forEach(producto => {
        if (categoria === 'todos' || producto.getAttribute('data-categoria') === categoria) {
            producto.style.display = 'block';
        } else {
            producto.style.display = 'none';
        }
    });
}

// Configurar funcionalidad del carrito
function configurarCarrito() {
    document.getElementById('limpiar-carrito').addEventListener('click', limpiarCarrito);
    document.getElementById('agregar-reserva').addEventListener('click', agregarCarritoAReserva);
}

// Agregar producto al carrito
function agregarAlCarrito(productoId) {
    // Obtener producto del backend
    fetch('/api/productos')
        .then(response => response.json())
        .then(productos => {
            const producto = productos.find(p => p.id === productoId);
            if (!producto) return;
            
            const itemExistente = carrito.find(item => item.id === productoId);
            
            if (itemExistente) {
                itemExistente.cantidad++;
            } else {
                carrito.push({
                    id: producto.id,
                    nombre: producto.nombre,
                    precio: producto.precio,
                    cantidad: 1
                });
            }
            
            actualizarCarrito();
            mostrarNotificacion(`${producto.nombre} agregado al carrito`);
        })
        .catch(error => {
            console.error('Error al agregar producto:', error);
        });
}

// Actualizar visualización del carrito
function actualizarCarrito() {
    const container = document.getElementById('carrito-items');
    const totalElement = document.getElementById('total-carrito');
    const botonAgregar = document.getElementById('agregar-reserva');
    
    if (carrito.length === 0) {
        container.innerHTML = '<p class="carrito-vacio">El carrito está vacío</p>';
        botonAgregar.disabled = true;
        totalElement.textContent = '0.00';
        return;
    }
    
    container.innerHTML = '';
    let total = 0;
    
    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'carrito-item';
        itemElement.innerHTML = `
            <div class="item-info">
                <div class="item-nombre">${item.nombre}</div>
                <div class="item-precio">S/. ${item.precio.toFixed(2)} c/u</div>
            </div>
            <div class="item-cantidad">
                <button class="btn-cantidad" onclick="modificarCantidad(${index}, -1)">-</button>
                <span>${item.cantidad}</span>
                <button class="btn-cantidad" onclick="modificarCantidad(${index}, 1)">+</button>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${index})">🗑️</button>
            </div>
        `;
        container.appendChild(itemElement);
    });
    
    totalElement.textContent = total.toFixed(2);
    botonAgregar.disabled = false;
}

// Modificar cantidad de items en el carrito
function modificarCantidad(index, cambio) {
    carrito[index].cantidad += cambio;
    
    if (carrito[index].cantidad <= 0) {
        carrito.splice(index, 1);
    }
    
    actualizarCarrito();
}

// Eliminar item del carrito
function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

// Limpiar todo el carrito
function limpiarCarrito() {
    carrito = [];
    actualizarCarrito();
    mostrarNotificacion('Carrito limpiado');
}

// Agregar carrito a la reserva
function agregarCarritoAReserva() {
    if (carrito.length === 0) return;
    
    const totalProductos = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    
    mostrarNotificacion(`✅ ${carrito.length} productos agregados al carrito de reserva - Total: S/. ${totalProductos.toFixed(2)}`);
    
    // Los productos se enviarán automáticamente con el formulario de reserva
}

// ========== PANEL DE ADMINISTRACIÓN ==========

function configurarPanelAdmin() {
    // Tabs
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remover clase active de todos los botones y paneles
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // Agregar clase active al botón y panel actual
            this.classList.add('active');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
    
    // Botón de logout
    document.getElementById('logout-btn').addEventListener('click', cerrarSesion);
    
    // Botón agregar computadora
    document.getElementById('agregar-pc').addEventListener('click', function() {
        alert('Funcionalidad para agregar computadoras - Próximamente');
    });
    
    // Botón agregar producto
    document.getElementById('agregar-producto').addEventListener('click', function() {
        alert('Funcionalidad para agregar productos - Próximamente');
    });
}

function mostrarPanelAdmin() {
    document.getElementById('admin-panel').style.display = 'block';
    actualizarEstadisticas();
    cargarReservasAdmin();
    cargarComputadorasAdmin();
    cargarProductosAdmin();
    cargarClientesAdmin();
}

// Funciones del Panel de Administración
async function actualizarEstadisticas() {
    try {
        const response = await fetch('/api/estadisticas');
        const stats = await response.json();
        
        document.getElementById('total-ventas').textContent = `S/. ${stats.ventas_totales.toFixed(2)}`;
        document.getElementById('ventas-computadoras').textContent = `S/. ${stats.ventas_computadoras.toFixed(2)}`;
        document.getElementById('ventas-productos').textContent = `S/. ${stats.ventas_productos.toFixed(2)}`;
        document.getElementById('reservas-mes').textContent = stats.reservas_mes;
        document.getElementById('computadoras-activas').textContent = stats.computadoras_activas;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

async function cargarReservasAdmin() {
    try {
        const response = await fetch('/api/reservas');
        const reservas = await response.json();
        
        const tbody = document.getElementById('reservas-body');
        tbody.innerHTML = '';
        
        reservas.forEach(reserva => {
            const productosHTML = reserva.productos && reserva.productos.length > 0 
                ? `<div class="reserva-productos">
                     ${reserva.productos.map(p => 
                         `<div class="producto-item">
                            ${p.nombre} x${p.cantidad} - S/. ${p.subtotal.toFixed(2)}
                          </div>`
                     ).join('')}
                   </div>`
                : '<div class="reserva-productos">Sin productos</div>';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${reserva.id}</td>
                <td>
                    ${reserva.cliente_nombre || 'Cliente ' + reserva.cliente_id}
                    ${productosHTML}
                </td>
                <td>PC ${reserva.computadora_id}</td>
                <td>${reserva.horas}</td>
                <td>
                    <div><strong>S/. ${reserva.total.toFixed(2)}</strong></div>
                    <div style="font-size: 0.8rem; color: #666;">
                        Computación: S/. ${reserva.total_computadora.toFixed(2)}<br>
                        Cafetería: S/. ${reserva.total_productos.toFixed(2)}
                    </div>
                </td>
                <td>${reserva.fecha}</td>
                <td><span class="estado ${reserva.estado}">${reserva.estado}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error cargando reservas:', error);
    }
}

async function cargarComputadorasAdmin() {
    try {
        const response = await fetch('/api/computadoras');
        const computadoras = await response.json();
        
        const tbody = document.getElementById('computadoras-body');
        tbody.innerHTML = '';
        
        computadoras.forEach(pc => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pc.id}</td>
                <td>${pc.marca}</td>
                <td>${pc.modelo}</td>
                <td>S/. ${pc.precio_hora.toFixed(2)}</td>
                <td><span class="${pc.disponible ? 'disponible' : 'no-disponible'}">${pc.disponible ? 'Disponible' : 'No disponible'}</span></td>
                <td>
                    <button class="btn-action btn-edit" data-id="${pc.id}">Editar</button>
                    <button class="btn-action btn-delete" data-id="${pc.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                alert(`Editar computadora ${id} - Próximamente`);
            });
        });
        
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('¿Estás seguro de eliminar esta computadora?')) {
                    alert(`Eliminar computadora ${id} - Próximamente`);
                }
            });
        });
    } catch (error) {
        console.error('Error cargando computadoras:', error);
    }
}

// Nueva función para cargar productos en el panel admin
async function cargarProductosAdmin() {
    try {
        const response = await fetch('/api/productos');
        const productos = await response.json();
        
        const tbody = document.getElementById('productos-body');
        tbody.innerHTML = '';
        
        productos.forEach(producto => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${producto.id}</td>
                <td>${producto.nombre}</td>
                <td><span class="categoria-badge ${producto.categoria}">${producto.categoria}</span></td>
                <td>S/. ${producto.precio.toFixed(2)}</td>
                <td>${producto.descripcion || 'Sin descripción'}</td>
                <td>
                    <button class="btn-action btn-edit-producto" data-id="${producto.id}">Editar</button>
                    <button class="btn-action btn-delete-producto" data-id="${producto.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Agregar event listeners a los botones de productos
        document.querySelectorAll('.btn-edit-producto').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editarProducto(id);
            });
        });
        
        document.querySelectorAll('.btn-delete-producto').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                eliminarProducto(id);
            });
        });
        
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

// Función para editar producto
function editarProducto(id) {
    alert(`Editar producto ${id} - Próximamente`);
}

// Función para eliminar producto
function eliminarProducto(id) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        alert(`Eliminar producto ${id} - Próximamente`);
    }
}

async function cargarClientesAdmin() {
    try {
        const response = await fetch('/api/clientes');
        const clientes = await response.json();
        
        const tbody = document.getElementById('clientes-body');
        tbody.innerHTML = '';
        
        clientes.forEach(cliente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cliente.id}</td>
                <td>${cliente.nombre}</td>
                <td>${cliente.email}</td>
                <td>${cliente.telefono || 'N/A'}</td>
                <td>${cliente.total_reservas}</td>
                <td>S/. ${cliente.total_gastado.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error cargando clientes:', error);
    }
}

// ========== FUNCIONES AUXILIARES ==========

// Función para mostrar notificación
function mostrarNotificacion(mensaje) {
    // Crear notificación temporal
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    `;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        document.body.removeChild(notificacion);
    }, 3000);
}

// Configurar cálculo de precios en tiempo real
function configurarCalculoPrecio() {
    const selectComputadora = document.getElementById('computadora');
    const inputHoras = document.getElementById('horas');
    
    // Crear elementos para mostrar precio y total si no existen
    if (!document.getElementById('precio-display')) {
        const formGroupComputadora = selectComputadora.parentElement;
        const precioElement = document.createElement('div');
        precioElement.id = 'precio-display';
        precioElement.className = 'precio-info';
        precioElement.innerHTML = '<strong>Precio por hora: <span id="precio-valor">S/. 0.00</span></strong>';
        formGroupComputadora.appendChild(precioElement);
    }
    
    if (!document.getElementById('total-display')) {
        const formGroupHoras = inputHoras.parentElement;
        const totalElement = document.createElement('div');
        totalElement.id = 'total-display';
        totalElement.className = 'total-info';
        totalElement.innerHTML = '<strong>Total computación: <span id="total-valor">S/. 0.00</span></strong>';
        formGroupHoras.appendChild(totalElement);
    }
    
    // Event listeners para calcular en tiempo real
    selectComputadora.addEventListener('change', calcularPrecio);
    inputHoras.addEventListener('input', calcularPrecio);
}

function calcularPrecio() {
    const selectComputadora = document.getElementById('computadora');
    const inputHoras = document.getElementById('horas');
    const precioValor = document.getElementById('precio-valor');
    const totalValor = document.getElementById('total-valor');
    
    const computadoraId = selectComputadora.value;
    const horas = parseInt(inputHoras.value) || 0;
    
    if (computadoraId && horas > 0) {
        // Encontrar la computadora seleccionada
        const option = selectComputadora.options[selectComputadora.selectedIndex];
        const precioTexto = option.textContent.split('S/. ')[1]?.split('/')[0];
        const precioHora = parseFloat(precioTexto) || 0;
        
        const total = precioHora * horas;
        
        if (precioValor) precioValor.textContent = `S/. ${precioHora.toFixed(2)}`;
        if (totalValor) totalValor.textContent = `S/. ${total.toFixed(2)}`;
    } else {
        if (precioValor) precioValor.textContent = 'S/. 0.00';
        if (totalValor) totalValor.textContent = 'S/. 0.00';
    }
}
