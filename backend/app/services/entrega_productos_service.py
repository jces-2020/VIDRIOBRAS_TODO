"""
Servicio para productos de entrega.
"""
import json
import re
from typing import Dict, Any, List
from app.services.supabase_client import supabase
from app.services.entrega_reporte_service import obtener_reporte_temporal


def _obtener_carrito_id(notificacion_id: str) -> str:
    notif_result = supabase.table("notificacion") \
        .select("descripcion") \
        .eq("id_notificacion", notificacion_id) \
        .limit(1) \
        .execute()

    if not notif_result.data:
        return ""

    descripcion = (notif_result.data[0] or {}).get("descripcion", "{}")
    try:
        meta = json.loads(descripcion)
        if isinstance(meta, dict):
            carrito_id = meta.get("carrito_id") or ""
            if carrito_id:
                return carrito_id
    except Exception:
        pass

    # Fallback para descripciones como: "Pago ... (Carrito: <uuid>)"
    if isinstance(descripcion, str):
        match = re.search(r"Carrito:\s*([0-9a-fA-F-]{36})", descripcion)
        if match:
            return match.group(1)

    return ""


def obtener_productos_entrega_por_notificacion(notificacion_id: str) -> Dict[str, Any]:
    """
    Obtiene productos comprados del cliente (plancha) y productos por corte sin merma.
    """
    try:
        carrito_id = _obtener_carrito_id(notificacion_id)
        if not carrito_id:
            return {
                "success": True,
                "message": "El cliente no agregó productos",
                "data": [],
                "carrito_id": ""
            }

        items = supabase.table("productos_carrito") \
            .select("producto_id, cantidad") \
            .eq("carrito_id", carrito_id) \
            .execute().data or []

        producto_ids = [it.get("producto_id") for it in items if it.get("producto_id")]
        productos = []
        productos_map = {}

        if producto_ids:
            datos = supabase.table("productos") \
                .select("id_producto, nombre, descripcion, codigo, grosor, cantidad, categoria_id, categoria(descripcion), almacen(fila, columna)") \
                .in_("id_producto", producto_ids) \
                .execute().data or []
            productos_map = {p.get("id_producto"): p for p in datos}

        for it in items:
            pid = it.get("producto_id")
            prod = productos_map.get(pid, {})
            productos.append({
                "producto_id": pid,
                "nombre": prod.get("nombre"),
                "descripcion": prod.get("descripcion"),
                "codigo": prod.get("codigo"),
                "grosor": prod.get("grosor"),
                "categoria_id": prod.get("categoria_id"),
                "categoria": (prod.get("categoria") or {}).get("descripcion"),
                "almacen_fila": (prod.get("almacen") or {}).get("fila"),
                "almacen_columna": (prod.get("almacen") or {}).get("columna"),
                "cantidad_cliente": it.get("cantidad") or 0,
                "stock_cantidad": prod.get("cantidad") or 0,
                "origen": "plancha"
            })

        reporte_tmp = obtener_reporte_temporal(notificacion_id)
        if reporte_tmp.get("success"):
            planchas = (reporte_tmp.get("data") or {}).get("plancha_por_corte", [])
            for plancha in planchas:
                pid = plancha.get("producto_id")
                if not pid:
                    continue
                if any(p.get("producto_id") == pid for p in productos):
                    continue

                prod = productos_map.get(pid)
                if not prod:
                    prod = supabase.table("productos") \
                        .select("id_producto, nombre, descripcion, codigo, grosor, cantidad, categoria_id, categoria(descripcion), almacen(fila, columna)") \
                        .eq("id_producto", pid) \
                        .limit(1) \
                        .execute().data or [{}]
                    prod = prod[0] if prod else {}

                productos.append({
                    "producto_id": pid,
                    "nombre": plancha.get("producto_nombre") or prod.get("nombre"),
                    "descripcion": plancha.get("producto_descripcion") or prod.get("descripcion"),
                    "codigo": plancha.get("producto_codigo") or prod.get("codigo"),
                    "grosor": prod.get("grosor"),
                    "categoria_id": plancha.get("categoria_id") or prod.get("categoria_id"),
                    "categoria": plancha.get("categoria") or (prod.get("categoria") or {}).get("descripcion"),
                    "almacen_fila": (prod.get("almacen") or {}).get("fila"),
                    "almacen_columna": (prod.get("almacen") or {}).get("columna"),
                    "cantidad_cliente": plancha.get("cantidad") or 1,
                    "stock_cantidad": prod.get("cantidad") or 0,
                    "origen": "corte_sin_merma"
                })

        if not productos:
            return {
                "success": True,
                "message": "El cliente no agregó productos",
                "data": [],
                "carrito_id": carrito_id
            }

        return {"success": True, "data": productos, "carrito_id": carrito_id}
    except Exception as exc:
        return {"success": False, "message": str(exc), "data": []}


def descontar_stock_productos(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Descuenta stock en tabla productos segun items.
    """
    try:
        if not items:
            return {"success": False, "message": "Lista vacia", "actualizados": 0}

        actualizados = 0
        for item in items:
            producto_id = item.get("producto_id")
            cantidad = float(item.get("cantidad") or 0)
            if not producto_id or cantidad <= 0:
                continue

            res = supabase.table("productos") \
                .select("cantidad") \
                .eq("id_producto", producto_id) \
                .limit(1) \
                .execute()

            if not res.data:
                continue

            actual = float(res.data[0].get("cantidad") or 0)
            nuevo = int(max(actual - cantidad, 0))  # Convertir a int

            supabase.table("productos") \
                .update({"cantidad": nuevo}) \
                .eq("id_producto", producto_id) \
                .execute()

            actualizados += 1

        return {"success": True, "actualizados": actualizados}
    except Exception as exc:
        return {"success": False, "message": str(exc), "actualizados": 0}
