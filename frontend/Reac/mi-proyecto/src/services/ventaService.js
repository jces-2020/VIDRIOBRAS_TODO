// Servicio para registrar venta
export async function registrarVenta({ total, metodo, caja_id }) {
  const res = await fetch('/api/venta/registrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ total, metodo, caja_id })
  });
  return await res.json();
}
