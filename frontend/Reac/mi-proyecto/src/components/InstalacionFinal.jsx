import React, { useState, useCallback } from 'react';
import { IconArrowLeft, IconUser, IconBell, IconFileTypePdf, IconUpload } from '@tabler/icons-react';
import { COLORS, FONTS } from '../colors';

const InstalacionFinal = ({ notificacion, onBack }) => {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const [descripcion, setDescripcion] = useState('');
  const [imagenes, setImagenes] = useState([]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    setImagenes(files);
    if (files.length > 0) {
      showToast(`${files.length} imagen(es) seleccionada(s)`);
    }
  };

  return (
    <div
      style={{
        padding: 24,
        fontFamily: FONTS.body,
        background: COLORS.backgroundLight,
        minHeight: '100vh',
        color: COLORS.text,
      }}
    >
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            padding: '12px 16px',
            borderRadius: 10,
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            color: COLORS.white,
            background: toast.tipo === 'success' ? COLORS.success : COLORS.error,
            fontWeight: 700,
            zIndex: 20,
          }}
        >
          {toast.mensaje}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: COLORS.text,
              color: COLORS.white,
              border: 'none',
              borderRadius: '10px',
              padding: '10px 14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
              fontFamily: FONTS.heading,
            }}
          >
            <IconArrowLeft stroke={1} size={20} />
            Atrás
          </button>
          <IconUser stroke={1} size={28} />
          <IconBell stroke={1} size={28} style={{ cursor: 'pointer' }} />
        </div>
        <IconFileTypePdf stroke={1} size={28} style={{ cursor: 'pointer' }} />
      </div>

      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 14, fontFamily: FONTS.heading, color: COLORS.text }}>
        ÁREA DE TRABAJO
      </h2>

      <div
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: '14px',
          padding: '20px',
          boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
          background: COLORS.white,
        }}
      >
        {/* Cabecera de pestañas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['REMETRO', 'REZO', 'PRODUCTOS', 'INSTALACIÓN'].map((tab) => (
            <div
              key={tab}
              style={{
                padding: '10px 16px',
                border: `1px solid ${COLORS.border}`,
                borderBottom: tab === 'INSTALACIÓN' ? `3px solid ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                borderRadius: '10px 10px 0 0',
                background: tab === 'INSTALACIÓN' ? COLORS.white : COLORS.backgroundLight,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'default',
                color: tab === 'INSTALACIÓN' ? COLORS.primary : COLORS.text,
                fontFamily: FONTS.heading,
              }}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* Cliente / fecha / seguimiento */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 1fr 1fr', gap: '12px', alignItems: 'end', marginBottom: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>CLIENTE</label>
            <input
              type="text"
              defaultValue={notificacion?.nombre || ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '10px',
                fontWeight: 700,
                fontFamily: FONTS.body,
                color: COLORS.text,
                background: COLORS.backgroundLight,
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>FECHA</label>
            <input
              type="date"
              defaultValue={notificacion?.fecha || ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '10px',
                fontWeight: 700,
                fontFamily: FONTS.body,
                color: COLORS.text,
                background: COLORS.backgroundLight,
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>INICIA</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 46,
                  height: 26,
                  borderRadius: 14,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.success,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: COLORS.white,
                    position: 'absolute',
                    top: 2,
                    right: 2
                  }}
                />
              </div>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: COLORS.text, textAlign: 'center' }}>SEGUIMIENTO</label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 22 }}>🚚</span>
              <span style={{ fontSize: 22 }}>💼</span>
              <span style={{ fontSize: 22 }}>🚛</span>
              <span style={{ fontSize: 22 }}>🏠</span>
              <span style={{ fontSize: 22 }}>📄</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start', marginBottom: '20px' }}>
          {/* Foto del servicio */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 800, marginBottom: 10, color: COLORS.text, fontFamily: FONTS.heading }}>
              FOTO DEL SERVICIO
            </label>
            <div
              style={{
                border: `1px dashed ${COLORS.border}`,
                borderRadius: '12px',
                minHeight: '260px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                background: COLORS.backgroundLight,
              }}
            >
              {imagenes.length === 0 ? (
                <label
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    color: COLORS.text,
                    fontFamily: FONTS.body,
                  }}
                >
                  <IconUpload stroke={1} size={36} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Subir imágenes</span>
                  <input type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: 'none' }} />
                </label>
              ) : (
                <div style={{ width: '100%', padding: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                  {imagenes.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      style={{
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: 11,
                        background: COLORS.white,
                        color: COLORS.text,
                      }}
                    >
                      {file.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 800, marginBottom: 10, color: COLORS.text, fontFamily: FONTS.heading }}>
              DESCRIPCIÓN
            </label>
            <textarea
              placeholder="Detalles de la instalación"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={12}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px',
                background: COLORS.backgroundLight,
                fontSize: '14px',
                fontFamily: FONTS.body,
                resize: 'vertical',
                color: COLORS.text,
              }}
            />
          </div>
        </div>

        {/* Ubicación mock y guardar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <button
            onClick={() => showToast('Datos de instalación guardados')}
            style={{
              background: COLORS.primary,
              color: COLORS.white,
              border: 'none',
              borderRadius: '12px',
              padding: '12px 32px',
              fontWeight: 800,
              fontSize: '15px',
              cursor: 'pointer',
              boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
              fontFamily: FONTS.heading,
            }}
          >
            GUARDAR
          </button>

          <div style={{ textAlign: 'right' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: COLORS.text }}>UBICACIÓN</label>
            <div
              style={{
                width: '120px',
                height: '90px',
                borderRadius: '12px',
                border: `1px solid ${COLORS.border}`,
                background: 'linear-gradient(135deg, #f5f7fb 0%, #eef2f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}
            >
              🗺️
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstalacionFinal;
