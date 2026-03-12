from flask import Blueprint, jsonify, request
from datetime import date
from services.cuadre_service import get_resumen_mes

caja_cuadre_bp = Blueprint("caja_cuadre_bp", __name__)

@caja_cuadre_bp.route("/api/caja/cuadre", methods=["GET"])
def caja_cuadre():
    mes = request.args.get("mes")
    if not mes:
        today = date.today()
        mes = f"{today.year}-{str(today.month).zfill(2)}"
    resumen = get_resumen_mes(mes)
    # Mapear los métodos a los nombres esperados por el frontend
    totales = {
        "tarjeta": resumen["totales_por_metodo"].get("tarjeta", 0),
        "contado": resumen["totales_por_metodo"].get("efectivo", 0) + resumen["totales_por_metodo"].get("contado", 0),
        "yape": resumen["totales_por_metodo"].get("yape", 0),
        "total": sum(resumen["totales_por_metodo"].values()),
    }
    # comprobantes: lista de ventas con info relevante
    comprobantes = [
        {
            "numero": v.get("id_venta", "")[:8],
            "cliente": "-",  # Si tienes cliente, cámbialo aquí
            "metodo_pago": v.get("metodo", ""),
            "monto": float(v.get("total", 0)),
            "fecha": v.get("fecha_venta", "")
        }
        for v in resumen["ventas"]
    ]
    return jsonify({"success": True, "totales": totales, "comprobantes": comprobantes})
