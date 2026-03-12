import React, { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../colors';

const Remetro = ({ notificacion, onToast }) => {
  const [ancho, setAncho] = useState('');
  const [alto, setAlto] = useState('');
  const [serie, setSerie] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaServicio, setFechaServicio] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [cargando, setCargando] = useState(true);

  // Obtener cortes del cliente para extraer alto y ancho
  useEffect(() => {
    if (!notificacion) return;

    console.log('[REMETRO] Notificación recibida:', notificacion);

    const obtenerCortes = async () => {
      try {
        setCargando(true);
        
        // Extraer nombre o documento del cliente de la notificación
        const nombreCliente = notificacion?.nombre || '';
        
        console.log('[REMETRO] Buscando cortes para cliente:', nombreCliente);

        // Obtener todos los cortes y filtrar por cliente
        const response = await fetch(`/api/cortes/cliente?nombre=${encodeURIComponent(nombreCliente)}`);
        const data = await response.json();

        console.log('[REMETRO] Respuesta de cortes:', data);

        if (data.success && Array.isArray(data.cortes) && data.cortes.length > 0) {
          // Encontrar los valores máximos de ancho y alto
          let maxAncho = 0;
          let maxAlto = 0;

          data.cortes.forEach((corte) => {
            const anchoVal = parseFloat(corte.ancho_cm) || 0;
            const altoVal = parseFloat(corte.alto_cm) || 0;
            
            if (anchoVal > maxAncho) maxAncho = anchoVal;
            if (altoVal > maxAlto) maxAlto = altoVal;
          });

          console.log('[REMETRO] Máximas medidas extraídas:', { maxAncho, maxAlto });

          setAncho(String(maxAncho));
          setAlto(String(maxAlto));
          setDescripcion(notificacion.descripcion || 'Servicio técnico');
          setFechaServicio(notificacion.fecha || new Date().toISOString().split('T')[0]);
        } else {
          console.log('[REMETRO] Sin cortes encontrados');
          setDescripcion(notificacion.descripcion || 'Servicio técnico');
          setFechaServicio(notificacion.fecha || new Date().toISOString().split('T')[0]);
        }
      } catch (error) {
        console.error('[REMETRO] Error obteniendo cortes:', error);
        setDescripcion(notificacion.descripcion || '');
        setFechaServicio(notificacion.fecha || '');
        onToast && onToast('Error al cargar cortes del cliente', 'error');
      } finally {
        setCargando(false);
      }
    };

    obtenerCortes();
  }, [notificacion, onToast]);

  const handleGuardar = async () => {
    // Validar que hay datos
    if (!ancho || !alto) {
      onToast('Por favor completa ancho y alto', 'error');
      return;
    }

    try {
      // Obtener ID del personal
      const personalToken = localStorage.getItem('personalToken');
      const personalId = localStorage.getItem('personal_id');

      if (!personalId) {
        onToast('Error: No se encontró el ID del personal', 'error');
        return;
      }

      const response = await fetch('/api/progreso/guardar-remetro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(personalToken && { 'Authorization': `Bearer ${personalToken}` })
        },
        body: JSON.stringify({
          notificacion_id: notificacion?.id,
          personal_id: personalId,
          datos: {
            ancho_cm: parseFloat(ancho),
            alto_cm: parseFloat(alto),
            serie,
            descripcion,
            fecha_servicio: fechaServicio,
            ubicacion
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        onToast('✅ Medidas guardadas correctamente (25% completado)', 'success');
        console.log('Progreso REMETRO guardado:', data);
      } else {
        onToast(data.message || 'Error al guardar medidas', 'error');
        console.error('Error en respuesta:', data);
      }
    } catch (error) {
      console.error('Error guardando progreso REMETRO:', error);
      onToast('Error al guardar medidas: ' + error.message, 'error');
    }
  };

  return (
    <div>
      {/* Cabecera: Cliente - Barra de seguimiento - Fecha */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '16px', marginBottom: '20px', alignItems: 'end' }}>
        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 700, 
            marginBottom: 6,
            fontFamily: FONTS.heading,
            color: COLORS.text
          }}>CLIENTE</label>
          <input
            type="text"
            defaultValue={notificacion?.nombre || ''}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `2px solid ${COLORS.text}`,
              borderRadius: '4px',
              fontWeight: 500,
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.text
            }}
          />
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 700, 
            marginBottom: 8, 
            textAlign: 'center',
            fontFamily: FONTS.heading,
            color: COLORS.text
          }}>SEGUIMIENTO</label>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center', padding: '8px', border: `2px solid ${COLORS.border}`, borderRadius: '4px', background: COLORS.gray[50] }}>
            <div style={{ textAlign: 'center', fontSize: '24px' }}>🚚</div>
            <div style={{ textAlign: 'center', fontSize: '24px' }}>💼</div>
            <div style={{ textAlign: 'center', fontSize: '24px' }}>🚛</div>
            <div style={{ textAlign: 'center', fontSize: '24px' }}>🏠</div>
            <div style={{ textAlign: 'center', fontSize: '24px' }}>📋</div>
          </div>
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            fontSize: 13, 
            fontWeight: 700, 
            marginBottom: 6,
            fontFamily: FONTS.heading,
            color: COLORS.text
          }}>FECHA</label>
          <input
            type="text"
            defaultValue={notificacion?.fecha || new Date().toLocaleDateString('es-PE')}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `2px solid ${COLORS.text}`,
              borderRadius: '4px',
              fontWeight: 500,
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.text
            }}
          />
        </div>
      </div>

      {/* Layout principal: izquierda (rectángulo medidas) y derecha (descripción, fecha, ubicación) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Área de medidas - Rectángulo central */}
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 700, 
              marginBottom: 8,
              fontFamily: FONTS.heading,
              color: COLORS.text
            }}>SERIE</label>
            <select style={{ 
              padding: '8px 12px', 
              border: `1px solid ${COLORS.border}`, 
              borderRadius: '4px', 
              minWidth: '120px',
              fontFamily: FONTS.body,
              fontSize: 14,
              color: COLORS.text
            }}>
              <option value="">Seleccionar</option>
              <option value="A">Serie A</option>
              <option value="B">Serie B</option>
              <option value="C">Serie C</option>
            </select>
          </div>
          
          {/* Rectángulo con medidas */}
          <div style={{
            border: `2px solid ${COLORS.text}`,
            padding: '40px 20px',
            minHeight: '280px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: COLORS.backgroundLight
          }}>
            {/* Medida ANCHO - arriba centrado */}
            <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: 12, fontFamily: FONTS.heading, color: COLORS.text }}>ANCHO</span>
              <input
                type="text"
                value={ancho}
                onChange={(e) => setAncho(e.target.value)}
                placeholder="cm"
                style={{
                  width: '80px',
                  padding: '4px 8px',
                  border: `1px solid ${COLORS.text}`,
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontWeight: 500,
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: COLORS.text
                }}
              />
            </div>

            {/* Dibujo dinámico de rectángulo basado en medidas */}
            {(() => {
              // Valores por defecto si no hay medidas
              const anchoVal = parseFloat(ancho) || 100;
              const altoVal = parseFloat(alto) || 100;
              
              // Contenedor máximo (pixeles)
              const maxWidth = 260;
              const maxHeight = 140;
              
              // Calcular escala manteniendo proporción
              const ratio = anchoVal / altoVal;
              let rectWidth, rectHeight;
              
              if (ratio > maxWidth / maxHeight) {
                // Más ancho: limitar por ancho
                rectWidth = maxWidth;
                rectHeight = maxWidth / ratio;
              } else {
                // Más alto: limitar por alto
                rectHeight = maxHeight;
                rectWidth = maxHeight * ratio;
              }
              
              // Posición centrada
              const svgWidth = 300;
              const svgHeight = 180;
              const offsetX = (svgWidth - rectWidth) / 2;
              const offsetY = (svgHeight - rectHeight) / 2;
              
              // Coordenadas del rectángulo
              const x1 = offsetX;
              const y1 = offsetY;
              const x2 = offsetX + rectWidth;
              const y2 = offsetY + rectHeight;
              
              return (
                <svg width="300" height="180" style={{ maxWidth: '100%' }}>
                  {/* Líneas cruzadas dinámicas */}
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.gray[600]} strokeWidth="2" />
                  <line x1={x2} y1={y1} x2={x1} y2={y2} stroke={COLORS.gray[600]} strokeWidth="2" />
                  
                  {/* Rectángulo dinámico */}
                  <polyline points={`${x1},${y1} ${x2},${y1} ${x2},${y2} ${x1},${y2} ${x1},${y1}`} stroke={COLORS.text} strokeWidth="2" fill="none" />
                  
                  {/* Flechas horizontales */}
                  <line x1={x1 + rectWidth * 0.3} y1={offsetY + rectHeight / 2} x2={x1 + rectWidth * 0.15} y2={offsetY + rectHeight / 2} stroke={COLORS.text} strokeWidth="2" markerEnd="url(#arrowleft)" />
                  <line x1={x1 + rectWidth * 0.7} y1={offsetY + rectHeight / 2} x2={x1 + rectWidth * 0.85} y2={offsetY + rectHeight / 2} stroke={COLORS.text} strokeWidth="2" markerEnd="url(#arrowright)" />
                  
                  <defs>
                    <marker id="arrowleft" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                      <polygon points="10,5 0,0 0,10" fill={COLORS.text} />
                    </marker>
                    <marker id="arrowright" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                      <polygon points="0,5 10,0 10,10" fill={COLORS.text} />
                    </marker>
                  </defs>
                </svg>
              );
            })()}

            {/* Medida LARGO - abajo centrado */}
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: 12, fontFamily: FONTS.heading, color: COLORS.text }}>LARGO</span>
              <input
                type="text"
                value={alto}
                onChange={(e) => setAlto(e.target.value)}
                placeholder="cm"
                style={{
                  width: '80px',
                  padding: '4px 8px',
                  border: `1px solid ${COLORS.text}`,
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontWeight: 500,
                  fontFamily: FONTS.body,
                  fontSize: 12,
                  color: COLORS.text
                }}
              />
            </div>
          </div>
        </div>

        {/* Panel derecho: Descripción, Fecha realización, Ubicación */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 700, 
              marginBottom: 8,
              fontFamily: FONTS.heading,
              color: COLORS.text
            }}>DESCR</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del trabajo a realizar"
              rows="6"
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '4px',
                fontSize: 14,
                fontFamily: FONTS.body,
                resize: 'none',
                color: COLORS.text
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 700, 
              marginBottom: 8,
              fontFamily: FONTS.heading,
              color: COLORS.text
            }}>FECHA HA REALIZAR EL SERVICIO</label>
            <input
              value={fechaServicio}
              onChange={(e) => setFechaServicio(e.target.value)}
              type="date"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '4px',
                fontFamily: FONTS.body,
                fontSize: 14,
                color: COLORS.text
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              fontSize: 13, 
              fontWeight: 700, 
              marginBottom: 8,
              fontFamily: FONTS.heading,
              color: COLORS.text
            }}>UBICACION</label>
            <textarea
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder="Dirección o ubicación del servicio"
              rows="3"
              style={{
                width: '100%',
                padding: '8px',
                border: `1px solid ${COLORS.border}`,
                borderRadius: '4px',
                fontSize: 14,
                fontFamily: FONTS.body,
                resize: 'none',
                color: COLORS.text
              }}
            />
          </div>
        </div>
      </div>

      {/* Botón guardar */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          style={{
            background: COLORS.text,
            color: COLORS.white,
            border: `2px solid ${COLORS.text}`,
            borderRadius: '8px',
            padding: '10px 40px',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            textTransform: 'uppercase',
            fontFamily: FONTS.heading,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onClick={handleGuardar}
        >
          GUARDAR
        </button>
      </div>
    </div>
  );
};

export default Remetro;
