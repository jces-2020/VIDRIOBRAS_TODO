from flask import Blueprint, request, jsonify, render_template
from services.supabase_client import supabase
from controllers.carrito_compras_api_controller import verify_jwt

barra_progreso_api = Blueprint('barra_progreso_api', __name__)

@barra_progreso_api.route('/prueba_barra_progreso')
def prueba_barra_progreso():
    """Renderiza la página de prueba de la barra de progreso"""
    return render_template('prueba_barra_progreso.html')

@barra_progreso_api.route('/api/clientes/buscar_por_correo', methods=['POST'])
def buscar_cliente_por_correo():
    """Busca un cliente por su correo electrónico"""
    try:
        data = request.get_json()
        correo = data.get('correo')
        
        if not correo:
            return jsonify({'success': False, 'message': 'Correo no proporcionado'}), 400
            
        # Buscar el cliente por correo
        cliente_res = supabase.table('cliente').select('*').eq('correo', correo).execute()
        print(f"[DEBUG] Buscando cliente con correo {correo}:", cliente_res.data)
        
        if not cliente_res.data:
            return jsonify({'success': False, 'message': 'Cliente no encontrado'}), 404
            
        return jsonify({
            'success': True,
            'cliente': cliente_res.data[0]
        })
    except Exception as e:
        print(f"[ERROR] Error al buscar cliente por correo: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@barra_progreso_api.route('/api/barra_progreso/<cliente_id>', methods=['GET'])
def barra_progreso(cliente_id):
    """
    Devuelve el estado de progreso basado en la tabla carrito_compras.
    Busca si existe un carrito del cliente con estado 'inicio', 'en proceso' o 'listo'.
    """
    try:
        print(f"\n{'='*80}")
        print(f"[DEBUG barra_progreso] Llamado para cliente_id: {cliente_id}")
        
        # Buscar todos los carritos del cliente
        carrito_res = supabase.table('carrito_compras') \
            .select('*') \
            .eq('cliente_id', cliente_id) \
            .execute()
        
        print(f"[DEBUG barra_progreso] Carritos encontrados: {len(carrito_res.data) if carrito_res.data else 0}")
        
        # Mostrar TODOS los carritos con sus estados
        if carrito_res.data:
            for idx, c in enumerate(carrito_res.data):
                print(f"  Carrito {idx+1}:")
                print(f"    - id_carrito: {c.get('id_carrito')}")
                print(f"    - estado: '{c.get('estado')}' (tipo: {type(c.get('estado'))})")
                print(f"    - estado repr: {repr(c.get('estado'))}")
        
        # Filtrar carritos con estados activos
        carritos_activos = []
        if carrito_res.data:
            for c in carrito_res.data:
                estado = (c.get('estado') or '').strip().lower()
                print(f"[DEBUG barra_progreso] Estado normalizado: '{estado}'")
                if estado in ['inicio', 'en proceso', 'listo', 'entregado']:
                    carritos_activos.append(c)
                    print(f"  ✓ Carrito {c.get('id_carrito')} agregado (estado: {estado})")
        
        print(f"[DEBUG barra_progreso] Carritos activos: {len(carritos_activos)}")
        print(f"{'='*80}\n")
        
        # Si existe al menos un carrito activo, tomar el primero
        if carritos_activos:
            carrito = carritos_activos[0]
            estado_carrito = (carrito.get('estado') or '').strip().lower()
            
            # Mapear estado del carrito a estado de la barra
            if estado_carrito == 'inicio':
                estado_barra = 'Inicio'
                progreso = 33
            elif estado_carrito == 'en proceso':
                estado_barra = 'En proceso'
                progreso = 66
            elif estado_carrito in ['listo', 'entregado']:
                estado_barra = 'Entregado'
                progreso = 100
            else:
                estado_barra = 'Inicio'
                progreso = 33
            
            print(f"[DEBUG] Estado determinado: {estado_barra}, Progreso: {progreso}")
            
            return jsonify({
                'success': True,
                'progreso': progreso,
                'estado': estado_barra,
                'mostrar_barra': True,
                'carrito_id': carrito.get('id_carrito')
            })
        
        # Si no existe carrito activo, no mostrar barra
        print(f"[DEBUG] No hay carritos activos para mostrar")
        return jsonify({
            'success': True,
            'progreso': 0,
            'estado': None,
            'mostrar_barra': False
        })
            
    except Exception as e:
        print(f"[ERROR] Error en barra_progreso: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

