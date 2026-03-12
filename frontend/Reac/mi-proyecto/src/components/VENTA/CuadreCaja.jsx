import React, { useState, useEffect, useContext } from "react";
import { COLORS, FONTS } from "../../colors";

const CuadreCaja = () => {
  const usuario = "Juan Pérez"; // Temporal
  const [totales, setTotales] = useState({ tarjeta: 0, contado: 0, yape: 0, total: 0 });
  const [comprobantes, setComprobantes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [retiro, setRetiro] = useState("");
  const [baseCaja, setBaseCaja] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/caja/cuadre")
      .then(res => res.json())
      .then(data => {
        setTotales({
          tarjeta: data.totales?.tarjeta || 0,
          contado: data.totales?.contado || 0,
          yape: data.totales?.yape || 0,
          total: data.totales?.total || 0,
        });
        setComprobantes(data.comprobantes || []);
        setBaseCaja(data.totales?.total || 0);
        setLoading(false);
      })
      .catch(() => {
        setError("No se pudo cargar el cuadre de caja");
        setLoading(false);
      });
  }, []);

  const handleRetiro = () => {
    if (!retiro || isNaN(retiro) || Number(retiro) <= 0) {
      setError("Ingrese un monto válido");
      return;
    }
    if (Number(retiro) > baseCaja) {
      setError("No puede retirar más que el total en caja");
      return;
    }
    setModal(true);
  };

  const confirmarRetiro = () => {
    setLoading(true);
    fetch("/api/caja/retiro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monto: Number(retiro), usuario }),
    })
      .then(res => res.json())
      .then(data => {
        setModal(false);
        setRetiro("");
        setError("");
        // Actualizar cuadre
        setBaseCaja(prev => prev - Number(retiro));
      })
      .catch(() => {
        setError("Error al registrar el retiro");
        setModal(false);
      })
      .finally(() => setLoading(false));
  };

  // Filtrar comprobantes por búsqueda
  const comprobantesFiltrados = comprobantes.filter(c =>
    c.numero?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.cliente?.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Imprimir arqueo
  const handleImprimir = () => {
    window.print(); // Puedes mejorar con react-to-print o jsPDF
  };

  return (
    <div style={{ 
      background: COLORS.backgroundLight, 
      minHeight: '100vh', 
      padding: '24px',
      fontFamily: FONTS.body
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '32px' 
      }}>
        {/* Panel izquierdo: Totales y comprobantes */}
        <div>
          <div style={{ 
            background: COLORS.white, 
            borderRadius: '16px', 
            boxShadow: `0 4px 16px rgba(0, 0, 0, 0.08)`, 
            padding: '24px', 
            marginBottom: '32px' 
          }}>
            <h2 style={{ 
              fontSize: '2.2rem', 
              fontWeight: 700, 
              marginBottom: '20px',
              fontFamily: FONTS.heading,
              color: COLORS.text
            }}>Cuadre de Caja</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span style={{ fontWeight: 600, fontFamily: FONTS.body, color: COLORS.text, fontSize: '1.05rem' }}>Por Tarjeta:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '12px', 
                    background: COLORS.border, 
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(totales.tarjeta / totales.total) * 100}%`,
                      height: '100%',
                      background: COLORS.primary,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <span style={{ fontWeight: 700, color: COLORS.primary, fontFamily: FONTS.body }}>S/ {totales.tarjeta.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <span style={{ fontWeight: 600, fontFamily: FONTS.body, color: COLORS.text, fontSize: '1.05rem' }}>Al Contado:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '12px', 
                    background: COLORS.border, 
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(totales.contado / totales.total) * 100}%`,
                      height: '100%',
                      background: COLORS.success,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <span style={{ fontWeight: 700, color: COLORS.success, fontFamily: FONTS.body }}>S/ {totales.contado.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <span style={{ fontWeight: 600, fontFamily: FONTS.body, color: COLORS.text, fontSize: '1.05rem' }}>Por Yape:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '12px', 
                    background: COLORS.border, 
                    borderRadius: '999px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${(totales.yape / totales.total) * 100}%`,
                      height: '100%',
                      background: COLORS.secondary,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  <span style={{ fontWeight: 700, color: COLORS.secondary, fontFamily: FONTS.body }}>S/ {totales.yape.toFixed(2)}</span>
                </div>
              </div>
              <div style={{ marginTop: '20px', fontSize: '1.6rem', fontWeight: 700, color: COLORS.text, fontFamily: FONTS.heading }}>
                Total General: S/ {totales.total.toFixed(2)}
              </div>
            </div>
          </div>
          <div style={{ 
            background: COLORS.white, 
            borderRadius: '16px', 
            boxShadow: `0 4px 16px rgba(0, 0, 0, 0.08)`, 
            padding: '24px' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: FONTS.heading, color: COLORS.text }}>Comprobantes</h3>
              <input
                type="text"
                placeholder="Buscar comprobante..."
                style={{ 
                  border: `1px solid ${COLORS.border}`, 
                  borderRadius: '8px', 
                  padding: '8px 12px',
                  fontFamily: FONTS.body,
                  color: COLORS.text
                }}
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.9rem', fontFamily: FONTS.body }}>
                <thead>
                  <tr style={{ background: COLORS.light }}>
                    <th style={{ padding: '8px', color: COLORS.text, fontFamily: FONTS.heading }}>N°</th>
                    <th style={{ padding: '8px', color: COLORS.text, fontFamily: FONTS.heading }}>Cliente</th>
                    <th style={{ padding: '8px', color: COLORS.text, fontFamily: FONTS.heading }}>Método</th>
                    <th style={{ padding: '8px', color: COLORS.text, fontFamily: FONTS.heading }}>Monto</th>
                    <th style={{ padding: '8px', color: COLORS.text, fontFamily: FONTS.heading }}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {comprobantesFiltrados.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: COLORS.textLight, padding: '16px' }}>No hay comprobantes</td></tr>
                  ) : comprobantesFiltrados.map(c => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: '8px', color: COLORS.text }}>{c.numero}</td>
                      <td style={{ padding: '8px', color: COLORS.text }}>{c.cliente}</td>
                      <td style={{ padding: '8px', color: COLORS.text }}>{c.metodo_pago}</td>
                      <td style={{ padding: '8px', color: COLORS.text }}>S/ {c.monto.toFixed(2)}</td>
                      <td style={{ padding: '8px', color: COLORS.text }}>{c.fecha}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Panel derecho: Base de caja y retiro */}
        <div>
          <div style={{ 
            background: COLORS.white, 
            borderRadius: '16px', 
            boxShadow: `0 4px 16px rgba(0, 0, 0, 0.08)`, 
            padding: '24px', 
            marginBottom: '32px' 
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '20px', fontFamily: FONTS.heading, color: COLORS.text }}>Cantidad en Caja</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 700, color: COLORS.text, fontFamily: FONTS.heading }}>S/ {baseCaja.toFixed(2)}</span>
              <button
                style={{ 
                  background: COLORS.primary, 
                  color: COLORS.white, 
                  padding: '12px 20px', 
                  borderRadius: '8px', 
                  fontWeight: 700, 
                  border: 'none', 
                  cursor: 'pointer',
                  boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`,
                  fontFamily: FONTS.heading,
                  fontSize: '1rem'
                }}
                onClick={handleImprimir}
              >Imprimir Arqueo</button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontFamily: FONTS.body, color: COLORS.text, fontSize: '1.05rem' }}>Cantidad a Retirar</label>
              <input
                type="number"
                min={1}
                max={baseCaja}
                style={{ 
                  border: `1px solid ${COLORS.border}`, 
                  borderRadius: '8px', 
                  padding: '8px 12px', 
                  width: '100%',
                  fontFamily: FONTS.body,
                  color: COLORS.text
                }}
                value={retiro}
                onChange={e => setRetiro(e.target.value)}
              />
            </div>
            <button
              style={{ 
                background: COLORS.primary, 
                color: COLORS.white, 
                padding: '12px 20px', 
                borderRadius: '8px', 
                fontWeight: 700, 
                width: '100%', 
                border: 'none', 
                cursor: 'pointer',
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1)`,
                fontFamily: FONTS.heading,
                fontSize: '1rem'
              }}
              onClick={handleRetiro}
              disabled={loading}
            >Retirar</button>
            {error && <div style={{ marginTop: '8px', color: COLORS.error, fontWeight: 600, fontFamily: FONTS.body }}>{error}</div>}
          </div>
          {/* Modal de confirmación */}
          {modal && (
            <div style={{ 
              position: 'fixed', 
              inset: 0, 
              background: 'rgba(0, 0, 0, 0.3)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              zIndex: 50 
            }}>
              <div style={{ 
                background: COLORS.white, 
                borderRadius: '16px', 
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.15)`, 
                padding: '32px', 
                maxWidth: '400px', 
                width: '100%' 
              }}>
                <h4 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '20px', fontFamily: FONTS.heading, color: COLORS.text }}>
                  ¿Confirmar retiro de S/ {retiro}?
                </h4>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                  <button 
                    style={{ 
                      background: COLORS.primary, 
                      color: COLORS.white, 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      fontWeight: 700, 
                      border: 'none', 
                      cursor: 'pointer',
                      fontFamily: FONTS.heading,
                      fontSize: '1rem'
                    }} 
                    onClick={confirmarRetiro}
                  >Confirmar</button>
                  <button 
                    style={{ 
                      background: COLORS.border, 
                      color: COLORS.text, 
                      padding: '12px 20px', 
                      borderRadius: '8px', 
                      fontWeight: 700, 
                      border: 'none', 
                      cursor: 'pointer',
                      fontFamily: FONTS.heading,
                      fontSize: '1rem'
                    }} 
                    onClick={() => setModal(false)}
                  >Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CuadreCaja;
