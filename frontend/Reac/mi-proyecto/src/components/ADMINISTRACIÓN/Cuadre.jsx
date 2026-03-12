import React, { useEffect, useMemo, useState } from 'react';
import { COLORS, FONTS } from '../../colors';

const Cuadre = ({ onToast }) => {
  const today = new Date();
  const defaultMes = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [mes, setMes] = useState(defaultMes);
  const [pagos, setPagos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [mes]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        fetch(`/api/cuadre-caja/pagos?mes=${mes}`),
        fetch(`/api/cuadre-caja/resumen?mes=${mes}`),
      ]);
      const pJson = await pRes.json();
      const rJson = await rRes.json();
      setPagos(pJson.success ? pJson.data : []);
      setResumen(rJson.success ? rJson.data : null);
    } catch (e) {
      onToast?.('Error al cargar cuadre', 'error');
    }
    setLoading(false);
  };

  const filteredPagos = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return pagos;
    return pagos.filter(p =>
      String(p.tipo || '').toLowerCase().includes(s) ||
      String(p.codigo || '').toLowerCase().includes(s) ||
      String(p.fecha || '').toLowerCase().includes(s)
    );
  }, [pagos, search]);

  const semanaDeFecha = (f) => {
    if (!f) return '-';
    const d = new Date(f);
    const start = new Date(d.getFullYear(), 0, 1);
    const diff = Math.floor((d - start) / (24 * 3600 * 1000));
    return Math.ceil((diff + start.getDay() + 1) / 7);
  };

  const handleGenerarPDF = () => {
    if (!resumen) return;
    const contenido = `
      <html><head><style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; }
        th { background: #111827; color: #fff; }
        .total { font-weight: bold; text-align: right; margin-top: 20px; }
      </style></head><body>
      <h1>CUADRE DEL MES</h1>
      <p><strong>Mes:</strong> ${mes}</p>

      <h2>Pagos</h2>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Codigo</th><th>Monto</th></tr></thead>
        <tbody>
          ${pagos.map(p => `
            <tr>
              <td>${p.fecha || '-'}</td>
              <td>${p.tipo}</td>
              <td>${p.codigo}</td>
              <td>S/ ${parseFloat(p.monto || 0).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2>Resumen</h2>
      <table>
        <tbody>
          <tr><td>Ingreso</td><td>S/ ${parseFloat(resumen.ingreso || 0).toFixed(2)}</td></tr>
          <tr><td>Egreso</td><td>S/ ${parseFloat(resumen.egreso || 0).toFixed(2)}</td></tr>
          <tr><td>Monto en caja</td><td>S/ ${parseFloat(resumen.monto_en_caja || 0).toFixed(2)}</td></tr>
          <tr><td>Monto de la empresa</td><td>S/ ${parseFloat(resumen.monto_empresa || 0).toFixed(2)}</td></tr>
        </tbody>
      </table>

      <p class="total">TOTAL: S/ ${parseFloat(resumen.monto_empresa || 0).toFixed(2)}</p>
      </body></html>
    `;
    const w = window.open('', '_blank');
    w.document.write(contenido);
    w.document.close();
    setTimeout(() => w.print(), 250);
  };

  if (loading) return <div className="p-6" style={{ fontFamily: FONTS.body, color: COLORS.text }}>Cargando...</div>;
  if (!resumen) return <div className="p-6" style={{ fontFamily: FONTS.body, color: COLORS.text }}>Sin datos del mes</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto" style={{ fontFamily: FONTS.body, color: COLORS.text }}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold" style={{ fontFamily: FONTS.heading, color: COLORS.text }}>
          CUADRE DEL MES
        </h2>
        <input
          type="month"
          value={mes}
          onChange={e => setMes(e.target.value)}
          className="p-2 border rounded-md"
          style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.body }}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Panel izquierdo: Pagos + búsqueda */}
        <div className="p-4 rounded-md border" style={{ background: COLORS.light, borderColor: COLORS.border }}>
          <div className="flex items-center gap-3 mb-3">
            <input
              placeholder="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 p-2 border rounded-md"
              style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.body }}
            />
          </div>

          <div className="border bg-white rounded-md overflow-hidden" style={{ borderColor: COLORS.border }}>
            <table className="w-full text-sm" style={{ fontFamily: FONTS.body }}>
              <thead style={{ background: COLORS.light, position: 'sticky', top: 0 }}>
                <tr>
                  <th className="border px-2 py-1" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.heading }}>FECHA</th>
                  <th className="border px-2 py-1" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.heading }}>MES</th>
                  <th className="border px-2 py-1" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.heading }}>SEMANA</th>
                  <th className="border px-2 py-1" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.heading }}>CODIGO</th>
                  <th className="border px-2 py-1" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.heading }}>TIPO DE PAGO</th>
                  <th className="border px-2 py-1 text-right" style={{ borderColor: COLORS.border, color: COLORS.text, fontFamily: FONTS.heading }}>MONTO</th>
                </tr>
              </thead>
              <tbody>
                {filteredPagos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-3" style={{ color: COLORS.textLight, fontFamily: FONTS.body }}>Sin pagos registrados</td>
                  </tr>
                ) : (
                  filteredPagos.map(p => (
                    <tr key={`${p.tipo}-${p.id}`} style={{ borderBottom: `1px solid ${COLORS.border}`, background: filteredPagos.indexOf(p) % 2 === 0 ? COLORS.backgroundLight : COLORS.white }}>
                      <td className="border px-2 py-1" style={{ borderColor: COLORS.border, fontFamily: FONTS.body }}>{p.fecha || '-'}</td>
                      <td className="border px-2 py-1" style={{ borderColor: COLORS.border, fontFamily: FONTS.body }}>{(p.fecha || '').slice(0, 7) || '-'}</td>
                      <td className="border px-2 py-1" style={{ borderColor: COLORS.border, fontFamily: FONTS.body }}>{semanaDeFecha(p.fecha)}</td>
                      <td className="border px-2 py-1" style={{ borderColor: COLORS.border, fontFamily: FONTS.body }}>{p.codigo}</td>
                      <td className="border px-2 py-1" style={{ borderColor: COLORS.border, fontFamily: FONTS.body }}>{p.tipo}</td>
                      <td className="border px-2 py-1 text-right" style={{ borderColor: COLORS.border, fontFamily: FONTS.body }}>S/ {parseFloat(p.monto || 0).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ background: COLORS.light, borderTop: `2px solid ${COLORS.border}` }}>
                  <td colSpan={5} className="border px-2 py-1 text-right font-bold" style={{ borderColor: COLORS.border, fontFamily: FONTS.heading }}>TOTAL</td>
                  <td className="border px-2 py-1 text-right font-bold" style={{ borderColor: COLORS.border, fontFamily: FONTS.heading }}>
                    S/ {filteredPagos.reduce((acc, p) => acc + (parseFloat(p.monto || 0) || 0), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Panel derecho: Resumen del mes */}
        <div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white border rounded-md" style={{ borderColor: COLORS.border, fontFamily: FONTS.body }}>
              <div style={{ color: COLORS.text }}>INGRESO</div>
              <div className="font-semibold" style={{ color: COLORS.text, fontFamily: FONTS.heading }}>S/ {parseFloat(resumen.ingreso || 0).toFixed(2)}</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-white border rounded-md" style={{ borderColor: COLORS.border, fontFamily: FONTS.body }}>
              <div style={{ color: COLORS.text }}>EGRESO</div>
              <div className="font-semibold" style={{ color: COLORS.text, fontFamily: FONTS.heading }}>S/ {parseFloat(resumen.egreso || 0).toFixed(2)}</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-white border rounded-md" style={{ borderColor: COLORS.border, fontFamily: FONTS.body }}>
              <div style={{ color: COLORS.text }}>MONTO EN CAJA</div>
              <div className="font-semibold" style={{ color: COLORS.text, fontFamily: FONTS.heading }}>S/ {parseFloat(resumen.monto_en_caja || 0).toFixed(2)}</div>
            </div>
            <div className="flex justify-between items-center p-3 bg-white border rounded-md" style={{ borderColor: COLORS.border, fontFamily: FONTS.body }}>
              <div style={{ color: COLORS.text }}>MONTO DE LA EMPRESA</div>
              <div className="font-semibold" style={{ color: COLORS.text, fontFamily: FONTS.heading }}>S/ {parseFloat(resumen.monto_empresa || 0).toFixed(2)}</div>
            </div>

            <div className="p-3 rounded-md border" style={{ background: COLORS.light, borderColor: COLORS.border }}>
              <div className="mb-2 font-bold" style={{ fontFamily: FONTS.heading, color: COLORS.text }}>TOTAL</div>
              <div className="w-full h-6 rounded-md overflow-hidden" style={{ background: COLORS.gray[200] }}>
                <div
                  style={{ width: `${Math.min(100, Math.max(0, (resumen.monto_empresa || 0) / (resumen.ingreso || 1) * 100))}%`, background: resumen.monto_empresa >= 0 ? COLORS.success : COLORS.error }}
                  className="h-full"
                />
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleGenerarPDF}
                className="text-white px-8 py-3 rounded-md font-semibold"
                style={{ background: COLORS.success, fontFamily: FONTS.heading }}
              >
                GUARDAR
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cuadre;