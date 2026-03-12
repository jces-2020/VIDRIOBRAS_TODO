import React from 'react';
import { COLORS, FONTS } from '../../colors';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const cardStyle = {
  backgroundColor: COLORS.white,
  borderRadius: 12,
  width: 520,
  maxWidth: '90vw',
  padding: 24,
  boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
  fontFamily: FONTS.body
};

const btnStyle = {
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: FONTS.heading
};

const CorteModal = ({ producto, onSelectPlancha, onSelectCorte, onClose }) => {
  const [cantidad, setCantidad] = React.useState(1);
  const esAluminio = (producto?.categoria || '').toUpperCase().includes('ALUMINIO');
  
  if (!producto) return null;

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <h3 style={{ margin: 0, fontFamily: FONTS.heading, color: COLORS.text }}>
          Tipo de compra
        </h3>
        <p style={{ marginTop: 8, color: COLORS.textLight }}>
          Producto: <b>{producto.nombre}</b>
        </p>

        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 14 }}>
            Cantidad:
          </label>
          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              fontSize: 16
            }}
          />
        </div>

        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <button
            style={{ ...btnStyle, background: COLORS.primary, color: COLORS.white }}
            onClick={() => onSelectPlancha?.(cantidad)}
          >
            {esAluminio ? 'Comprar barra completa' : 'Comprar plancha completa'}
          </button>
          <button
            style={{ ...btnStyle, background: COLORS.info, color: COLORS.white }}
            onClick={() => onSelectCorte?.()}
          >
            Introducir cortes
          </button>
        </div>

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <button
            style={{ ...btnStyle, background: COLORS.gray[300], color: COLORS.text }}
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorteModal;
