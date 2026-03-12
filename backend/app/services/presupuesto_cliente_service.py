"""
Servicio para guardar presupuestos con búsqueda de cliente
y generación de notificaciones asociadas.
"""

from typing import Optional, Dict, List, Tuple
from datetime import datetime
from services.supabase_client import supabase


def buscar_cliente_por_documento(documento: str) -> Optional[Dict]:
    """
    Busca un cliente en la tabla 'cliente' por el campo 'documento'.
    Retorna el registro del cliente si lo encuentra, None caso contrario.
    """
    try:
        result = supabase.table("cliente").select("*").eq("documento", documento).execute()
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
    except Exception as e:
        print(f"Error buscando cliente por documento: {str(e)}")
        return None


def guardar_presupuesto_con_cliente(presupuesto_data: Dict, cliente_encontrado: Optional[Dict], documento_ingresado: str, nombre_apis: str) -> Tuple[bool, str, Optional[str]]:
    """
    Guarda un presupuesto FICTICIO (no en BD presupuesto).
    Crea:
    - Notificación con el TOTAL del presupuesto
    - Corte con ancho, alto y normbre = "documento - nombre"
    
    - Si cliente_encontrado existe: normbre = nombre del cliente
    - Si no existe: normbre = documento + nombre_apis
    
    Retorna: (success: bool, message: str, presupuesto_id: Optional[str])
    """
    try:
        print(f"\n========================================")
        print(f"DEBUG: Datos recibidos en presupuesto_data:")
        for key, value in presupuesto_data.items():
            print(f"  {key}: {value} (tipo: {type(value).__name__})")
        print(f"========================================\n")
        
        # Determinar nombre para notificación y cortes
        if cliente_encontrado:
            nombre_notif = cliente_encontrado.get("nombre", "Cliente desconocido")
            cliente_id = cliente_encontrado.get("id_cliente")
        else:
            nombre_notif = f"{documento_ingresado} - {nombre_apis}"
            cliente_id = None
        
        # Crear notificación con el TOTAL del presupuesto
        total = float(presupuesto_data.get("total", 0))
        descripcion = presupuesto_data.get("descripcion", "Presupuesto de servicio")
        
        # Guardar el total en la descripción
        if total > 0:
            descripcion_final = f"{descripcion} - Total: S/. {total:.2f}"
        else:
            descripcion_final = descripcion
        
        notificacion_insert = {
            "nombre": nombre_notif,
            "descripcion": descripcion_final,
            "id_cliente": cliente_id,
            "tipo": "servicio",
            "estado_notificacion_id": None
        }
        
        print(f"DEBUG: Creando notificación con nombre={nombre_notif}, total={total}")
        notif_result = supabase.table("notificacion").insert(notificacion_insert).execute()
        if not notif_result.data:
            print("Advertencia: Notificación no se creó")
            notificacion_id = None
        else:
            notificacion_id = notif_result.data[0].get("id_notificacion")
            print(f"✓ Notificación creada: {notificacion_id}")
        
        # Crear corte con ancho, alto
        ancho = presupuesto_data.get("ancho")
        alto = presupuesto_data.get("alto")
        
        print(f"DEBUG: Valores recibidos - ancho={ancho} (tipo: {type(ancho).__name__}), alto={alto} (tipo: {type(alto).__name__})")
        
        # Convertir a float y validar
        try:
            ancho_float = float(ancho) if ancho else 0
            alto_float = float(alto) if alto else 0
        except (ValueError, TypeError) as e:
            print(f"DEBUG: Error convertiendo valores: {e}")
            ancho_float = 0
            alto_float = 0
        
        print(f"DEBUG: Valores convertidos - ancho_float={ancho_float}, alto_float={alto_float}")
        
        if ancho_float > 0 and alto_float > 0:
            try:
                # Crear carrito ficticio para asociar el corte
                carrito_insert = {
                    "cliente_id": cliente_id,
                    "estado": "pendiente"
                }
                
                print(f"DEBUG: Creando carrito ficticio para cliente_id={cliente_id}")
                carrito_result = supabase.table("carrito_compras").insert(carrito_insert).execute()
                
                if not carrito_result.data:
                    print(f"✗ Error: No se pudo crear carrito")
                    return False, "Error al crear carrito para corte", None
                
                carrito_id = carrito_result.data[0].get("id_carrito")
                print(f"✓ Carrito creado: {carrito_id}")
                
                # Buscar un producto genérico para el corte (necesario porque producto_id no puede ser NULL)
                producto_generico = None
                try:
                    # Buscar producto que se llame "Vidrio" o similar, o tomar el primero
                    productos_result = supabase.table("productos").select("id_producto").limit(1).execute()
                    if productos_result.data and len(productos_result.data) > 0:
                        producto_generico = productos_result.data[0].get("id_producto")
                        print(f"DEBUG: Producto genérico encontrado: {producto_generico}")
                    else:
                        print(f"✗ Error: No hay productos en la BD para asociar al corte")
                        return False, "No hay productos disponibles para crear corte", None
                except Exception as e:
                    print(f"✗ Error buscando producto: {str(e)}")
                    return False, "Error buscando producto para corte", None
                
                # Ahora crear el corte con el carrito_id y producto_id
                cortes_insert = {
                    "ancho_cm": ancho_float,
                    "alto_cm": alto_float,
                    "cantidad": 1,
                    "estado": "pendiente",
                    "carrito_id": carrito_id,
                    "producto_id": producto_generico,
                    "normbre": nombre_notif  # "documento - nombre"
                }
                
                print(f"DEBUG: Creando corte con ancho={ancho_float}, alto={alto_float}, normbre={nombre_notif}")
                print(f"DEBUG: Payload de corte: {cortes_insert}")
                cortes_result = supabase.table("cortes").insert(cortes_insert).execute()
                print(f"DEBUG: Resultado de inserción: {cortes_result}")
                if not cortes_result.data:
                    print(f"Advertencia: Corte no se creó - Resultado vacío")
                else:
                    print(f"✓ Corte creado exitosamente: {cortes_result.data[0]}")
            except Exception as e:
                print(f"✗ Error al crear corte: {str(e)}")
                import traceback
                traceback.print_exc()
        else:
            print(f"DEBUG: No se creó corte - ancho_float={ancho_float}, alto_float={alto_float} (ambos deben ser > 0)")
        
        return True, "Presupuesto procesado exitosamente", notificacion_id
        
    except Exception as e:
        print(f"Error guardando presupuesto: {str(e)}")
        return False, f"Error: {str(e)}", None


def guardar_multiples_presupuestos(presupuestos_list: List[Dict], cliente_encontrado: Optional[Dict], documento_ingresado: str, nombre_apis: str) -> Tuple[bool, str, List[str]]:
    """
    Guarda múltiples presupuestos de una sola vez.
    Retorna: (success: bool, message: str, presupuesto_ids: List[str])
    """
    presupuesto_ids = []
    errores = []
    
    for pres in presupuestos_list:
        success, msg, pres_id = guardar_presupuesto_con_cliente(pres, cliente_encontrado, documento_ingresado, nombre_apis)
        if success and pres_id:
            presupuesto_ids.append(pres_id)
        else:
            errores.append(msg)
    
    if errores:
        msg = f"Se guardaron {len(presupuesto_ids)} presupuestos. Errores: {'; '.join(errores)}"
    else:
        msg = f"Se guardaron exitosamente {len(presupuesto_ids)} presupuestos"
    
    return len(errores) == 0, msg, presupuesto_ids
