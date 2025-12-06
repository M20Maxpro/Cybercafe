from flask import Flask, render_template, request, jsonify
import json
from datetime import datetime

app = Flask(__name__, template_folder='.')

# Datos de productos de cafetería
PRODUCTOS = [
    {
        "id": 1, 
        "nombre": "Café Americano", 
        "precio": 5.00, 
        "categoria": "bebidas",
        "descripcion": "Café negro tradicional"
    },
    {
        "id": 2, 
        "nombre": "Café Latte", 
        "precio": 7.00, 
        "categoria": "bebidas",
        "descripcion": "Café con leche vaporizada"
    },
    {
        "id": 3, 
        "nombre": "Capuchino", 
        "precio": 8.00, 
        "categoria": "bebidas",
        "descripcion": "Café espresso con leche espumosa"
    },
    {
        "id": 4, 
        "nombre": "Té Negro", 
        "precio": 4.00, 
        "categoria": "bebidas",
        "descripcion": "Té tradicional inglés"
    },
    {
        "id": 5, 
        "nombre": "Jugo Natural", 
        "precio": 6.00, 
        "categoria": "bebidas",
        "descripcion": "Jugo de frutas natural"
    },
    {
        "id": 6, 
        "nombre": "Sandwich de Pollo", 
        "precio": 12.00, 
        "categoria": "comida",
        "descripcion": "Sandwich con pollo, lechuga y tomate"
    },
    {
        "id": 7, 
        "nombre": "Hamburguesa", 
        "precio": 15.00, 
        "categoria": "comida",
        "descripcion": "Hamburguesa con carne, queso y vegetales"
    },
    {
        "id": 8, 
        "nombre": "Galletas", 
        "precio": 3.00, 
        "categoria": "snacks",
        "descripcion": "Paquete de galletas surtidas"
    },
    {
        "id": 9, 
        "nombre": "Papas Fritas", 
        "precio": 8.00, 
        "categoria": "snacks",
        "descripcion": "Porción de papas fritas"
    },
    {
        "id": 10, 
        "nombre": "Brownie", 
        "precio": 6.00, 
        "categoria": "snacks",
        "descripcion": "Delicioso brownie de chocolate"
    }
]

# Datos de las computadoras
COMPUTADORAS = [
    {"id": 1, "marca": "Apple", "modelo": "iMac 27\"", "precio_hora": 8.00, "disponible": True},
    {"id": 2, "marca": "HP", "modelo": "Pavilion Gaming", "precio_hora": 6.00, "disponible": True},
    {"id": 3, "marca": "Lenovo", "modelo": "ThinkCentre", "precio_hora": 5.50, "disponible": True},
    {"id": 4, "marca": "Dell", "modelo": "OptiPlex", "precio_hora": 5.50, "disponible": True},
    {"id": 5, "marca": "Asus", "modelo": "ROG Strix", "precio_hora": 7.00, "disponible": True},
    {"id": 6, "marca": "Acer", "modelo": "Predator", "precio_hora": 6.50, "disponible": True},
    {"id": 7, "marca": "MSI", "modelo": "Gaming Desktop", "precio_hora": 7.50, "disponible": True},
    {"id": 8, "marca": "Razer", "modelo": "Blade", "precio_hora": 9.00, "disponible": True},
    {"id": 9, "marca": "Huawei", "modelo": "MateStation", "precio_hora": 6.00, "disponible": True},
    {"id": 10, "marca": "Microsoft", "modelo": "Surface Studio", "precio_hora": 8.50, "disponible": True}
]

# Datos de promociones
PROMOCIONES = [
    {
        "titulo": "2x1 en Viernes de Gaming",
        "descripcion": "Todos los viernes, paga 1 hora y lleva 2 horas de gaming",
        "vigencia": "Hasta 31 de Diciembre 2024"
    },
    {
        "titulo": "Pack Estudiantil",
        "descripcion": "5 horas + impresión gratis por S/. 25.00",
        "vigencia": "Promoción permanente"
    },
    {
        "titulo": "Noche Gamer",
        "descripcion": "De 10pm a 6am - 8 horas por S/. 35.00",
        "vigencia": "Todos los fines de semana"
    },
    {
        "titulo": "Combo Gamer + Café",
        "descripcion": "2 horas de gaming + café americano por S/. 15.00",
        "vigencia": "Promoción permanente"
    }
]

# Datos de usuarios para el sistema de autenticación
USUARIOS = [
    {"id": 1, "email": "Duran@cyberspace.com", "password": "admin123", "tipo": "admin", "nombre": "Administrador"},
    {"id": 2, "email": "juan@ejemplo.com", "password": "12345", "tipo": "cliente", "nombre": "Juan Pérez", "telefono": "987654321"},
    {"id": 3, "email": "maria@ejemplo.com", "password": "1234", "tipo": "cliente", "nombre": "Maria Garcia", "telefono": "987654322"},
    {"id": 4, "email": "anastasio@ejemplo.com", "password": "cliente123", "tipo": "cliente", "nombre": "Carlos Anastasio", "telefono": "927634327"},
    {"id": 5, "email": "julio@ejemplo.com", "password": "7576588", "tipo": "cliente", "nombre": "Julian Valva", "telefono": "927003387"},
    {"id": 6, "email": "adriana@ejemplo.com", "password": "45123", "tipo": "cliente", "nombre": "Adriana Bella", "telefono": "911638320"},
    {"id": 7, "email": "fea@ejemplo.com", "password": "123", "tipo": "cliente", "nombre": "Dulce Fina", "telefono": "929934007"},
]

# Datos de reservas para el panel de administración (ACTUALIZADO con productos)
RESERVAS = [
    {
        "id": 1, 
        "cliente_id": 2, 
        "computadora_id": 1, 
        "horas": 3, 
        "total_computadora": 24.00,
        "total_productos": 12.00,
        "total": 36.00,
        "fecha": "2024-01-15 14:00", 
        "estado": "completada", 
        "cliente_nombre": "Juan Pérez",
        "productos": [
            {"id": 1, "nombre": "Café Americano", "precio": 5.00, "cantidad": 1, "subtotal": 5.00},
            {"id": 8, "nombre": "Galletas", "precio": 3.00, "cantidad": 1, "subtotal": 3.00},
            {"id": 10, "nombre": "Brownie", "precio": 6.00, "cantidad": 1, "subtotal": 6.00}
        ]
    },
    {
        "id": 2, 
        "cliente_id": 2, 
        "computadora_id": 3, 
        "horas": 2, 
        "total_computadora": 11.00,
        "total_productos": 7.00,
        "total": 18.00,
        "fecha": "2024-01-16 16:00", 
        "estado": "completada", 
        "cliente_nombre": "Juan Pérez",
        "productos": [
            {"id": 2, "nombre": "Café Latte", "precio": 7.00, "cantidad": 1, "subtotal": 7.00}
        ]
    },
    {
        "id": 3, 
        "cliente_id": 3, 
        "computadora_id": 5, 
        "horas": 4, 
        "total_computadora": 28.00,
        "total_productos": 0.00,
        "total": 28.00,
        "fecha": "2024-01-17 18:00", 
        "estado": "pendiente", 
        "cliente_nombre": "Maria Garcia",
        "productos": []
    }
]

@app.route('/')
def index():
    return render_template('index.html')

# ================== RUTAS DE LA API ==================

# Productos de cafetería
@app.route('/api/productos')
def get_productos():
    return jsonify(PRODUCTOS)

# Computadoras
@app.route('/api/computadoras')
def get_computadoras():
    return jsonify(COMPUTADORAS)

# Promociones
@app.route('/api/promociones')
def get_promociones():
    return jsonify(PROMOCIONES)

# Sistema de reservas ACTUALIZADO con productos
@app.route('/api/reservar', methods=['POST'])
def reservar():
    data = request.json
    computadora_id = data.get('computadora_id')
    horas = data.get('horas')
    fecha = data.get('fecha')
    nombre = data.get('nombre')
    telefono = data.get('telefono')
    cliente_id = data.get('cliente_id')
    productos = data.get('productos', [])  # Nuevo: productos del carrito
    
    # Validaciones
    if not computadora_id:
        return jsonify({"success": False, "message": "Computadora es requerida"}), 400
    
    if not horas or horas < 1:
        return jsonify({"success": False, "message": "Horas deben ser al menos 1"}), 400
    
    if not fecha:
        return jsonify({"success": False, "message": "Fecha es requerida"}), 400
    
    # Buscar computadora
    computadora = next((pc for pc in COMPUTADORAS if pc['id'] == computadora_id), None)
    if not computadora:
        return jsonify({"success": False, "message": "Computadora no encontrada"}), 404
    
    if not computadora['disponible']:
        return jsonify({"success": False, "message": "Computadora no disponible"}), 400
    
    # Calcular total de computadora
    total_computadora = computadora['precio_hora'] * horas
    
    # Calcular total de productos
    total_productos = 0
    productos_detalle = []
    for item in productos:
        producto = next((p for p in PRODUCTOS if p['id'] == item['id']), None)
        if producto:
            subtotal = producto['precio'] * item['cantidad']
            total_productos += subtotal
            productos_detalle.append({
                "id": producto['id'],
                "nombre": producto['nombre'],
                "precio": producto['precio'],
                "cantidad": item['cantidad'],
                "subtotal": subtotal
            })
    
    total_final = total_computadora + total_productos
    
    # Crear nueva reserva
    nueva_reserva = {
        "id": len(RESERVAS) + 1,
        "cliente_id": cliente_id or 2,
        "computadora_id": computadora_id,
        "horas": horas,
        "total_computadora": total_computadora,
        "total_productos": total_productos,
        "total": total_final,
        "fecha": fecha,
        "estado": "pendiente",
        "cliente_nombre": nombre,
        "productos": productos_detalle
    }
    
    RESERVAS.append(nueva_reserva)
    
    # Marcar computadora como no disponible
    computadora['disponible'] = False
    
    print(f"Reserva recibida: {nombre} - PC {computadora_id} - {horas}h - Productos: {len(productos)} - Total: S/. {total_final}")
    
    return jsonify({
        "success": True,
        "message": "Reserva realizada con éxito",
        "reserva_id": nueva_reserva['id'],
        "total": total_final,
        "total_computadora": total_computadora,
        "total_productos": total_productos
    })

# Servicio de taxi
@app.route('/api/solicitar_taxi', methods=['POST'])
def solicitar_taxi():
    data = request.json
    direccion = data.get('direccion')
    referencia = data.get('referencia')
    telefono = data.get('telefono')
    
    # Simulación de solicitud de taxi
    print(f"Taxi solicitado a: {direccion} - Ref: {referencia} - Tel: {telefono}")
    
    return jsonify({
        "success": True,
        "message": "Taxi solicitado. Llegará en 10-15 minutos",
        "numero_taxi": f"T-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    })

# ================== SISTEMA DE AUTENTICACIÓN ==================

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    tipo = data.get('tipo_usuario')
    
    usuario = next((u for u in USUARIOS if u['email'] == email and u['password'] == password and u['tipo'] == tipo), None)
    
    if usuario:
        return jsonify({
            "success": True,
            "usuario": usuario
        })
    else:
        return jsonify({
            "success": False,
            "message": "Credenciales incorrectas"
        }), 401

# ================== PANEL DE ADMINISTRACIÓN ==================

@app.route('/api/estadisticas')
def get_estadisticas():
    # Calcular estadísticas en tiempo real
    ventas_totales = sum(reserva['total'] for reserva in RESERVAS)
    ventas_computadoras = sum(reserva['total_computadora'] for reserva in RESERVAS)
    ventas_productos = sum(reserva['total_productos'] for reserva in RESERVAS)
    promedio_venta = ventas_totales / len(RESERVAS) if RESERVAS else 0
    computadoras_activas = sum(1 for pc in COMPUTADORAS if pc['disponible'])
    
    # Reservas del mes actual
    reservas_mes = len([r for r in RESERVAS if '2024-01' in r['fecha']])
    
    return jsonify({
        "ventas_totales": round(ventas_totales, 2),
        "ventas_computadoras": round(ventas_computadoras, 2),
        "ventas_productos": round(ventas_productos, 2),
        "promedio_venta": round(promedio_venta, 2),
        "reservas_mes": reservas_mes,
        "computadoras_activas": computadoras_activas
    })

@app.route('/api/reservas')
def get_reservas():
    # Ordenar reservas por fecha (más recientes primero)
    reservas_ordenadas = sorted(RESERVAS, key=lambda x: x['fecha'], reverse=True)
    return jsonify(reservas_ordenadas)

@app.route('/api/clientes')
def get_clientes():
    clientes = []
    
    # Procesar cada usuario cliente
    for usuario in USUARIOS:
        if usuario['tipo'] == 'cliente':
            # Encontrar reservas del cliente
            reservas_cliente = [r for r in RESERVAS if r['cliente_id'] == usuario['id']]
            total_gastado = sum(r['total'] for r in reservas_cliente)
            total_reservas = len(reservas_cliente)
            
            clientes.append({
                "id": usuario['id'],
                "nombre": usuario['nombre'],
                "email": usuario['email'],
                "telefono": usuario.get('telefono', 'N/A'),
                "total_reservas": total_reservas,
                "total_gastado": round(total_gastado, 2),
                "ultima_reserva": max([r['fecha'] for r in reservas_cliente]) if reservas_cliente else 'N/A'
            })
    
    # Ordenar clientes por total gastado (mayor a menor)
    clientes_ordenados = sorted(clientes, key=lambda x: x['total_gastado'], reverse=True)
    
    return jsonify(clientes_ordenados)

# ================== GESTIÓN DE COMPUTADORAS ==================

@app.route('/api/computadoras/<int:computadora_id>', methods=['PUT'])
def actualizar_computadora(computadora_id):
    data = request.json
    computadora = next((pc for pc in COMPUTADORAS if pc['id'] == computadora_id), None)
    
    if not computadora:
        return jsonify({"success": False, "message": "Computadora no encontrada"}), 404
    
    # Actualizar campos permitidos
    if 'precio_hora' in data:
        computadora['precio_hora'] = data['precio_hora']
    if 'disponible' in data:
        computadora['disponible'] = data['disponible']
    if 'marca' in data:
        computadora['marca'] = data['marca']
    if 'modelo' in data:
        computadora['modelo'] = data['modelo']
    
    return jsonify({
        "success": True,
        "message": "Computadora actualizada correctamente",
        "computadora": computadora
    })

@app.route('/api/computadoras/<int:computadora_id>', methods=['DELETE'])
def eliminar_computadora(computadora_id):
    global COMPUTADORAS
    computadora = next((pc for pc in COMPUTADORAS if pc['id'] == computadora_id), None)
    
    if not computadora:
        return jsonify({"success": False, "message": "Computadora no encontrada"}), 404
    
    # En una aplicación real, aquí harías un soft delete o verificarías dependencias
    COMPUTADORAS = [pc for pc in COMPUTADORAS if pc['id'] != computadora_id]
    
    return jsonify({
        "success": True,
        "message": "Computadora eliminada correctamente"
    })

@app.route('/api/computadoras', methods=['POST'])
def agregar_computadora():
    data = request.json
    
    # Validar campos requeridos
    campos_requeridos = ['marca', 'modelo', 'precio_hora']
    for campo in campos_requeridos:
        if campo not in data:
            return jsonify({"success": False, "message": f"Campo {campo} es requerido"}), 400
    
    # Crear nueva computadora
    nueva_computadora = {
        "id": max([pc['id'] for pc in COMPUTADORAS]) + 1 if COMPUTADORAS else 1,
        "marca": data['marca'],
        "modelo": data['modelo'],
        "precio_hora": float(data['precio_hora']),
        "disponible": data.get('disponible', True)
    }
    
    COMPUTADORAS.append(nueva_computadora)
    
    return jsonify({
        "success": True,
        "message": "Computadora agregada correctamente",
        "computadora": nueva_computadora
    })

# ================== GESTIÓN DE RESERVAS ==================

@app.route('/api/reservas/<int:reserva_id>', methods=['PUT'])
def actualizar_reserva(reserva_id):
    data = request.json
    reserva = next((r for r in RESERVAS if r['id'] == reserva_id), None)
    
    if not reserva:
        return jsonify({"success": False, "message": "Reserva no encontrada"}), 404
    
    # Actualizar estado
    if 'estado' in data and data['estado'] in ['pendiente', 'completada', 'cancelada']:
        reserva['estado'] = data['estado']
        
        # Si se completa o cancela la reserva, actualizar disponibilidad de la computadora
        if data['estado'] in ['completada', 'cancelada']:
            computadora = next((pc for pc in COMPUTADORAS if pc['id'] == reserva['computadora_id']), None)
            if computadora:
                computadora['disponible'] = True
    
    return jsonify({
        "success": True,
        "message": "Reserva actualizada correctamente",
        "reserva": reserva
    })

# ================== GESTIÓN DE PRODUCTOS ==================

@app.route('/api/productos/<int:producto_id>', methods=['PUT'])
def actualizar_producto(producto_id):
    data = request.json
    producto = next((p for p in PRODUCTOS if p['id'] == producto_id), None)
    
    if not producto:
        return jsonify({"success": False, "message": "Producto no encontrado"}), 404
    
    # Actualizar campos permitidos
    if 'precio' in data:
        producto['precio'] = data['precio']
    if 'nombre' in data:
        producto['nombre'] = data['nombre']
    if 'descripcion' in data:
        producto['descripcion'] = data['descripcion']
    if 'categoria' in data:
        producto['categoria'] = data['categoria']
    
    return jsonify({
        "success": True,
        "message": "Producto actualizado correctamente",
        "producto": producto
    })

@app.route('/api/productos/<int:producto_id>', methods=['DELETE'])
def eliminar_producto(producto_id):
    global PRODUCTOS
    producto = next((p for p in PRODUCTOS if p['id'] == producto_id), None)
    
    if not producto:
        return jsonify({"success": False, "message": "Producto no encontrado"}), 404
    
    # En una aplicación real, aquí verificarías si el producto está en uso
    PRODUCTOS = [p for p in PRODUCTOS if p['id'] != producto_id]
    
    return jsonify({
        "success": True,
        "message": "Producto eliminado correctamente"
    })

@app.route('/api/productos', methods=['POST'])
def agregar_producto():
    data = request.json
    
    # Validar campos requeridos
    campos_requeridos = ['nombre', 'precio', 'categoria']
    for campo in campos_requeridos:
        if campo not in data:
            return jsonify({"success": False, "message": f"Campo {campo} es requerido"}), 400
    
    # Crear nuevo producto
    nuevo_producto = {
        "id": max([p['id'] for p in PRODUCTOS]) + 1 if PRODUCTOS else 1,
        "nombre": data['nombre'],
        "precio": float(data['precio']),
        "categoria": data['categoria'],
        "descripcion": data.get('descripcion', ''),
        "disponible": data.get('disponible', True)
    }
    
    PRODUCTOS.append(nuevo_producto)
    
    return jsonify({
        "success": True,
        "message": "Producto agregado correctamente",
        "producto": nuevo_producto
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)