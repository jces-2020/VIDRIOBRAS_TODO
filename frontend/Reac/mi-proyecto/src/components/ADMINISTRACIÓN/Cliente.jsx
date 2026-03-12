import React, { useEffect, useState } from 'react';
import { COLORS, FONTS } from '../../colors';

const cardStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 16,
  boxShadow: '0 10px 26px rgba(0,0,0,0.06)',
  background: COLORS.white,
};

const headerText = {
  fontFamily: FONTS.heading,
  color: COLORS.text,
};

const labelText = {
  fontWeight: 700,
  color: COLORS.text,
};

const mutedText = {
  color: COLORS.textLight,
};

const inputBase = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  fontFamily: FONTS.body,
  fontSize: 14,
};

const buttonBase = {
  border: 'none',
  borderRadius: 12,
  padding: '10px 14px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: FONTS.heading,
};

const Cliente = ({ onToast }) => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ventasLoading, setVentasLoading] = useState(false);
  const [showDescuentoForm, setShowDescuentoForm] = useState(false);
  const [descripcionDescuento, setDescripcionDescuento] = useState('');
  const [porcentajeDescuento, setPorcentajeDescuento] = useState('');

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clientes_admin');
      if (!res.ok) throw new Error('No se pudo cargar clientes');
      const data = await res.json();
      if (data.success) {
        setClientes(Array.isArray(data.data) ? data.data : []);
      } else {
        onToast?.('Error al cargar clientes', 'error');
      }
    } catch (e) {
      onToast?.('Error al cargar clientes', 'error');
    }
    setLoading(false);
  };

  const handleSelectCliente = async (cliente) => {
    setSelectedCliente(cliente);
    setShowDescuentoForm(false);
    setDescripcionDescuento('');
    setPorcentajeDescuento('');
    setVentas([]);

    setVentasLoading(true);
    try {
      const res = await fetch(`/api/clientes_admin/${cliente.id_cliente}/ventas`);
      if (!res.ok) throw new Error('No se pudo cargar ventas');
      const data = await res.json();
      if (data.success) {
        setVentas(Array.isArray(data.data) ? data.data : []);
      } else {
        setVentas([]);
      }
    } catch (e) {
      onToast?.('Error al cargar ventas del cliente', 'error');
      setVentas([]);
    }
    setVentasLoading(false);
  };

  const handleAgregarDescuento = async () => {
    if (!selectedCliente) return;
    if (!descripcionDescuento.trim() || !porcentajeDescuento || parseFloat(porcentajeDescuento) <= 0) {
      onToast?.('Completa todos los campos correctamente', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/clientes_admin/${selectedCliente.id_cliente}/descuento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: descripcionDescuento, porcentaje: parseFloat(porcentajeDescuento) })
      });
      const data = await res.json();
      if (data.success) {
        onToast?.('Descuento/Promoción agregada correctamente');
        setShowDescuentoForm(false);
        setDescripcionDescuento('');
        setPorcentajeDescuento('');
      } else {
        onToast?.(data.message || 'Error al agregar descuento', 'error');
      }
    } catch (e) {
      onToast?.('Error al agregar descuento', 'error');
    }
  };

  if (loading) {
    return <div style={{ padding: 20, fontFamily: FONTS.body }}>Cargando clientes...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto', color: COLORS.text, fontFamily: FONTS.body }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ ...headerText, fontSize: 26, letterSpacing: 0.5 }}>CLIENTES DE LA EMPRESA</h2>
        <p style={{ ...mutedText, fontSize: 14 }}>Total: {clientes.length} clientes registrados</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 18 }}>
        <div style={{ ...cardStyle, padding: 18 }}>
          <h3 style={{ ...headerText, fontSize: 18, marginBottom: 12 }}>Lista de Clientes</h3>
          <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden', background: COLORS.white, maxHeight: 620 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead style={{ position: 'sticky', top: 0, background: COLORS.gray[100], zIndex: 1 }}>
                <tr>
                  <th style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 12px', textAlign: 'left', fontFamily: FONTS.heading }}>Nombre</th>
                  <th style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 12px', textAlign: 'left', fontFamily: FONTS.heading }}>Correo</th>
                  <th style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 12px', textAlign: 'left', fontFamily: FONTS.heading }}>Documento</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: 18, color: COLORS.textLight }}>Sin clientes registrados</td>
                  </tr>
                ) : (
                  clientes.map((c, idx) => {
                    const isSelected = selectedCliente?.id_cliente === c.id_cliente;
                    const rowBg = isSelected ? COLORS.light : idx % 2 === 0 ? COLORS.gray[50] : COLORS.white;
                    return (
                      <tr
                        key={c.id_cliente}
                        onClick={() => handleSelectCliente(c)}
                        style={{ cursor: 'pointer', background: rowBg, transition: 'background 0.2s ease' }}
                      >
                        <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 12px' }}>{c.nombre || 'Sin nombre'}</td>
                        <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 12px' }}>{c.correo || '-'}</td>
                        <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 12px' }}>{c.documento || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selectedCliente ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ ...cardStyle, padding: 18 }}>
              <h3 style={{ ...headerText, fontSize: 18, marginBottom: 12 }}>Información del Cliente</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, fontSize: 14 }}>
                <div><span style={labelText}>Nombre: </span>{selectedCliente.nombre || '-'}</div>
                <div><span style={labelText}>Correo: </span>{selectedCliente.correo || '-'}</div>
                <div><span style={labelText}>Teléfono: </span>{selectedCliente.numero || '-'}</div>
                <div><span style={labelText}>Documento: </span>{selectedCliente.documento || '-'}</div>
                <div><span style={labelText}>Tipo: </span>{selectedCliente.tipo_documento?.descripcion || '-'}</div>
                <div><span style={labelText}>Estado: </span>{selectedCliente.estado_cliente?.descripcion || '-'}</div>
              </div>
            </div>

            <div style={{ ...cardStyle, padding: 18 }}>
              <h3 style={{ ...headerText, fontSize: 18, marginBottom: 12 }}>Boletas y Facturas</h3>
              {ventasLoading ? (
                <div style={{ textAlign: 'center', padding: 12, ...mutedText }}>Cargando ventas...</div>
              ) : (
                <div style={{ maxHeight: 260, overflow: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead style={{ background: COLORS.gray[100] }}>
                      <tr>
                        <th style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 10px', textAlign: 'left', fontFamily: FONTS.heading }}>Fecha</th>
                        <th style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 10px', textAlign: 'left', fontFamily: FONTS.heading }}>Documento</th>
                        <th style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 10px', textAlign: 'right', fontFamily: FONTS.heading }}>Monto</th>
                        <th style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 10px', textAlign: 'left', fontFamily: FONTS.heading }}>Método</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventas.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', padding: 14, color: COLORS.textLight }}>Sin ventas registradas</td>
                        </tr>
                      ) : (
                        ventas.map((v, idx) => (
                          <tr key={v.id_registro} style={{ background: idx % 2 === 0 ? COLORS.gray[50] : COLORS.white }}>
                            <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '9px 10px' }}>{v.fecha || '-'}</td>
                            <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '9px 10px' }}>{v.documento || '-'}</td>
                            <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '9px 10px', textAlign: 'right' }}>S/ {(parseFloat(v.monto || 0) || 0).toFixed(2)}</td>
                            <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '9px 10px' }}>{v.metodo_pago?.descripcion || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {ventas.length > 0 && (
                      <tfoot>
                        <tr>
                          <td colSpan={2} style={{ borderTop: `1px solid ${COLORS.border}`, padding: '10px 10px', textAlign: 'right', fontWeight: 800 }}>TOTAL</td>
                          <td style={{ borderTop: `1px solid ${COLORS.border}`, padding: '10px 10px', textAlign: 'right', fontWeight: 800 }}>
                            S/ {ventas.reduce((acc, v) => acc + (parseFloat(v.monto || 0) || 0), 0).toFixed(2)}
                          </td>
                          <td style={{ borderTop: `1px solid ${COLORS.border}` }}></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </div>

            <div style={{ ...cardStyle, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h3 style={{ ...headerText, fontSize: 18 }}>Descuento / Promoción</h3>
                {!showDescuentoForm && (
                  <button
                    onClick={() => setShowDescuentoForm(true)}
                    style={{
                      ...buttonBase,
                      background: COLORS.success,
                      color: COLORS.white,
                      boxShadow: '0 10px 20px rgba(16,185,129,0.22)',
                    }}
                  >
                    Agregar Descuento
                  </button>
                )}
              </div>

              {showDescuentoForm && (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div>
                    <label style={{ ...labelText, display: 'block', marginBottom: 6, fontSize: 13 }}>Descripción</label>
                    <input
                      type="text"
                      placeholder="Ej: Descuento de temporada"
                      value={descripcionDescuento}
                      onChange={e => setDescripcionDescuento(e.target.value)}
                      style={inputBase}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelText, display: 'block', marginBottom: 6, fontSize: 13 }}>Porcentaje (%)</label>
                    <input
                      type="number"
                      placeholder="15"
                      min="0"
                      max="100"
                      step="0.1"
                      value={porcentajeDescuento}
                      onChange={e => setPorcentajeDescuento(e.target.value)}
                      style={inputBase}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleAgregarDescuento}
                      style={{
                        ...buttonBase,
                        flex: 1,
                        background: COLORS.primary,
                        color: COLORS.white,
                        boxShadow: '0 10px 20px rgba(0,210,255,0.25)',
                      }}
                    >
                      Guardar Descuento
                    </button>
                    <button
                      onClick={() => {
                        setShowDescuentoForm(false);
                        setDescripcionDescuento('');
                        setPorcentajeDescuento('');
                      }}
                      style={{
                        ...buttonBase,
                        flex: 1,
                        background: COLORS.gray[400],
                        color: COLORS.white,
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ ...cardStyle, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.textLight, minHeight: 420 }}>
            <p style={{ fontSize: 16 }}>Selecciona un cliente para ver sus detalles</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cliente;
