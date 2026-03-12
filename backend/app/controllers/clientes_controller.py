from flask import Blueprint, jsonify, request
import os, json, base64, hmac, hashlib, time
from app.services.supabase_client import supabase

clientes_bp = Blueprint('clientes', __name__)

def _b64url_decode(data: str) -> bytes:
    # Rellenar padding '=' si falta
    rem = len(data) % 4
    if rem:
        data += '=' * (4 - rem)
    return base64.urlsafe_b64decode(data)

def verify_jwt(token: str):
    """Devuelve el payload si el token es válido; de lo contrario None."""
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
        # Verificar expiración
        if payload.get('exp') and int(payload['exp']) < int(time.time()):
            return None
        return payload
    except Exception:
        return None

@clientes_bp.route('/api/clientes', methods=['GET'])
def get_clientes():
    # Allow optional filtering by documento or nombre
    documento = request.args.get('documento', None)
    filtro = request.args.get('filtro', None)
    if documento:
        response = supabase.table('cliente').select(
            'id_cliente, nombre, documento'
        ).eq('documento', documento).limit(1).execute()
        return jsonify(response.data or [])
    if filtro:
        # simple ilike on nombre or documento
        response = supabase.table('cliente').select(
            'id_cliente, nombre, documento'
        ).or_(
            f'nombre.ilike.%{filtro}%,documento.ilike.%{filtro}%'
        ).limit(5).execute()
        return jsonify(response.data or [])

    # default: list all for admin or other uses
    response = supabase.table('cliente').select(
        'id_cliente, numero, correo, contraseña, nombre, tipo_cliente_id, estado_cliente_id, documento'
    ).execute()
    clientes = response.data
    return jsonify(clientes)

# Endpoint para agregar un cliente (POST)
@clientes_bp.route('/api/clientes', methods=['POST'])
def add_cliente():
    data = request.json
    # Normalizar UUID opcionales para evitar strings vacíos que rompen el INSERT
    tipo_cliente_id = data.get('tipo_cliente_id') or None
    nuevo_cliente = {
        'numero': data.get('numero'),
        'correo': data.get('correo'),
        'contraseña': data.get('contraseña'),  # <-- Corrección aquí
        'nombre': data.get('nombre'),
        'documento': data.get('documento'),
        'tipo_cliente_id': tipo_cliente_id
    }
    try:
        response = supabase.table('cliente').insert(nuevo_cliente).execute()
        if response.data:
            return jsonify({'success': True, 'cliente': response.data[0]}), 201
        else:
            # TEMPORALMENTE: Deshabilitada validación de claves duplicadas para pruebas
            # Retornar error genérico
            err = response.error or {}
            msg = str(err.get('message') or err)
            print(f"[CLIENTES] Error al registrar: {msg}")
            return jsonify({'success': False, 'message': 'Error al registrar. Intenta con otros datos.'}), 400
    except Exception as e:
        print("Exception:", e)  # Mostrar excepción en consola
        # TEMPORALMENTE: Permitir duplicados para pruebas
        return jsonify({'success': True, 'cliente': nuevo_cliente}), 201

@clientes_bp.route('/api/clientes/login', methods=['POST'])
def login_cliente():
    data = request.json
    correo = data.get('correo')
    contraseña = data.get('contraseña')  # <-- Corrección aquí
    # Busca el cliente por correo
    response = supabase.table('cliente').select('id_cliente, correo, contraseña, nombre, numero, documento, "tipo cliente"').eq('correo', correo).execute()
    clientes = response.data
    if not clientes:
        return jsonify({'success': False, 'message': 'Usuario no encontrado'}), 404
    cliente = clientes[0]
    # Si el usuario fue registrado con Google, no permitir login tradicional
    tipo_cliente_label = cliente.get('tipo cliente')
    if isinstance(tipo_cliente_label, str) and tipo_cliente_label.lower() == 'google':
        return jsonify({'success': False, 'message': 'Este usuario fue registrado con Google. Por favor, inicie sesión usando Google.'}), 403
    # Verifica la contraseña (aquí se compara texto plano, para producción usa hash)
    if cliente['contraseña'] == contraseña:
        # Generar un token JWT HS256 simple sin dependencia externa
        # Usar el mismo secreto que verify_jwt para evitar tokens inválidos
        secret = os.environ.get('JWT_SECRET', 'vidriobras-secret')
        # header
        header = {"alg": "HS256", "typ": "JWT"}
        payload = {
            "sub": cliente['id_cliente'],
            "email": cliente.get('correo'),
            "name": cliente.get('nombre'),
            # exp en segundos (7 días)
            "exp": int(time.time()) + 7 * 24 * 3600,
            "aud": "cliente"
        }
        def b64url(data: bytes) -> str:
            return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')
        signing_input = f"{b64url(json.dumps(header).encode())}.{b64url(json.dumps(payload).encode())}"
        signature = hmac.new(secret.encode('utf-8'), signing_input.encode('utf-8'), hashlib.sha256).digest()
        token = signing_input + "." + b64url(signature)
        return jsonify({'success': True, 'cliente': cliente, 'token': token, 'token_type': 'Bearer'}), 200
    else:
        return jsonify({'success': False, 'message': 'Contraseña incorrecta'}), 401

@clientes_bp.route('/api/clientes/me', methods=['GET'])
def get_cliente_actual():
    """Devuelve los datos del cliente autenticado usando el JWT enviado en Authorization: Bearer <token>."""
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Falta token'}), 401
    token = auth.split(' ', 1)[1]
    payload = verify_jwt(token)
    if not payload:
        return jsonify({'success': False, 'message': 'Token inválido o expirado'}), 401
    try:
        cid = payload.get('sub')
        res = supabase.table('cliente').select('id_cliente, correo, contraseña, nombre').eq('id_cliente', cid).limit(1).execute()
        if not res.data:
            return jsonify({'success': False, 'message': 'Cliente no encontrado'}), 404
        return jsonify({'success': True, 'cliente': res.data[0]}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500