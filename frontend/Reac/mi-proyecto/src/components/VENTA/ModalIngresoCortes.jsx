import React, { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../colors';

/**
 * Modal/Panel para ingresar detalles de cortes
 * Campos dinámicos según tipo de producto:
 * - ALUMINIOS: Solo ancho O alto (una dimensión), sin espesor ni notas
 * - VIDRIOS: Ancho y alto, sin espesor ni notas
 */
const ModalIngresoCortes = ({ 
  producto,
  tipoProducto,    // 'ALUMINIOS' | 'VIDRIOS'
  cortesExistentes = null,  // Array de cortes existentes para editar
  onGuardarCorte,   // callback(corteData) - agrega a cotización
  onCancel 
}) => {
  const [cantidad, setCantidad] = useState(1);
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('');
  const [cortesAgregados, setCortesAgregados] = useState([]);

  // Pre-poblar cortes existentes cuando estamos editando
  useEffect(() => {
    if (cortesExistentes && Array.isArray(cortesExistentes)) {
      setCortesAgregados(cortesExistentes);
    }
  }, [cortesExistentes]);

  // Determinar tipo de producto (por defecto VIDRIOS)
  const esAluminio = tipoProducto === 'ALUMINIOS';
  const esVidrio = tipoProducto === 'VIDRIOS';

  const handleAgregarOtroCorte = () => {
    // Validación según tipo de producto
    if (esAluminio) {
      // ALUMINIO: Solo ancho
      if (!ancho) {
        alert('Por favor ingresa el ancho');
        return;
      }
    } else if (esVidrio) {
      // VIDRIO: Ancho y Alto
      if (!ancho || !alto) {
        alert('Por favor ingresa ancho y alto');
        return;
      }
    } else {
      // Otros: Ancho y Alto
      if (!ancho || !alto) {
        alert('Por favor ingresa ancho y alto');
        return;
      }
    }

    const nuevoCorte = {
      id: Date.now() + Math.random(),
      cantidad: Number(cantidad),
      ancho: esAluminio ? Number(ancho) : (ancho ? Number(ancho) : null),
      alto: esAluminio ? null : (alto ? Number(alto) : null),
      espesor: null,  // Sin espesor para ninguno
      observaciones: null  // Nunca se usa
    };

    setCortesAgregados([...cortesAgregados, nuevoCorte]);
    // Limpiar formulario
    setCantidad(1);
    setAncho('');
    setAlto('');
  };

  const handleEliminarCorte = (id) => {
    setCortesAgregados(cortesAgregados.filter(c => c.id !== id));
  };

  const handleGuardarTodosLosCortes = () => {
    if (cortesAgregados.length === 0) {
      alert('Agrega al menos un corte antes de guardar');
      return;
    }

    const corteData = {
      tipo_producto: 'CORTE',
      producto_original: {
        codigo: producto.codigo,
        nombre: producto.nombre,
        precio_unitario: producto.precio_unitario
      },
      cortes_detalles: cortesAgregados,  // Array de cortes
      total_cortes: cortesAgregados.length,
      // Cálculo: suma de todos los cortes
      precio_unitario: producto.precio_unitario,
      subtotal: cortesAgregados.reduce((sum, c) => sum + (c.cantidad * (producto.precio_unitario || 0)), 0)
    };

    onGuardarCorte?.(corteData);
  };

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
        maxWidth: '600px',
        width: '90%',
        fontFamily: FONTS.body,
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{
            fontFamily: FONTS.heading,
            fontSize: '1.6rem',
            color: COLORS.text,
            margin: 0
          }}>
            ✂️ Ingreso de Cortes {esAluminio ? '(ALUMINIO)' : esVidrio ? '(VIDRIO)' : ''}
          </h2>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: COLORS.textLight
            }}
          >
            ✕
          </button>
        </div>

        {/* Info producto */}
        <div style={{
          background: COLORS.lightBlue,
          padding: '16px',
          marginBottom: '24px'
            // ...existing code...
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: COLORS.text }}>
            Producto: {producto?.nombre}
          </p>
          <p style={{ margin: '0', color: COLORS.textLight, fontSize: '0.95rem' }}>
            Código: {producto?.codigo} | Precio base: S/ {(producto?.precio_unitario || 0).toFixed(2)}
          </p>
          {esAluminio && (
            <p style={{ margin: '8px 0 0 0', color: COLORS.text, fontSize: '0.9rem', fontWeight: 500 }}>
              📌 Ingresa solo el ancho
            </p>
          )}
          {esVidrio && (
            <p style={{ margin: '8px 0 0 0', color: COLORS.text, fontSize: '0.9rem', fontWeight: 500 }}>
              📌 Ingresa ancho y alto
            </p>
          )}
        </div>

        {/* Formulario */}
        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          
          {/* Cantidad */}
          <div>
            <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
              Cantidad de piezas de este corte
            </label>
            <input
              type="number"
              min="1"
              value={cantidad}
              onChange={e => setCantidad(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: `1px solid ${COLORS.border}`,
                fontFamily: FONTS.body,
                fontSize: '1rem'
              }}
            />
          </div>

          {/* ALUMINIO: Solo Ancho */}
          {esAluminio && (
            <div>
              <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
                Ancho (cm) *
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ej: 100"
                value={ancho}
                onChange={e => setAncho(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid ${COLORS.border}`,
                  fontFamily: FONTS.body,
                  fontSize: '1rem'
                }}
              />
            </div>
          )}

          {/* VIDRIO: Ancho, Alto (sin espesor) */}
          {esVidrio && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
                  Ancho (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 100"
                  value={ancho}
                  onChange={e => setAncho(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
                    fontFamily: FONTS.body,
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
                  Alto (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 50"
                  value={alto}
                  onChange={e => setAlto(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
                    fontFamily: FONTS.body,
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
          )}

          {/* OTROS: Ancho, Alto, Espesor */}
          {!esAluminio && !esVidrio && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
                  Ancho (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 100"
                  value={ancho}
                  onChange={e => setAncho(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
                    fontFamily: FONTS.body,
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
                  Alto (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 50"
                  value={alto}
                  onChange={e => setAlto(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
                    fontFamily: FONTS.body,
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontWeight: 600, fontSize: '0.95rem', color: COLORS.text, display: 'block', marginBottom: '6px' }}>
                  Espesor (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 6"
                  value={espesor}
                  onChange={e => setEspesor(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: `1px solid ${COLORS.border}`,
                    fontFamily: FONTS.body,
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
          )}

          {/* Botón agregar otro corte */}
          <button
            onClick={handleAgregarOtroCorte}
            style={{
              padding: '12px',
              background: COLORS.lightBlue,
              color: COLORS.primary,
              border: `2px solid ${COLORS.primary}`,
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              fontFamily: FONTS.heading
            }}
          >
            + Agregar otro corte
          </button>

        </div>

        {/* Lista de cortes agregados */}
        {cortesAgregados.length > 0 && (
          <div style={{
            background: COLORS.light,
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '24px',
            maxHeight: '250px',
            overflowY: 'auto'
          }}>
            <h4 style={{
              margin: '0 0 12px 0',
              fontFamily: FONTS.heading,
              color: COLORS.text,
              fontSize: '1rem'
            }}>
              📋 Cortes agregados ({cortesAgregados.length}):
            </h4>
            {cortesAgregados.map((corte, idx) => (
              <div key={corte.id + '-' + idx} style={{
                background: COLORS.white,
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: `1px solid ${COLORS.border}`
              }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: COLORS.text, fontSize: '0.95rem' }}>
                    Corte {idx + 1}: {corte.cantidad}x 
                    {esAluminio 
                      ? `(${corte.ancho}cm ancho)`
                      : esVidrio
                      ? `(${corte.ancho}cm x ${corte.alto}cm)`
                      : `(${corte.ancho}cm x ${corte.alto}cm)`
                    }
                  </p>
                </div>
                <button
                  onClick={() => handleEliminarCorte(corte.id)}
                  style={{
                    padding: '4px 10px',
                    background: COLORS.error,
                    color: COLORS.white,
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleGuardarTodosLosCortes}
            disabled={cortesAgregados.length === 0}
            style={{
              flex: 1,
              padding: '12px',
              background: cortesAgregados.length === 0 ? COLORS.textLight : COLORS.primary,
              color: COLORS.white,
              border: 'none',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: cortesAgregados.length === 0 ? 'not-allowed' : 'pointer',
              fontFamily: FONTS.heading,
              opacity: cortesAgregados.length === 0 ? 0.5 : 1
            }}
          >
            ✓ Guardar todos los cortes ({cortesAgregados.length})
          </button>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              background: COLORS.light,
              color: COLORS.text,
              border: `2px solid ${COLORS.border}`,
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              fontFamily: FONTS.heading
            }}
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalIngresoCortes;
