export const construirReporteEntrega = ({
  notificacion,
  clienteNombre,
  fecha,
  cortes,
  mermas,
  productos,
  planchaPorCorte
}) => {
  return {
    generado_en: new Date().toISOString(),
    notificacion_id: notificacion?.id || null,
    cliente: clienteNombre || null,
    fecha: fecha || null,
    cortes: cortes || [],
    mermas: mermas || [],
    productos: productos || [],
    plancha_por_corte: planchaPorCorte || []
  };
};

export const descargarReporteEntrega = (reporte, nombreBase = 'reporte-entrega') => {
  const contenido = JSON.stringify(reporte, null, 2);
  const blob = new Blob([contenido], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  const fecha = new Date().toISOString().slice(0, 10);

  enlace.href = url;
  enlace.download = `${nombreBase}-${fecha}.json`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
};
