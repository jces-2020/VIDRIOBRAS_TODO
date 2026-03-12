from flask import Blueprint, request, jsonify
from app.services.supabase_client import supabase
import uuid
import os, json, base64, hmac, hashlib, time

carrito_compras_api = Blueprint('carrito_compras_api', __name__)

def _b64url_decode(data: str) -> bytes:
    rem = len(data) % 4
    if rem:
        data += '=' * (4 - rem)
    return base64.urlsafe_b64decode(data)

def verify_jwt(token: str):
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header = json.loads(_b64url_decode(parts[0]).decode('utf-8'))
        payload = json.loads(_b64url_decode(parts[1]).decode('utf-8'))
        signature = parts[2]
        if header.get('alg') != 'HS256':
            return None
        secret = os.environ.get('JWT_SECRET', 'vidriobras-secret')
        signing_input = parts[0] + '.' + parts[1]
        expected = hmac.new(secret.encode('utf-8'), signing_input.encode('utf-8'), hashlib.sha256).digest()
        expected_b64 = base64.urlsafe_b64encode(expected).rstrip(b'=').decode('utf-8')
        if not hmac.compare_digest(signature, expected_b64):
            return None
        if payload.get('exp') and int(payload['exp']) < int(time.time()):
            return None
        return payload
    except Exception:
        return None

def _require_personal(request, allowed_areas=None):
    """Valida Authorization Bearer de personal y opcionalmente su área.
    Devuelve (ok: bool, payload_or_response) donde payload_or_response es el payload o una respuesta Flask."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return False, (jsonify({'success': False, 'message': 'No autorizado'}), 401)
    token = auth.split(' ', 1)[1]
    payload = verify_jwt(token)
    if not payload or payload.get('aud') != 'personal':
        return False, (jsonify({'success': False, 'message': 'Token inválido'}), 401)
    if allowed_areas:
        area = (payload.get('area') or '').upper()
        # normalizar acentos básicos
        area = area.replace('Á','A').replace('É','E').replace('Í','I').replace('Ó','O').replace('Ú','U')
        allowed_norm = [a.upper().replace('Á','A').replace('É','E').replace('Í','I').replace('Ó','O').replace('Ú','U') for a in allowed_areas]
        if area not in allowed_norm:
            return False, (jsonify({'success': False, 'message': 'Área no autorizada'}), 403)
    return True, payload

@carrito_compras_api.route('/api/carrito_compras', methods=['POST'])
def crear_o_obtener_carrito():
    """
    Endpoint que ya NO se debe usar para crear carritos.
    Los carritos se crean automáticamente después del pago.
    Este endpoint devuelve un error deprecado.
    """
    return jsonify({
        'success': False,
        'message': 'Los carritos se crean automáticamente después del pago. No uses este endpoint.'
    }), 410  # 410 Gone

@carrito_compras_api.route('/api/carrito_compras/<cliente_id>', methods=['GET'])
def obtener_carrito(cliente_id):
    try:
        result = supabase.table('carrito_compras').select('*').eq('cliente_id', cliente_id).execute()
        data = result.data or []
        pedidos = []
        for row in data:
            pedidos.append({
                'id': row.get('id_carrito'),
                'estado': row.get('estado') or 'Proceso'
            })
        return jsonify({'success': True, 'data': pedidos}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@carrito_compras_api.route('/api/carrito_compras/attach', methods=['POST', 'PATCH'])
def asociar_carrito_a_cliente():
    """
    DEPRECADO: Este endpoint NO DEBE USARSE.
    La asociación del cliente_id a carrito_compras SOLO debe hacerse mediante el webhook de Mercado Pago.
    carrito_compras es SOLO para pedidos ya pagados (barra de progreso).
    """
    return jsonify({
        'success': False, 
        'message': 'Este endpoint está deprecado. La asociación cliente-carrito se hace automáticamente en el webhook de pago.'
    }), 410  # 410 Gone

@carrito_compras_api.route('/api/carrito_compras/verificar_pendiente', methods=['POST'])
def verificar_pedido_pendiente():
    """
    ELIMINADO: Ya no hay validación de 'pendiente'.
    Los productos se guardan SOLO después del pago.
    """
    return jsonify({
        'success': True,
        'tiene_pendiente': False,
        'message': 'Validación eliminada - productos se guardan solo después del pago'
    }), 200


@carrito_compras_api.route('/api/carrito_compras/checkout', methods=['POST', 'PATCH'])
def confirmar_pedido():
    """Marca un carrito como 'pendiente' (o actualiza su estado) y asegura la asociación al cliente.
    body: { carrito_id, cliente_id, estado? }
    """
    data = request.get_json(silent=True) or {}
    carrito_id = data.get('carrito_id')
    cliente_id = data.get('cliente_id')
    estado = data.get('estado') or 'Proceso'
    if not carrito_id or not cliente_id:
        return jsonify({'success': False, 'message': 'carrito_id y cliente_id son requeridos'}), 400
    try:
        # Validación por token: debe existir y coincidir con cliente_id
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'No autorizado'}), 401
        token = auth.split(' ', 1)[1]
        payload = verify_jwt(token)
        if not payload or str(payload.get('sub')) != str(cliente_id):
            return jsonify({'success': False, 'message': 'Token inválido'}), 401

        # Asegurar asociación y estado (guardamos solo texto 'estado')
        upd_fields = {'cliente_id': cliente_id, 'estado': estado}

        try:
            upd = supabase.table('carrito_compras').update(upd_fields).eq('id_carrito', carrito_id).execute()
        except Exception:
            return jsonify({'success': False, 'message': 'No se pudo confirmar el pedido.'}), 400

        # Crear una notificación de trabajo con el nombre del cliente y cantidad total de productos
        try:
            # Datos del cliente
            cli_info = supabase.table('cliente').select('nombre').eq('id_cliente', cliente_id).limit(1).execute()
            nombre_cli = None
            if cli_info and getattr(cli_info, 'data', None):
                nombre_cli = cli_info.data[0].get('nombre')
            # Cantidad total de productos (suma de cantidades en el carrito)
            items = supabase.table('productos_carrito').select('cantidad').eq('carrito_id', carrito_id).execute()
            # Notificación de trabajo se creará solo cuando el pago esté aprobado (webhook Mercado Pago)
            pass
        except Exception:
            pass

        return jsonify({'success': True, 'data': upd.data}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

## Endpoint de barra de progreso de pedidos eliminado temporalmente

@carrito_compras_api.route('/api/admin/pedidos/<cliente_id>', methods=['GET'])
def admin_listar_pedidos(cliente_id):
    """Lista pedidos de un cliente. Requiere JWT de personal (área ALMACEN o ADMINISTRACION)."""
    try:
        ok, resp = _require_personal(request, allowed_areas=['ALMACEN', 'ADMINISTRACION'])
        if not ok:
            return resp
        res = supabase.table('carrito_compras').select('*').eq('cliente_id', cliente_id).execute()
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
        return jsonify({'success': True, 'pedidos': pedidos}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@carrito_compras_api.route('/api/pedidos/<carrito_id>/estado', methods=['PATCH'])
def actualizar_estado_pedido(carrito_id):
    """Actualiza el estado de un pedido (carrito). body: { estado: 'Proceso'|'Pagado'|'Listo' }.
    Preferirá guardar estado_id si existe la tabla estado.
    """
    data = request.get_json(silent=True) or {}
    estado_req = (data.get('estado') or '').strip()
    if not estado_req:
        return jsonify({'success': False, 'message': 'estado es requerido'}), 400
    try:
        # Solo personal autorizado puede cambiar el estado
        ok, resp = _require_personal(request, allowed_areas=['ALMACEN', 'ADMINISTRACION', 'OBRAS', 'TRABAJO'])
        if not ok:
            return resp
        # Validar que el carrito exista
        car = supabase.table('carrito_compras').select('id_carrito').eq('id_carrito', carrito_id).limit(1).execute()
        if not car.data:
            return jsonify({'success': False, 'message': 'Pedido no encontrado'}), 404
        upd_fields = {'estado': estado_req}
        upd = supabase.table('carrito_compras').update(upd_fields).eq('id_carrito', carrito_id).execute()

        # Intentar marcar la notificación asociada como atendida cuando el pedido queda Pagado/Listo
        try:
            estado_final = estado_req.strip().lower()
            if estado_final in ('listo', 'pagado'):
                # Resolver id de estado_notificacion 'Atendida' si existe
                atendida_id = None
                try:
                    estn = supabase.table('estado_notificacion').select('id_estado, descripcion').execute()
                    for row in getattr(estn, 'data', []) or []:
                        desc = (row.get('descripcion') or '').strip().lower()
                        if desc in ('atendida', 'cerrada', 'completada'):
                            atendida_id = row.get('id_estado')
                            break
                except Exception:
                    atendida_id = None
                # Buscar notificación vinculada a este carrito_id (descripcion guarda JSON con carrito_id)
                try:
                    nres = supabase.table('notificacion_trabajo').select('id_notificacion, descripcion').execute()
                except Exception:
                    nres = None
                if nres and getattr(nres, 'data', None):
                    import json as _json
                    for n in nres.data:
                        try:
                            meta = _json.loads(n.get('descripcion') or '{}')
                            if isinstance(meta, dict) and str(meta.get('carrito_id')) == str(carrito_id):
                                if atendida_id is not None:
                                    try:
                                        supabase.table('notificacion_trabajo').update({'estado_notificacion_id': atendida_id}).eq('id_notificacion', n.get('id_notificacion')).execute()
                                    except Exception:
                                        pass
                                # Si no hay tabla de estados, no hacemos nada (evitamos tocar esquema)
                                break
                        except Exception:
                            continue
            # Si se marca Pagado, completar el flujo: borrar items, carrito y notificaciones para liberar al cliente
            if estado_final == 'pagado':
                deleted_items = 0
                deleted_notifs = 0
                try:
                    # contar items
                    it = supabase.table('productos_carrito').select('producto_id').eq('carrito_id', carrito_id).execute()
                    deleted_items = len(getattr(it, 'data', []) or [])
                except Exception:
                    deleted_items = 0
                try:
                    supabase.table('productos_carrito').delete().eq('carrito_id', carrito_id).execute()
                except Exception:
                    pass
                # borrar notificaciones asociadas
                try:
                    nres2 = supabase.table('notificacion_trabajo').select('id_notificacion, descripcion').execute()
                    import json as _json
                    for n in getattr(nres2, 'data', []) or []:
                        try:
                            meta = _json.loads(n.get('descripcion') or '{}')
                            if isinstance(meta, dict) and str(meta.get('carrito_id')) == str(carrito_id):
                                supabase.table('notificacion_trabajo').delete().eq('id_notificacion', n.get('id_notificacion')).execute()
                                deleted_notifs += 1
                        except Exception:
                            continue
                    # Fallback: si las notificaciones antiguas no tienen JSON, intentar por coincidencia de texto
                    try:
                        like_res = supabase.table('notificacion_trabajo').select('id_notificacion').like('descripcion', f"%{carrito_id}%").execute()
                        for n in getattr(like_res, 'data', []) or []:
                            try:
                                supabase.table('notificacion_trabajo').delete().eq('id_notificacion', n.get('id_notificacion')).execute()
                                deleted_notifs += 1
                            except Exception:
                                pass
                    except Exception:
                        pass
                except Exception:
                    pass
                # por último borrar el carrito
                try:
                    supabase.table('carrito_compras').delete().eq('id_carrito', carrito_id).execute()
                except Exception:
                    pass
                return jsonify({'success': True, 'data': upd.data, 'deleted': True, 'deleted_items': deleted_items, 'deleted_notifs': deleted_notifs}), 200
        except Exception:
            # No bloquear respuesta por errores en notificación
            pass

        return jsonify({'success': True, 'data': upd.data}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ========= NUEVO: Pedidos por cliente (para frontend cliente) =========
from app.controllers.clientes_controller import verify_jwt


@carrito_compras_api.route('/api/pedidos/<cliente_id>', methods=['GET'])
def listar_pedidos_cliente(cliente_id):
    """Lista pedidos de un cliente autenticado (usado por el frontend de cliente).
    Requiere JWT del cliente en Authorization: Bearer <token>.
    """
    try:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'Token faltante'}), 401
        token = auth_header.split(' ', 1)[1]
        payload = verify_jwt(token)
        if not payload:
            return jsonify({'success': False, 'message': 'Token inválido'}), 401
        if str(payload.get('sub')) != str(cliente_id):
            return jsonify({'success': False, 'message': 'No autorizado'}), 403

        res = supabase.table('carrito_compras').select('*').eq('cliente_id', cliente_id).execute()
        carritos = res.data or []
        pedidos = []
        for c in carritos:
            pedidos.append({
                'id': c.get('id_carrito'),
                'estado': c.get('estado') or 'Proceso',
                'created_at': c.get('created_at') or c.get('fecha')
            })
        pedidos.sort(key=lambda x: x.get('created_at') or '', reverse=True)
        return jsonify({'success': True, 'pedidos': pedidos}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@carrito_compras_api.route('/api/carrito_compras/limpiar_carritos_vacios', methods=['POST'])
def limpiar_carritos_vacios():
    """
    Elimina todos los carritos del cliente que están vacíos (sin productos)
    o que tienen estado Pendiente con cliente_id
    """
    try:
        data = request.get_json(silent=True) or {}
        cliente_id = data.get('cliente_id')
        
        if not cliente_id:
            return jsonify({'success': False, 'message': 'cliente_id requerido'}), 400
        
        # Validar token
        auth = request.headers.get('Authorization', '')
        if not auth.startswith('Bearer '):
            return jsonify({'success': False, 'message': 'No autorizado'}), 401
        token = auth.split(' ', 1)[1]
        payload = verify_jwt(token)
        if not payload or str(payload.get('sub')) != str(cliente_id):
            return jsonify({'success': False, 'message': 'Token inválido'}), 401
        
        print(f"\n[LIMPIAR_CARRITOS] Cliente: {cliente_id}")
        
        # Obtener TODOS los carritos del cliente
        carritos_res = supabase.table('carrito_compras').select('id_carrito, estado').eq('cliente_id', cliente_id).execute()
        carritos = getattr(carritos_res, 'data', []) or []
        
        eliminados = []
        
        for carrito in carritos:
            cid = carrito.get('id_carrito')
            estado = carrito.get('estado', '').strip()
            
            # Verificar si tiene productos
            productos = supabase.table('productos_carrito').select('producto_id').eq('carrito_id', cid).execute()
            tiene_productos = len(getattr(productos, 'data', []) or []) > 0
            
            # Eliminar si:
            # 1. No tiene productos
            # 2. O está en estado Pendiente (no debería tener cliente_id si es pendiente)
            debe_eliminar = False
            razon = ""
            
            if not tiene_productos:
                debe_eliminar = True
                razon = "sin productos"
            elif estado.lower() == 'pendiente':
                debe_eliminar = True
                razon = "estado Pendiente con cliente_id (inconsistente)"
            
            if debe_eliminar:
                try:
                    # Primero eliminar productos_carrito (FK)
                    supabase.table('productos_carrito').delete().eq('carrito_id', cid).execute()
                    # Luego eliminar carrito
                    supabase.table('carrito_compras').delete().eq('id_carrito', cid).execute()
                    eliminados.append({'carrito_id': cid, 'razon': razon})
                    print(f"[LIMPIAR_CARRITOS] Eliminado: {cid} ({razon})")
                except Exception as e:
                    print(f"[LIMPIAR_CARRITOS] Error eliminando {cid}: {e}")
        
        print(f"[LIMPIAR_CARRITOS] Total eliminados: {len(eliminados)}")
        
        return jsonify({
            'success': True, 
            'eliminados': len(eliminados),
            'detalles': eliminados
        }), 200
        
    except Exception as e:
        print(f"[LIMPIAR_CARRITOS] Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@carrito_compras_api.route('/api/admin/resetear_carritos_pendientes', methods=['POST'])
def resetear_carritos_pendientes():
    """
    Admin-only: Resetea carritos en estado Pendiente para remover cliente_id
    Esto es para limpiar carritos que fueron asociados incorrectamente
    """
    try:
        # Obtener todos los carritos en estado Pendiente
        carritos_res = supabase.table('carrito_compras').select('id_carrito').eq('estado', 'Pendiente').execute()
        carritos = getattr(carritos_res, 'data', []) or []
        
        actualizados = []
        for c in carritos:
            cid = c.get('id_carrito')
            try:
                # Resetear cliente_id a NULL para carritos sin pagar
                supabase.table('carrito_compras').update({
                    'cliente_id': None
                }).eq('id_carrito', cid).execute()
                actualizados.append(cid)
                print(f"[RESETEAR] Carrito {cid} - cliente_id resetado a NULL")
            except Exception as e:
                print(f"[RESETEAR] Error en {cid}: {e}")
        
        print(f"[RESETEAR] Total actualizados: {len(actualizados)}")
        
        return jsonify({
            'success': True,
            'actualizados': len(actualizados),
            'carritos': actualizados
        }), 200
        
    except Exception as e:
        print(f"[RESETEAR] Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
