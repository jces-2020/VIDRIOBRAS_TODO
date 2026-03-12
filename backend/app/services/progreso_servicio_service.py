"""
Service: Gestión de Progreso de Servicio
Lógica de negocio para registrar y actualizar el progreso de cada servicio
a través de los pasos: REMETRO → RETAZO → PRODUCTOS → INSTALACION
"""
from typing import Dict, Any, Optional
from services.supabase_client import supabase
from datetime import datetime
import json


# ============================================================================
# UTILIDADES
# ============================================================================

def get_porcentaje_por_paso(paso: str) -> int:
    """Retorna el porcentaje de avance según el paso"""
    pasos = {
        'PENDIENTE': 0,
        'EN_REMETRO': 25,
        'EN_RETAZO': 50,
        'EN_PRODUCTOS': 75,
        'EN_INSTALACION': 100,
        'COMPLETADO': 100
    }
    return pasos.get(paso, 0)


def get_siguiente_paso(paso_actual: str) -> str:
    """Retorna el siguiente paso en la secuencia"""
    secuencia = {
        'PENDIENTE': 'EN_REMETRO',
        'EN_REMETRO': 'EN_RETAZO',
        'EN_RETAZO': 'EN_PRODUCTOS',
        'EN_PRODUCTOS': 'EN_INSTALACION',
        'EN_INSTALACION': 'COMPLETADO',
        'COMPLETADO': 'COMPLETADO'
    }
    return secuencia.get(paso_actual, 'EN_REMETRO')


# ============================================================================
# CREAR O INICIALIZAR PROGRESO
# ============================================================================

def crear_progreso_servicio(notificacion_id: str, personal_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Crea un nuevo registro de progreso para una notificación de servicio.
    Se llamará automáticamente cuando se cree una notificación tipo SERVICIO.
    """
    try:
        # Verificar si ya existe
        check = supabase.table("progreso_servicio").select("id_progreso").eq(
            "notificacion_id", notificacion_id
        ).execute()
        
        if check.data:
            return {
                "success": False,
                "message": "Progreso ya existe para esta notificación",
                "id_progreso": check.data[0]['id_progreso']
            }
        
        # Crear nuevo registro
        resultado = supabase.table("progreso_servicio").insert({
            "notificacion_id": notificacion_id,
            "personal_id": personal_id,
            "estado_actual": "PENDIENTE",
            "porcentaje_completado": 0
        }).execute()
        
        if resultado.data:
            return {
                "success": True,
                "message": "Progreso inicializado",
                "id_progreso": resultado.data[0]['id_progreso'],
                "estado": "PENDIENTE",
                "porcentaje": 0
            }
        else:
            return {"success": False, "message": "Error al crear progreso"}
            
    except Exception as e:
        print(f"Error creando progreso: {e}")
        return {"success": False, "message": str(e)}


def obtener_progreso(notificacion_id: str) -> Dict[str, Any]:
    """Obtiene el estado actual del progreso de un servicio"""
    try:
        resultado = supabase.table("progreso_servicio").select("*").eq(
            "notificacion_id", notificacion_id
        ).execute()
        
        if resultado.data:
            data = resultado.data[0]
            return {
                "success": True,
                "id_progreso": data['id_progreso'],
                "estado_actual": data['estado_actual'],
                "porcentaje_completado": data['porcentaje_completado'],
                "pasos_completados": {
                    "remetro": data['paso_remetro_completado'],
                    "retazo": data['paso_retazo_completado'],
                    "productos": data['paso_productos_completado'],
                    "instalacion": data['paso_instalacion_completado']
                },
                "datos": {
                    "remetro": data['paso_remetro_datos'],
                    "retazo": data['paso_retazo_datos'],
                    "productos": data['paso_productos_datos'],
                    "instalacion": data['paso_instalacion_datos']
                }
            }
        else:
            return {"success": False, "message": "Progreso no encontrado"}
            
    except Exception as e:
        print(f"Error obteniendo progreso: {e}")
        return {"success": False, "message": str(e)}


# ============================================================================
# GUARDAR CADA PASO
# ============================================================================

def guardar_paso_remetro(notificacion_id: str, datos: Dict[str, Any], personal_id: str) -> Dict[str, Any]:
    """
    Guarda los datos del paso REMETRO (mediciones iniciales)
    
    datos esperado: {
        "medidas": [...],
        "fotos": [...],
        "notas": "...",
        "personal_responsable": "..."
    }
    """
    try:
        # Obtener o crear progreso
        progreso = obtener_progreso(notificacion_id)
        if not progreso['success']:
            progreso = crear_progreso_servicio(notificacion_id, personal_id)
        
        id_progreso = progreso['id_progreso']
        
        # Actualizar progreso
        resultado = supabase.table("progreso_servicio").update({
            "paso_remetro_datos": json.dumps(datos),
            "paso_remetro_completado": True,
            "paso_remetro_fecha": datetime.now().isoformat(),
            "estado_actual": "EN_RETAZO",
            "porcentaje_completado": 25,
            "personal_id": personal_id,
            "actualizado_en": datetime.now().isoformat()
        }).eq("id_progreso", id_progreso).execute()
        
        return {
            "success": True,
            "message": "REMETRO guardado exitosamente",
            "estado": "EN_RETAZO",
            "porcentaje": 25
        }
        
    except Exception as e:
        print(f"Error guardando REMETRO: {e}")
        return {"success": False, "message": str(e)}


def guardar_paso_retazo(notificacion_id: str, datos: Dict[str, Any], personal_id: str) -> Dict[str, Any]:
    """
    Guarda los datos del paso RETAZO (selección de materiales)
    
    datos esperado: {
        "retazos_seleccionados": [...],
        "criterio_seleccion": "...",
        "costo_retazo": 0.00
    }
    """
    try:
        progreso = obtener_progreso(notificacion_id)
        if not progreso['success']:
            return {"success": False, "message": "Progreso no existe. Debe completar REMETRO primero"}
        
        # Validar que REMETRO esté completado
        if not progreso['pasos_completados']['remetro']:
            return {"success": False, "message": "Debe completar REMETRO antes de RETAZO"}
        
        id_progreso = progreso['id_progreso']
        
        resultado = supabase.table("progreso_servicio").update({
            "paso_retazo_datos": json.dumps(datos),
            "paso_retazo_completado": True,
            "paso_retazo_fecha": datetime.now().isoformat(),
            "estado_actual": "EN_PRODUCTOS",
            "porcentaje_completado": 50,
            "personal_id": personal_id,
            "actualizado_en": datetime.now().isoformat()
        }).eq("id_progreso", id_progreso).execute()
        
        return {
            "success": True,
            "message": "RETAZO guardado exitosamente",
            "estado": "EN_PRODUCTOS",
            "porcentaje": 50
        }
        
    except Exception as e:
        print(f"Error guardando RETAZO: {e}")
        return {"success": False, "message": str(e)}


def guardar_paso_productos(notificacion_id: str, datos: Dict[str, Any], personal_id: str) -> Dict[str, Any]:
    """
    Guarda los datos del paso PRODUCTOS (definición de cortes)
    
    datos esperado: {
        "cortes_vidrio": [...],
        "cortes_aluminio": [...],
        "optimizacion": "...",
        "costo_produccion": 0.00,
        "tiempo_estimado_cortes": "..."
    }
    """
    try:
        progreso = obtener_progreso(notificacion_id)
        if not progreso['success']:
            return {"success": False, "message": "Progreso no existe"}
        
        # Validar secuencia
        if not progreso['pasos_completados']['retazo']:
            return {"success": False, "message": "Debe completar RETAZO antes de PRODUCTOS"}
        
        id_progreso = progreso['id_progreso']
        
        resultado = supabase.table("progreso_servicio").update({
            "paso_productos_datos": json.dumps(datos),
            "paso_productos_completado": True,
            "paso_productos_fecha": datetime.now().isoformat(),
            "estado_actual": "EN_INSTALACION",
            "porcentaje_completado": 75,
            "personal_id": personal_id,
            "actualizado_en": datetime.now().isoformat()
        }).eq("id_progreso", id_progreso).execute()
        
        return {
            "success": True,
            "message": "PRODUCTOS guardado exitosamente",
            "estado": "EN_INSTALACION",
            "porcentaje": 75
        }
        
    except Exception as e:
        print(f"Error guardando PRODUCTOS: {e}")
        return {"success": False, "message": str(e)}


def guardar_paso_instalacion(notificacion_id: str, datos: Dict[str, Any], personal_id: str) -> Dict[str, Any]:
    """
    Guarda los datos del paso INSTALACION (confirmación final)
    
    datos esperado: {
        "fecha_instalacion": "2026-03-15",
        "personal_instalacion": [...],
        "fotos_antes": [...],
        "fotos_durante": [...],
        "fotos_despues": [...],
        "observaciones": "...",
        "problemas_encontrados": "...",
        "tiempo_real_ejecucion": "...",
        "firma_cliente": "base64_image"
    }
    """
    try:
        progreso = obtener_progreso(notificacion_id)
        if not progreso['success']:
            return {"success": False, "message": "Progreso no existe"}
        
        # Validar secuencia
        if not progreso['pasos_completados']['productos']:
            return {"success": False, "message": "Debe completar PRODUCTOS antes de INSTALACION"}
        
        id_progreso = progreso['id_progreso']
        
        # Actualizar progreso a COMPLETADO
        resultado = supabase.table("progreso_servicio").update({
            "paso_instalacion_datos": json.dumps(datos),
            "paso_instalacion_completado": True,
            "paso_instalacion_fecha": datetime.now().isoformat(),
            "estado_actual": "COMPLETADO",
            "porcentaje_completado": 100,
            "personal_id": personal_id,
            "actualizado_en": datetime.now().isoformat()
        }).eq("id_progreso", id_progreso).execute()
        
        if resultado.data:
            # Actualizar estado de notificación a FINALIZADO
            supabase.table("notificacion_trabajo").update({
                "estado_notificacion_id": obtener_estado_finalizado()
            }).eq("id_notificacion", notificacion_id).execute()
            
            return {
                "success": True,
                "message": "INSTALACION guardada. SERVICIO COMPLETADO! ✓",
                "estado": "COMPLETADO",
                "porcentaje": 100
            }
        
    except Exception as e:
        print(f"Error guardando INSTALACION: {e}")
        return {"success": False, "message": str(e)}


# ============================================================================
# UTILIDADES ADICIONALES
# ============================================================================

def obtener_estado_finalizado():
    """Obtiene el ID de estado FINALIZADO"""
    try:
        resultado = supabase.table("estado_notificacion").select("id_estado").eq(
            "descripcion", "FINALIZADO"
        ).execute()
        
        if resultado.data:
            return resultado.data[0]['id_estado']
        return None
    except:
        return None


def obtener_progreso_por_etapa(etapa: str) -> list:
    """
    Obtiene todos los servicios en una etapa específica.
    Útil para dashboards y reportes.
    """
    try:
        resultado = supabase.table("progreso_servicio").select("*").eq(
            "estado_actual", f"EN_{etapa.upper()}"
        ).execute()
        
        return resultado.data or []
    except Exception as e:
        print(f"Error obteniendo progreso por etapa: {e}")
        return []


def obtener_estadisticas_servicio(notificacion_id: str) -> Dict[str, Any]:
    """Obtiene estadísticas completas de un servicio"""
    try:
        progreso = obtener_progreso(notificacion_id)
        
        if not progreso['success']:
            return {"success": False}
        
        datos = progreso['datos']
        
        return {
            "success": True,
            "notificacion_id": notificacion_id,
            "estado": progreso['estado_actual'],
            "porcentaje": progreso['porcentaje_completado'],
            
            "remetro": {
                "completado": progreso['pasos_completados']['remetro'],
                "fecha": progreso.get('paso_remetro_fecha'),
                "medidas": len(datos.get('remetro', {}).get('medidas', []))
            },
            
            "retazo": {
                "completado": progreso['pasos_completados']['retazo'],
                "fecha": progreso.get('paso_retazo_fecha'),
                "retazos_usados": len(datos.get('retazo', {}).get('retazos_seleccionados', []))
            },
            
            "productos": {
                "completado": progreso['pasos_completados']['productos'],
                "fecha": progreso.get('paso_productos_fecha'),
                "cortes_vidrio": len(datos.get('productos', {}).get('cortes_vidrio', [])),
                "cortes_aluminio": len(datos.get('productos', {}).get('cortes_aluminio', []))
            },
            
            "instalacion": {
                "completado": progreso['pasos_completados']['instalacion'],
                "fecha": progreso.get('paso_instalacion_fecha')
            }
        }
        
    except Exception as e:
        print(f"Error obteniendo estadísticas: {e}")
        return {"success": False, "message": str(e)}
