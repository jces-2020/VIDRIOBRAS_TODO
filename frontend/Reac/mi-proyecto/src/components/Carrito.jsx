import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { COLORS, FONTS } from "../colors";
import MercadoPagoCardForm from "./MercadoPagoCardForm";
import ModalFacturacion from "./VENTA/ModalFacturacion";
import { registrarVenta } from '../services/ventaService';

const Carrito = () => {
  const [carritoId, setCarritoId] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [productos, setProductos] = useState([]);
  const [idProducto, setIdProducto] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [mensaje, setMensaje] = useState("");
  const [editingQty, setEditingQty] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardFormLoading, setCardFormLoading] = useState(false);
  const [showFacturacionModal, setShowFacturacionModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // Estado para token sincronizado desde PanelCliente
  const [token, setToken] = useState(localStorage.getItem('auth_token') || '');
  // Carrito local en RAM - se guarda en BD solo después de pagar
  const [carritoLocal, setCarritoLocal] = useState([]);

  // Escuchar evento global de actualización de token
  useEffect(() => {
    const handler = (e) => {
      if (e.detail?.token) setToken(e.detail.token);
    };
    window.addEventListener('tokenUpdated', handler);
    return () => window.removeEventListener('tokenUpdated', handler);
  }, []);

  // ========== NUEVO: MANEJAR RETORNO DE MERCADO PAGO ==========
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const status = urlParams.get('status');
    const carritoIdParam = urlParams.get('carrito_id');
    
    if (status && carritoIdParam) {
      console.log('[CARRITO] Retorno de Mercado Pago - Status:', status);
      
      if (status === 'success') {
        setMensaje('✅ ¡Pago exitoso! Tu pedido ha sido confirmado.');
        // Limpiar carrito del localStorage
        localStorage.removeItem('carrito_id');
        setCarritoId(null);
        setCarrito([]);
        
        // Redirigir al perfil después de 2 segundos
        setTimeout(() => {
          navigate('/panelcliente');
        }, 2000);
      } else if (status === 'pending') {
        setMensaje('⏳ Pago pendiente. Te notificaremos cuando se confirme.');
      } else if (status === 'failure') {
        setMensaje('❌ El pago no pudo completarse. Intenta nuevamente.');
      }
      
      // Limpiar parámetros de la URL
      window.history.replaceState({}, document.title, '/carrito');
    }
  }, [location.search, navigate]);

  const realizarPedido = async () => {
    setLoading(true);
    setMensaje('');
    
    try {
      const clienteId = localStorage.getItem('cliente_id');
      if (!clienteId || !token) {
        const from = location?.pathname || '/carrito';
        navigate(`/login?from=${encodeURIComponent(from)}`, { state: { from } });
        return;
      }
      
      console.log('[REALIZARPEDIDO] Iniciando - ClienteID:', clienteId);
      
      // TODO: Validar datos completos usando el nuevo endpoint
      // Comentado temporalmente para probar el flujo de pago
      // try {
      //   const r = await fetch('http://localhost:5000/api/clientes/datos_completos', { headers: { 'Authorization': `Bearer ${token}` } });
      //   const j = await r.json();
      //   if (!j.success) {
      //     setMensaje('Error validando datos del cliente.');
      //     return;
      //   }
      //   if (!j.datos_completos) {
      //     navigate('/completa-datos-google');
      //     return;
      //   }
      // } catch (e) {
      //   setMensaje('Error validando datos del cliente.');
      //   return;
      // }
      
      if (!carritoId) {
        setMensaje('No hay un carrito activo. Agrega productos e inténtalo nuevamente.');
        return;
      }
      
      // ========== PAGO DIRECTO CON FORMULARIO INTEGRADO ==========
      // Mostrar formulario de pago en lugar de redirigir
      console.log('[REALIZARPEDIDO] ✅ Mostrando formulario de pago...');
      setShowCardForm(true);
      setMensaje('Completa los datos de tu tarjeta abajo para finalizar el pago.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos disponibles desde el backend
  useEffect(() => {
    // productos disponibles
    fetch("/api/productos")
      .then(async r => {
        const t = await r.text();
        try { setProductos(JSON.parse(t)); } catch { setProductos([]); }
      });

    // inicializar carrito local desde sessionStorage
    const carritoGuardado = sessionStorage.getItem('carritoLocal');
    if (carritoGuardado) {
      try {
        const parsed = JSON.parse(carritoGuardado);
        setCarritoLocal(parsed);
      } catch {
        setCarritoLocal([]);
      }
    }
    
    // Generar ID de carrito temporal si no existe
    let cid = localStorage.getItem('carrito_id');
    if (!cid) {
      cid = 'temp_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('carrito_id', cid);
    }
    setCarritoId(cid);
  }, []);

  const cargarCarrito = async (cid) => {
    // Esta función ya no carga de BD - el carrito está en RAM
    // Se mantiene por compatibilidad pero no hace nada
  };

  // Cargar detalles de productos del carrito desde el backend
  const fetchDetallesCarrito = async (nuevoCarrito) => {
    if (nuevoCarrito.length === 0) {
      setCarrito([]);
      return;
    }
    const ids = nuevoCarrito.map(p => p.id_producto);
    const res = await fetch("http://localhost:5000/api/productos/detalles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
    const detalles = await res.json();
    // Unir cantidades
    const tabla = nuevoCarrito.map(item => {
      const prod = detalles.find(p => p.id_producto === item.id_producto);
      if (!prod) return null;
      const subtotal = item.cantidad * parseFloat(prod.precio_unitario);
      return { ...prod, cantidad: item.cantidad, subtotal };
    }).filter(Boolean);
    setCarrito(tabla);
  };

  // Agregar producto al carrito (SOLO en RAM - no en BD)
  const handleAgregar = (e) => {
    e.preventDefault();
    if (!idProducto || cantidad < 1) return;
    
    // Buscar el producto en la lista de productos disponibles
    const prod = productos.find(p => p.id_producto === idProducto);
    if (!prod) {
      setMensaje('Producto no encontrado');
      return;
    }
    
    // Agregar o actualizar en carrito local
    const nuevoCarrito = [...carritoLocal];
    const index = nuevoCarrito.findIndex(item => item.id_producto === idProducto);
    
    if (index >= 0) {
      // Producto ya existe - aumentar cantidad
      nuevoCarrito[index].cantidad += cantidad;
    } else {
      // Nuevo producto
      nuevoCarrito.push({
        ...prod,
        cantidad,
        subtotal: cantidad * parseFloat(prod.precio_unitario)
      });
    }
    
    setCarritoLocal(nuevoCarrito);
    sessionStorage.setItem('carritoLocal', JSON.stringify(nuevoCarrito));
    setCarrito(nuevoCarrito);
    setIdProducto('');
    setCantidad(1);
    setMensaje('✅ Producto agregado al carrito');
  };

  const actualizarCantidad = (id_producto, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      handleEliminar(id_producto);
      return;
    }
    
    const nuevoCarrito = carritoLocal.map(item => {
      if (item.id_producto === id_producto) {
        return {
          ...item,
          cantidad: nuevaCantidad,
          subtotal: nuevaCantidad * parseFloat(item.precio_unitario)
        };
      }
      return item;
    });
    
    setCarritoLocal(nuevoCarrito);
    sessionStorage.setItem('carritoLocal', JSON.stringify(nuevoCarrito));
    setCarrito(nuevoCarrito);
    setMensaje('✅ Cantidad actualizada');
  };

  // Eliminar producto del carrito (local)
  const handleEliminar = (id) => {
    const nuevoCarrito = carritoLocal.filter(item => item.id_producto !== id);
    setCarritoLocal(nuevoCarrito);
    sessionStorage.setItem('carritoLocal', JSON.stringify(nuevoCarrito));
    setCarrito(nuevoCarrito);
    setMensaje('✅ Producto eliminado del carrito');
  };

  // Calcular total
  const total = carrito.reduce((acc, p) => acc + (Number(p.subtotal) || 0), 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h2 className="font-heading" style={{ fontWeight: 700, fontSize: 28, color: COLORS.text }}>Carrito de Compras</h2>
      <form
        onSubmit={handleAgregar}
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <select
          value={idProducto}
          onChange={e => setIdProducto(e.target.value)}
          required
          className="font-body"
          style={{ padding: 8, fontSize: 16, fontFamily: FONTS.body, borderColor: COLORS.border }}
        >
          <option value="">Selecciona un producto</option>
          {productos.map(p => (
            <option key={p.id_producto} value={p.id_producto}>
              {p.nombre}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={cantidad}
          onChange={e => setCantidad(Number(e.target.value))}
          className="font-body"
          style={{ width: 80, padding: 8, fontSize: 16, fontFamily: FONTS.body, borderColor: COLORS.border }}
          required
        />
        <button
          type="submit"
          className="font-heading"
          style={{
            padding: "8px 18px",
            fontWeight: 700,
            background: COLORS.info,
            color: COLORS.white,
            border: "none",
            borderRadius: 6,
            fontFamily: FONTS.heading,
          }}
        >
          Agregar +
        </button>
      </form>
      <table
        className="table-fixed w-full shadow-sm text-sm rounded-2xl overflow-hidden font-body"
        style={{ minWidth: 1000, borderColor: COLORS.border, backgroundColor: COLORS.backgroundLight }}
      >
        <thead>
          <tr style={{ backgroundColor: COLORS.gray[100] }}>
            <th className="px-4 py-3 text-left font-heading" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border }}>
              NOMBRE
            </th>
            <th className="px-4 py-3 text-left font-heading" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border }}>
              GROSOR
            </th>
            <th className="px-4 py-3 text-left font-heading" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border }}>
              CODIGO
            </th>
            <th className="px-8 py-3 text-left font-heading" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border, width: "40%" }}>
              DESCRIPCIÓN
            </th>
            <th className="px-2 py-3 text-left font-heading" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border, width: 64 }}>
              CANTIDAD
            </th>
            <th className="px-4 py-3 text-right font-heading" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border }}>
              PRECIO UNITARIO
            </th>
            <th className="px-4 py-3 text-right font-heading" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border }}>
              SUBTOTAL
            </th>
            <th className="px-4 py-3 text-center font-heading" style={{ color: COLORS.gray[600], fontWeight: 600, fontFamily: FONTS.heading, borderColor: COLORS.border }}>
              Acción
            </th>
          </tr>
        </thead>
        <tbody>
          {carrito.map((row, idx) => (
            <tr
              key={`${row.id_producto || row.id}-${idx}`}
              className="font-body"
              style={{ backgroundColor: idx % 2 === 0 ? COLORS.white : COLORS.gray[50] }}
            >
              <td
                className="px-4 py-2 font-body"
                style={{
                  maxWidth: 200,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  borderColor: COLORS.border,
                  color: COLORS.text,
                  fontFamily: FONTS.body,
                }}
                title={row.nombre}
              >
                {row.nombre}
              </td>
              <td className="px-4 py-2 font-body" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.body }}>
                {row.grosor}
              </td>
              <td className="px-4 py-2 font-body" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.body }}>
                {row.codigo}
              </td>
              <td className="px-8 py-2 font-body" style={{ width: "40%", borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.body }}>
                {row.descripcion}
              </td>
              <td className="px-2 py-2 font-body" style={{ width: 128, textAlign: 'center', borderColor: COLORS.border }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const current = Number(editingQty[row.id_producto] ?? row.cantidad);
                      const next = Math.max(1, current - 1);
                      setEditingQty(p => ({ ...p, [row.id_producto]: next }));
                      actualizarCantidad(row.id_producto, next);
                    }}
                    className="font-body"
                    style={{ padding: '4px 8px', backgroundColor: COLORS.gray[200], borderRadius: 4, border: 'none', fontFamily: FONTS.body, color: COLORS.text }}
                  >-</button>
                  <input
                    type="number"
                    min={1}
                    value={editingQty[row.id_producto] ?? row.cantidad}
                    onChange={e => {
                      const val = Math.max(1, Number(e.target.value));
                      setEditingQty(p => ({ ...p, [row.id_producto]: val }));
                    }}
                    onBlur={() => {
                      const val = Number(editingQty[row.id_producto] ?? row.cantidad);
                      actualizarCantidad(row.id_producto, Math.max(1, val));
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                      }
                    }}
                    className="font-body"
                    style={{ width: 64, textAlign: 'center', borderColor: COLORS.border, borderRadius: 4, fontFamily: FONTS.body }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const current = Number(editingQty[row.id_producto] ?? row.cantidad);
                      const next = current + 1;
                      setEditingQty(p => ({ ...p, [row.id_producto]: next }));
                      actualizarCantidad(row.id_producto, next);
                    }}
                    className="font-body"
                    style={{ padding: '4px 8px', backgroundColor: COLORS.gray[200], borderRadius: 4, border: 'none', fontFamily: FONTS.body, color: COLORS.text }}
                  >+</button>
                </div>
              </td>
              <td
                className="px-4 py-2 font-body text-right"
                style={{
                  maxWidth: 120,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  borderColor: COLORS.border,
                  color: COLORS.info,
                  fontFamily: FONTS.body,
                }}
                title={`S/ ${row.precio_unitario}`}
              >
                S/ {row.precio_unitario}
              </td>
              <td
                className="px-4 py-2 font-body text-right"
                style={{
                  maxWidth: 120,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  borderColor: COLORS.border,
                  color: COLORS.info,
                  fontFamily: FONTS.body,
                }}
                title={`S/ ${row.subtotal}`}
              >
                S/ {row.subtotal}
              </td>
              <td className="px-4 py-2 text-center font-body" style={{ borderColor: COLORS.border }}>
                <div className="flex justify-center">
                  <button
                    onClick={() => handleEliminar(row.id_producto)}
                    className="font-heading"
                    style={{
                      backgroundColor: COLORS.error,
                      color: COLORS.white,
                      borderRadius: 4,
                      padding: '6px 12px',
                      border: 'none',
                      fontFamily: FONTS.heading,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={e => e.target.style.opacity = '0.9'}
                    onMouseLeave={e => e.target.style.opacity = '1'}
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
          <tr style={{ backgroundColor: COLORS.gray[200] }}>
            <td
              colSpan={6}
              className="px-4 py-2 text-right font-heading"
              style={{
                whiteSpace: "nowrap",
                fontWeight: 600,
                fontFamily: FONTS.heading,
                color: COLORS.text,
              }}
            >
              TOTAL
            </td>
            <td
              className="px-4 py-2 text-right font-heading"
              style={{
                whiteSpace: "nowrap",
                minWidth: 160,
                fontWeight: 600,
                fontFamily: FONTS.heading,
                color: COLORS.info,
              }}
            >
              S/ {total}
            </td>
            <td className="px-4 py-2"></td>
          </tr>
        </tbody>
      </table>
      {mensaje && (
        <div className="font-body" style={{ color: COLORS.success, marginTop: 12, fontFamily: FONTS.body }}>{mensaje}</div>
      )}

      {/* Mostrar CardForm si se activó */}
      {showCardForm && (
        <div style={{
          marginTop: 32,
          padding: '20px',
          border: `2px solid ${COLORS.accent}`,
          borderRadius: 12,
          backgroundColor: COLORS.backgroundLight,
        }}>
          <h3 style={{ marginBottom: 16, color: COLORS.text, fontFamily: FONTS.heading }}>
            Completa tu pago
          </h3>
          <MercadoPagoCardForm
            carritoId={carritoId}
            clienteId={localStorage.getItem('cliente_id')}
            total={total}
            onPaymentSuccess={async (data) => {
              console.log('[CARRITO] Pago exitoso:', data);
              // Guardar productos en BD ahora que el pago está confirmado
              const clienteId = localStorage.getItem('cliente_id');
              const token = localStorage.getItem('auth_token');
              try {
                // Enviar estructura completa con tipo_venta y cortes
                const productosParaGuardar = carritoLocal.map(item => {
                  const prod = {
                    producto_id: item.id_producto || item.id,
                    cantidad: item.cantidad || 1,
                    tipo_venta: item.tipo_venta || 'plancha'
                  };
                  // Si es corte, incluir array de cortes
                  if (item.tipo_venta === 'corte' && item.cortes) {
                    prod.cortes = item.cortes;
                  }
                  return prod;
                });
                console.log('[CARRITO] Productos a guardar:', productosParaGuardar);
                const res = await fetch('/api/pagos/confirmar_compra', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    carrito_id: carritoId,
                    cliente_id: clienteId,
                    productos: productosParaGuardar,
                    payment_id: data.payment_id || data.id
                  })
                });
                const resultadoGuardar = await res.json();
                console.log('[CARRITO] Resultado guardar:', resultadoGuardar);
                // REGISTRAR VENTA EN BD
                if (resultadoGuardar.success) {
                  // Determinar método de pago
                  const metodo = 'tarjeta'; // Puedes ajustar según el flujo
                  const ventaRes = await registrarVenta({ total, metodo });
                  if (ventaRes.success) {
                    setShowCardForm(false);
                    setMensaje('✅ ¡Pago realizado y venta registrada! Genera tu comprobante abajo.');
                    setTimeout(() => {
                      setShowFacturacionModal(true);
                    }, 1500);
                  } else {
                    setMensaje('⚠️ Pago realizado pero error al registrar venta. Contacta soporte.');
                  }
                } else {
                  setMensaje('⚠️ Pago confirmado pero hubo un error al guardar tu compra. Contacta soporte.');
                }
              } catch (err) {
                console.error('[CARRITO] Error guardando compra:', err);
                setMensaje('⚠️ Pago confirmado pero hubo un error al guardar. Contacta soporte.');
              }
            }}
            onPaymentError={(error) => {
              console.log('[CARRITO] Error en pago:', error);
              setMensaje(`Error: ${error}`);
            }}
            onLoading={(isLoading) => {
              setCardFormLoading(isLoading);
            }}
          />
          <button
            onClick={() => setShowCardForm(false)}
            style={{
              marginTop: 16,
              padding: '10px 20px',
              background: COLORS.border,
              color: COLORS.text,
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: FONTS.body,
            }}
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Botón para realizar pedido que abre CardForm */}
      <div
        style={{
          marginTop: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={realizarPedido}
          className="font-heading"
          style={{
            background: loading 
              ? COLORS.gray[400] 
              : `linear-gradient(90deg, ${COLORS.accent} 0%, #ffcc80 100%)`,
            color: loading ? COLORS.white : COLORS.text,
            padding: "12px 32px",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            fontSize: 18,
            fontFamily: FONTS.heading,
            boxShadow: '0 2px 8px 0 rgba(255,179,71,0.10)',
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: 1,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'center',
            opacity: loading ? 0.4 : 1,
          }}
          disabled={loading || cardFormLoading}
        >
          {loading && (
            <svg 
              className="animate-spin" 
              style={{ width: 20, height: 20 }} 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                style={{ opacity: 0.25 }} 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                style={{ opacity: 0.75 }} 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {loading ? 'Procesando...' : 'REALIZAR PEDIDO'}
        </button>
      </div>

      {/* Modal de Facturación - Post Pago */}
      {showFacturacionModal && (
        <ModalFacturacion
          productos={carritoLocal.map(p => ({
            codigo: p.codigo || p.codigo_producto || p.id_producto,
            descripcion: p.descripcion || p.nombre,
            cantidad: Number(p.cantidad) || 1,
            precio_unitario: Number(p.precio_unitario) || 0
          }))}
          onClose={() => {
            setShowFacturacionModal(false);
            // Limpiar carrito y redirigir
            localStorage.removeItem('carrito_id');
            sessionStorage.removeItem('carritoLocal');
            setCarritoId(null);
            setCarrito([]);
            setCarritoLocal([]);
            setMensaje('');
            // Redirigir después de limpiar
            setTimeout(() => {
              navigate('/panelcliente', { replace: true });
            }, 300);
          }}
        />
      )}
    </div>
  );
};

export default Carrito;
