# Ejemplo de modelo para una tabla de Supabase (ajusta según tu tabla)

class Producto:

    def __init__(self, id, nombre, descripcion, categoria='', IMG_P='', grosor='', codigo='', precio_unitario=0, fila='', columna=''):
        self.id = id
        self.nombre = nombre
        self.descripcion = descripcion
        self.categoria = categoria
        self.IMG_P = IMG_P
        self.grosor = grosor
        self.codigo = codigo
        self.precio_unitario = precio_unitario
        self.fila = fila
        self.columna = columna

    @staticmethod
    def from_dict(data):
        return Producto(
            id=data.get('id') or data.get('id_producto'),
            nombre=data.get('nombre'),
            descripcion=data.get('descripcion'),
            categoria=data.get('categoria', ''),
            IMG_P=data.get('IMG_P', ''),
            grosor=data.get('grosor', ''),
            codigo=data.get('codigo', ''),
            precio_unitario=data.get('precio_unitario', 0),
            fila=data.get('fila', ''),
            columna=data.get('columna', '')
        )
