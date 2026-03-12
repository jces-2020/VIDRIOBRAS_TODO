// RAM store para cotizaciones (similar a ramPresupuestos)
let cotizacionList = [];

function _ensureId(item) {
  if (!item.__cotiz_id) {
    item.__cotiz_id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
  }
  return item;
}

export function agregarProductoCotizacion(producto) {
  // Agrega un producto completo a la lista
  const item = _ensureId({ ...producto });
  cotizacionList.push(item);
  return item;
}

export function actualizarProductoCotizacion(id, nuevosDatos) {
  cotizacionList = cotizacionList.map(x =>
    x.__cotiz_id === id ? _ensureId({ ...x, ...nuevosDatos }) : x
  );
}

export function eliminarProductoCotizacion(id) {
  cotizacionList = cotizacionList.filter(x => x.__cotiz_id !== id);
}

export function obtenerProductosCotizacion() {
  return [...cotizacionList];
}

export function limpiarCotizacion() {
  cotizacionList = [];
}
