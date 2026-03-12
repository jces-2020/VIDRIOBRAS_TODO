// Realiza compra llamando al backend
export async function realizarCompra({ documento, productos, cortes, metodoPago }) {
  const res = await fetch('/api/compra/realizar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documento, productos, cortes, metodo_pago: metodoPago })
  });
  return await res.json();
}
