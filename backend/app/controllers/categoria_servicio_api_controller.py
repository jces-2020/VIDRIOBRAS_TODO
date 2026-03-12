from flask import Blueprint, request, jsonify
from app.services.supabase_client import supabase

categoria_servicio_api_bp = Blueprint('categoria_servicio_api', __name__)

@categoria_servicio_api_bp.route('/api/tipo_categoria', methods=['GET', 'POST'])
def tipo_categoria():
    if request.method == 'GET':
        try:
            resp = supabase.table('tipo_categoria').select('id_tipo_categoria, descripcion').execute()
            err = getattr(resp, 'error', None) if resp is not None else None
            data = getattr(resp, 'data', None) if resp is not None else None
            if err:
                return jsonify({'error': str(err)}), 500
            return jsonify(data or [])
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        try:
            data = request.get_json()
            if not data or not data.get('descripcion'):
                return jsonify({'error': 'Descripción requerida'}), 400
            payload = {'descripcion': data.get('descripcion')}
            resp = supabase.table('tipo_categoria').insert(payload).execute()
            err = getattr(resp, 'error', None) if resp is not None else None
            data_resp = getattr(resp, 'data', None) if resp is not None else None
            if err:
                return jsonify({'error': str(err)}), 500
            return jsonify({'mensaje': 'Tipo de categoría registrada', 'data': data_resp or resp}), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@categoria_servicio_api_bp.route('/api/categoria_servicio', methods=['GET', 'POST'])
def categoria_servicio():
    if request.method == 'GET':
        try:
            # JOIN para traer el nombre del tipo de categoría
            resp = supabase.table('categoria_servicio') \
                .select('id_categoria_servicio, descripcion, tipo_categoria_id, tipo_categoria:tipo_categoria_id (descripcion)') \
                .execute()
            err = getattr(resp, 'error', None) if resp is not None else None
            data = getattr(resp, 'data', None) if resp is not None else None
            if err:
                return jsonify({'error': str(err)}), 500
            # Formatear para incluir el nombre del tipo
            for c in data or []:
                c['tipo_nombre'] = c.get('tipo_categoria', {}).get('descripcion') if c.get('tipo_categoria') else None
                c.pop('tipo_categoria', None)
            return jsonify(data or [])
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        try:
            data = request.get_json()
            if not data or not data.get('descripcion') or not data.get('tipo_categoria_id'):
                return jsonify({'error': 'Descripción y tipo_categoria_id requeridos'}), 400
            payload = {
                'descripcion': data.get('descripcion'),
                'tipo_categoria_id': data.get('tipo_categoria_id')
            }
            resp = supabase.table('categoria_servicio').insert(payload).execute()
            err = getattr(resp, 'error', None) if resp is not None else None
            data_resp = getattr(resp, 'data', None) if resp is not None else None
            if err:
                return jsonify({'error': str(err)}), 500
            return jsonify({'mensaje': 'Categoría de servicio registrada', 'data': data_resp or resp}), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500
