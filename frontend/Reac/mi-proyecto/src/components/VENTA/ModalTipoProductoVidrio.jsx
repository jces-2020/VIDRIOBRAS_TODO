import React from 'react';
import { COLORS, FONTS } from '../../colors';

/**
 * Modal para seleccionar si el cliente quiere:
 * ALUMINIOS: CORTES o VARILLA
 * VIDRIOS: PLANCHA o CORTES
 */
const ModalTipoProductoVidrio = ({ 
  producto,
  tipoProducto,   // 'ALUMINIOS' | 'VIDRIOS'
  onPlancha,      // callback(producto) - solo para VIDRIOS
  onVara,         // callback(producto) - solo para ALUMINIOS
  onCortes,       // callback(producto) - para ambos
  onCancel 
}) => {
  const esAluminio = tipoProducto === 'ALUMINIOS';
  const esVidrio = tipoProducto === 'VIDRIOS';
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: COLORS.white,
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        maxWidth: '500px',
        width: '90%',
        fontFamily: FONTS.body
      }}>
        <h2 style={{
          fontFamily: FONTS.heading,
          fontSize: '1.6rem',
          color: COLORS.text,
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          {esAluminio ? '🔧 Aluminio' : esVidrio ? '🪟 Vidrio' : '?'} - ¿Cómo deseas agregarlo?
        </h2>
        
        <p style={{
          color: COLORS.textLight,
          textAlign: 'center',
          marginBottom: '32px',
          fontSize: '1rem'
        }}>
          {producto?.nombre || 'Producto seleccionado'}
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: esAluminio ? '1fr 1fr' : '1fr 1fr',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {/* VIDRIO: Mostrar PLANCHA */}
          {esVidrio && (
            <button
              onClick={() => onPlancha?.(producto)}
              style={{
                padding: '16px 12px',
                border: '2px solid ' + COLORS.primary,
                borderRadius: '10px',
                background: COLORS.primary,
                color: COLORS.white,
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: FONTS.heading,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              📦 PLANCHA
            </button>
          )}

          {/* ALUMINIO: Mostrar VARILLA */}
          {esAluminio && (
            <button
              onClick={() => onVara?.(producto)}
              style={{
                padding: '16px 12px',
                border: '2px solid ' + COLORS.primary,
                borderRadius: '10px',
                background: COLORS.primary,
                color: COLORS.white,
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                fontFamily: FONTS.heading,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.target.style.transform = 'scale(1)'}
            >
              📐 VARILLA
            </button>
          )}

          {/* Ambos: Mostrar CORTES */}
          <button
            onClick={() => onCortes?.(producto)}
            style={{
              padding: '16px 12px',
              border: '2px solid ' + COLORS.warning,
              borderRadius: '10px',
              background: COLORS.warning,
              color: COLORS.white,
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              fontFamily: FONTS.heading,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            ✂️ CORTES
          </button>
        </div>

        <button
          onClick={onCancel}
          style={{
            width: '100%',
            padding: '12px',
            border: `2px solid ${COLORS.border}`,
            borderRadius: '10px',
            background: COLORS.light,
            color: COLORS.text,
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
            fontFamily: FONTS.heading
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ModalTipoProductoVidrio;
