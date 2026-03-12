from flask import Blueprint, request, jsonify
from services import presupuestos_service

presupuestos_bp = Blueprint('presupuestos', __name__)

@presupuestos_bp.route('/api/presupuestos', methods=['POST'])
def crear_presupuesto():
    """
    Endpoint para guardar un nuevo presupuesto
    """
    try:
        data = request.get_json()
        
        # Validar datos requeridos básicos
        if not data.get('servicio_id'):
            return jsonify({"success": False, "message": "El campo 'servicio_id' es requerido"}), 400
        # cliente_id/documento son opcionales; se pueden omitir para presupuestos anónimos
        if not data.get('cliente_id') and data.get('cliente_documento'):
            # si se envía documento intentamos buscar el id, pero no es obligatorio
            cli_resp = presupuestos_service.obtiene_cliente_por_documento(data['cliente_documento'])
            if cli_resp:
                data['cliente_id'] = cli_resp

        resultado = presupuestos_service.guardar_presupuesto(data)
        
        if resultado.get('success'):
            return jsonify(resultado), 201
        else:
            return jsonify(resultado), 400
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al crear presupuesto: {str(e)}"
        }), 500


@presupuestos_bp.route('/api/presupuestos', methods=['GET'])
def listar_presupuestos():
    """
    Endpoint para obtener la lista de presupuestos
    Soporta filtro por query param ?filtro=documento_o_razon_social
    """
    try:
        filtro = request.args.get('filtro', None)
        servicio_id = request.args.get('servicio_id', None)
        presupuestos = presupuestos_service.obtener_presupuestos(filtro, servicio_id)
        
        return jsonify({
            "success": True,
            "data": presupuestos
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al obtener presupuestos: {str(e)}"
        }), 500


@presupuestos_bp.route('/api/presupuestos/<presupuesto_id>', methods=['GET'])
def obtener_presupuesto(presupuesto_id):
    """
    Endpoint para obtener un presupuesto específico por ID
    """
    try:
        presupuesto = presupuestos_service.obtener_presupuesto_por_id(presupuesto_id)
        
        if presupuesto:
            return jsonify({
                "success": True,
                "data": presupuesto
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Presupuesto no encontrado"
            }), 404
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error al obtener presupuesto: {str(e)}"
        }), 500
