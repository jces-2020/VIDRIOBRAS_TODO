import React, { useEffect, useState, useCallback } from 'react';
import { IconUser, IconFileTypePdf, IconBell } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';
import ServicioTrabajo from './Servicio';
import OptimizacionCortes from './Optimizacion';
import EntregaPedido from './Entrega';

const cardStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  background: COLORS.white,
};

const buttonStyle = {
  border: 'none',
  borderRadius: 10,
  padding: '8px 16px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: FONTS.heading,
  fontSize: 14,
};

// Área "Obras": contiene el panel de gestión de Pedidos/Entregas
const Obras = () => {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const authHeaders = useCallback(() => {
    try {
      const t = localStorage.getItem('personalToken');
      console.log('[GestionObras] Token obtenido:', t ? `Existe (${t.length} chars)` : 'No existe');
      if (t) {
        console.log(`[GestionObras] Enviando auth header con token`);
        return { Authorization: `Bearer ${t}` };
      }
    } catch (e) {
      console.error('[GestionObras] Error obteniendo headers:', e);
    }
    console.log('[GestionObras] Sin token, headers vacíos');
    return {};
  }, []);

  const [ocultarAtendidas, setOcultarAtendidas] = useState(true);
  const [notifs, setNotifs] = useState([]);
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifsError, setNotifsError] = useState('');
  const [mostrarPanelNotificaciones, setMostrarPanelNotificaciones] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('ENTREGA');

  const [pedidoSelId, setPedidoSelId] = useState('');
  const [notifNombre, setNotifNombre] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [detalleLoading, setDetalleLoading] = useState(false);
  const [detalleError, setDetalleError] = useState('');
  const [vistaServicio, setVistaServicio] = useState(null);
  const [vistaOptimizacion, setVistaOptimizacion] = useState(null);
  const [vistaEntrega, setVistaEntrega] = useState(null);

  const buildStaticNotifs = useCallback((tipo) => {
    const baseFecha = '2025-12-27';
    if (tipo === 'SERVICIO') {
      return [
        {
          id: 'svc-1',
          nombre: 'María Quispe',
          fecha: `${baseFecha} 09:10`,
          descripcion: 'Revisión de cierre de mampara en oficina 2do piso.',
          cantidad: '-',
          carrito_estado: '-',
          estado_label: 'Pendiente'
        },
        {
          id: 'svc-2',
          nombre: 'Carlos Rojas',
          fecha: `${baseFecha} 11:00`,
          descripcion: 'Instalación de bisagras hidráulicas en puerta principal.',
          cantidad: '2 bisagras',
          carrito_estado: '-',
          estado_label: 'Pendiente'
        }
      ];
    }
    if (tipo === 'OPTIMIZACION') {
      return [
        {
          id: 'opt-1',
          nombre: 'Inversiones Luna',
          fecha: `${baseFecha} 08:45`,
          descripcion: 'Pulido y alineación de paños 3 y 4 para mejorar ajuste.',
          cantidad: '-',
          carrito_estado: '-',
          estado_label: 'Pendiente'
        },
        {
          id: 'opt-2',
          nombre: 'Arq. Valeria Soto',
          fecha: `${baseFecha} 15:30`,
          descripcion: 'Ajuste de templados para reducir fuga de aire en showroom.',
          cantidad: '-',
          carrito_estado: '-',
          estado_label: 'Pendiente'
        }
      ];
    }
    return [];
  }, []);

  const fetchNotifs = useCallback(async () => {
    setNotifsLoading(true); 
    setNotifsError('');
    try {
      console.log(`[fetchNotifs] Categoría actual: ${categoriaSeleccionada}`);
      
      // Verificar que exista token para consultar notificaciones
      const token = localStorage.getItem('personalToken');
      console.log(`[fetchNotifs] Token para notificaciones: ${token ? 'SÍ existe' : 'NO existe'}`);
      if (!token) {
        // Sin token, usar datos estáticos
        console.log(`[fetchNotifs] Sin token, usando datos estáticos`);
        setNotifs(buildStaticNotifs(categoriaSeleccionada));
        setNotifsLoading(false);
        return;
      }
      
      const params = new URLSearchParams();
      if (ocultarAtendidas) params.set('ocultar_atendidas', '1');
      params.set('tipo', categoriaSeleccionada);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const url = `/api/admin/notificaciones${qs}`;
      const headers = authHeaders();
      
      console.log(`[fetchNotifs] Haciendo fetch a: ${url}`);
      console.log(`[fetchNotifs] Headers:`, Object.keys(headers).length > 0 ? 'Con Authorization' : 'Sin headers');
      
      const r = await fetch(url, { headers });
      
      console.log(`[fetchNotifs] Status: ${r.status}`);
      
      // Si falla la solicitud o no es JSON válido, usar datos estáticos
      if (!r.ok) {
        console.log(`[fetchNotifs] API devolvió status ${r.status}, usando datos estáticos`);
        setNotifs(buildStaticNotifs('ENTREGA'));
        setNotifsLoading(false);
        return;
      }
      
      let j;
      try {
        j = await r.json();
        console.log(`[fetchNotifs] JSON parseado, success: ${j.success}`);
      } catch (parseErr) {
        console.error('[fetchNotifs] Error parseando JSON:', parseErr);
        setNotifs(buildStaticNotifs('ENTREGA'));
        setNotifsLoading(false);
        return;
      }
      
      if (j.success && Array.isArray(j.notificaciones)) {
        const normalizadas = j.notificaciones.map((item) => ({
          ...item,
          id: item.id || item.id_notificacion
        }));
        setNotifs(normalizadas);
      } else {
        setNotifs(buildStaticNotifs('ENTREGA'));
      }
    } catch (e) {
      console.error('Error fetching notifs:', e);
      // Fallback a datos estáticos en lugar de mostrar error
      setNotifs(buildStaticNotifs(categoriaSeleccionada));
    } finally { 
      setNotifsLoading(false); 
    }
  }, [authHeaders, ocultarAtendidas, categoriaSeleccionada, buildStaticNotifs]);

  useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

  // Si está en vista de Servicio, mostrar el componente ServicioTrabajo
  if (vistaServicio) {
    return <ServicioTrabajo notificacion={vistaServicio} onBack={() => setVistaServicio(null)} />;
  }

  // Si está en vista de Optimización, mostrar el componente OptimizacionCortes
  if (vistaOptimizacion) {
    return <OptimizacionCortes notificacion={vistaOptimizacion} onBack={() => setVistaOptimizacion(null)} />;
  }

  // Si está en vista de Entrega, mostrar el componente EntregaPedido
  if (vistaEntrega) {
    return <EntregaPedido notificacion={vistaEntrega} onBack={() => setVistaEntrega(null)} />;
  }

  return (
    <div style={{
      padding: 24,
      fontFamily: FONTS.body,
      background: COLORS.backgroundLight,
      minHeight: '100vh',
      color: COLORS.text,
    }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          padding: '12px 16px',
          borderRadius: 12,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          color: COLORS.white,
          background: toast.tipo === 'success' ? COLORS.success : COLORS.error,
          fontWeight: 700,
          zIndex: 30,
        }}>
          {toast.mensaje}
        </div>
      )}

      {/* Header con iconos y botón */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <IconUser stroke={1.5} size={28} color={COLORS.text} />
        <IconBell 
          stroke={1.5} 
          size={28} 
          style={{ cursor: 'pointer' }} 
          color={COLORS.primary}
          onClick={() => setMostrarPanelNotificaciones(!mostrarPanelNotificaciones)} 
        />
        <button
          style={{
            ...buttonStyle,
            background: COLORS.error,
            color: COLORS.white,
            boxShadow: '0 8px 20px rgba(239,68,68,0.22)',
            padding: '10px 24px',
            fontSize: 15
          }}
          onClick={() => {
            localStorage.removeItem('personalToken');
            localStorage.removeItem('staff');
            localStorage.removeItem('area');
            window.location.href = '/';
          }}
        >
          Cerrar sesión
        </button>
      </div>

      <div style={{
        ...cardStyle,
        display: 'flex',
        gap: 20
      }}>
        {/* Panel lateral de notificaciones */}
        {mostrarPanelNotificaciones && (
          <div style={{
            width: 200,
            borderRight: `1px solid ${COLORS.border}`,
            paddingRight: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 15
          }}>
            <h4 style={{ 
              fontWeight: 700, 
              marginBottom: 12, 
              fontSize: 13, 
              letterSpacing: 0.5,
              fontFamily: FONTS.heading,
              color: COLORS.text
            }}>
              NOTIFICACIONES
            </h4>
            {['SERVICIO', 'OPTIMIZACION', 'ENTREGA'].map((cat, idx) => {
              const isActive = categoriaSeleccionada === cat;
              const isServicio = cat === 'SERVICIO';
              return (
                <div 
                  key={cat}
                  onClick={() => setCategoriaSeleccionada(cat)} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    paddingBottom: 12,
                    borderBottom: idx < 2 ? `1px solid ${COLORS.border}` : 'none',
                    cursor: 'pointer',
                    color: isServicio && isActive ? COLORS.primary : COLORS.textLight,
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    fontFamily: FONTS.body,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: 18 }}>
                    {cat === 'SERVICIO' ? '👤' : cat === 'OPTIMIZACION' ? '🔧' : '📦'}
                  </span>
                  <span>{cat === 'OPTIMIZACION' ? 'OPTIMIZACIÓN' : cat}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Contenido principal */}
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 style={{ 
                fontWeight: 700, 
                fontSize: 16,
                fontFamily: FONTS.heading,
                color: COLORS.text
              }}>
                Notificaciones de trabajo
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  fontSize: 14, 
                  gap: 6,
                  fontFamily: FONTS.body,
                  color: COLORS.error,
                  fontWeight: 600
                }}>
                  <input 
                    type="checkbox" 
                    checked={ocultarAtendidas} 
                    onChange={e => setOcultarAtendidas(e.target.checked)}
                    style={{ cursor: 'pointer', width: 16, height: 16 }}
                  />
                  ✓ Ocultar atendidas
                </label>
                <button 
                  onClick={fetchNotifs}
                  style={{
                    ...buttonStyle,
                    background: COLORS.gray[100],
                    color: COLORS.text,
                    padding: '8px 16px',
                    fontSize: 14,
                    border: `1px solid ${COLORS.border}`
                  }}
                >
                  Refrescar
                </button>
              </div>
            </div>
            {notifsLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: COLORS.textLight }}>
                Cargando notificaciones...
              </div>
            ) : notifsError ? (
              <div style={{ 
                padding: 12, 
                borderRadius: 8, 
                background: COLORS.error, 
                color: COLORS.white,
                fontSize: 14
              }}>
                {notifsError}
              </div>
            ) : notifs.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: COLORS.textLight }}>
                No hay notificaciones.
              </div>
            ) : (
              <div style={{ 
                border: `1px solid ${COLORS.border}`, 
                borderRadius: 12, 
                overflow: 'hidden',
                marginBottom: 16
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead style={{ background: COLORS.gray[50] }}>
                    <tr>
                      {['Cliente', 'Fecha', 'Descripción', 'Cantidad', 'Estado Pedido', 'Trabajo', 'Acción'].map(header => (
                        <th key={header} style={{
                          borderBottom: `2px solid ${COLORS.border}`,
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontFamily: FONTS.heading,
                          fontWeight: 600,
                          fontSize: 14,
                          color: COLORS.text
                        }}>
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {notifs.map((n, idx) => {
                      const isEntrega = categoriaSeleccionada === 'ENTREGA';
                      return (
                        <tr key={n.id} style={{ 
                          background: idx % 2 === 0 ? COLORS.white : COLORS.gray[50]
                        }}>
                          <td style={{ 
                            borderBottom: `1px solid ${COLORS.border}`, 
                            padding: '12px 16px',
                            fontFamily: FONTS.body,
                            fontSize: 14,
                            color: COLORS.text
                          }}>
                            {n.nombre || '-'}
                          </td>
                          <td style={{ 
                            borderBottom: `1px solid ${COLORS.border}`, 
                            padding: '12px 16px',
                            fontFamily: FONTS.body,
                            fontSize: 14,
                            color: COLORS.text
                          }}>
                            {n.fecha || '-'}
                          </td>
                          <td style={{ 
                            borderBottom: `1px solid ${COLORS.border}`, 
                            padding: '12px 16px',
                            fontFamily: FONTS.body,
                            fontSize: 14,
                            color: COLORS.text
                          }}>
                            {n.descripcion || '-'}
                          </td>
                          <td style={{ 
                            borderBottom: `1px solid ${COLORS.border}`, 
                            padding: '12px 16px',
                            fontFamily: FONTS.body,
                            fontSize: 14,
                            color: COLORS.text
                          }}>
                            {n.cantidad ?? '-'}
                          </td>
                          <td style={{ 
                            borderBottom: `1px solid ${COLORS.border}`, 
                            padding: '12px 16px',
                            fontFamily: FONTS.body,
                            fontSize: 14,
                            color: COLORS.text
                          }}>
                            {n.carrito_estado || '-'}
                          </td>
                          <td style={{ 
                            borderBottom: `1px solid ${COLORS.border}`, 
                            padding: '12px 16px',
                            fontFamily: FONTS.body,
                            fontSize: 14,
                            color: COLORS.text
                          }}>
                            {n.estado_label || 'Pendiente'}
                          </td>
                          <td style={{ 
                            borderBottom: `1px solid ${COLORS.border}`, 
                            padding: '12px 16px',
                            textAlign: 'center'
                          }}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                              <button 
                                style={{
                                  ...buttonStyle,
                                  background: COLORS.warning,
                                  color: COLORS.white,
                                  padding: '8px 20px',
                                  fontSize: 14,
                                  borderRadius: 8,
                                  boxShadow: '0 2px 8px rgba(245,158,11,0.25)'
                                }}
                                onClick={async () => {
                            try {
                              // Para SERVICIO, abrir la vista de servicio
                              if (!isEntrega && categoriaSeleccionada === 'SERVICIO') {
                                setVistaServicio(n);
                                return;
                              }
                              // Para OPTIMIZACION, abrir la vista de optimización
                              if (!isEntrega && categoriaSeleccionada === 'OPTIMIZACION') {
                                setVistaOptimizacion(n);
                                return;
                              }
                              // Para ENTREGA, actualizar estado y abrir la vista de entrega
                              if (isEntrega && categoriaSeleccionada === 'ENTREGA') {
                                const notifId = n.id || n.id_notificacion;
                                if (!notifId) {
                                  showToast('No se encontró el ID de la notificación', 'error');
                                  return;
                                }
                                const actual = (n.estado_label || 'PENDIENTE').toUpperCase();
                                const nextSrv = actual === 'EN_PROCESO' ? 'FINALIZANDO' : 'EN_PROCESO';

                                console.log(`[Realizar] Actualizando notificación ${notifId} a estado ${nextSrv}`);

                                const r = await fetch(`/api/admin/notificaciones/${notifId}/estado`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json', ...authHeaders() },
                                  body: JSON.stringify({ estado: nextSrv })
                                });
                                const j = await r.json();
                                if (!r.ok || !j.success) throw new Error(j.error || j.message || 'Error al actualizar estado');

                                showToast(`Estado cambiado a ${nextSrv}`);
                                setVistaEntrega(n);
                                return;
                              }
                              // Para categorías mock, solo rotamos el estado local
                              if (!isEntrega || !n.carrito_id) {
                                setNotifs(prev => prev.map(item => {
                                  if (item.id !== n.id) return item;
                                  const cur = (item.estado_label || 'Pendiente').toUpperCase();
                                  const next = cur === 'PENDIENTE' ? 'En proceso' : (cur === 'EN PROCESO' ? 'Finalizado' : 'En proceso');
                                  return { ...item, estado_label: next };
                                }));
                                showToast('Trabajo actualizado');
                                return;
                              }
                              
                              // Para ENTREGA con carrito_id: actualizar estado de notificación
                              // (El backend automáticamente actualiza el carrito cuando cambia a EN_PROCESO)
                              const actual = (n.estado_label || 'PENDIENTE').toUpperCase();
                              const nextSrv = actual === 'EN_PROCESO' ? 'FINALIZANDO' : 'EN_PROCESO';
                              
                              console.log(`[Realizar] Actualizando notificación ${n.id} a estado ${nextSrv}`);
                              
                              // Actualizar estado de notificación (el backend actualiza el carrito automáticamente)
                              const r = await fetch(`/api/admin/notificaciones/${n.id}/estado`, { 
                                method: 'PATCH', 
                                headers: { 'Content-Type': 'application/json', ...authHeaders() }, 
                                body: JSON.stringify({ estado: nextSrv }) 
                              });
                              const j = await r.json();
                              if (!r.ok || !j.success) throw new Error(j.error || j.message || 'Error al actualizar estado');
                              
                              console.log('[Realizar] Notificación actualizada exitosamente');
                              showToast(`Estado cambiado a ${nextSrv}`);
                              try { await fetchNotifs(); } catch (e) {}
                            } catch (e) {
                              showToast(String(e), 'error');
                            }
                          }}>Realizar</button>
                          {isEntrega && (
                            <>
                              <button 
                                style={{
                                  ...buttonStyle,
                                  background: COLORS.info,
                                  color: COLORS.white,
                                  padding: '8px 20px',
                                  fontSize: 14,
                                  borderRadius: 8,
                                  boxShadow: '0 2px 8px rgba(59,130,246,0.25)'
                                }}
                                onClick={async () => {
                                if (!n.carrito_id) { showToast('No se pudo obtener el pedido asociado', 'error'); return; }
                                setPedidoSelId(n.carrito_id);
                                setNotifNombre(n.nombre || '');
                                setDetalleLoading(true); setDetalle(null); setDetalleError('');
                                try {
                                  const r = await fetch(`/api/admin/pedidos/${n.carrito_id}/detalle`, { headers: { ...authHeaders() } });
                                  const j = await r.json();
                                  if (!r.ok || !j.success) throw new Error(j.error || j.message || 'Error');
                                  setDetalle(j);
                                } catch (e) {
                                  setDetalleError(String(e));
                                } finally { setDetalleLoading(false); }
                                }}>Detalle</button>
                              <button 
                                style={{
                                  ...buttonStyle,
                                  background: COLORS.error,
                                  color: COLORS.white,
                                  padding: '8px 20px',
                                  fontSize: 14,
                                  borderRadius: 8,
                                  boxShadow: '0 2px 8px rgba(239,68,68,0.25)'
                                }}
                                onClick={async () => {
                                if (!n.carrito_id) { showToast('Esta notificación no tiene pedido asociado.', 'error'); return; }
                                if (!window.confirm('¿Eliminar este pedido y sus items? Esta acción no se puede deshacer.')) return;
                                try {
                                  const r = await fetch(`/api/admin/pedidos/${n.carrito_id}`, { method: 'DELETE', headers: { ...authHeaders() } });
                                  const j = await r.json();
                                  if (!r.ok || !j.success) throw new Error(j.error || j.message || 'No se pudo eliminar');
                                  showToast('Pedido eliminado');
                                  if (pedidoSelId === n.carrito_id) { setPedidoSelId(''); setDetalle(null); setDetalleError(''); setNotifNombre(''); }
                                  try { await fetchNotifs(); } catch (e) {}
                                } catch (e) { showToast(String(e), 'error'); }
                              }}>Eliminar</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
            )}
          </div>
          {/* Panel de detalle del pedido */}
          <div style={{ ...cardStyle, marginBottom: 0 }}>
            {detalleLoading ? (
              <div style={{ padding: 20, textAlign: 'center', color: COLORS.textLight }}>
                Cargando detalle...
              </div>
            ) : detalleError ? (
              <div style={{ 
                padding: 12, 
                borderRadius: 8, 
                background: COLORS.error, 
                color: COLORS.white,
                fontSize: 14
              }}>
                {detalleError}
              </div>
            ) : detalle && detalle.success ? (
              <div>
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ 
                      fontWeight: 800, 
                      fontSize: 18,
                      fontFamily: FONTS.heading,
                      color: COLORS.text,
                      marginBottom: 6
                    }}>
                      Detalle del pedido
                    </h4>
                    <div style={{ 
                      fontSize: 14, 
                      color: COLORS.textLight,
                      fontFamily: FONTS.body
                    }}>
                      Estado: {detalle.pedido && detalle.pedido.estado}
                    </div>
                  </div>
                  <button 
                    onClick={() => { 
                      setPedidoSelId(''); 
                      setDetalle(null); 
                      setDetalleError(''); 
                      setNotifNombre(''); 
                    }}
                    style={{
                      ...buttonStyle,
                      background: COLORS.gray[200],
                      color: COLORS.text,
                      padding: '6px 12px',
                      fontSize: 13
                    }}
                  >
                    Cerrar
                  </button>
                </div>
                <div style={{ 
                  marginBottom: 16, 
                  fontSize: 14, 
                  color: COLORS.text,
                  fontFamily: FONTS.body
                }}>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ fontWeight: 700 }}>Cliente:</span>{' '}
                    {(detalle.cliente && (detalle.cliente.nombre || detalle.cliente.razon_social)) || notifNombre || '-'}
                  </div>
                  {detalle.cliente && (
                    <>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 700 }}>Número:</span> {detalle.cliente.numero || '-'}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 700 }}>Documento:</span>{' '}
                        {(detalle.cliente.tipo_documento || '') + ' ' + (detalle.cliente.documento || '')}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        <span style={{ fontWeight: 700 }}>Correo:</span> {detalle.cliente.correo || '-'}
                      </div>
                    </>
                  )}
                </div>
                <div style={{ 
                  border: `1px solid ${COLORS.border}`, 
                  borderRadius: 12, 
                  overflow: 'auto',
                  marginBottom: 16
                }}>
                  <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead style={{ background: COLORS.gray[100] }}>
                      <tr>
                        {['Producto', 'Código', 'Cantidad', 'Fila', 'Columna', 'Grosor', 'Precio', 'Subtotal'].map(h => (
                          <th key={h} style={{
                            padding: '10px 8px',
                            borderBottom: `1px solid ${COLORS.border}`,
                            fontFamily: FONTS.heading,
                            fontWeight: 800,
                            textAlign: 'left',
                            color: COLORS.text
                          }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(detalle.items || []).map((it, idx) => (
                        <tr key={it.id_producto} style={{ 
                          background: idx % 2 === 0 ? COLORS.white : COLORS.gray[50]
                        }}>
                          <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 8px' }}>
                            {it.nombre}
                          </td>
                          <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 8px', fontFamily: 'monospace' }}>
                            {it.codigo || '-'}
                          </td>
                          <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 8px' }}>
                            {it.cantidad}
                          </td>
                          <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 8px' }}>
                            {it.fila || '-'}
                          </td>
                          <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 8px' }}>
                            {it.columna || '-'}
                          </td>
                          <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 8px' }}>
                            {it.grosor || '-'}
                          </td>
                          <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 8px' }}>
                            S/. {Number(it.precio_unitario || 0).toFixed(2)}
                          </td>
                          <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 8px' }}>
                            S/. {Number(it.subtotal || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: COLORS.gray[50] }}>
                        <td 
                          colSpan={6}
                          style={{ 
                            borderTop: `2px solid ${COLORS.border}`, 
                            padding: '10px 8px', 
                            textAlign: 'right', 
                            fontWeight: 800,
                            fontFamily: FONTS.heading
                          }}
                        >
                          Totales
                        </td>
                        <td style={{ borderTop: `2px solid ${COLORS.border}`, padding: '10px 8px' }}>—</td>
                        <td style={{ 
                          borderTop: `2px solid ${COLORS.border}`, 
                          padding: '10px 8px', 
                          fontWeight: 800,
                          fontFamily: FONTS.heading
                        }}>
                          S/. {Number(detalle.total_precio || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    style={{
                      ...buttonStyle,
                      background: COLORS.warning,
                      color: COLORS.white,
                      padding: '10px 18px',
                      boxShadow: '0 10px 20px rgba(245,158,11,0.22)'
                    }}
                    onClick={async () => {
                    try {
                      const r = await fetch(`/api/pedidos/${pedidoSelId}/estado`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ estado: 'Listo' }) });
                      const j = await r.json();
                      if (!r.ok || !j.success) throw new Error(j.error || j.message || 'Error al actualizar');
                      showToast('Pedido marcado como Listo');
                      try { await fetchNotifs(); } catch (e) {}
                    } catch (e) {
                      showToast(String(e), 'error');
                    }
                  }}>Pagado</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Obras;
