"""
Servicio para gestión de personal.
Consulta Supabase para obtener información del personal y sus bonos.
"""

from typing import Dict, List, Any, Optional

from services.supabase_client import supabase


def get_all_personal() -> List[Dict[str, Any]]:
    """
    Obtiene todo el personal con información de tipo_personal.
    """
    try:
        result = supabase.table("personal").select(
            "*, tipo_personal:tipo_personal_id(id_tipo, descripcion)"
        ).execute()
        print(f"[personal_service] fetched {len(result.data or [])} personal records")
        return result.data or []
    except Exception as exc:  # noqa: BLE001
        print(f"[personal_service] error fetching personal: {exc}")
        import traceback
        traceback.print_exc()
        return []


def get_personal_by_id(personal_id: str) -> Optional[Dict[str, Any]]:
    """
    Obtiene detalles de un personal específico.
    """
    try:
        result = supabase.table("personal").select(
            "*, tipo_personal:tipo_personal_id(id_tipo, descripcion)"
        ).eq("id_personal", personal_id).execute()
        if result.data:
            return result.data[0]
        return None
    except Exception as exc:  # noqa: BLE001
        print(f"[personal_service] error fetching personal by id: {exc}")
        import traceback
        traceback.print_exc()
        return None


def get_bonos_personal(personal_id: str) -> List[Dict[str, Any]]:
    """
    Obtiene los bonos asignados a un personal.
    """
    try:
        result = supabase.table("bonos_personal").select(
            "bono_id, bonos:bono_id(id_bono, descripcion)"
        ).eq("personal_id", personal_id).execute()
        return result.data or []
    except Exception as exc:  # noqa: BLE001
        print(f"[personal_service] error fetching bonos: {exc}")
        return []


def get_all_bonos() -> List[Dict[str, Any]]:
    """
    Obtiene todos los bonos disponibles.
    """
    try:
        result = supabase.table("bonos").select("id_bono, descripcion").execute()
        return result.data or []
    except Exception as exc:  # noqa: BLE001
        print(f"[personal_service] error fetching all bonos: {exc}")
        return []


def add_bono_to_personal(personal_id: str, bono_id: str) -> bool:
    """
    Asigna un bono a un personal.
    """
    try:
        result = supabase.table("bonos_personal").insert({
            "personal_id": personal_id,
            "bono_id": bono_id
        }).execute()
        return bool(result.data)
    except Exception as exc:  # noqa: BLE001
        print(f"[personal_service] error adding bono: {exc}")
        return False


def remove_bono_from_personal(personal_id: str, bono_id: str) -> bool:
    """
    Elimina un bono de un personal.
    """
    try:
        result = supabase.table("bonos_personal").delete().eq(
            "personal_id", personal_id
        ).eq("bono_id", bono_id).execute()
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"[personal_service] error removing bono: {exc}")
        return False


def create_pago(personal_id: str, monto: float, fecha: str) -> Optional[Dict[str, Any]]:
    """
    Crea un registro de pago para el personal.
    Nota: La tabla 'pago' no tiene FK directa a personal, pero la creamos de todas formas.
    """
    try:
        result = supabase.table("pago").insert({
            "monto": monto,
            "fecha": fecha
        }).execute()
        if result.data:
            return result.data[0]
        return None
    except Exception as exc:  # noqa: BLE001
        print(f"[personal_service] error creating pago: {exc}")
        return None


__all__ = [
    "get_all_personal",
    "get_personal_by_id",
    "get_bonos_personal",
    "get_all_bonos",
    "add_bono_to_personal",
    "remove_bono_from_personal",
    "create_pago",
]
