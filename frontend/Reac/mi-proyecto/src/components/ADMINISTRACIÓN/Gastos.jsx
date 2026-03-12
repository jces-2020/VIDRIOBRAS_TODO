import React, { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../colors';

const Gastos = ({ onToast }) => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nuevoGasto, setNuevoGasto] = useState({ descripcion: '', monto: '' });

  useEffect(() => {
    fetchResumen();
  }, [fecha]);

  const fetchResumen = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gastos-diarios/resumen?fecha=${fecha}`);
      const data = await res.json();
      if (data.success) {
        setResumen(data.data);
      } else {
        onToast?.('Error al cargar resumen', 'error');
      }
    } catch (e) {
      onToast?.('Error al cargar resumen', 'error');
    }
    setLoading(false);
  };

  const handleAgregarGasto = async () => {
    if (!nuevoGasto.monto) {
      onToast?.('Ingresa el monto del gasto', 'error');
      return;
    }
    try {
      const res = await fetch('/api/gastos-diarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto: parseFloat(nuevoGasto.monto), fecha })
      });
      const data = await res.json();
      if (data.success) {
        onToast?.('Gasto registrado', 'success');
        setNuevoGasto({ descripcion: '', monto: '' });
        fetchResumen();
      } else {
        onToast?.('Error al registrar gasto', 'error');
      }
    } catch (e) {
      onToast?.('Error al registrar gasto', 'error');
    }
  };

  const handleGenerarPDF = () => {
    if (!resumen) return;
    
    // Crear contenido HTML para el PDF
    const contenido = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; text-align: right; }
            .section { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h1>RESUMEN DE GASTOS E INGRESOS</h1>
          <p><strong>Fecha:</strong> ${fecha}</p>
          
          <div class="section">
            <h2>GASTOS</h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Monto</th>
                </tr>
              </thead>
              <tbody>
                ${resumen.gastos.map(g => `
                  <tr>
                    <td>${g.id_gasto}</td>
                    <td>S/ ${parseFloat(g.monto || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p class="total">Total Gastos: S/ ${resumen.total_gastos.toFixed(2)}</p>
          </div>

          <div class="section">
            <h2>INGRESOS DE CAJA</h2>
            <table>
              <thead>
                <tr>
                  <th>ID Caja</th>
                  <th>Turno</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${resumen.cajas.map(c => `
                  <tr>
                    <td>${c.id_caja}</td>
                    <td>${c.turno || '-'}</td>
                    <td>S/ ${parseFloat(c.subtotal || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p class="total">Total Caja: S/ ${resumen.total_ingresos_caja.toFixed(2)}</p>
          </div>

          <div class="section">
            <h2>VENTAS</h2>
            <table>
              <thead>
                <tr>
                  <th>ID Venta</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${resumen.ventas.map(v => `
                  <tr>
                    <td>${v.id_venta}</td>
                    <td>S/ ${parseFloat(v.total || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p class="total">Total Ventas: S/ ${resumen.total_ventas.toFixed(2)}</p>
          </div>

          <div style="border-top: 3px solid #333; margin-top: 30px; padding-top: 20px;">
            <p class="total" style="font-size: 24px; color: ${resumen.total_neto >= 0 ? 'green' : 'red'}">
              TOTAL NETO: S/ ${resumen.total_neto.toFixed(2)}
            </p>
          </div>
        </body>
      </html>
    `;

    // Abrir en una nueva ventana para imprimir/guardar como PDF
    const ventana = window.open('', '_blank');
    ventana.document.write(contenido);
    ventana.document.close();
    setTimeout(() => {
      ventana.print();
    }, 250);
  };

  if (loading) {
    return <div style={{ padding: 24, fontFamily: FONTS.body, color: COLORS.text }}>Cargando...</div>;
  }

  if (!resumen) {
    return <div style={{ padding: 24, fontFamily: FONTS.body, color: COLORS.text }}>No hay datos disponibles</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" style={{ fontFamily: FONTS.body, color: COLORS.text }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: FONTS.heading, color: COLORS.text }}>
          MONTO EN DE LA EMPRESA
        </h2>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="p-2 border rounded-md"
          style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.body }}
        />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Columna de Gastos */}
        <div>
          <h3 className="text-lg font-bold mb-3 p-2" style={{ fontFamily: FONTS.heading, background: COLORS.light, color: COLORS.text }}>GASTOS</h3>
          <div className="border rounded-md overflow-hidden" style={{ borderColor: COLORS.border }}>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm" style={{ fontFamily: FONTS.body }}>
                <thead style={{ background: COLORS.light, position: 'sticky', top: 0 }}>
                  <tr>
                    <th className="border px-3 py-2 text-left">ID</th>
                    <th className="border px-3 py-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.gastos.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="text-center text-gray-400 py-4">
                        Sin gastos registrados
                      </td>
                    </tr>
                  ) : (
                    resumen.gastos.map(g => (
                      <tr key={g.id_gasto} className="hover:bg-gray-50">
                        <td className="border px-3 py-2">{g.id_gasto.slice(0, 8)}...</td>
                        <td className="border px-3 py-2 text-right">
                          S/ {parseFloat(g.monto || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-3 p-3 rounded-md border" style={{ background: COLORS.backgroundLight, borderColor: COLORS.border }}>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Monto"
                value={nuevoGasto.monto}
                onChange={e => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })}
                className="flex-1 p-2 border rounded-md"
                style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.body }}
              />
              <button
                onClick={handleAgregarGasto}
                className="text-white px-4 py-2 rounded-md"
                style={{ background: COLORS.primary, fontFamily: FONTS.heading, fontWeight: 700 }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Columna de Ingresos */}
        <div>
          <h3 className="text-lg font-bold mb-3 p-2" style={{ fontFamily: FONTS.heading, background: COLORS.light, color: COLORS.text }}>INGRESOS</h3>
          
          {/* Caja */}
          <div className="mb-4">
            <h4 className="font-semibold mb-2" style={{ fontFamily: FONTS.heading, color: COLORS.text }}>Caja</h4>
            <div className="border rounded-md overflow-hidden" style={{ borderColor: COLORS.border }}>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm" style={{ fontFamily: FONTS.body }}>
                  <thead style={{ background: COLORS.light, position: 'sticky', top: 0 }}>
                    <tr>
                      <th className="border px-3 py-2 text-left" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.heading }}>Turno</th>
                      <th className="border px-3 py-2 text-right" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.heading }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.cajas.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center text-gray-400 py-4">Sin registros</td>
                      </tr>
                    ) : (
                      resumen.cajas.map(c => (
                        <tr key={c.id_caja} className="hover:bg-gray-50">
                          <td className="border px-3 py-2">{c.turno || '-'}</td>
                          <td className="border px-3 py-2 text-right">
                            S/ {parseFloat(c.subtotal || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Ventas */}
          <div>
            <h4 className="font-semibold mb-2" style={{ fontFamily: FONTS.heading, color: COLORS.text }}>Ventas</h4>
            <div className="border rounded-md overflow-hidden" style={{ borderColor: COLORS.border }}>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm" style={{ fontFamily: FONTS.body }}>
                  <thead style={{ background: COLORS.light, position: 'sticky', top: 0 }}>
                    <tr>
                      <th className="border px-3 py-2 text-left" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.heading }}>ID</th>
                      <th className="border px-3 py-2 text-right" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.heading }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.ventas.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center text-gray-400 py-4">Sin ventas</td>
                      </tr>
                    ) : (
                      resumen.ventas.map(v => (
                        <tr key={v.id_venta} className="hover:bg-gray-50">
                          <td className="border px-3 py-2">{v.id_venta.slice(0, 8)}...</td>
                          <td className="border px-3 py-2 text-right">
                            S/ {parseFloat(v.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Totales */}
      <div style={{ borderTop: `2px solid ${COLORS.border}`, paddingTop: 16 }}>
        <div className="grid grid-cols-3 gap-4 text-right font-semibold text-lg mb-4">
          <div className="p-3 rounded-md border" style={{ background: `${COLORS.error}22`, borderColor: COLORS.error }}>
            <div className="text-sm" style={{ color: COLORS.textLight, fontFamily: FONTS.body }}>Total Gastos</div>
            <div style={{ color: COLORS.error, fontFamily: FONTS.heading, fontWeight: 700 }}>S/ {resumen.total_gastos.toFixed(2)}</div>
          </div>
          <div className="p-3 rounded-md border" style={{ background: `${COLORS.info}22`, borderColor: COLORS.info }}>
            <div className="text-sm" style={{ color: COLORS.textLight, fontFamily: FONTS.body }}>Total Ingresos</div>
            <div style={{ color: COLORS.info, fontFamily: FONTS.heading, fontWeight: 700 }}>
              S/ {(resumen.total_ingresos_caja + resumen.total_ventas).toFixed(2)}
            </div>
          </div>
          <div className="p-3 rounded-md border" style={{ background: `${resumen.total_neto >= 0 ? COLORS.success : COLORS.error}22`, borderColor: resumen.total_neto >= 0 ? COLORS.success : COLORS.error }}>
            <div className="text-sm" style={{ color: COLORS.textLight, fontFamily: FONTS.body }}>TOTAL</div>
            <div style={{ color: resumen.total_neto >= 0 ? COLORS.success : COLORS.error, fontFamily: FONTS.heading, fontWeight: 700 }}>
              S/ {resumen.total_neto.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleGenerarPDF}
            className="text-white px-8 py-3 rounded-md font-semibold text-lg"
            style={{ background: COLORS.success, fontFamily: FONTS.heading }}
          >
            GUARDAR PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default Gastos;
