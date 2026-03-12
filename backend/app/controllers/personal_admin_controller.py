from flask import Blueprint, jsonify, request
from datetime import date

from services.personal_service import (
    get_all_personal,
    get_personal_by_id,
    get_bonos_personal,
    get_all_bonos,
    add_bono_to_personal,
    remove_bono_from_personal,
    create_pago,
)

personal_admin_bp = Blueprint("personal_admin_bp", __name__)


@personal_admin_bp.route("/api/personal", methods=["GET"])
def list_personal():
    """Lista todo el personal."""
    personal = get_all_personal()
    return jsonify({"success": True, "data": personal})


@personal_admin_bp.route("/api/personal/<personal_id>", methods=["GET"])
def get_personal_detail(personal_id):
    """Obtiene detalles de un personal específico."""
    personal = get_personal_by_id(personal_id)
    if not personal:
        return jsonify({"success": False, "message": "Personal no encontrado"}), 404
    return jsonify({"success": True, "data": personal})


@personal_admin_bp.route("/api/personal/<personal_id>/bonos", methods=["GET"])
def list_bonos_personal(personal_id):
    """Lista los bonos asignados a un personal."""
    bonos = get_bonos_personal(personal_id)
    return jsonify({"success": True, "data": bonos})


@personal_admin_bp.route("/api/bonos", methods=["GET"])
def list_all_bonos():
    """Lista todos los bonos disponibles."""
    bonos = get_all_bonos()
    return jsonify({"success": True, "data": bonos})


@personal_admin_bp.route("/api/personal/<personal_id>/bonos", methods=["POST"])
def add_bono(personal_id):
    """Asigna un bono a un personal."""
    data = request.get_json()
    bono_id = data.get("bono_id")
    if not bono_id:
        return jsonify({"success": False, "message": "bono_id requerido"}), 400
    
    success = add_bono_to_personal(personal_id, bono_id)
    if success:
        return jsonify({"success": True, "message": "Bono asignado"})
    return jsonify({"success": False, "message": "Error al asignar bono"}), 500


@personal_admin_bp.route("/api/personal/<personal_id>/bonos/<bono_id>", methods=["DELETE"])
def remove_bono(personal_id, bono_id):
    """Elimina un bono de un personal."""
    success = remove_bono_from_personal(personal_id, bono_id)
    if success:
        return jsonify({"success": True, "message": "Bono eliminado"})
    return jsonify({"success": False, "message": "Error al eliminar bono"}), 500


@personal_admin_bp.route("/api/personal/<personal_id>/pago", methods=["POST"])
def register_pago(personal_id):
    """Registra un pago para el personal."""
    data = request.get_json()
    monto = data.get("monto")
    fecha_pago = data.get("fecha") or str(date.today())
    
    if not monto:
        return jsonify({"success": False, "message": "Monto requerido"}), 400
    
    pago = create_pago(personal_id, float(monto), fecha_pago)
    if pago:
        return jsonify({"success": True, "message": "Pago registrado", "data": pago})
    return jsonify({"success": False, "message": "Error al registrar pago"}), 500
