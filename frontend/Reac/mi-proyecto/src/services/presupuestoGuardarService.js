/**
 * Helper para guardar presupuestos con búsqueda de cliente
 * y generación de notificaciones.
 * 
 * Uso: importar y llamar guardaPresupuestosConCliente() cuando se presione botón Guardar
 */

export async function guardarPresupuestosConCliente({
  documento,
  nombreApis,
  presupuestos,
  onSuccess,
  onError
}) {
  try {
    if (!documento || documento.trim() === '') {
      const msg = 'Por favor ingresa un número de documento';
      if (onError) onError(msg);
      return false;
    }
    
    if (!presupuestos || presupuestos.length === 0) {
      const msg = 'No hay presupuestos para guardar';
      if (onError) onError(msg);
      return false;
    }
    
    // Construir payload limpio (sin __ram_id ni otros campos internos)
    const presupuestosLimpios = presupuestos.map(p => ({
      servicio_id: p.servicio_id,
      descripcion: p.descripcion,
      cantidad: p.cantidad,
      precio_unitario: p.precio_unitario,
      subtotal: p.subtotal,
      igv: p.igv,
      total: p.total,
      ancho: p.ancho,
      alto: p.alto
    }));
    
    const payload = {
      documento: documento.trim(),
      nombre_apis: nombreApis || 'Cliente anónimo',
      presupuestos: presupuestosLimpios
    };
    
    // Llamar al endpoint
    const response = await fetch('/api/presupuesto_guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (onSuccess) {
        onSuccess({
          message: data.message,
          clienteStatus: data.cliente_status,
          presupuestoIds: data.presupuesto_ids,
          clienteEncontrado: data.cliente_encontrado
        });
      }
      return true;
    } else {
      const msg = data.message || 'Error al guardar presupuestos';
      if (onError) onError(msg);
      return false;
    }
  } catch (error) {
    console.error('Error en guardarPresupuestosConCliente:', error);
    if (onError) onError(`Error de conexión: ${error.message}`);
    return false;
  }
}

/**
 * Helper para buscar cliente por documento (uso en Datos del cliente durante búsqueda)
 */
export async function buscarClientePorDocumento(documento) {
  try {
    if (!documento || documento.trim() === '') {
      return {
        encontrado: false,
        cliente: null,
        mensaje: ''
      };
    }
    
    const response = await fetch('/api/cliente/buscar_documento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documento: documento.trim() })
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (data.encontrado) {
        return {
          encontrado: true,
          cliente: data.cliente,
          mensaje: 'Cliente ya está logueado en el sistema'
        };
      } else {
        return {
          encontrado: false,
          cliente: null,
          mensaje: 'No es cliente'
        };
      }
    } else {
      return {
        encontrado: false,
        cliente: null,
        mensaje: 'Error al buscar cliente'
      };
    }
  } catch (error) {
    console.error('Error en buscarClientePorDocumento:', error);
    return {
      encontrado: false,
      cliente: null,
      mensaje: 'Error de conexión'
    };
  }
}
