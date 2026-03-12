from flask import Blueprint, jsonify, request
from app.services.supabase_client import supabase
import os, json, base64, hmac, hashlib, time

pedidos_detalle_api = Blueprint('pedidos_detalle_api', __name__)

# Utilidades JWT (HS256 sin dependencia externa)
def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

def _b64url_decode(data: str) -> bytes:
    rem = len(data) % 4
    if rem:
        data += '=' * (4 - rem)
    return base64.urlsafe_b64decode(data)

def verify_jwt(token: str):
    try:
        parts = token.split('.')
        print(f"[DEBUG verify_jwt] Token partes: {len(parts)}")
        if len(parts) != 3:
            print(f"[DEBUG verify_jwt] Token no tiene 3 partes, retornando None")
            return None
        
        # Decodificar header y payload
        header = json.loads(_b64url_decode(parts[0]).decode('utf-8'))
        payload = json.loads(_b64url_decode(parts[1]).decode('utf-8'))
        signature = parts[2]
        print(f"[DEBUG verify_jwt] Header algorithm: {header.get('alg')}, Payload aud: {payload.get('aud')}")
        
        if header.get('alg') != 'HS256':
            print(f"[DEBUG verify_jwt] Algorithm no es HS256, retornando None")
            return None
        
        secret = os.environ.get('JWT_SECRET', 'devsecret-change-me')
        print(f"[DEBUG verify_jwt] Secret usado (first 20 chars): {secret[:20]}...")
        
        # Recrear el signing_input EXACTAMENTE como en tipo_personal_controller.py
        # signing_input = f"{_b64url(json.dumps(header).encode())}.{_b64url(json.dumps(payload).encode())}"
        signing_input = parts[0] + '.' + parts[1]
        
        # Crear firma esperada
        expected = hmac.new(secret.encode('utf-8'), signing_input.encode('utf-8'), hashlib.sha256).digest()
        expected_b64 = _b64url(expected)
        
        print(f"[DEBUG verify_jwt] Firma recibida (first 20): {signature[:20]}...")
        print(f"[DEBUG verify_jwt] Firma esperada (first 20): {expected_b64[:20]}...")
        print(f"[DEBUG verify_jwt] ¿Firmas coinciden?: {hmac.compare_digest(signature, expected_b64)}")
        
        if not hmac.compare_digest(signature, expected_b64):
            print(f"[DEBUG verify_jwt] Firma no coincide, retornando None")
            return None
        
        if payload.get('exp') and int(payload['exp']) < int(time.time()):
            print(f"[DEBUG verify_jwt] Token expirado (exp: {payload['exp']}, now: {int(time.time())}), retornando None")
            return None
        
        print(f"[DEBUG verify_jwt] JWT válido para: {payload.get('name')} en área {payload.get('area')}")
        return payload
    except Exception as e:
        import traceback
        print(f"[DEBUG verify_jwt] Excepción: {e}")
        print(traceback.format_exc())
        return None

def _require_personal(request, allowed_areas=None):
    auth = request.headers.get('Authorization', '')
    print(f"[DEBUG _require_personal] Authorization header: '{auth[:50]}...' (exists: {bool(auth)})")
    
    if not auth.startswith('Bearer '):
        print(f"[DEBUG _require_personal] Header no comienza con 'Bearer', retornando 401")
        return False, (jsonify({'success': False, 'message': 'No autorizado'}), 401)
    
    token = auth.split(' ', 1)[1]
    print(f"[DEBUG _require_personal] Token extractado: '{token[:50]}...'")
    
    payload = verify_jwt(token)
    print(f"[DEBUG _require_personal] JWT verificado: {bool(payload)}, payload: {payload}")
    
    if not payload or payload.get('aud') != 'personal':
        print(f"[DEBUG _require_personal] Payload inválido o aud != 'personal', retornando 401")
        return False, (jsonify({'success': False, 'message': 'Token inválido'}), 401)
    
    if allowed_areas:
        area = (payload.get('area') or '').upper()
        area = area.replace('Á','A').replace('É','E').replace('Í','I').replace('Ó','O').replace('Ú','U')
        if area == 'OPERACIONES':
            area = 'OBRAS'
        allowed_norm = [a.upper().replace('Á','A').replace('É','E').replace('Í','I').replace('Ó','O').replace('Ú','U') for a in allowed_areas]
        print(f"[DEBUG _require_personal] Área verificada: '{area}' en {allowed_norm}")
        if area not in allowed_norm:
            print(f"[DEBUG _require_personal] Área no autorizada, retornando 403")
            return False, (jsonify({'success': False, 'message': 'Área no autorizada'}), 403)
    
    print(f"[DEBUG _require_personal] Autorización exitosa para: {payload.get('name')}")
    return True, payload

def _parse_notif_desc(desc_str: str):
    """Intenta parsear la descripcion de notificación guardada como JSON.
    Retorna dict con al menos keys: cantidad?, carrito_id?"""
    try:
        data = json.loads(desc_str or '{}')
        if isinstance(data, dict):
            return data
    except Exception:
        pass
    # Fallback: intentar extraer 'carrito_id' si está en texto
    out = {}
    if isinstance(desc_str, str):
        import re
        m = re.search(r"[0-9a-fA-F\-]{36}", desc_str)
        if m:
            out['carrito_id'] = m.group(0)
    return out

def _infer_tipo_notif(item: dict) -> str:
    try:
        desc = str(item.get('descripcion_raw') or '').lower()
    except Exception:
        desc = ''
    estado = str(item.get('carrito_estado') or '').strip().lower()
    if 'optim' in desc:
        return 'OPTIMIZACION'
    if estado in ('listo', 'pagado'):
        return 'ENTREGA'
    return 'SERVICIO'

@pedidos_detalle_api.route('/api/admin/notificaciones', methods=['GET'])
def listar_notificaciones_admin():
    """Lista notificaciones de trabajo para el panel (requiere JWT de personal)."""
    try:
        ok, resp = _require_personal(request, allowed_areas=['ALMACEN', 'ADMINISTRACION', 'OBRAS', 'TRABAJO'])
        if not ok:
            return resp
        
        # Parámetros
        ocultar_atendidas = (request.args.get('ocultar_atendidas') or '').strip().lower() in ('1','true','yes','si')
        tipo_filter = (request.args.get('tipo') or '').strip().upper()
        
        # Usar tabla 'notificacion' para todos los tipos (SERVICIO/OPTIMIZACION/ENTREGA)
        res = supabase.table('notificacion').select('*').execute()
        notifs_raw = getattr(res, 'data', []) or []
        
        # cache de estados de notificación (id -> descripcion)
        estados_map = {}
        try:
            estn = supabase.table('estado_notificacion').select('id_estado, descripcion').execute()
            for row in getattr(estn, 'data', []) or []:
                estados_map[row.get('id_estado')] = (row.get('descripcion') or '').strip()
        except Exception:
            estados_map = {}

        notifs = []
        for n in notifs_raw:
            # Parsear metadatos
            meta = _parse_notif_desc(n.get('descripcion'))
            carrito_id = meta.get('carrito_id')
            
            # Para ENTREGA, obtener estado del carrito si existe
            c_estado = None
            if carrito_id:
                try:
                    c = supabase.table('carrito_compras').select('estado').eq('id_carrito', carrito_id).limit(1).execute()
                    if c and getattr(c, 'data', None):
                        c_estado = (c.data[0].get('estado') or '').strip()
                except Exception:
                    c_estado = None

            # Descripción amigable
            try:
                desc_txt = n.get('descripcion') or ''
            except Exception:
                desc_txt = ''
            
            if meta.get('cantidad'):
                desc_txt = f"Cantidad de productos llevar: {meta.get('cantidad')}"

            item = {
                'id': n.get('id_notificacion') or n.get('id'),
                'nombre': n.get('nombre'),
                'cantidad': meta.get('cantidad'),
                'carrito_id': carrito_id,
                'descripcion_raw': n.get('descripcion'),
                'descripcion': desc_txt,
                'estado_notificacion_id': n.get('estado_notificacion_id'),
                'carrito_estado': c_estado,
                'estado_label': estados_map.get(n.get('estado_notificacion_id'))
            }
            
            # Tipo desde columna 'tipo' si existe; fallback a inferencia
            item_tipo = (n.get('tipo') or '').strip().upper()
            if not item_tipo:
                item_tipo = _infer_tipo_notif(item)
            item['tipo'] = item_tipo
            
            # Filtrar si se pidió ocultar atendidas
            if ocultar_atendidas and (str(item.get('carrito_estado') or '').lower() in ('listo','pagado')):
                continue
            
            # Filtrar por tipo si se solicitó
            if tipo_filter and item_tipo != tipo_filter:
                continue
            
            notifs.append(item)
        
        return jsonify({'success': True, 'notificaciones': notifs}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    
def _get_estado_id_por_nombre(nombre: str):
    """Mapea nombre de estado a id_estado. Maneja EN_PROCESO -> 'En proceso', etc."""
    try:
        estn = supabase.table('estado_notificacion').select('id_estado, descripcion').execute()
        nombre_n = (nombre or '').strip().upper()
        
        # Mapeo de alias
        mapeo = {
            'EN_PROCESO': 'EN PROCESO',
            'FINALIZANDO': 'FINALIZANDO',
            'ATENDIDA': 'ATENDIDA',
            'PENDIENTE': 'PENDIENTE'
        }
        
        nombre_mapped = mapeo.get(nombre_n, nombre_n)
        
        for row in getattr(estn, 'data', []) or []:
            desc = (row.get('descripcion') or '').strip().upper()
            if desc == nombre_mapped or desc == nombre_n:
                return row.get('id_estado')
        return None
    except Exception:
        return None

@pedidos_detalle_api.route('/api/admin/notificaciones/<notif_id>/estado', methods=['PATCH'])
def actualizar_estado_notificacion_admin(notif_id):
        """Actualiza el estado de trabajo de una notificación.
        Body JSON: { estado: 'EN_PROCESO' | 'FINALIZANDO' | 'ATENDIDA' }
        Si la notificación es de ENTREGA (tipo) y el estado es EN_PROCESO,
        también cambia el carrito_compras a 'en proceso'.
        """
        try:
            print(f"\n{'#'*80}")
            print(f"[DEBUG ENDPOINT] PATCH /api/admin/notificaciones/{notif_id}/estado")
            
            ok, resp = _require_personal(request, allowed_areas=['ALMACEN', 'ADMINISTRACION', 'OBRAS', 'TRABAJO'])
            if not ok:
                print(f"[DEBUG] ❌ Autorización fallida")
                return resp
            
            data = request.get_json(silent=True) or {}
            print(f"[DEBUG] Body recibido: {data}")
            
            estado_req = (data.get('estado') or '').strip().upper()
            print(f"[DEBUG] Estado solicitado: '{estado_req}'")
            
            if estado_req not in ('EN_PROCESO', 'FINALIZANDO', 'ATENDIDA'):
                print(f"[DEBUG] ❌ Estado inválido")
                return jsonify({'success': False, 'message': 'Estado inválido'}), 400

            eid = _get_estado_id_por_nombre(estado_req)
            print(f"[DEBUG] ID de estado obtenido: {eid}")
            
            if not eid:
                print(f"[DEBUG] ❌ Estado no configurado en BD")
                return jsonify({'success': False, 'message': 'Estado no configurado'}), 400

            # Intentar obtener notificación de tabla 'notificacion' primero (ENTREGA)
            print(f"[DEBUG] Buscando notificación en tabla 'notificacion'...")
            nres = supabase.table('notificacion').select('*').eq('id_notificacion', notif_id).limit(1).execute()
            notif_data = None
            tabla_origen = None
            
            if nres and getattr(nres, 'data', None):
                notif_data = nres.data[0]
                tabla_origen = 'notificacion'
                print(f"[DEBUG] ✓ Notificación encontrada en tabla 'notificacion'")
                print(f"[DEBUG] Datos de notificación: {notif_data}")
            else:
                # Fallback a notificacion_trabajo
                print(f"[DEBUG] No encontrada en 'notificacion', buscando en 'notificacion_trabajo'...")
                nres2 = supabase.table('notificacion_trabajo').select('*').eq('id_notificacion', notif_id).limit(1).execute()
                if nres2 and getattr(nres2, 'data', None):
                    notif_data = nres2.data[0]
                    tabla_origen = 'notificacion_trabajo'
                    print(f"[DEBUG] ✓ Notificación encontrada en tabla 'notificacion_trabajo'")
                    print(f"[DEBUG] Datos de notificación: {notif_data}")
            
            print(f"[DEBUG] Tabla origen: '{tabla_origen}'")
            
            if not notif_data:
                print(f"[DEBUG] ❌ Notificación no encontrada en ninguna tabla")
                return jsonify({'success': False, 'message': 'Notificación no encontrada'}), 404

            # Actualizar estado de la notificación
            print(f"[DEBUG] Actualizando estado_notificacion_id={eid} en tabla '{tabla_origen}'")
            supabase.table(tabla_origen).update({'estado_notificacion_id': eid}).eq('id_notificacion', notif_id).execute()
            print(f"[DEBUG] ✓ Estado actualizado en BD")
            
            # Si es ENTREGA (tabla notificacion) y estado es EN_PROCESO, cambiar carrito a "en proceso"
            if tabla_origen == 'notificacion' and estado_req == 'EN_PROCESO':
                try:
                    print(f"\n{'='*80}")
                    print(f"[DEBUG ACTUALIZAR CARRITO] Intentando actualizar carrito para notificación ENTREGA")
                    print(f"[DEBUG] tabla_origen: {tabla_origen}")
                    print(f"[DEBUG] estado_req: {estado_req}")
                    
                    # Obtener id_cliente de la notificación
                    cliente_id = notif_data.get('id_cliente')
                    print(f"[DEBUG] cliente_id de la notificación: {cliente_id} (tipo: {type(cliente_id)})")
                    
                    if cliente_id:
                        # Primero buscar TODOS los carritos del cliente para ver qué hay
                        todos_carritos = supabase.table('carrito_compras').select('*').eq('cliente_id', cliente_id).execute()
                        print(f"[DEBUG] TODOS los carritos del cliente:")
                        if todos_carritos.data:
                            for idx, c in enumerate(todos_carritos.data):
                                print(f"  Carrito {idx+1}:")
                                print(f"    - id_carrito: {c.get('id_carrito')}")
                                print(f"    - estado: '{c.get('estado')}' (tipo: {type(c.get('estado'))})")
                                print(f"    - estado repr: {repr(c.get('estado'))}")
                        else:
                            print(f"  ⚠️  No se encontraron carritos para este cliente")
                        
                        # Ahora buscar los que están en estado "inicio"
                        carritos_res = supabase.table('carrito_compras').select('id_carrito, estado').eq('cliente_id', cliente_id).eq('estado', 'inicio').execute()
                        print(f"[DEBUG] Carritos filtrados con estado='inicio': {len(carritos_res.data) if carritos_res.data else 0}")
                        
                        if carritos_res and getattr(carritos_res, 'data', None):
                            for carrito in carritos_res.data:
                                carrito_id = carrito.get('id_carrito')
                                print(f"[DEBUG] → Actualizando carrito {carrito_id} a 'en proceso'")
                                # Actualizar carrito a "en proceso"
                                update_res = supabase.table('carrito_compras').update({'estado': 'en proceso'}).eq('id_carrito', carrito_id).execute()
                                print(f"[DEBUG] ✓ Resultado actualización: {update_res.data}")
                        else:
                            print(f"[DEBUG] ⚠️ No se encontraron carritos en estado 'inicio' para el cliente {cliente_id}")
                    else:
                        print(f"[DEBUG] ❌ No se encontró id_cliente en la notificación")
                    
                    print(f"{'='*80}\n")
                except Exception as e:
                    print(f"[ERROR] ❌ Error actualizando carrito: {e}")
                    import traceback
                    traceback.print_exc()
            
            return jsonify({'success': True, 'estado': estado_req}), 200
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

@pedidos_detalle_api.route('/api/admin/notificaciones/<notif_id>/detalle', methods=['GET'])
def detalle_notificacion_admin(notif_id):
    """Devuelve el detalle del pedido asociado a la notificación (si existe carrito_id en la descripción)."""
    try:
        ok, resp = _require_personal(request, allowed_areas=['ALMACEN', 'ADMINISTRACION', 'OBRAS', 'TRABAJO'])
        if not ok:
            return resp
        nres = supabase.table('notificacion_trabajo').select('*').eq('id_notificacion', notif_id).limit(1).execute()
        if not nres or not getattr(nres, 'data', None):
            return jsonify({'success': False, 'message': 'Notificación no encontrada'}), 404
        notif = nres.data[0]
        meta = _parse_notif_desc(notif.get('descripcion'))
        carrito_id = meta.get('carrito_id')
        if not carrito_id:
            return jsonify({'success': False, 'message': 'No se pudo determinar el carrito asociado'}), 400
        # Reutilizar la lógica de detalle por carrito
        # (invocamos la función local y devolvemos su JSON)
        # Implementación directa: replicar llamada
        car = supabase.table('carrito_compras').select('*').eq('id_carrito', carrito_id).limit(1).execute()
        if not car or not getattr(car, 'data', None):
            return jsonify({'success': False, 'message': 'Pedido no encontrado'}), 404
        carrito = car.data[0]
        estado_desc = carrito.get('estado')
        pedido_meta = { 'id': carrito.get('id_carrito'), 'estado': estado_desc or 'Proceso', 'created_at': carrito.get('created_at') or carrito.get('fecha') }
        # Cliente
        cliente = None
        if carrito.get('cliente_id'):
            cli = supabase.table('cliente').select('*').eq('id_cliente', carrito['cliente_id']).limit(1).execute()
            if cli and cli.data:
                row = cli.data[0]
                cliente = {
                    'id': row.get('id_cliente'),
                    'nombre': row.get('nombre'),
                    'numero': row.get('numero') or row.get('telefono') or row.get('celular'),
                    'tipo_documento': row.get('tipo_documento') or row.get('tipo_doc'),
                    'documento': row.get('documento') or row.get('dni') or row.get('ruc'),
                    'correo': row.get('correo') or row.get('email')
                }
        items = supabase.table('productos_carrito').select('*').eq('carrito_id', carrito_id).execute().data or []
        ids = [it['producto_id'] for it in items]
        productos = supabase.table('productos').select('*').in_('id_producto', ids).execute().data or []
        prod_map = {p.get('id_producto'): p for p in productos}
        joined = []
        total_precio = 0.0
        total_items = 0
        for it in items:
            p = prod_map.get(it.get('producto_id'))
            if not p:
                continue
            cantidad = float(it.get('cantidad') or 0)
            precio = float(p.get('precio_unitario') or 0)
            subtotal = round(precio * cantidad, 2)
            total_precio += subtotal
            total_items += cantidad
            joined.append({
                'id_producto': p.get('id_producto'),
                'nombre': p.get('nombre'),
                'codigo': p.get('codigo'),
                'cantidad': cantidad,
                'fila': p.get('fila'),
                'columna': p.get('columna'),
                'precio_unitario': precio,
                'subtotal': subtotal,
                'grosor': p.get('grosor'),
                'descripcion': p.get('descripcion')
            })
        return jsonify({
            'success': True,
            'notificacion': {
                'id': notif.get('id_notificacion') or notif.get('id'),
                'nombre': notif.get('nombre'),
                'cantidad': meta.get('cantidad')
            },
            'pedido': pedido_meta,
            'cliente': cliente,
            'items': joined,
            'total_items': total_items,
            'total_precio': round(total_precio, 2)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@pedidos_detalle_api.route('/api/admin/pedidos/buscar', methods=['GET'])
def buscar_pedidos_por_cliente_admin():
    """Busca pedidos por documento, número o correo del cliente.
    Parámetros (querystring): documento? numero? correo?
    Retorna el cliente (si existe) y la lista de pedidos como en /api/admin/pedidos/<cliente_id>.
    """
    try:
        ok, resp = _require_personal(request, allowed_areas=['ALMACEN', 'ADMINISTRACION', 'OBRAS', 'TRABAJO'])
        if not ok:
            return resp
        documento = request.args.get('documento')
        numero = request.args.get('numero')
        correo = request.args.get('correo')
        if not (documento or numero or correo):
            return jsonify({'success': False, 'message': 'Provee documento, numero o correo'}), 400

        # Buscar cliente
        cli_res = None
        if documento:
            cli_res = supabase.table('cliente').select('*').eq('documento', documento).limit(1).execute()
        elif numero:
            cli_res = supabase.table('cliente').select('*').eq('numero', numero).limit(1).execute()
        elif correo:
            cli_res = supabase.table('cliente').select('*').eq('correo', correo).limit(1).execute()

        if not cli_res or not getattr(cli_res, 'data', None):
            return jsonify({'success': True, 'cliente': None, 'pedidos': []}), 200
        cli = cli_res.data[0]
        cid = cli.get('id_cliente')

        # Pedidos del cliente
        res = supabase.table('carrito_compras').select('*').eq('cliente_id', cid).execute()
        carritos = res.data or []
        pedidos = []
        for c in carritos:
            estado_desc = c.get('estado')
            pedidos.append({
                'id': c.get('id_carrito'),
                'estado': estado_desc or 'Proceso',
                'created_at': c.get('created_at') or c.get('fecha')
            })
        pedidos.sort(key=lambda x: x.get('created_at') or '', reverse=True)
        cliente = {
            'id': cid,
            'nombre': cli.get('nombre'),
            'numero': cli.get('numero'),
            'documento': cli.get('documento'),
            'tipo_documento': cli.get('tipo_documento') or cli.get('tipo_doc'),
            'correo': cli.get('correo')
        }
        return jsonify({'success': True, 'cliente': cliente, 'pedidos': pedidos}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@pedidos_detalle_api.route('/api/admin/pedidos/<carrito_id>/detalle', methods=['GET'])
def obtener_detalle_pedido_admin(carrito_id):
    """Devuelve el detalle de un pedido para el panel de Almacén.
    Incluye datos del cliente y la lista de productos con cantidades y ubicación (fila/columna).
    Requiere JWT de personal (área ALMACEN o ADMINISTRACION).

    Respuesta:
    {
      success: true,
      pedido: { id, estado, created_at },
      cliente: { id, nombre, numero, tipo_documento, documento, correo },
      items: [ { id_producto, nombre, codigo, cantidad, fila, columna, precio_unitario, subtotal, grosor, descripcion } ],
      total_items: n,
      total_precio: m
    }
    """
    try:
        ok, resp = _require_personal(request, allowed_areas=['ALMACEN', 'ADMINISTRACION', 'OBRAS', 'TRABAJO'])
        if not ok:
            return resp
        # 1) Cargar carrito
        car = supabase.table('carrito_compras').select('*').eq('id_carrito', carrito_id).limit(1).execute()
        if not car or not getattr(car, 'data', None):
            return jsonify({'success': False, 'message': 'Pedido no encontrado'}), 404
        carrito = car.data[0]

        # Resolver descripción de estado desde el texto directamente
        estado_desc = carrito.get('estado')

        pedido_meta = {
            'id': carrito.get('id_carrito'),
            'estado': estado_desc or 'Proceso',
            'created_at': carrito.get('created_at') or carrito.get('fecha')
        }

        # 2) Cargar cliente
        cliente_row = None
        if carrito.get('cliente_id'):
            try:
                cli = supabase.table('cliente').select('*').eq('id_cliente', carrito['cliente_id']).limit(1).execute()
                if cli and cli.data:
                    cliente_row = cli.data[0]
            except Exception:
                cliente_row = None

        cliente = None
        if cliente_row:
            cliente = {
                'id': cliente_row.get('id_cliente'),
                'nombre': cliente_row.get('nombre'),
                'numero': cliente_row.get('numero') or cliente_row.get('telefono') or cliente_row.get('celular'),
                'tipo_documento': cliente_row.get('tipo_documento') or cliente_row.get('tipo_doc'),
                'documento': cliente_row.get('documento') or cliente_row.get('dni') or cliente_row.get('ruc'),
                'correo': cliente_row.get('correo') or cliente_row.get('email')
            }
        else:
            # Fallback: si el carrito no tiene cliente_id, intentar obtener el nombre desde notificacion_trabajo
            # y, si es posible, resolver datos completos buscando en tabla cliente por nombre exacto.
            try:
                nres = supabase.table('notificacion_trabajo').select('nombre, descripcion').execute()
            except Exception:
                nres = None
            notif_nombre = None
            if nres and getattr(nres, 'data', None):
                for n in nres.data:
                    try:
                        meta = json.loads(n.get('descripcion') or '{}')
                    except Exception:
                        meta = {}
                    if isinstance(meta, dict) and str(meta.get('carrito_id')) == str(carrito_id):
                        notif_nombre = n.get('nombre')
                        break
            if notif_nombre:
                # Intentar buscar un cliente con ese nombre
                cli_by_name = None
                try:
                    busc = supabase.table('cliente').select('*').eq('nombre', notif_nombre).limit(2).execute()
                    if busc and getattr(busc, 'data', None):
                        # Si hay uno único, usarlo; si hay varios, solo regresamos el nombre
                        if len(busc.data) == 1:
                            cli_by_name = busc.data[0]
                except Exception:
                    cli_by_name = None
                if cli_by_name:
                    cliente = {
                        'id': cli_by_name.get('id_cliente'),
                        'nombre': cli_by_name.get('nombre'),
                        'numero': cli_by_name.get('numero') or cli_by_name.get('telefono') or cli_by_name.get('celular'),
                        'tipo_documento': cli_by_name.get('tipo_documento') or cli_by_name.get('tipo_doc'),
                        'documento': cli_by_name.get('documento') or cli_by_name.get('dni') or cli_by_name.get('ruc'),
                        'correo': cli_by_name.get('correo') or cli_by_name.get('email')
                    }
                else:
                    # Al menos devolver el nombre para UI
                    cliente = {
                        'id': None,
                        'nombre': notif_nombre,
                        'numero': None,
                        'tipo_documento': None,
                        'documento': None,
                        'correo': None
                    }

        # 3) Cargar items del carrito con detalles de producto
        items = supabase.table('productos_carrito').select('*').eq('carrito_id', carrito_id).execute().data or []
        if not items:
            return jsonify({'success': True, 'pedido': pedido_meta, 'cliente': cliente, 'items': [], 'total_items': 0, 'total_precio': 0.0}), 200

        ids = [it['producto_id'] for it in items]
        productos = supabase.table('productos').select('*').in_('id_producto', ids).execute().data or []
        prod_map = {p.get('id_producto'): p for p in productos}

        joined = []
        total_precio = 0.0
        total_items = 0
        for it in items:
            p = prod_map.get(it.get('producto_id'))
            if not p:
                continue
            cantidad = float(it.get('cantidad') or 0)
            precio = float(p.get('precio_unitario') or 0)
            subtotal = round(precio * cantidad, 2)
            total_precio += subtotal
            total_items += cantidad
            joined.append({
                'id_producto': p.get('id_producto'),
                'nombre': p.get('nombre'),
                'codigo': p.get('codigo'),
                'cantidad': cantidad,
                'fila': p.get('fila'),
                'columna': p.get('columna'),
                'precio_unitario': precio,
                'subtotal': subtotal,
                'grosor': p.get('grosor'),
                'descripcion': p.get('descripcion')
            })

        return jsonify({
            'success': True,
            'pedido': pedido_meta,
            'cliente': cliente,
            'items': joined,
            'total_items': total_items,
            'total_precio': round(total_precio, 2)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@pedidos_detalle_api.route('/api/admin/backfill/asociar-clientes', methods=['POST'])
def backfill_asociar_clientes():
    """Asocia carrito_compras.cliente_id usando el nombre de notificacion_trabajo
    cuando hay una coincidencia única en la tabla cliente. Útil para carritos
    antiguos sin cliente_id. Requiere JWT de personal (ALMACEN o ADMINISTRACION).

    Parámetros opcionales (querystring o JSON):
      - dry_run: bool (por defecto false). Si true, no realiza actualizaciones, sólo reporta.

    Respuesta ejemplo:
    {
      success: true,
      dry_run: false,
      summary: {
        updated: 3,
        skipped_no_carrito: 2,
        skipped_tiene_cliente: 4,
        skipped_nombre_generico: 5,
        skipped_sin_coincidencia: 1,
        skipped_multiples_coincidencias: 2,
        errors: 0
      },
      details: [
        { carrito_id, notif_nombre, matched_cliente_id, action: 'updated'|'would_update'|'skip:*'|'error', reason? }
      ]
    }
    """
    try:
        ok, resp = _require_personal(request, allowed_areas=['ALMACEN', 'ADMINISTRACION', 'OBRAS', 'TRABAJO'])
        if not ok:
            return resp

        dry_run = False
        try:
            q = request.args.get('dry_run')
            if q is not None:
                dry_run = str(q).strip().lower() in ('1','true','yes','si')
            else:
                body = request.get_json(silent=True) or {}
                if isinstance(body, dict):
                    v = body.get('dry_run')
                    if isinstance(v, bool):
                        dry_run = v
                    elif isinstance(v, str):
                        dry_run = v.strip().lower() in ('1','true','yes','si')
        except Exception:
            pass

        res = supabase.table('notificacion_trabajo').select('id_notificacion, nombre, descripcion').execute()
        notifs = getattr(res, 'data', []) or []

        summary = {
            'updated': 0,
            'skipped_no_carrito': 0,
            'skipped_tiene_cliente': 0,
            'skipped_nombre_generico': 0,
            'skipped_sin_coincidencia': 0,
            'skipped_multiples_coincidencias': 0,
            'errors': 0
        }
        details = []

        for n in notifs:
            try:
                meta = _parse_notif_desc(n.get('descripcion'))
                carrito_id = meta.get('carrito_id')
                if not carrito_id:
                    summary['skipped_no_carrito'] += 1
                    details.append({'carrito_id': None, 'notif_nombre': n.get('nombre'), 'action': 'skip:no_carrito'})
                    continue

                car = supabase.table('carrito_compras').select('id_carrito, cliente_id').eq('id_carrito', carrito_id).limit(1).execute()
                if not car or not getattr(car, 'data', None):
                    summary['skipped_no_carrito'] += 1
                    details.append({'carrito_id': carrito_id, 'notif_nombre': n.get('nombre'), 'action': 'skip:carrito_no_existe'})
                    continue
                carrito = car.data[0]
                if carrito.get('cliente_id'):
                    summary['skipped_tiene_cliente'] += 1
                    details.append({'carrito_id': carrito_id, 'notif_nombre': n.get('nombre'), 'action': 'skip:ya_tiene_cliente'})
                    continue

                notif_nombre = (n.get('nombre') or '').strip()
                if notif_nombre.lower() in ('', 'cliente'):
                    summary['skipped_nombre_generico'] += 1
                    details.append({'carrito_id': carrito_id, 'notif_nombre': notif_nombre, 'action': 'skip:nombre_generico'})
                    continue

                busc = supabase.table('cliente').select('id_cliente, nombre').eq('nombre', notif_nombre).execute()
                rows = getattr(busc, 'data', []) or []
                if len(rows) == 0:
                    summary['skipped_sin_coincidencia'] += 1
                    details.append({'carrito_id': carrito_id, 'notif_nombre': notif_nombre, 'action': 'skip:sin_coincidencia'})
                    continue
                if len(rows) > 1:
                    summary['skipped_multiples_coincidencias'] += 1
                    details.append({'carrito_id': carrito_id, 'notif_nombre': notif_nombre, 'action': 'skip:multiples_coincidencias'})
                    continue

                matched = rows[0]
                if dry_run:
                    summary['updated'] += 1  # cuenta como potencial actualización
                    details.append({'carrito_id': carrito_id, 'notif_nombre': notif_nombre, 'matched_cliente_id': matched.get('id_cliente'), 'action': 'would_update'})
                else:
                    upd = supabase.table('carrito_compras').update({'cliente_id': matched.get('id_cliente')}).eq('id_carrito', carrito_id).execute()
                    # no importa el resultado exacto; si no lanza excepción, lo contamos
                    summary['updated'] += 1
                    details.append({'carrito_id': carrito_id, 'notif_nombre': notif_nombre, 'matched_cliente_id': matched.get('id_cliente'), 'action': 'updated'})
            except Exception as ex:
                summary['errors'] += 1
                details.append({'carrito_id': meta.get('carrito_id') if 'meta' in locals() else None, 'notif_nombre': n.get('nombre'), 'action': 'error', 'reason': str(ex)})

        return jsonify({'success': True, 'dry_run': dry_run, 'summary': summary, 'details': details}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@pedidos_detalle_api.route('/api/admin/pedidos/<carrito_id>', methods=['DELETE'])
def eliminar_pedido_admin(carrito_id):
    """Elimina un pedido (carrito) y sus items, y borra notificaciones asociadas.
    Requiere JWT de personal (ALMACEN o ADMINISTRACION).

    Respuesta ejemplo: { success: true, deleted_items: n, deleted_carritos: m, deleted_notifs: k }
    """
    try:
        ok, resp = _require_personal(request, allowed_areas=['ALMACEN', 'ADMINISTRACION', 'OBRAS', 'TRABAJO'])
        if not ok:
            return resp

        deleted_items = 0
        deleted_carritos = 0
        deleted_notifs = 0

        # 1) Borrar items del carrito
        try:
            it_del = supabase.table('productos_carrito').delete().eq('carrito_id', carrito_id).execute()
            # Postgrest devuelve un array si se habilita prefer=return=representation; si no, no siempre
            if getattr(it_del, 'data', None):
                deleted_items = len(it_del.data)
        except Exception:
            # Si falla, continuamos para no dejar inconsistent, pero reportamos 0
            deleted_items = 0

        # 2) Borrar el carrito
        try:
            car_del = supabase.table('carrito_compras').delete().eq('id_carrito', carrito_id).execute()
            if getattr(car_del, 'data', None):
                deleted_carritos = len(car_del.data)
        except Exception:
            deleted_carritos = 0

        # 3) Borrar notificaciones asociadas al carrito (por descripcion que contenga carrito_id)
        try:
            # Intento directo con like
            try:
                n_like = supabase.table('notificacion_trabajo').select('id_notificacion, descripcion').like('descripcion', f"%{carrito_id}%").execute()
                ids = [row.get('id_notificacion') for row in getattr(n_like, 'data', []) or [] if row.get('id_notificacion')]
            except Exception:
                # Fallback: listar todas y filtrar en cliente
                n_all = supabase.table('notificacion_trabajo').select('id_notificacion, descripcion').execute()
                ids = []
                for row in getattr(n_all, 'data', []) or []:
                    try:
                        meta = _parse_notif_desc(row.get('descripcion'))
                        if str(meta.get('carrito_id')) == str(carrito_id):
                            ids.append(row.get('id_notificacion'))
                    except Exception:
                        pass
            for nid in ids:
                try:
                    supabase.table('notificacion_trabajo').delete().eq('id_notificacion', nid).execute()
                    deleted_notifs += 1
                except Exception:
                    pass
        except Exception:
            deleted_notifs = 0

        return jsonify({
            'success': True,
            'deleted_items': deleted_items,
            'deleted_carritos': deleted_carritos,
            'deleted_notifs': deleted_notifs
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
