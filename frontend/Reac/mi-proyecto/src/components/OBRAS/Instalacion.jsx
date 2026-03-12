import React, { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../colors';

const Instalacion = ({ notificacion, onToast }) => {

  const [imagenes, setImagenes] = useState([]);
  const [fechaInstalacion, setFechaInstalacion] = useState(
    notificacion?.fechaInstalacion || ''
  );
  const [observaciones, setObservaciones] = useState(
    notificacion?.observaciones || ''
  );
  const [guardando, setGuardando] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFiles = (event) => {
    const newFiles = Array.from(event.target.files);
    setImagenes((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveImage = (index) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGuardar = async () => {
    try {
      setGuardando(true);

      if (!fechaInstalacion || !observaciones) {
        onToast('Por favor completa fecha de instalación y observaciones', 'error');
        return;
      }

      const personalToken = localStorage.getItem('personalToken');
      const personalId = localStorage.getItem('personal_id');

      if (!personalId) {
        onToast('Error: No se encontró el ID del personal', 'error');
        return;
      }

      const response = await fetch('/api/progreso/guardar-instalacion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(personalToken && { 'Authorization': `Bearer ${personalToken}` })
        },
        body: JSON.stringify({
          notificacion_id: notificacion?.id,
          personal_id: personalId,
          datos: {
            fecha_instalacion: fechaInstalacion,
            observaciones,
            cantidad_imagenes: imagenes.length,
            fotos_capturadas: imagenes.length > 0
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        onToast('✅ Instalación completada (100% finalizado)', 'success');
      } else {
        onToast(data.message || 'Error al guardar instalación', 'error');
      }

    } catch (error) {
      onToast('Error al guardar instalación: ' + error.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>

      <h3
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 16,
          fontFamily: FONTS.heading,
          color: COLORS.text
        }}
      >
        Instalación
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '24px',
          alignItems: 'start',
          marginBottom: '20px'
        }}
      >

        {/* FOTO */}
        <div>

          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 8,
              fontFamily: FONTS.heading,
              color: COLORS.text
            }}
          >
            FOTO DEL SERVICIO
          </label>

          <div
            style={{
              border: `2px solid ${COLORS.border}`,
              borderRadius: '6px',
              minHeight: isMobile ? '180px' : '260px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: COLORS.backgroundLight
            }}
          >

            {imagenes.length === 0 ? (
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer'
                }}
              >

                <span style={{ fontSize: 32 }}>📷</span>

                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  Subir imágenes
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFiles}
                  style={{ display: 'none' }}
                />

              </label>
            ) : (

              <div
                style={{
                  width: '100%',
                  padding: 10,
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? 'repeat(2,1fr)'
                    : 'repeat(auto-fill,minmax(100px,1fr))',
                  gap: 8
                }}
              >

                {imagenes.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: '6px',
                      padding: '6px',
                      fontSize: 10,
                      background: COLORS.white,
                      textAlign: 'center',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleRemoveImage(idx)}
                  >
                    <div style={{ fontSize: 16 }}>✕</div>
                    {file.name}
                  </div>
                ))}

              </div>

            )}

          </div>

        </div>


        {/* DATOS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div>

            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 8
              }}
            >
              Fecha de Instalación
            </label>

            <input
              type="date"
              value={fechaInstalacion}
              onChange={(e) => setFechaInstalacion(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '4px'
              }}
            />

          </div>

          <div>

            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 8
              }}
            >
              Observaciones de Instalación
            </label>

            <textarea
              placeholder="Detalles de la instalación"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows="6"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '4px',
                resize: 'none'
              }}
            />

          </div>

        </div>

      </div>


      {/* BOTON */}
      <button
        style={{
          width: isMobile ? '100%' : 'auto',
          background: COLORS.success,
          color: COLORS.white,
          border: 'none',
          borderRadius: '8px',
          padding: '10px 20px',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          opacity: guardando ? 0.6 : 1
        }}
        onClick={handleGuardar}
        disabled={guardando}
      >

        {guardando ? 'Guardando...' : 'Guardar'}

      </button>

    </div>
  );
};

export default Instalacion;