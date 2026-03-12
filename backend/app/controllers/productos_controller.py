# Controlador para exponer API REST de productos usando Supabase
from flask import Blueprint, jsonify, request, render_template_string
from app.services.supabase_client import supabase
from app.models.producto import Producto

productos_bp = Blueprint('productos', __name__, url_prefix='/api')

@productos_bp.route('/productos', methods=['GET'])
def get_productos():
    response = supabase.table('productos')\
        .select('id_producto, codigo, nombre, cantidad, precio_unitario, descripcion, grosor, categoria_id, almacen_id, stock_id, IMG_P, categoria:categoria_id (descripcion)')\
        .execute()
    SUPABASE_URL = "https://tu-project-ref.supabase.co/storage/v1/object/public/IMG/PRODUCTOS/"
    productos = []
    for item in response.data:
        categoria_nombre = None
        if 'categoria' in item and isinstance(item['categoria'], dict):
            categoria_nombre = item['categoria'].get('descripcion')
        img_p = item.get('IMG_P')
        if img_p and not img_p.startswith('http'):
            img_p = SUPABASE_URL + img_p
        productos.append({
            'id_producto': item.get('id_producto'),
            'codigo': item.get('codigo'),
            'nombre': item.get('nombre'),
            'cantidad': item.get('cantidad'),
            'precio_unitario': item.get('precio_unitario'),
            'descripcion': item.get('descripcion'),
            'grosor': item.get('grosor'),
            'categoria_id': item.get('categoria_id'),
            'almacen_id': item.get('almacen_id'),
            'stock_id': item.get('stock_id'),
            'IMG_P': img_p,
            'categoria': categoria_nombre
        })
    return jsonify(productos)

@productos_bp.route('/show-productos', methods=['GET'])
def show_productos():
    try:
        response = supabase.table('productos')\
            .select('id_producto, codigo, nombre, cantidad, precio_unitario, descripcion, grosor, categoria_id, almacen_id, stock_id, IMG_P, categoria:categoria_id (descripcion)')\
            .execute()
        SUPABASE_URL = "https://tu-project-ref.supabase.co/storage/v1/object/public/IMG/PRODUCTOS/"
        productos = []
        for item in response.data:
            categoria_nombre = None
            if 'categoria' in item and isinstance(item['categoria'], dict):
                categoria_nombre = item['categoria'].get('descripcion') or "Sin categoría"
            img_p = item.get('IMG_P')
            if img_p and not img_p.startswith('http'):
                img_p = SUPABASE_URL + img_p
            if not img_p:
                img_p = "https://via.placeholder.com/200x200?text=Sin+Imagen"
            productos.append({
                'id_producto': item.get('id_producto'),
                'codigo': item.get('codigo'),
                'nombre': item.get('nombre'),
                'cantidad': item.get('cantidad'),
                'precio_unitario': item.get('precio_unitario'),
                'descripcion': item.get('descripcion'),
                'grosor': item.get('grosor'),
                'categoria_id': item.get('categoria_id'),
                'almacen_id': item.get('almacen_id'),
                'stock_id': item.get('stock_id'),
                'IMG_P': img_p,
                'categoria': categoria_nombre
            })
        # Renderizar HTML simple
        html = """
        <h2>Productos desde Supabase Storage</h2>
        {% for p in productos %}
            <div style="margin-bottom: 24px;">
                <img src="{{p.IMG_P}}" alt="Producto {{p.id_producto}}" style="max-width:200px;max-height:200px;display:block;">
                <div><b>ID Producto:</b> {{p.id_producto}}</div>
                <div><b>Código:</b> {{p.codigo}}</div>
                <div><b>Nombre:</b> {{p.nombre}}</div>
                <div><b>Cantidad:</b> {{p.cantidad}}</div>
                <div><b>Precio Unitario:</b> {{p.precio_unitario}}</div>
                <div><b>Descripción:</b> {{p.descripcion}}</div>
                <div><b>Grosor:</b> {{p.grosor}}</div>
                <div><b>Categoría ID:</b> {{p.categoria_id}}</div>
                <div><b>Almacén ID:</b> {{p.almacen_id}}</div>
                <div><b>Stock ID:</b> {{p.stock_id}}</div>
                <div><b>Categoría:</b> {{p.categoria}}</div>
                <div><b>URL Imagen:</b> <a href="{{p.IMG_P}}" target="_blank">{{p.IMG_P}}</a></div>
            </div>
        {% endfor %}
        """
        print("DEBUG productos:", productos)
        return render_template_string(html, productos=productos)
    except Exception as e:
        print("ERROR en show-productos:", e)
        return f"<h2>Error interno:</h2><pre>{e}</pre>", 500

