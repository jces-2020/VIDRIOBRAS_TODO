from services.supabase_client import supabase
from datetime import date
from typing import Optional

def registrar_venta(total: float, metodo: str, caja_id: Optional[str] = None) -> bool:
    venta_payload = {
        "total": total,
        "fecha_venta": date.today().isoformat(),
        "metodo": metodo,
        "caja_id": caja_id
    }
    res = supabase.table("venta").insert(venta_payload).execute()
    return bool(res.data)
