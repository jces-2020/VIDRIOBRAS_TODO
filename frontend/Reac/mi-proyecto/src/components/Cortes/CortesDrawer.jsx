import React, { useMemo, useState } from 'react';
import { COLORS, FONTS } from '../../colors';

const drawerStyle = {
  position: 'fixed',
  top: 0,
  right: 0,
  height: '100vh',
  width: 420,
  maxWidth: '95vw',
  backgroundColor: COLORS.white,
  boxShadow: '-8px 0 24px rgba(0,0,0,0.18)',
  zIndex: 1000,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 12
};

const inputStyle = {
  width: '100%',
  padding: 8,
  borderRadius: 6,
  border: `1px solid ${COLORS.border}`,
  fontFamily: FONTS.body
};

const CortesDrawer = ({
  producto,
  costoCorte = 0,
  onConfirm,
  onClose
}) => {
  const esAluminio = (producto?.categoria || '').toUpperCase().includes('ALUMINIO');
  
  const [cortes, setCortes] = useState([
    { ancho_cm: '', alto_cm: '', cantidad: 1 }
  ]);

  const calcularTotal = useMemo(() => {
    const precioUnit = Number(producto?.precio_unitario || 0);
    return cortes.reduce((acc, c) => {
      const ancho = Number(c.ancho_cm || 0);
      const alto = esAluminio ? 1 : Number(c.alto_cm || 0);
      const cantidad = Number(c.cantidad || 0);
      if (ancho <= 0 || (alto <= 0 && !esAluminio) || cantidad <= 0) return acc;
      
      let precioCorte;
      if (esAluminio) {
        // Para aluminio: precio por metro lineal
        const longitudMetros = ancho / 100;
        const precioBase = longitudMetros * precioUnit;
        precioCorte = (precioBase + costoCorte) * cantidad;
      } else {
        // Para vidrio: cálculo por área en m²
        const areaCm2 = ancho * alto;
        const areaM2 = areaCm2 / 10000;
        const precioBase = areaM2 * precioUnit;
        precioCorte = (precioBase + costoCorte) * cantidad;
      }
      return acc + precioCorte;
    }, 0);
  }, [cortes, producto, costoCorte, esAluminio]);

  const updateCorte = (idx, key, value) => {
    setCortes((prev) => prev.map((c, i) => (
      i === idx ? { ...c, [key]: value } : c
    )));
  };

  const addCorte = () => {
    setCortes((prev) => [...prev, { ancho_cm: '', alto_cm: '', cantidad: 1 }]);
  };

  const removeCorte = (idx) => {
    setCortes((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div style={drawerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontFamily: FONTS.heading, color: COLORS.text }}>
          {esAluminio ? 'Cortes de barra' : 'Cortes personalizados'}
        </h3>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
        >
          X
        </button>
      </div>

      <div style={{ color: COLORS.textLight }}>
        Producto: <b>{producto?.nombre || '-'}</b>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {cortes.map((c, idx) => (
          <div key={idx} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10 }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: esAluminio ? '2fr 1fr' : '1fr 1fr 1fr', 
              gap: 8 
            }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700 }}>
                  {esAluminio ? 'Longitud (cm)' : 'Ancho (cm)'}
                </label>
                <input
                  type="number"
                  min={1}
                  value={c.ancho_cm}
                  onChange={(e) => updateCorte(idx, 'ancho_cm', e.target.value)}
                  style={inputStyle}
                />
              </div>
              {!esAluminio && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Alto (cm)</label>
                  <input
                    type="number"
                    min={1}
                    value={c.alto_cm}
                    onChange={(e) => updateCorte(idx, 'alto_cm', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              )}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Cantidad</label>
                <input
                  type="number"
                  min={1}
                  value={c.cantidad}
                  onChange={(e) => updateCorte(idx, 'cantidad', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <button
                onClick={() => removeCorte(idx)}
                style={{ background: COLORS.gray[300], border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addCorte}
        style={{ background: COLORS.primary, color: COLORS.white, border: 'none', padding: '8px 12px', borderRadius: 8, fontWeight: 700 }}
      >
        {esAluminio ? 'Agregar otro corte de barra' : 'Agregar otro corte'}
      </button>

      <div style={{ marginTop: 'auto', borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Precio total</span>
          <b>S/ {Number(calcularTotal).toFixed(2)}</b>
        </div>
        <button
          onClick={() => onConfirm?.({ cortes, total: Number(calcularTotal.toFixed(2)) })}
          style={{ width: '100%', background: COLORS.info, color: COLORS.white, border: 'none', padding: '10px 12px', borderRadius: 8, fontWeight: 700 }}
        >
          Agregar al carrito
        </button>
      </div>
    </div>
  );
};

export default CortesDrawer;
