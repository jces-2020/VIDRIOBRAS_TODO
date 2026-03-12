"""
Controller: Progreso de Servicio
Endpoints para guardar el progreso de cada paso del servicio
"""
from flask import Blueprint, request, jsonify
from services.progreso_servicio_service import (
    crear_progreso_servicio,
    obtener_progreso,
    guardar_paso_remetro,
    guardar_paso_retazo,
    guardar_paso_productos,
    guardar_paso_instalacion,
    obtener_estadisticas_servicio,
    obtener_progreso_por_etapa
)

progreso_blueprint = Blueprint('progreso', __name__, url_prefix='/api/progreso')


# ============================================================================
# ENDPOINTS DE INICIALIZACIÓN
# ============================================================================

@progreso_blueprint.route('/crear/<notificacion_id>', methods=['POST'])
def crear_progreso(notificacion_id):
    """
    Crea un nuevo registro de progreso para una notificación de servicio.
    Se llama automáticamente al crear una notificación tipo SERVICIO.
    """
    try:
        personal_id = request.json.get('personal_id') if request.json else None
        
        resultado = crear_progreso_servicio(notificacion_id, personal_id)
        
        return jsonify(resultado), 200 if resultado['success'] else 400
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@progreso_blueprint.route('/obtener/<notificacion_id>', methods=['GET'])
def obtener_progreso_endpoint(notificacion_id):
    """
    Obtiene el estado actual del progreso de un servicio.
    Retorna todos los datos completados hasta el momento.
    """
    try:
        resultado = obtener_progreso(notificacion_id)
        
        return jsonify(resultado), 200 if resultado['success'] else 404
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================================
# ENDPOINTS GUARDAR CADA PASO
# ============================================================================

@progreso_blueprint.route('/guardar-remetro', methods=['POST'])
def guardar_remetro():
    """
    Guarda los datos del paso REMETRO (mediciones iniciales).
    
    Body esperado:
    {
        "notificacion_id": "uuid",
        "personal_id": "uuid",
        "datos": {
            "medidas": [{"ubicacion": "Sala", "ancho": 300, "alto": 250}],
            "fotos": ["url1", "url2"],
            "notas": "Marco en buen estado"
        }
    }
    """
    try:
        payload = request.json
        notificacion_id = payload.get('notificacion_id')
        personal_id = payload.get('personal_id')
        datos = payload.get('datos', {})
        
        if not notificacion_id or not personal_id:
            return jsonify({
                "success": False,
                "message": "notificacion_id y personal_id son requeridos"
            }), 400
        
        resultado = guardar_paso_remetro(notificacion_id, datos, personal_id)
        
        return jsonify(resultado), 200 if resultado['success'] else 400
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@progreso_blueprint.route('/guardar-retazo', methods=['POST'])
def guardar_retazo():
    """
    Guarda los datos del paso RETAZO (selección de materiales).
    
    Body esperado:
    {
        "notificacion_id": "uuid",
        "personal_id": "uuid",
        "datos": {
            "retazos_seleccionados": [
                {"id_retazo": "abc123", "cantidad": 2, "descripcion": "Verde 6mm"}
            ],
            "criterio_seleccion": "Por disponibilidad",
            "costo_retazo": 450.00
        }
    }
    """
    try:
        payload = request.json
        notificacion_id = payload.get('notificacion_id')
        personal_id = payload.get('personal_id')
        datos = payload.get('datos', {})
        
        if not notificacion_id or not personal_id:
            return jsonify({
                "success": False,
                "message": "notificacion_id y personal_id son requeridos"
            }), 400
        
        resultado = guardar_paso_retazo(notificacion_id, datos, personal_id)
        
        return jsonify(resultado), 200 if resultado['success'] else 400
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@progreso_blueprint.route('/guardar-productos', methods=['POST'])
def guardar_productos():
    """
    Guarda los datos del paso PRODUCTOS (definición de cortes).
    
    Body esperado:
    {
        "notificacion_id": "uuid",
        "personal_id": "uuid",
        "datos": {
            "cortes_vidrio": [
                {"ancho": 150, "alto": 200, "cantidad": 2}
            ],
            "cortes_aluminio": [
                {"largo": 300, "cantidad": 2}
            ],
            "optimizacion": "Máximo aprovechamiento",
            "costo_produccion": 1200.00,
            "tiempo_estimado_cortes": "2 horas"
        }
    }
    """
    try:
        payload = request.json
        notificacion_id = payload.get('notificacion_id')
        personal_id = payload.get('personal_id')
        datos = payload.get('datos', {})
        
        if not notificacion_id or not personal_id:
            return jsonify({
                "success": False,
                "message": "notificacion_id y personal_id son requeridos"
            }), 400
        
        resultado = guardar_paso_productos(notificacion_id, datos, personal_id)
        
        return jsonify(resultado), 200 if resultado['success'] else 400
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@progreso_blueprint.route('/guardar-instalacion', methods=['POST'])
def guardar_instalacion():
    """
    Guarda los datos del paso INSTALACION (confirmación final).
    
    Body esperado:
    {
        "notificacion_id": "uuid",
        "personal_id": "uuid",
        "datos": {
            "fecha_instalacion": "2026-03-15",
            "personal_instalacion": ["Carlos Ramos", "Marina López"],
            "fotos_antes": ["url1"],
            "fotos_durante": ["url2", "url3"],
            "fotos_despues": ["url4"],
            "observaciones": "Cliente muy satisfecho",
            "problemas_encontrados": "Ninguno",
            "tiempo_real_ejecucion": "45 minutos"
        }
    }
    """
    try:
        payload = request.json
        notificacion_id = payload.get('notificacion_id')
        personal_id = payload.get('personal_id')
        datos = payload.get('datos', {})
        
        if not notificacion_id or not personal_id:
            return jsonify({
                "success": False,
                "message": "notificacion_id y personal_id son requeridos"
            }), 400
        
        resultado = guardar_paso_instalacion(notificacion_id, datos, personal_id)
        
        return jsonify(resultado), 200 if resultado['success'] else 400
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ============================================================================
# ENDPOINTS CONSULTA Y ESTADÍSTICAS
# ============================================================================

@progreso_blueprint.route('/estadisticas/<notificacion_id>', methods=['GET'])
def obtener_estadisticas(notificacion_id):
    """
    Obtiene estadísticas completas de un servicio.
    """
    try:
        resultado = obtener_estadisticas_servicio(notificacion_id)
        
        return jsonify(resultado), 200 if resultado['success'] else 404
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@progreso_blueprint.route('/por-etapa/<etapa>', methods=['GET'])
def por_etapa(etapa):
    """
    Obtiene todos los servicios en una etapa específica.
    
    etapa: REMETRO | RETAZO | PRODUCTOS | INSTALACION
    """
    try:
        etapa_valida = etapa.upper()
        if etapa_valida not in ['REMETRO', 'RETAZO', 'PRODUCTOS', 'INSTALACION']:
            return jsonify({
                "success": False,
                "message": "Etapa inválida. Use: REMETRO | RETAZO | PRODUCTOS | INSTALACION"
            }), 400
        
        servicios = obtener_progreso_por_etapa(etapa_valida)
        
        return jsonify({
            "success": True,
            "etapa": etapa_valida,
            "cantidad": len(servicios),
            "servicios": servicios
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@progreso_blueprint.route('/health', methods=['GET'])
def health():
    """Verificación de salud del servicio"""
    return jsonify({
        "success": True,
        "message": "Progreso Service OK",
        "version": "1.0.0"
    }), 200
