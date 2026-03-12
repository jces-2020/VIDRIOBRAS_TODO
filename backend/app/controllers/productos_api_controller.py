from flask import Blueprint, request, jsonify
from app.services.supabase_client import supabase
from app.services.supabase_client import IS_SERVICE
from werkzeug.utils import secure_filename
import io
import mimetypes
import tempfile
import os

productos_api_bp = Blueprint('productos_api', __name__)

@productos_api_bp.route('/api/productos/detalles', methods=['POST'])
def detalles_productos():
    ids = request.json.get('ids', [])
    if not ids:
        return jsonify([])
    response = supabase.table('productos').select('id_producto, nombre, grosor, codigo, descripcion, precio_unitario').in_('id_producto', ids).execute()
    return jsonify(response.data)


@productos_api_bp.route('/api/productos', methods=['POST'])
def registrar_producto():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400

        # Crear registro en almacén si hay fila/columna
        almacen_id = None
        if data.get('fila') or data.get('columna'):
            almacen_payload = {
                'fila': data.get('fila'),
                'columna': data.get('columna'),
                # fecha_ingreso se genera automáticamente en la BD
            }
            almacen_resp = supabase.table('almacen').insert(almacen_payload).execute()
            err_alm = getattr(almacen_resp, 'error', None) if almacen_resp is not None else None
            data_alm = getattr(almacen_resp, 'data', None) if almacen_resp is not None else None
            if err_alm:
                return jsonify({'error': f'Almacen: {str(err_alm)}'}), 500
            if isinstance(data_alm, list) and len(data_alm) > 0:
                almacen_id = data_alm[0].get('id_almacen')
            elif isinstance(data_alm, dict):
                almacen_id = data_alm.get('id_almacen')

        # Mapa de campos mínimos - adapta según tu tabla en supabase
        payload = {
            'codigo': data.get('codigo'),
            'nombre': data.get('nombre'),
            'cantidad': data.get('cantidad'),
            'precio_unitario': data.get('precio_unitario'),
            'descripcion': data.get('descripcion'),
            'grosor': data.get('grosor'),
            'categoria_id': data.get('categoria_id'),
            'almacen_id': almacen_id,
            'stock_id': data.get('stock_id'),
            'IMG_P': data.get('IMG_P') or data.get('imagen_url'),
        }

        resp = supabase.table('productos').insert(payload).execute()
        # extraer error/data de forma defensiva
        err = getattr(resp, 'error', None) if resp is not None else None
        data_resp = getattr(resp, 'data', None) if resp is not None else None
        if err:
            return jsonify({'error': str(err)}), 500
        # en algunos casos resp puede ser ya una lista/dict
        return jsonify({'mensaje': 'Producto registrado con éxito', 'data': data_resp or resp}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@productos_api_bp.route('/api/stock', methods=['GET'])
def listar_stock():
    try:
        resp = supabase.table('stock').select('*').execute()
        err = getattr(resp, 'error', None) if resp is not None else None
        data = getattr(resp, 'data', None) if resp is not None else None
        # si la respuesta es un diccionario con 'data'
        if err:
            return jsonify({'error': str(err)}), 500
        if isinstance(data, list):
            return jsonify(data)
        if isinstance(resp, list):
            return jsonify(resp)
        # fallback: intentar serializar lo que venga
        return jsonify(data or [])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@productos_api_bp.route('/api/categorias', methods=['GET'])
def listar_categorias():
    try:
        resp = supabase.table('categoria').select('*').execute()
        err = getattr(resp, 'error', None) if resp is not None else None
        data = getattr(resp, 'data', None) if resp is not None else None
        if err:
            return jsonify({'error': str(err)}), 500
        return jsonify(data or [])
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@productos_api_bp.route('/api/productos/images', methods=['GET'])
def listar_imagenes():
    """Lista las imágenes del bucket IMG bajo la carpeta PRODUCTOS y devuelve URLs públicas."""
    try:
        # leer categoria desde querystring y listar en la carpeta PRODUCTOS/{categoria}
        categoria = request.args.get('categoria', '') or ''
        path = 'PRODUCTOS'
        if categoria:
            path = f"PRODUCTOS/{categoria}"
        # requerir service role key para listar storage; si no está, devolver mensaje claro
        if not IS_SERVICE:
            return jsonify({'error': 'SUPABASE_SERVICE_ROLE_KEY no configurada en el servidor. No se puede listar storage.'}), 403
        lista = supabase.storage.from_('IMG').list(path)
        # si se solicita debug, devolver representación cruda para inspección
        if request.args.get('debug'):
            try:
                return jsonify({'debug': True, 'lista_repr': repr(lista)})
            except Exception:
                return jsonify({'debug': True, 'lista_str': str(lista)})
        # Manejo defensivo de la respuesta
        err = getattr(lista, 'error', None) if lista is not None else None
        files = None
        if err:
            return jsonify({'error': str(err)}), 500
        if isinstance(lista, list):
            files = lista
        elif hasattr(lista, 'data'):
            files = lista.data
        elif isinstance(lista, dict) and 'data' in lista:
            files = lista.get('data')
        else:
            files = []
        result = []
        # Helper para construir public url
        def public_url_for(p):
            try:
                url_obj = supabase.storage.from_('IMG').get_public_url(p)
                if isinstance(url_obj, dict):
                    return url_obj.get('publicUrl') or url_obj.get('publicURL') or url_obj.get('public_url')
                return getattr(url_obj, 'publicUrl', None) or getattr(url_obj, 'publicURL', None)
            except Exception:
                return None

        # Si files viene como lista de entries
        if isinstance(files, list) and len(files) > 0:
            for f in files:
                name = f.get('name') if isinstance(f, dict) else (f.name if hasattr(f, 'name') else str(f))
                # si listamos dentro de PRODUCTOS/{categoria}, el name es solo filename
                fullpath = f"{path}/{name}"
                result.append({'name': name, 'url': public_url_for(fullpath), 'path': fullpath})

        # Si no encontramos nada y estamos pidiendo por categoria, intentamos listar PRODUCTOS y filtrar por prefijo
        if len(result) == 0 and categoria:
            fallback = supabase.storage.from_('IMG').list('PRODUCTOS')
            err2 = getattr(fallback, 'error', None) if fallback is not None else None
            files2 = []
            if err2:
                files2 = []
            elif isinstance(fallback, list):
                files2 = fallback
            elif hasattr(fallback, 'data'):
                files2 = fallback.data
            elif isinstance(fallback, dict) and 'data' in fallback:
                files2 = fallback.get('data')
            if isinstance(files2, list):
                for f in files2:
                    name = f.get('name') if isinstance(f, dict) else (f.name if hasattr(f, 'name') else str(f))
                    # name puede ser 'categoria/archivo.png' o solo 'archivo.png'
                    if isinstance(name, str):
                        if name.startswith(f"{categoria}/"):
                            fullpath = f"PRODUCTOS/{name}"
                            result.append({'name': name.split('/',1)[1] if '/' in name else name, 'url': public_url_for(fullpath), 'path': fullpath, 'categorized': True})
                        else:
                            # agregar como no categorizado (mostrable, con opción de asignar)
                            fullpath = f"PRODUCTOS/{name}"
                            result.append({'name': name, 'url': public_url_for(fullpath), 'path': fullpath, 'categorized': False})

        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@productos_api_bp.route('/api/productos/upload-image', methods=['POST'])
def upload_image():
    """Recibe multipart/form-data con 'file' y 'categoria' y sube al bucket IMG bajo PRODUCTOS/{categoria}/filename"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        file = request.files['file']
        categoria = request.form.get('categoria', 'otro') or 'otro'
        filename = secure_filename(file.filename)
        if filename == '':
            return jsonify({'error': 'Invalid filename'}), 400
        
        # Determinar el content-type
        content_type, _ = mimetypes.guess_type(filename)
        if content_type is None:
            content_type = 'application/octet-stream' # Tipo por defecto

        remote_path = f"PRODUCTOS/{categoria}/{filename}"
        file_bytes = file.read()

        # Intentar subir la imagen, si ya existe, eliminar y reintentar
        try:
            up = supabase.storage.from_('IMG').upload(
                path=remote_path,
                file=file_bytes,
                file_options={'content-type': content_type}
            )
        except Exception as e:
            # Si es error de duplicado, eliminar y reintentar
            msg = str(e)
            if 'already exists' in msg or 'statusCode": 409' in msg or 'Duplicate' in msg:
                try:
                    supabase.storage.from_('IMG').remove([remote_path])
                    up = supabase.storage.from_('IMG').upload(
                        path=remote_path,
                        file=file_bytes,
                        file_options={'content-type': content_type}
                    )
                except Exception as e2:
                    return jsonify({'error': f"Error sobreescribiendo imagen: {str(e2)}"}), 500
            else:
                return jsonify({'error': f"Error en la subida a Supabase: {str(e)}"}), 500

        err_up = getattr(up, 'error', None) if up is not None else None
        if err_up:
            # Si es error de duplicado, eliminar y reintentar
            if 'already exists' in str(err_up) or 'statusCode": 409' in str(err_up) or 'Duplicate' in str(err_up):
                try:
                    supabase.storage.from_('IMG').remove([remote_path])
                    up = supabase.storage.from_('IMG').upload(
                        path=remote_path,
                        file=file_bytes,
                        file_options={'content-type': content_type}
                    )
                    err_up = getattr(up, 'error', None) if up is not None else None
                    if err_up:
                        return jsonify({'error': str(err_up)}), 500
                except Exception as e2:
                    return jsonify({'error': f"Error sobreescribiendo imagen: {str(e2)}"}), 500
            else:
                return jsonify({'error': str(err_up)}), 500
        
        # obtener url pública
        url_obj = supabase.storage.from_('IMG').get_public_url(remote_path)
        url = None
        if isinstance(url_obj, str): # A veces la URL viene como string directamente
            url = url_obj
        elif hasattr(url_obj, 'public_url'):
            url = url_obj.public_url
        elif isinstance(url_obj, dict):
            url = url_obj.get('publicUrl') or url_obj.get('publicURL') or url_obj.get('public_url')

        # Si el cliente solicita que creemos un registro inicial de producto con la URL (create_product=1), hacerlo.
        create_flag = request.form.get('create_product', '0') or '0'
        created = None
        if create_flag == '1':
            try:
                # crear un registro mínimo con IMG_P y categoria_id (si viene)
                payload = {'IMG_P': url}
                if categoria:
                    payload['categoria_id'] = categoria
                # Insertar y solicitar el registro insertado
                ins = supabase.table('productos').insert(payload).execute()
                err_ins = getattr(ins, 'error', None) if ins is not None else None
                data_ins = getattr(ins, 'data', None) if ins is not None else None
                if err_ins:
                    # no abortamos la subida, solo reportamos el error de insert
                    created = None
                else:
                    # data_ins puede ser una lista con el registro insertado
                    if isinstance(data_ins, list) and len(data_ins) > 0:
                        created = data_ins[0]
                    elif isinstance(data_ins, dict):
                        created = data_ins
            except Exception:
                created = None

        return jsonify({'mensaje': 'Subida completa', 'url': url, 'path': remote_path, 'producto': created})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@productos_api_bp.route('/api/productos/move-image', methods=['POST'])
def move_image():
    """Mueve un archivo dentro del bucket IMG a la carpeta PRODUCTOS/{categoria}/{filename}.
       Recibe JSON { path: 'PRODUCTOS/...' , categoria: 'vidrios' }
    """
    try:
        data = request.get_json() or {}
        src_path = data.get('path')
        categoria = data.get('categoria') or 'otro'
        if not src_path:
            return jsonify({'error': 'No path provided'}), 400
        # extraer filename
        filename = src_path.split('/')[-1]
        dest_path = f"PRODUCTOS/{categoria}/{filename}"

        # descargar contenido
        download = supabase.storage.from_('IMG').download(src_path)
        # manejo defensivo
        if hasattr(download, 'error') and download.error:
            return jsonify({'error': str(download.error)}), 500
        # download may return a Response-like with 'read' or 'content'
        content = None
        try:
            # if it's bytes
            if isinstance(download, (bytes, bytearray)):
                content = download
            elif hasattr(download, 'read'):
                content = download.read()
            elif hasattr(download, 'content'):
                content = download.content
            elif hasattr(download, 'data'):
                content = download.data
        except Exception:
            content = None
        if content is None:
            return jsonify({'error': 'Could not read source file content'}), 500

        # escribir contenido a archivo temporal y subir por ruta (detecta extensión)
        ext = os.path.splitext(filename)[1] or ''
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tf:
                # si content es bytes-like
                if isinstance(content, (bytes, bytearray)):
                    tf.write(content)
                else:
                    # si es objeto con read()
                    try:
                        tf.write(content.read())
                    except Exception:
                        pass
                tmp_path = tf.name
            up = supabase.storage.from_('IMG').upload(dest_path, tmp_path)
        finally:
            if tmp_path:
                try: os.remove(tmp_path)
                except Exception: pass
        err_up = getattr(up, 'error', None) if up is not None else None
        if err_up:
            return jsonify({'error': str(err_up)}), 500

        # intentar borrar origen
        try:
            supabase.storage.from_('IMG').remove([src_path])
        except Exception:
            pass

        url_obj = supabase.storage.from_('IMG').get_public_url(dest_path)
        url = None
        if isinstance(url_obj, dict):
            url = url_obj.get('publicUrl') or url_obj.get('publicURL') or url_obj.get('public_url')
        else:
            url = getattr(url_obj, 'publicUrl', None) or getattr(url_obj, 'publicURL', None)

        return jsonify({'mensaje': 'Movido', 'url': url, 'path': dest_path})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@productos_api_bp.route('/api/productos/fix-mime', methods=['POST'])
def fix_mime_for_productos():
    """Re-sube todos los objetos bajo PRODUCTOS para forzar que Supabase registre el content-type correcto.
       Requiere clave de servicio (IS_SERVICE=True).
       Devuelve un resumen con success/failed.
    """
    if not IS_SERVICE:
        return jsonify({'error': 'SUPABASE_SERVICE_ROLE_KEY no configurada en el servidor. No se puede modificar storage.'}), 403
    try:
        lista = supabase.storage.from_('IMG').list('PRODUCTOS')
        files = []
        if isinstance(lista, list):
            files = lista
        elif hasattr(lista, 'data'):
            files = lista.data
        elif isinstance(lista, dict) and 'data' in lista:
            files = lista.get('data')

        results = []
        for f in files:
            name = f.get('name') if isinstance(f, dict) else (getattr(f, 'name', None) or str(f))
            full = f"PRODUCTOS/{name}"
            try:
                download = supabase.storage.from_('IMG').download(full)
                # obtener contenido
                content = None
                if isinstance(download, (bytes, bytearray)):
                    content = download
                elif hasattr(download, 'read'):
                    content = download.read()
                elif hasattr(download, 'content'):
                    content = download.content
                elif hasattr(download, 'data'):
                    content = download.data
                if content is None:
                    results.append({'file': full, 'ok': False, 'error': 'no content'})
                    continue
                # escribir temporal y re-subir para forzar MIME
                ext = os.path.splitext(name)[1] or ''
                tmp_path = None
                try:
                    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tf:
                        if isinstance(content, (bytes, bytearray)):
                            tf.write(content)
                        else:
                            try:
                                tf.write(content.read())
                            except Exception:
                                pass
                        tmp_path = tf.name
                    up = supabase.storage.from_('IMG').upload(full, tmp_path)
                finally:
                    if tmp_path:
                        try: os.remove(tmp_path)
                        except Exception: pass
                err_up = getattr(up, 'error', None) if up is not None else None
                if err_up:
                    results.append({'file': full, 'ok': False, 'error': str(err_up)})
                else:
                    results.append({'file': full, 'ok': True})
            except Exception as e:
                results.append({'file': full, 'ok': False, 'error': str(e)})

        return jsonify({'summary': {'total': len(files), 'results': results}})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Endpoints adicionales para CRUD completo con id_producto como UUID (string)
@productos_api_bp.route('/api/productos', methods=['GET'])
def listar_productos():
    try:
        # Join con almacen para traer fecha_ingreso
        resp = supabase.table('productos').select('*, almacen(fecha_ingreso)').execute()
        err = getattr(resp, 'error', None) if resp is not None else None
        data = getattr(resp, 'data', None) if resp is not None else None
        if err:
            return jsonify({'error': str(err)}), 500
        # Mapear fecha_ingreso al producto
        productos = []
        for p in data or []:
            fecha = None
            if isinstance(p.get('almacen'), dict):
                fecha = p['almacen'].get('fecha_ingreso')
            elif isinstance(p.get('almacen'), list) and len(p['almacen']) > 0:
                fecha = p['almacen'][0].get('fecha_ingreso')
            p['almacen_fecha_ingreso'] = fecha
            productos.append(p)
        return jsonify(productos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@productos_api_bp.route('/api/productos/<id_producto>', methods=['GET'])
def obtener_producto(id_producto):
    try:
        resp = supabase.table('productos').select('*').eq('id_producto', id_producto).single().execute()
        err = getattr(resp, 'error', None) if resp is not None else None
        data = getattr(resp, 'data', None) if resp is not None else None
        if err:
            return jsonify({'error': str(err)}), 500
        if not data:
            return jsonify({'error': 'Producto no encontrado'}), 404
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@productos_api_bp.route('/api/productos/<id_producto>', methods=['PUT'])
def actualizar_producto(id_producto):
    try:
        body = request.get_json() or {}
        # obtener current
        current_resp = supabase.table('productos').select('*').eq('id_producto', id_producto).single().execute()
        curr_err = getattr(current_resp, 'error', None) if current_resp is not None else None
        curr_data = getattr(current_resp, 'data', None) if current_resp is not None else None
        if curr_err:
            return jsonify({'error': str(curr_err)}), 500
        if not curr_data:
            return jsonify({'error': 'Producto no encontrado'}), 404

        # Si hay fila/columna, actualizar almacén o crear si no existe
        almacen_id = curr_data.get('almacen_id')
        if body.get('fila') or body.get('columna'):
            almacen_payload = {
                'fila': body.get('fila'),
                'columna': body.get('columna'),
            }
            if almacen_id:
                supabase.table('almacen').update(almacen_payload).eq('id_almacen', almacen_id).execute()
            else:
                almacen_resp = supabase.table('almacen').insert(almacen_payload).execute()
                err_alm = getattr(almacen_resp, 'error', None) if almacen_resp is not None else None
                data_alm = getattr(almacen_resp, 'data', None) if almacen_resp is not None else None
                if err_alm:
                    return jsonify({'error': f'Almacen: {str(err_alm)}'}), 500
                if isinstance(data_alm, list) and len(data_alm) > 0:
                    almacen_id = data_alm[0].get('id_almacen')
                elif isinstance(data_alm, dict):
                    almacen_id = data_alm.get('id_almacen')

        fields = ['codigo','nombre','cantidad','precio_unitario','descripcion','grosor','categoria_id','almacen_id','stock_id','IMG_P']
        up_payload = {}
        for f in fields:
            if f == 'almacen_id':
                up_payload[f] = almacen_id
            elif f in body:
                up_payload[f] = body.get(f)
            else:
                up_payload[f] = curr_data.get(f)

        resp = supabase.table('productos').update(up_payload).eq('id_producto', id_producto).execute()
        err = getattr(resp, 'error', None) if resp is not None else None
        data = getattr(resp, 'data', None) if resp is not None else None
        if err:
            return jsonify({'error': str(err)}), 500
        return jsonify({'mensaje':'Producto actualizado','data': data or []})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@productos_api_bp.route('/api/productos/<id_producto>', methods=['DELETE'])
def eliminar_producto(id_producto):
    try:
        # obtener producto para revisar IMG_P
        current_resp = supabase.table('productos').select('*').eq('id_producto', id_producto).single().execute()
        curr_err = getattr(current_resp, 'error', None) if current_resp is not None else None
        curr_data = getattr(current_resp, 'data', None) if current_resp is not None else None
        if curr_err:
            return jsonify({'error': str(curr_err)}), 500

        # si hay imagen y tenemos permiso de servicio, intentar eliminarla del bucket
        if curr_data and curr_data.get('IMG_P') and IS_SERVICE:
            img_url = curr_data.get('IMG_P')
            try:
                # intentar mapear public URL a path: listar PRODUCTOS/* y comparar
                lista = supabase.storage.from_('IMG').list('PRODUCTOS')
                files = []
                if isinstance(lista, list):
                    files = lista
                elif hasattr(lista,'data'):
                    files = lista.data
                for f in files:
                    name = f.get('name') if isinstance(f, dict) else getattr(f,'name',None) or str(f)
                    full = f"PRODUCTOS/{name}"
                    try:
                        url_obj = supabase.storage.from_('IMG').get_public_url(full)
                        pub = None
                        if isinstance(url_obj, dict):
                            pub = url_obj.get('publicUrl') or url_obj.get('publicURL') or url_obj.get('public_url')
                        else:
                            pub = getattr(url_obj,'publicUrl',None) or getattr(url_obj,'publicURL',None)
                        if pub and pub == img_url:
                            try:
                                supabase.storage.from_('IMG').remove([full])
                            except Exception:
                                pass
                            break
                    except Exception:
                        continue
            except Exception:
                pass

        # eliminar registro
        resp = supabase.table('productos').delete().eq('id_producto', id_producto).execute()
        err = getattr(resp, 'error', None) if resp is not None else None
        if err:
            return jsonify({'error': str(err)}), 500
        return jsonify({'mensaje':'Producto eliminado'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500