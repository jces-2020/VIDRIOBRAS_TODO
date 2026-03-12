"""
Controlador para consultas de merma.
"""
from flask import Blueprint, jsonify, request
from app.services.merma_service import (
    obtener_merma_por_categoria, 
    eliminar_mermas,
    buscar_merma_por_medidas,
    obtener_categorias_merma
)

merma_bp = Blueprint("merma", __name__)


@merma_bp.route("/api/merma/categoria/<categoria_id>", methods=["GET"])
def get_merma_por_categoria(categoria_id):
    """
    GET /api/merma/categoria/<categoria_id>
    Obtiene mermas filtradas por categoria.
    """
    try:
        resultado = obtener_merma_por_categoria(categoria_id)
        if resultado.get("success"):
            return jsonify({"success": True, "data": resultado.get("data", [])}), 200

        return jsonify({
            "success": False,
            "message": resultado.get("message", "Error al obtener mermas")
        }), 400
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": str(exc)
        }), 500


@merma_bp.route("/api/merma/eliminar", methods=["POST"])
def eliminar_mermas_endpoint():
    """
    POST /api/merma/eliminar
    Body: {"ids": ["uuid", ...]}
    """
    try:
        data = request.get_json() or {}
        ids = data.get("ids") or []

        resultado = eliminar_mermas(ids)
        if resultado.get("success"):
            return jsonify({"success": True, "eliminados": resultado.get("eliminados", 0)}), 200

        return jsonify({
            "success": False,
            "message": resultado.get("message", "Error al eliminar mermas")
        }), 400
    except Exception as exc:
        return jsonify({
            "success": False,
            "message": str(exc)
        }), 500


@merma_bp.route("/api/merma/buscar", methods=["GET"])
def buscar_merma_endpoint():
    """
    GET /api/merma/buscar?ancho=100&alto=200&tolerancia=10&categoria=uuid
    Busca merma disponible por medidas con tolerancia.
    
    Query params:
        ancho: Ancho requerido en cm (requerido)
        alto: Alto requerido en cm (requerido)
        tolerancia: Tolerancia en cm (default: 10)
        categoria: UUID de categoría (opcional)
    """
    try:
        ancho_str = request.args.get('ancho', '').strip()
        alto_str = request.args.get('alto', '').strip()
        tolerancia_str = request.args.get('tolerancia', '10').strip()
        id_categoria = request.args.get('categoria', '').strip() or None
        
        if not ancho_str or not alto_str:
            return jsonify({
                "success": False,
                "message": "Parámetros 'ancho' y 'alto' son requeridos",
                "mermas": []
            }), 400
        
        try:
            ancho_cm = float(ancho_str)
            alto_cm = float(alto_str)
            tolerancia = float(tolerancia_str)
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Valores numéricos inválidos",
                "mermas": []
            }), 400
        
        print(f"[MERMA_CONTROLLER] Buscando merma: ancho={ancho_cm}, alto={alto_cm}, tolerancia={tolerancia}")
        
        resultado = buscar_merma_por_medidas(ancho_cm, alto_cm, tolerancia, id_categoria)
        
        if resultado.get("success"):
            return jsonify(resultado), 200
        
        return jsonify(resultado), 400
        
    except Exception as e:
        print(f"[MERMA_CONTROLLER] ✗ Error: {str(e)}")
        return jsonify({
            "success": False,
            "message": str(e),
            "mermas": []
        }), 500


@merma_bp.route("/api/merma/categorias", methods=["GET"])
def get_categorias_endpoint():
    """
    GET /api/merma/categorias
    Obtiene todas las categorías disponibles para filtrar merma.
    """
    try:
        resultado = obtener_categorias_merma()
        
        if resultado.get("success"):
            return jsonify(resultado), 200
        
        return jsonify(resultado), 400
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "categorias": []
        }), 500
