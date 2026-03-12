"""
Controller: Servicio Trabajo
Maneja el workflow de servicios técnicos (REMETRO/RETAZO/PRODUCTOS/INSTALACION).
"""
from flask import Blueprint, jsonify, request
from typing import Optional, Dict, Any
from app.services.supabase_client import supabase
import json

servicio_trabajo_bp = Blueprint("servicio_trabajo_bp", __name__)


@servicio_trabajo_bp.route("/api/servicio/remetro/guardar", methods=["POST"])
def guardar_remetro():
    """
    POST /api/servicio/remetro/guardar
    Guarda los datos de REMETRO (medidas, serie, descripción, ubicación).
    
    Body: {
        "notificacion_id": uuid,
        "ancho": float,
        "alto": float,
        "serie": str,
        "descripcion": str,
        "fecha_servicio": str,
        "ubicacion": str
    }
    """
    try:
        data = request.get_json() or {}
        notificacion_id = data.get("notificacion_id")
        
        if not notificacion_id:
            return jsonify({"success": False, "message": "notificacion_id requerido"}), 400
        
        # Preparar datos de REMETRO
        remetro_data = {
            "remetro_ancho": data.get("ancho"),
            "remetro_alto": data.get("alto"),
            "remetro_serie": data.get("serie"),
            "remetro_descripcion": data.get("descripcion"),
            "remetro_fecha_servicio": data.get("fecha_servicio"),
            "remetro_ubicacion": data.get("ubicacion")
        }
        
        print(f"[SERVICIO] Guardando REMETRO para notificación {notificacion_id}: {remetro_data}")
        
        # Actualizar la notificación con los datos de REMETRO
        resultado = supabase.table("notificacion") \
            .update(remetro_data) \
            .eq("id_notificacion", notificacion_id) \
            .execute()
        
        err = getattr(resultado, 'error', None) if resultado is not None else None
        if err:
            print(f"[SERVICIO] Error actualizando notificación: {err}")
            return jsonify({"success": False, "message": str(err)}), 500
        
        print(f"[SERVICIO] ✅ REMETRO guardado exitosamente")
        return jsonify({
            "success": True,
            "message": "Datos de REMETRO guardados correctamente"
        }), 200
        
    except Exception as e:
        print(f"[SERVICIO] ❌ Error: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@servicio_trabajo_bp.route("/api/servicio/instalacion/guardar", methods=["POST"])
def guardar_instalacion():
    """
    POST /api/servicio/instalacion/guardar
    Guarda los datos de INSTALACION (fecha, técnico, observaciones).
    
    Body: {
        "notificacion_id": uuid,
        "fecha_instalacion": str,
        "tecnico_asignado": str,
        "observaciones": str,
        "cantidad_imagenes": int
    }
    """
    try:
        data = request.get_json() or {}
        notificacion_id = data.get("notificacion_id")
        
        if not notificacion_id:
            return jsonify({"success": False, "message": "notificacion_id requerido"}), 400
        
        # Preparar datos de INSTALACION
        instalacion_data = {
            "instalacion_fecha": data.get("fecha_instalacion"),
            "instalacion_tecnico": data.get("tecnico_asignado"),
            "instalacion_observaciones": data.get("observaciones"),
            "instalacion_cantidad_imagenes": data.get("cantidad_imagenes", 0)
        }
        
        print(f"[SERVICIO] Guardando INSTALACION para notificación {notificacion_id}: {instalacion_data}")
        
        # Actualizar la notificación con los datos de INSTALACION
        resultado = supabase.table("notificacion") \
            .update(instalacion_data) \
            .eq("id_notificacion", notificacion_id) \
            .execute()
        
        err = getattr(resultado, 'error', None) if resultado is not None else None
        if err:
            print(f"[SERVICIO] Error actualizando notificación: {err}")
            return jsonify({"success": False, "message": str(err)}), 500
        
        print(f"[SERVICIO] ✅ INSTALACION guardada exitosamente")
        return jsonify({
            "success": True,
            "message": "Datos de INSTALACION guardados correctamente"
        }), 200
        
    except Exception as e:
        print(f"[SERVICIO] ❌ Error: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


@servicio_trabajo_bp.route("/productos/disponibles", methods=["GET"])
def get_productos_disponibles():
    """
    Obtiene la lista de productos disponibles para selección.
    Query params:
    - busqueda: str (opcional)
    - tipo: REMETRO | RETAZO | PRODUCTOS
    """
    try:
        busqueda = request.args.get("busqueda", "")
        tipo = request.args.get("tipo", "PRODUCTOS")
        
        # TODO: Implementar búsqueda de productos
        # productos = buscar_productos_disponibles(busqueda, tipo)
        
        return jsonify({
            "success": True,
            "data": [],
            "message": "Endpoint en desarrollo"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@servicio_trabajo_bp.route("/guardar", methods=["POST"])
def guardar_servicio():
    """
    Guarda los datos del servicio técnico.
    Body: {
        "cliente": str,
        "fecha": str,
        "productos_seleccionados": [],
        "barras": [],
        "cortes": [],
        "instalacion": { "fecha": str, "tecnico": str, "observaciones": str, "imagenes": [] }
    }
    """
    try:
        data = request.get_json()
        
        cliente = data.get("cliente")
        if not cliente:
            return jsonify({"success": False, "message": "Cliente requerido"}), 400
        
        # TODO: Implementar guardado
        # resultado = guardar_servicio_trabajo(data)
        
        return jsonify({
            "success": True,
            "message": "Servicio guardado correctamente"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@servicio_trabajo_bp.route("/<servicio_id>", methods=["GET"])
def get_servicio_detalle(servicio_id: str):
    """
    Obtiene el detalle de un servicio específico.
    """
    try:
        # TODO: Obtener detalle del servicio
        # servicio = get_servicio_by_id(servicio_id)
        
        return jsonify({
            "success": True,
            "data": {},
            "message": "Endpoint en desarrollo"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@servicio_trabajo_bp.route("/<servicio_id>/instalacion", methods=["PATCH"])
def update_instalacion(servicio_id: str):
    """
    Actualiza los datos de instalación del servicio.
    """
    try:
        data = request.get_json()
        
        # TODO: Actualizar instalación
        # resultado = actualizar_instalacion(servicio_id, data)
        
        return jsonify({
            "success": True,
            "message": "Instalación actualizada"
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
