from flask import Blueprint, jsonify, request
from datetime import date

from services.gastos_service import (
    get_gastos_by_date,
    get_caja_by_date,
    get_ventas_by_date,
    create_gasto,
    get_resumen_dia
)

gastos_diarios_bp = Blueprint("gastos_diarios_bp", __name__)


@gastos_diarios_bp.route("/api/gastos-diarios", methods=["GET"])
def list_gastos():
    """Lista los gastos de una fecha específica (hoy por defecto)."""
    fecha = request.args.get("fecha", str(date.today()))
    gastos = get_gastos_by_date(fecha)
    return jsonify({"success": True, "data": gastos, "fecha": fecha})


@gastos_diarios_bp.route("/api/gastos-diarios", methods=["POST"])
def add_gasto():
    """Crea un nuevo gasto."""
    data = request.get_json()
    monto = data.get("monto")
    fecha_gasto = data.get("fecha") or str(date.today())
    caja_id = data.get("caja_id")
    
    if not monto:
        return jsonify({"success": False, "message": "Monto requerido"}), 400
    
    gasto = create_gasto(float(monto), fecha_gasto, caja_id)
    if gasto:
        return jsonify({"success": True, "message": "Gasto registrado", "data": gasto})
    return jsonify({"success": False, "message": "Error al registrar gasto"}), 500


@gastos_diarios_bp.route("/api/caja", methods=["GET"])
def list_caja():
    """Lista las cajas de una fecha específica."""
    fecha = request.args.get("fecha", str(date.today()))
    cajas = get_caja_by_date(fecha)
    return jsonify({"success": True, "data": cajas, "fecha": fecha})


@gastos_diarios_bp.route("/api/gastos-diarios/resumen", methods=["GET"])
def resumen_gastos():
    """Obtiene un resumen completo de gastos e ingresos del día."""
    fecha = request.args.get("fecha", str(date.today()))
    resumen = get_resumen_dia(fecha)
    return jsonify({"success": True, "data": resumen})
