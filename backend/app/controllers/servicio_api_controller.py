from flask import Blueprint, request, jsonify
from app.services.supabase_client import supabase
from werkzeug.utils import secure_filename
import mimetypes

servicio_api_bp = Blueprint('servicio_api', __name__)

@servicio_api_bp.route('/api/tipo_servicio', methods=['GET'])
def listar_tipos_servicio():
    try:
        resp = supabase.table('tipo_servicio').select('id_tipo, descripcion').execute()
        err = getattr(resp, 'error', None) if resp is not None else None
        data = getattr(resp, 'data', None) if resp is not None else None
        if err:
            return jsonify({'error': str(err)}), 500
        return jsonify(data or [])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@servicio_api_bp.route('/api/servicio', methods=['POST'])
def registrar_servicio():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
        payload = {
            'nombre': data.get('nombre'),
            'descripcion': data.get('descripcion'),
            'tipo_servicio_id': data.get('tipo_servicio_id'),
            'ING': data.get('ING'),
        }
        # Validar que tipo_servicio_id exista en la tabla tipo_servicio
        tipo_id = payload.get('tipo_servicio_id')
        if tipo_id:
            tipo_resp = supabase.table('tipo_servicio').select('id_tipo').eq('id_tipo', tipo_id).execute()
            tipo_data = getattr(tipo_resp, 'data', None) if tipo_resp is not None else None
            if not tipo_data or (isinstance(tipo_data, list) and len(tipo_data) == 0):
                return jsonify({'error': 'Tipo de servicio no válido'}), 400
        resp = supabase.table('servicio').insert(payload).execute()
        err = getattr(resp, 'error', None) if resp is not None else None
        data_resp = getattr(resp, 'data', None) if resp is not None else None
        if err:
            return jsonify({'error': str(err)}), 500
        return jsonify({'mensaje': 'Servicio registrado', 'data': data_resp or resp}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@servicio_api_bp.route('/api/servicio/upload-image', methods=['POST'])
def upload_servicio_image():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        file = request.files['file']
        tipo = request.form.get('tipo', 'otro') or 'otro'
        filename = secure_filename(file.filename)
        if filename == '':
            return jsonify({'error': 'Invalid filename'}), 400
        content_type, _ = mimetypes.guess_type(filename)
        if content_type is None:
            content_type = 'application/octet-stream'
        remote_path = f"SERVICIOS/{tipo}/{filename}"
        file_bytes = file.read()
        up = supabase.storage.from_('IMG').upload(
            path=remote_path,
            file=file_bytes,
            file_options={'content-type': content_type}
        )
        err_up = getattr(up, 'error', None) if up is not None else None
        if err_up:
            return jsonify({'error': str(err_up)}), 500
        url_obj = supabase.storage.from_('IMG').get_public_url(remote_path)
        url = None
        if isinstance(url_obj, str):
            url = url_obj
        elif hasattr(url_obj, 'public_url'):
            url = url_obj.public_url
        elif isinstance(url_obj, dict):
            url = url_obj.get('publicUrl') or url_obj.get('publicURL') or url_obj.get('public_url')
        return jsonify({'mensaje': 'Subida completa', 'url': url, 'path': remote_path})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
