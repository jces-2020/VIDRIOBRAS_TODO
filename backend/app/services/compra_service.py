from services.supabase_client import supabase
from typing import Optional, Dict, Any, List

# Buscar cliente por documento

def buscar_cliente_por_documento(documento: str) -> Optional[Dict[str, Any]]:
    res = supabase.table("cliente").select("*").eq("documento", documento).execute()
    if res.data and len(res.data) > 0:
        return res.data[0]
    return None

# Guardar flujo de compra

def guardar_flujo_compra(cliente: Optional[dict], productos: List[dict], cortes: List[dict], metodo_pago: str, documento: str = "", nombre_api_peru: str = "") -> bool:
    nombres_productos = ", ".join([p["nombre"] for p in productos])
    # Si existe cliente
    if cliente:
        # 1. Crear carrito_compras
        carrito_payload = {
            "estado": "inicio",
            "cliente_id": cliente["id_cliente"]
        }
        carrito_res = supabase.table("carrito_compras").insert(carrito_payload).execute()
        if not carrito_res.data:
            return False
        id_carrito = carrito_res.data[0]["id_carrito"]
        # 2. Guardar productos en productos_carrito
        productos_payload = [
            {
                "producto_id": p["id_producto"],
                "carrito_id": id_carrito,
                "cantidad": p["cantidad"]
            }
            for p in productos
        ]
        if productos_payload:
            supabase.table("productos_carrito").insert(productos_payload).execute()
        # 3. Guardar cortes en cortes
        cortes_payload = [
            {
                "ancho_cm": c["ancho_cm"],
                "alto_cm": c["alto_cm"],
                "cantidad": c["cantidad"],
                "carrito_id": id_carrito,
                "producto_id": c["producto_id"],
                "normbre": c.get("nombre", "")
            }
            for c in cortes
        ]
        if cortes_payload:
            supabase.table("cortes").insert(cortes_payload).execute()
        # 4. Crear notificación
        notif_payload = {
            "tipo": "entrega",
            "nombre": cliente["nombre"],
            "descripcion": nombres_productos,
            "id_cliente": cliente["id_cliente"]
        }
        supabase.table("notificacion").insert(notif_payload).execute()
        return True
    else:
        # Si NO existe cliente
        # Siempre mostrar ambos, aunque uno esté vacío
        nombre_completo = f"{documento} - {nombre_api_peru}" if documento and nombre_api_peru else (documento or nombre_api_peru or "")
        # 1. Crear carrito_compras (sin cliente_id, pero con nombre)
        carrito_payload = {
            "estado": "inicio",
            "nombre": nombre_completo
        }
        carrito_res = supabase.table("carrito_compras").insert(carrito_payload).execute()
        if not carrito_res.data:
            return False
        id_carrito = carrito_res.data[0]["id_carrito"]
        # 2. Guardar productos en productos_carrito
        productos_payload = [
            {
                "producto_id": p["id_producto"],
                "carrito_id": id_carrito,
                "cantidad": p["cantidad"]
            }
            for p in productos
        ]
        if productos_payload:
            supabase.table("productos_carrito").insert(productos_payload).execute()
        # 3. Guardar cortes en cortes (nombre especial)
        cortes_payload = [
            {
                "ancho_cm": c["ancho_cm"],
                "alto_cm": c["alto_cm"],
                "cantidad": c["cantidad"],
                "carrito_id": id_carrito,
                "producto_id": c["producto_id"],
                "normbre": nombre_completo
            }
            for c in cortes
        ]
        if cortes_payload:
            supabase.table("cortes").insert(cortes_payload).execute()
        # 4. Crear notificación (nombre especial)
        notif_payload = {
            "tipo": "entrega",
            "nombre": nombre_completo,
            "descripcion": nombres_productos
        }
        supabase.table("notificacion").insert(notif_payload).execute()
        return True
