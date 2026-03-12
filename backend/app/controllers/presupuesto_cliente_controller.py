"""
Controlador para guardar presupuestos de servicio con búsqueda de cliente
y generación automática de notificaciones.
"""

from flask import Blueprint, request, jsonify
from services.presupuesto_cliente_service import (
    buscar_cliente_por_documento,
    guardar_multiples_presupuestos
)

presupuesto_cliente_bp = Blueprint('presupuesto_cliente', __name__)


@presupuesto_cliente_bp.route('/api/presupuesto_guardar', methods=['POST'])
def guardar_presupuestos_con_cliente():
    """
    Endpoint para guardar múltiples presupuestos con búsqueda automática de cliente
    y creación de notificación.
    
    JSON esperado:
    {
        "documento": "20123456789",       # Número de documento ingresado
        "nombre_apis": "ACME Corp",       # Nombre obtenido de APIs Peru (si aplica)
        "presupuestos": [                 # Lista de presupuestos
            {
                "servicio_id": "uuid-xxx",
                "descripcion": "Ventana Corrediza",
                "cantidad": 1,
                "precio_unitario": 424.71,
                "subtotal": 424.71,
                "igv": 76.45,
                "total": 501.16
            },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        # Validar campos obligatorios
        if not data:
            return jsonify({"success": False, "message": "No se envió datos"}), 400
        
        documento = data.get("documento", "").strip()
        nombre_apis = data.get("nombre_apis", "Cliente anónimo").strip()
        presupuestos_list = data.get("presupuestos", [])
        
        if not documento:
            return jsonify({"success": False, "message": "El documento es requerido"}), 400
        
        if not presupuestos_list or len(presupuestos_list) == 0:
            return jsonify({"success": False, "message": "Se requiere al menos un presupuesto"}), 400
        
        # Buscar cliente en la tabla 'cliente' por documento
        cliente_encontrado = buscar_cliente_por_documento(documento)
        
        if cliente_encontrado:
            estado_mensaje = f"Cliente '{cliente_encontrado.get('nombre', 'desconocido')}' ya está en sistema"
        else:
            estado_mensaje = "Cliente no está en sistema; se guardará como anónimo"
        
        # Guardar presupuestos y crear notificación + cortes
        success, msg, pres_ids = guardar_multiples_presupuestos(
            presupuestos_list,
            cliente_encontrado,
            documento,
            nombre_apis
        )
        
        if success:
            return jsonify({
                "success": True,
                "message": msg,
                "cliente_status": estado_mensaje,
                "presupuesto_ids": pres_ids,
                "cliente_encontrado": cliente_encontrado is not None
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": msg,
                "cliente_status": estado_mensaje
            }), 500
        
    except Exception as e:
        print(f"Error en guardar_presupuestos_con_cliente: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error del servidor: {str(e)}"
        }), 500


@presupuesto_cliente_bp.route('/api/cliente/buscar_documento', methods=['POST'])
def buscar_cliente():
    """
    Endpoint para buscar cliente por documento (para usar durante la búsqueda en Datos del cliente).
    
    JSON esperado:
    {
        "documento": "20123456789"
    }
    
    Respuesta:
    {
        "success": true,
        "encontrado": true,
        "cliente": { ... datos del cliente ... } o null
    }
    """
    try:
        data = request.get_json()
        documento = data.get("documento", "").strip()
        
        if not documento:
            return jsonify({
                "success": True,
                "encontrado": False,
                "cliente": None
            }), 200
        
        cliente = buscar_cliente_por_documento(documento)
        
        return jsonify({
            "success": True,
            "encontrado": cliente is not None,
            "cliente": cliente
        }), 200
        
    except Exception as e:
        print(f"Error en buscar_cliente: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}"
        }), 500
