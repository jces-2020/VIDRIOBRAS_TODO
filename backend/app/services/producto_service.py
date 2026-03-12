from app.services.supabase_client import supabase
from app.models.producto import Producto

# Servicio para interactuar con productos en Supabase
class ProductoService:
    @staticmethod
    def obtener_productos_por_ids(ids):
        response = supabase.table('productos').select('*').in_('id_producto', ids).execute()
        productos_dicts = response.data or []
        return [ProductoService.dict_a_producto(d) for d in productos_dicts]

    @staticmethod
    def dict_a_producto(data):
        return Producto(
            id=data.get('id_producto'),
            nombre=data.get('nombre'),
            descripcion=data.get('descripcion'),
            categoria=data.get('categoria', ''),
            IMG_P=data.get('IMG_P', '')
        )

    @staticmethod
    def obtener_todos_los_productos():
        response = supabase.table('productos').select('id_producto, nombre, grosor, codigo, descripcion, precio_unitario').execute()
        productos_dicts = response.data or []
        return productos_dicts
