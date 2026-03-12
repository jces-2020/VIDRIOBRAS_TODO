from flask import Blueprint, request, jsonify
from services.compra_service import buscar_cliente_por_documento, guardar_flujo_compra

compra_api = Blueprint('compra_api', __name__)

@compra_api.route('/api/compra/realizar', methods=['POST'])
def api_realizar_compra():
    data = request.get_json()
    documento = data.get('documento')
    productos = data.get('productos', [])
    cortes = data.get('cortes', [])
    metodo_pago = data.get('metodo_pago', '')
    nombre_api_peru = data.get('nombre_api_peru', '')
    if not documento or not productos:
        return jsonify({"success": False, "message": "Faltan datos"}), 400
    cliente = buscar_cliente_por_documento(documento)
    ok = guardar_flujo_compra(cliente, productos, cortes, metodo_pago, documento, nombre_api_peru)
    if ok:
        return jsonify({"success": True}), 200
    else:
        return jsonify({"success": False, "message": "Error al guardar"}), 500
