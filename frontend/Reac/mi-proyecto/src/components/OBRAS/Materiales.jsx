import { useState, useEffect, useMemo } from 'react';
import { COLORS, FONTS } from '../../colors';
import { construirReporteEntrega } from '../../utils/entregaReporte';

const Materiales = ({ notificacion, onToast, onGuardarSuccess }) => {
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const fetchProductos = async () => {
      if (!notificacion?.id) {
        return;
      }

      setCargando(true);
      try {
        const response = await fetch(`/api/entrega/productos/notificacion/${notificacion.id}`);
        const data = await response.json();
        if (data.success) {
          setProductosDisponibles(Array.isArray(data.data) ? data.data : []);
          if (!Array.isArray(data.data) || data.data.length === 0) {
            onToast && onToast(data.message || 'El cliente no agregó productos', 'success');
          }
        } else {
          const msg = data.message || data.error || 'Error al cargar productos';
          onToast && onToast(msg, 'error');
        }
      } catch (error) {
        onToast && onToast('Error al conectar con el servidor', 'error');
      } finally {
        setCargando(false);
      }
    };

    fetchProductos();
  }, [notificacion?.id, onToast]);

  const productosFiltrados = useMemo(() => {
    return (productosDisponibles || []).filter((p) => {
      const nombre = (p.nombre || '').toLowerCase();
      const codigo = (p.codigo || '').toLowerCase();
      const term = busquedaProducto.toLowerCase();
      return nombre.includes(term) || codigo.includes(term);
    });
  }, [productosDisponibles, busquedaProducto]);

  const handleSeleccionarProducto = (producto) => {
    if (productosSeleccionados.some((p) => p.producto_id === producto.producto_id)) {
      setProductosSeleccionados(productosSeleccionados.filter((p) => p.producto_id !== producto.producto_id));
    } else {
      const cantidadCliente = producto.cantidad_cliente || 0;
      const cantidadInicial = cantidadCliente > 0 ? cantidadCliente : 1;
      setProductosSeleccionados([
        ...productosSeleccionados,
        { ...producto, cantidad_seleccionada: cantidadInicial }
      ]);
    }
  };

  const handleEliminarProducto = (id) => {
    setProductosSeleccionados(productosSeleccionados.filter((p) => p.producto_id !== id));
  };

  const handleIncrementarCantidad = (id) => {
    setProductosSeleccionados(
      productosSeleccionados.map((p) => {
        if (p.producto_id !== id) {
          return p;
        }
        const limite = p.cantidad_cliente || 1;
        const nueva = Math.min((p.cantidad_seleccionada || 1) + 1, limite);
        return { ...p, cantidad_seleccionada: nueva };
      })
    );
  };

  const handleDecrementarCantidad = (id) => {
    setProductosSeleccionados(
      productosSeleccionados
        .map((p) => {
          if (p.producto_id !== id) {
            return p;
          }
          const nueva = Math.max(1, (p.cantidad_seleccionada || 1) - 1);
          return { ...p, cantidad_seleccionada: nueva };
        })
        .filter((p) => p.cantidad_seleccionada > 0)
    );
  };

  const handleGuardar = async () => {
    if (productosSeleccionados.length === 0) {
      onToast && onToast('Selecciona al menos un producto', 'error');
      return;
    }

    setGuardando(true);
    try {
      // Validar que todos los productos tengan producto_id
      const items = productosSeleccionados
        .filter((p) => p.producto_id) // Solo incluir productos con ID válido
        .map((p) => ({
          producto_id: p.producto_id,
          cantidad: parseFloat(p.cantidad_seleccionada) || 1
        }));

      if (items.length === 0) {
        onToast && onToast('Los productos seleccionados no tienen ID válido', 'error');
        setGuardando(false);
        return;
      }

      // Obtener carrito_id de la notificación
      let carrito_id = null;
      if (notificacion?.descripcion) {
        try {
          const desc = JSON.parse(notificacion.descripcion);
          carrito_id = desc.carrito_id;
        } catch (e) {
          const match = String(notificacion.descripcion).match(/Carrito:\s*([0-9a-fA-F-]{36})/);
          if (match) {
            carrito_id = match[1];
          }
        }
      }

      if (!carrito_id) {
        onToast && onToast('No se encontró el carrito asociado', 'error');
        setGuardando(false);
        return;
      }

      // Log para debug
      console.log('Confirmando productos:', { carrito_id, items });

      // Llamar al nuevo endpoint que hace todo:
      // 1. Descuenta stock
      // 2. Elimina de productos_carrito
      // 3. Guarda en reporte_entregas
      const resConfirmar = await fetch('/api/entrega/productos/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrito_id, items })
      });
      
      const dataConfirmar = await resConfirmar.json();
      
      if (!dataConfirmar.success) {
        onToast && onToast(dataConfirmar.message || 'Error al confirmar productos', 'error');
        console.error('Error del servidor:', dataConfirmar);
        setGuardando(false);
        return;
      }

      console.log('Productos confirmados:', dataConfirmar);

      // Guardar productos seleccionados en localStorage para que Productos.jsx los recupere
      // Incluir información de ubicación del almacén
      const productosConUbicacion = productosSeleccionados.map(p => ({
        ...p,
        fila: p.almacen_fila || p.fila || '-',
        columna: p.almacen_columna || p.columna || '-'
      }));
      localStorage.setItem('productosSeleccionadosEntrega', JSON.stringify(productosConUbicacion));

      setProductosDisponibles((prev) => prev
        .map((prod) => {
          const sel = productosSeleccionados.find((p) => p.producto_id === prod.producto_id);
          if (!sel) {
            return prod;
          }
          const restanteCliente = (prod.cantidad_cliente || 0) - (sel.cantidad_seleccionada || 0);
          return { ...prod, cantidad_cliente: restanteCliente };
        })
        .filter((prod) => (prod.cantidad_cliente || 0) > 0));

      setProductosSeleccionados([]);
      onToast && onToast('✅ Productos confirmados y guardados', 'success');
      onGuardarSuccess && onGuardarSuccess();
    } catch (error) {
      onToast && onToast('Error al guardar', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const obtenerSeleccionado = (productoId) => {
    return productosSeleccionados.find((p) => p.producto_id === productoId);
  };

  return (
    <div>
      {/* Tabla unica: Productos disponibles + seleccion */}
      <div style={{ border: `2px solid ${COLORS.border}`, borderRadius: '8px', padding: '16px', background: COLORS.white, marginBottom: '20px' }}>
        <h4 style={{ fontFamily: FONTS.heading, fontWeight: 700, marginBottom: 12, fontSize: 14, color: COLORS.text }}>Productos Disponibles</h4>
        <input
          type="text"
          placeholder="🔍 Buscar producto por nombre o código..."
          value={busquedaProducto}
          onChange={(e) => setBusquedaProducto(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: `1px solid ${COLORS.border}`,
            borderRadius: '4px',
            marginBottom: '12px',
            fontFamily: FONTS.body,
            fontSize: 14,
            color: COLORS.text
          }}
        />
        <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: FONTS.body }}>
            <thead style={{ background: COLORS.gray[200], position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', textAlign: 'left', fontFamily: FONTS.heading, color: COLORS.text }}>Sel</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', textAlign: 'left', fontFamily: FONTS.heading, color: COLORS.text }}>Producto</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', textAlign: 'left', fontFamily: FONTS.heading, color: COLORS.text }}>Descripción</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', textAlign: 'left', fontFamily: FONTS.heading, color: COLORS.text }}>Código</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', textAlign: 'left', fontFamily: FONTS.heading, color: COLORS.text }}>Grosor</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', textAlign: 'left', fontFamily: FONTS.heading, color: COLORS.text }}>Categoría</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', textAlign: 'left', fontFamily: FONTS.heading, color: COLORS.text }}>Ubicación</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Cant. stock</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Cant. cliente</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="9" style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', color: COLORS.textLight, fontFamily: FONTS.body }}>
                    Cargando productos...
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', color: COLORS.textLight, fontFamily: FONTS.body }}>
                    No se encontraron productos
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((prod) => {
                  const seleccionado = obtenerSeleccionado(prod.producto_id);
                  return (
                    <tr key={prod.producto_id} style={{ background: COLORS.white }}>
                      <td style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(seleccionado)}
                          onChange={() => handleSeleccionarProducto(prod)}
                          style={{ cursor: 'pointer', width: 16, height: 16 }}
                        />
                      </td>
                      <td style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', fontFamily: FONTS.body, color: COLORS.text }}>{prod.nombre}</td>
                      <td style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', fontFamily: FONTS.body, color: COLORS.text }}>{prod.descripcion || '-'}</td>
                      <td style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', fontFamily: 'monospace', fontSize: 11, color: COLORS.text }}>{prod.codigo || '-'}</td>
                      <td style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', fontFamily: FONTS.body, color: COLORS.text }}>{prod.grosor || '-'}</td>
                      <td style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', fontFamily: FONTS.body, color: COLORS.text }}>{prod.categoria || '-'}</td>
                      <td style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', fontFamily: FONTS.body, color: COLORS.text }}>
                        {(prod.almacen_fila || prod.almacen_columna) ? `${prod.almacen_fila || '-'}-${prod.almacen_columna || '-'}` : '-'}
                      </td>
                      <td style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text }}>{prod.stock_cantidad || 0}</td>
                      <td style={{ border: `1px solid ${COLORS.border}`, padding: '4px 8px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text }}>
                        {seleccionado ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              onClick={() => handleDecrementarCantidad(prod.producto_id)}
                              style={{
                                background: COLORS.error,
                                color: COLORS.white,
                                border: 'none',
                                borderRadius: '3px',
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: 11
                              }}
                            >
                              -
                            </button>
                            <span style={{ minWidth: '20px', textAlign: 'center' }}>{seleccionado.cantidad_seleccionada}</span>
                            <button
                              onClick={() => handleIncrementarCantidad(prod.producto_id)}
                              style={{
                                background: COLORS.success,
                                color: COLORS.white,
                                border: 'none',
                                borderRadius: '3px',
                                width: '20px',
                                height: '20px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: 11
                              }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          prod.cantidad_cliente || 0
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botón guardar */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          style={{
            background: COLORS.text,
            color: COLORS.white,
            border: `2px solid ${COLORS.text}`,
            borderRadius: '8px',
            padding: '10px 40px',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            textTransform: 'uppercase',
            fontFamily: FONTS.heading,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onClick={handleGuardar}
          disabled={guardando}
        >
          {guardando ? 'GUARDANDO...' : 'GUARDAR'}
        </button>
      </div>
    </div>
  );
};

export default Materiales;
