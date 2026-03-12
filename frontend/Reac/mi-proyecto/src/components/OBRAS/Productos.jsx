import { useState, useEffect, useRef } from 'react';
import { COLORS, FONTS } from '../../colors';

const Productos = ({ notificacion, onToast, showHeader = true, onFinalizarEntrega }) => {
  const [barras, setBarras] = useState([{ id: 1, nombre: 'Barra 1', medidas: [], info: { fila: 'A', columna: '3', stock: true } }]);
  const [cortes, setCortes] = useState([]);
  const [corteInputs, setCorteInputs] = useState({});
  const [cortesPorProducto, setCortesPorProducto] = useState([]);
  const [cargandoCortes, setCargandoCortes] = useState(false);
  const [selectedVidrio, setSelectedVidrio] = useState(null);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [finalizando, setFinalizando] = useState(false);
  const svgAluminioRef = useRef(null);
  const svgVidrioRef = useRef(null);

  useEffect(() => {
    const fetchCortes = async () => {
      if (!notificacion?.id) {
        return;
      }

      setCargandoCortes(true);
      try {
        const response = await fetch(`/api/cortes/notificacion/${notificacion.id}`);
        const data = await response.json();
        if (data.success) {
          setCortesPorProducto(Array.isArray(data.productos) ? data.productos : []);
        } else {
          onToast && onToast(data.error || 'Error al cargar cortes', 'error');
        }
      } catch (error) {
        onToast && onToast('Error al conectar con el servidor', 'error');
      } finally {
        setCargandoCortes(false);
      }
    };

    // Recuperar productos seleccionados del localStorage
    const productosGuardados = localStorage.getItem('productosSeleccionadosEntrega');
    if (productosGuardados) {
      try {
        setProductosSeleccionados(JSON.parse(productosGuardados));
      } catch (e) {
        console.error('Error al recuperar productos:', e);
      }
    }

    fetchCortes();
  }, [notificacion?.id, onToast]);

  const separarPorCategoria = (productos) => {
    const vidrios = [];
    const aluminios = [];

    (productos || []).forEach((producto) => {
      const categoria = (producto.categoria || '').toUpperCase();
      if (categoria.includes('ALUMIN')) {
        aluminios.push(producto);
      } else {
        vidrios.push(producto);
      }
    });

    return { vidrios, aluminios };
  };

  const { vidrios, aluminios } = separarPorCategoria(cortesPorProducto);

  const obtenerCortesAluminio = () => {
    return (aluminios || []).flatMap((producto) => {
      return (producto.cortes || []).map((corte) => {
        const valor = Number(corte.ancho_cm || corte.alto_cm || 0);
        return {
          ...corte,
          producto_nombre: producto.producto_nombre,
          largo_cm: Number.isFinite(valor) ? valor : 0
        };
      });
    });
  };

  const cortesAluminio = obtenerCortesAluminio();
  const largoBarraCm = 300;
  const totalUsadoCm = cortesAluminio.reduce((acc, corte) => acc + (corte.largo_cm || 0), 0);
  const porcentajeUsado = Math.min((totalUsadoCm / largoBarraCm) * 100, 100);
  const almacenFilaAluminio = cortesAluminio.length > 0 ? (cortesAluminio[0].producto_almacen_fila || '') : '';
  const almacenColumnaAluminio = cortesAluminio.length > 0 ? (cortesAluminio[0].producto_almacen_columna || '') : '';
  const vidrioPlanchaAncho = 300;
  const vidrioPlanchaAlto = 300;

  const obtenerCortesVidrio = () => {
    return (vidrios || []).flatMap((producto) => {
      return (producto.cortes || []).map((corte) => {
        const ancho = Number(corte.ancho_cm || 0);
        const alto = Number(corte.alto_cm || 0);
        return {
          ...corte,
          producto_nombre: producto.producto_nombre,
          ancho_cm: Number.isFinite(ancho) ? ancho : 0,
          alto_cm: Number.isFinite(alto) ? alto : 0,
          producto_almacen_fila: producto.producto_almacen_fila,
          producto_almacen_columna: producto.producto_almacen_columna
        };
      });
    });
  };

  const cortesVidrio = obtenerCortesVidrio();

  // Obtener vidrios únicos agrupados
  const obtenerVidriosUnicos = () => {
    const vidriosMap = new Map();
    cortesVidrio.forEach((corte) => {
      if (!vidriosMap.has(corte.producto_nombre)) {
        vidriosMap.set(corte.producto_nombre, {
          nombre: corte.producto_nombre,
          fila: corte.producto_almacen_fila,
          columna: corte.producto_almacen_columna,
          cortes: []
        });
      }
      vidriosMap.get(corte.producto_nombre).cortes.push(corte);
    });
    return Array.from(vidriosMap.values());
  };

  const vidriosUnicos = obtenerVidriosUnicos();

  // Inicializar selectedVidrio al cargar los vidrios
  useEffect(() => {
    if (vidriosUnicos.length > 0 && !selectedVidrio) {
      setSelectedVidrio(vidriosUnicos[0].nombre);
    }
  }, [vidriosUnicos]);

  // Obtener cortes del vidrio seleccionado
  const cortesVidrioSeleccionado = selectedVidrio 
    ? vidriosUnicos.find(v => v.nombre === selectedVidrio)?.cortes || [] 
    : [];

  const almacenFilaVidrio = selectedVidrio
    ? vidriosUnicos.find(v => v.nombre === selectedVidrio)?.fila || ''
    : '';
  const almacenColumnaVidrio = selectedVidrio
    ? vidriosUnicos.find(v => v.nombre === selectedVidrio)?.columna || ''
    : '';

  const calcularDistribucionVidrio = (cortesADistr = cortesVidrioSeleccionado) => {
    const piezas = cortesADistr
      .filter((corte) => corte.ancho_cm > 0 && corte.alto_cm > 0)
      .sort((a, b) => b.alto_cm - a.alto_cm);

    let x = 0;
    let y = 0;
    let altoFila = 0;
    const colocadas = [];

    piezas.forEach((pieza) => {
      if (pieza.ancho_cm > vidrioPlanchaAncho || pieza.alto_cm > vidrioPlanchaAlto) {
        return;
      }

      if (x + pieza.ancho_cm > vidrioPlanchaAncho) {
        y += altoFila;
        x = 0;
        altoFila = 0;
      }

      if (y + pieza.alto_cm > vidrioPlanchaAlto) {
        return;
      }

      colocadas.push({
        ...pieza,
        x,
        y
      });

      x += pieza.ancho_cm;
      altoFila = Math.max(altoFila, pieza.alto_cm);
    });

    return colocadas;
  };

  const handleAgregarBarra = () => {
    const newId = Math.max(...barras.map(b => b.id), 0) + 1;
    setBarras([...barras, { id: newId, nombre: `Barra ${newId}`, medidas: [], info: { fila: 'A', columna: '1', stock: false } }]);
  };

  const handleCorteInputChange = (barraId, value) => {
    setCorteInputs({
      ...corteInputs,
      [barraId]: value
    });
  };

  const handleAgregarCorte = (barraId) => {
    const value = corteInputs[barraId];
    if (value && !isNaN(value) && value > 0) {
      setCortes([...cortes, { barraId, largo: value }]);
      setCorteInputs({ ...corteInputs, [barraId]: '' });
    }
  };

  const generarReportePDF = async () => {
    try {
      // Convertir SVG a imagen PNG
      const svgToImage = (svgElement) => {
        if (!svgElement) return null;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const img = new Image();
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        return new Promise((resolve) => {
          img.onload = () => {
            canvas.width = svgElement.clientWidth;
            canvas.height = svgElement.clientHeight;
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/png'));
          };
          img.src = url;
        });
      };

      // Obtener imágenes
      const imgAluminio = await svgToImage(svgAluminioRef.current);
      const imgVidrio = await svgToImage(svgVidrioRef.current);

      // Preparar datos de productos y cortes
      const productosAluminio = aluminios.map(p => ({
        nombre: p.producto_nombre,
        cortes: (p.cortes || []).map(c => ({
          ancho: c.ancho_cm,
          alto: c.alto_cm,
          cantidad: 1
        }))
      }));

      const productosVidrio = vidriosUnicos.map(v => ({
        nombre: v.nombre,
        ubication: `Fila ${v.fila} / Col ${v.columna}`,
        cortes: v.cortes.map(c => ({
          ancho: c.ancho_cm,
          alto: c.alto_cm,
          cantidad: 1
        }))
      }));

      // Generar HTML del reporte
      const contenidoHTML = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reporte de Cortes - VIDRIOBRAS</title>
          <style>
            * { margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; }
            .container { max-width: 900px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #333; padding-bottom: 15px; }
            .header h1 { font-size: 24px; margin-bottom: 8px; }
            .header p { font-size: 12px; color: #666; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .section-title { font-size: 16px; font-weight: bold; background-color: #f0f0f0; padding: 10px; margin-bottom: 15px; border-left: 4px solid #cc0000; }
            .diagram { margin: 20px 0; text-align: center; }
            .diagram img { max-width: 100%; height: auto; border: 1px solid #ccc; }
            .diagraM-title { font-size: 13px; font-weight: bold; margin-bottom: 10px; color: #333; }
            .productos-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            .productos-table th, .productos-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .productos-table th { background-color: #333; color: white; font-weight: bold; }
            .productos-table tr:nth-child(even) { background-color: #f9f9f9; }
            .cortes-detail { margin-left: 30px; font-size: 11px; margin-top: 8px; }
            .corte-item { display: inline-block; margin-right: 15px; }
            .footer { text-align: center; font-size: 11px; color: #999; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; }
            .fecha { font-size: 12px; color: #666; margin-bottom: 12px; }
            @media print { body { margin: 0; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1>REPORTE DE ENTREGAS</h1>
              <p>VIDRIOBRAS - Gestión de Producción</p>
              <div class="fecha">Fecha: ${new Date().toLocaleDateString('es-ES')}</div>
            </div>

            <!-- Sección PRODUCTOS SELECCIONADOS -->
            <div class="section">
              <div class="section-title">📦 PRODUCTOS SELECCIONADOS</div>
              
              ${productosSeleccionados.length > 0 ? `
                <table class="productos-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Descripción</th>
                      <th>Código</th>
                      <th>Categoría</th>
                      <th>Cantidad</th>
                      <th>Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productosSeleccionados.map(p => `
                      <tr>
                        <td><strong>${p.nombre || '-'}</strong></td>
                        <td>${p.descripcion || '-'}</td>
                        <td>${p.codigo || '-'}</td>
                        <td>${p.categoria || '-'}</td>
                        <td>${p.cantidad_seleccionada || 1}</td>
                        <td>${p.fila && p.columna ? `Fila ${p.fila} / Col ${p.columna}` : '-'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p style="color: #999;">Sin productos seleccionados</p>'}
            </div>

            <!-- Sección ALUMINIOS -->
            <div class="section">
              <div class="section-title">📐 CORTES DE ALUMINIO</div>
              
              ${imgAluminio ? `
                <div class="diagram">
                  <div class="diagraM-title">Distribución de Aluminio en Barra de 300cm</div>
                  <img src="${imgAluminio}" alt="Diagrama de Aluminio">
                </div>
              ` : ''}

              ${productosAluminio.length > 0 ? `
                <table class="productos-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad Cortes</th>
                      <th>Detalles (Remetreo)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productosAluminio.map(p => `
                      <tr>
                        <td><strong>${p.nombre}</strong></td>
                        <td>${p.cortes.length}</td>
                        <td>
                          <div class="cortes-detail">
                            ${p.cortes.map((c, i) => `<span class="corte-item">${i + 1}. ${c.ancho}cm</span>`).join('')}
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p style="color: #999;">Sin cortes de aluminio registrados</p>'}
            </div>

            <!-- Sección VIDRIOS -->
            <div class="section">
              <div class="section-title">🔷 CORTES DE VIDRIO</div>
              
              ${imgVidrio ? `
                <div class="diagram">
                  <div class="diagraM-title">Distribución de Vidrio en Plancha 300×300cm</div>
                  <img src="${imgVidrio}" alt="Diagrama de Vidrio">
                </div>
              ` : ''}

              ${productosVidrio.length > 0 ? `
                <table class="productos-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Ubicación</th>
                      <th>Cantidad Cortes</th>
                      <th>Detalles (Remetreo)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productosVidrio.map(v => `
                      <tr>
                        <td><strong>${v.nombre}</strong></td>
                        <td>${v.ubication}</td>
                        <td>${v.cortes.length}</td>
                        <td>
                          <div class="cortes-detail">
                            ${v.cortes.map((c, i) => `<span class="corte-item">${i + 1}. ${c.ancho}×${c.alto}</span>`).join('')}
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              ` : '<p style="color: #999;">Sin cortes de vidrio registrados</p>'}
            </div>

            <!-- Footer -->
            <div class="footer">
              <p>&copy; 2026 VIDRIOBRAS - Sistema de Gestión de Entregas | Reporte Generado Automáticamente</p>
            </div>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 500);
            };
          </script>
        </body>
        </html>
      `;

      // Abrir en nueva ventana para impresión/PDF
      const ventana = window.open('', '_blank');
      ventana.document.write(contenidoHTML);
      ventana.document.close();

      // Retornar datos para finalización
      return {
        aluminios: productosAluminio,
        vidrios: productosVidrio,
        productos: productosSeleccionados, // Incluir productos seleccionados
        imgAluminio,
        imgVidrio
      };
    } catch (error) {
      console.error('Error generando PDF:', error);
      onToast && onToast('Error al generar el PDF', 'error');
      return null;
    }
  };

  const finalizarEntregaCompleta = async () => {
    if (finalizando) return;
    setFinalizando(true);

    try {
      // Generar PDF y obtener datos
      const datosCortes = await generarReportePDF();
      if (!datosCortes) {
        setFinalizando(false);
        return;
      }

      // Esperar a que el PDF se abra antes de enviar
      console.log('Esperando apertura de PDF...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Llamar al endpoint de finalización
      console.log('Enviando datos de finalización:', {
        notificacion_id: notificacion?.id,
        productos: datosCortes.productos?.length || 0,
        cortes: (datosCortes.aluminios?.length || 0) + (datosCortes.vidrios?.length || 0)
      });

      const response = await fetch('/api/entrega/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificacion_id: notificacion?.id,
          cortes_data: datosCortes
        })
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (data.success) {
        onToast && onToast('✅ Entrega completada correctamente', 'success');
        console.log('Entrega finalizada:', data.message);
        
        // Limpiar localStorage
        localStorage.removeItem('productosSeleccionadosEntrega');
        
        // Navegar de regreso después de completar
        if (onFinalizarEntrega) {
          console.log('Navegando de regreso...');
          setTimeout(() => {
            onFinalizarEntrega();
          }, 1000);
        }
      } else {
        onToast && onToast(data.message || 'Error al finalizar entrega', 'error');
        console.error('Error en respuesta:', data);
      }
    } catch (error) {
      console.error('Error finalizando entrega:', error);
      onToast && onToast('Error al finalizar la entrega: ' + error.message, 'error');
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, fontFamily: FONTS.heading, color: COLORS.text }}>Productos</h3>

      {showHeader && (
        <>
          {/* Header: Cliente - Seguimiento - Fecha */}
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
        </>
      )}

      {/* Layout dos columnas: Área con barras | Aluminios */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '16px', marginBottom: '20px' }}>
        {/* Columna izquierda: ALUMINIOS con cortes */}
        <div style={{ border: `2px solid ${COLORS.text}`, borderRadius: '8px', padding: '12px' }}>
          <h4 style={{ fontFamily: FONTS.heading, fontWeight: 700, marginBottom: 12, textAlign: 'center', fontSize: 14, color: COLORS.text }}>ALUMINIOS</h4>
          {barras.map((barra) => (
            <div key={barra.id} style={{ border: `1px solid ${COLORS.text}`, borderRadius: '4px', padding: '10px', marginBottom: '12px', backgroundColor: COLORS.backgroundLight }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, fontSize: '12px', color: COLORS.text }}>{barra.nombre}</span>
                <button
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                  title="Información de la barra"
                >
                  ℹ️
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: 11 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: FONTS.heading, color: COLORS.text }}>FILA</label>
                  <select
                    value={almacenFilaAluminio}
                    onChange={() => {}}
                    style={{ width: '100%', padding: '4px', border: `1px solid ${COLORS.border}`, borderRadius: '4px', fontSize: 10, fontFamily: FONTS.body, color: COLORS.text }}
                  >
                    <option value=""></option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: FONTS.heading, color: COLORS.text }}>COLUMNA</label>
                  <select
                    value={almacenColumnaAluminio}
                    onChange={() => {}}
                    style={{ width: '100%', padding: '4px', border: `1px solid ${COLORS.border}`, borderRadius: '4px', fontSize: 10, fontFamily: FONTS.body, color: COLORS.text }}
                  >
                    <option value=""></option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: 11, gap: 8, fontFamily: FONTS.body, color: COLORS.text }}>
                  <input type="checkbox" defaultChecked={barra.info.stock} />
                  <span>SI HAY EN STOCK</span>
                </label>
              </div>

              {/* Medidas de Aluminio - SIMPLE */}
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: FONTS.heading, color: COLORS.text }}>MEDIDAS (cm)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    placeholder="Largo"
                    defaultValue={barra.medidas[0] || ''}
                    onChange={(e) => {
                      const nuevasBarras = barras.map(b => 
                        b.id === barra.id 
                          ? { ...b, medidas: [parseFloat(e.target.value) || 0, b.medidas[1] || 0] }
                          : b
                      );
                      setBarras(nuevasBarras);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      border: `1px solid ${COLORS.text}`,
                      borderRadius: '4px',
                      fontSize: 10,
                      fontFamily: FONTS.body,
                      color: COLORS.text
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Ancho"
                    defaultValue={barra.medidas[1] || ''}
                    onChange={(e) => {
                      const nuevasBarras = barras.map(b => 
                        b.id === barra.id 
                          ? { ...b, medidas: [b.medidas[0] || 0, parseFloat(e.target.value) || 0] }
                          : b
                      );
                      setBarras(nuevasBarras);
                    }}
                    style={{
                      flex: 1,
                      padding: '6px',
                      border: `1px solid ${COLORS.text}`,
                      borderRadius: '4px',
                      fontSize: 10,
                      fontFamily: FONTS.body,
                      color: COLORS.text
                    }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px', color: COLORS.text }}>Barra 300 cm</div>
                
                {/* SVG Visualización Aluminio */}
                {cortesAluminio.length > 0 ? (
                  <svg 
                    ref={svgAluminioRef}
                    width="100%" 
                    height="50" 
                    viewBox="0 0 300 50" 
                    style={{ border: `1px solid ${COLORS.text}`, borderRadius: '4px', background: COLORS.gray[200], marginBottom: '8px' }}
                  >
                    {/* Barra base */}
                    <rect x="10" y="15" width="280" height="20" fill={COLORS.gray[300]} stroke={COLORS.text} strokeWidth="1" />
                    
                    {/* Cortes */}
                    {(() => {
                      let xPos = 10;
                      const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
                      return cortesAluminio.map((corte, idx) => {
                        const width = (corte.largo_cm / largoBarraCm) * 280;
                        const color = colors[idx % colors.length];
                        const result = (
                          <g key={`${corte.id_corte || corte.id || idx}`}>
                            <rect 
                              x={xPos} 
                              y="15" 
                              width={width} 
                              height="20" 
                              fill={color} 
                              stroke={COLORS.text} 
                              strokeWidth="1" 
                              opacity="0.8"
                            />
                            {width > 25 && (
                              <text 
                                x={xPos + width / 2} 
                                y="28" 
                                fontSize="10" 
                                fill={COLORS.white} 
                                textAnchor="middle"
                                fontWeight="bold"
                              >
                                {corte.largo_cm}cm
                              </text>
                            )}
                          </g>
                        );
                        xPos += width;
                        return result;
                      });
                    })()}
                    
                    {/* Escala */}
                    <text x="10" y="50" fontSize="9" fill={COLORS.text}>0</text>
                    <text x="285" y="50" fontSize="9" fill={COLORS.text}>300</text>
                  </svg>
                ) : (
                  <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '6px', padding: '8px', background: COLORS.border, marginBottom: '8px' }}>
                    <div style={{ fontSize: '11px', color: COLORS.textLight }}>Sin cortes de aluminio</div>
                  </div>
                )}

                {/* Información adicional */}
                <div style={{ border: `1px solid ${COLORS.text}`, borderRadius: '6px', padding: '8px', background: COLORS.border }}>
                  <div style={{ width: '100%', height: '18px', background: '#e2e8f0', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ width: `${porcentajeUsado}%`, height: '100%', background: COLORS.info }} />
                    <div style={{ position: 'absolute', top: '2px', left: '8px', fontSize: '10px', fontWeight: 600, color: COLORS.text }}>0 cm</div>
                    <div style={{ position: 'absolute', top: '2px', right: '8px', fontSize: '10px', fontWeight: 600, color: COLORS.text }}>{largoBarraCm} cm</div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px', color: COLORS.text }}>
                    Usado: {totalUsadoCm} cm de {largoBarraCm} cm
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '11px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px', color: COLORS.text }}>Cortes:</div>
                    {cargandoCortes ? (
                      <div style={{ color: COLORS.textLight }}>Cargando cortes...</div>
                    ) : cortesAluminio.length === 0 ? (
                      <div style={{ color: COLORS.textLight }}>Sin cortes de aluminio</div>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {cortesAluminio.map((corte, idx) => (
                          <span key={`${corte.id_corte || idx}`} style={{ background: COLORS.info, border: `1px solid ${COLORS.border}`, borderRadius: '12px', padding: '4px 8px', fontSize: '10px', color: COLORS.white }}>
                            {corte.largo_cm} cm
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={handleAgregarBarra}
            style={{
              width: '100%',
              background: COLORS.success,
              color: COLORS.white,
              border: 'none',
              borderRadius: '4px',
              padding: '8px',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: FONTS.heading
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span> Agregar Barra
          </button>
        </div>

        {/* Columna derecha: VIDRIO / Plancha con área de corte */}
        <div>
          <div style={{ border: `2px solid ${COLORS.text}`, borderRadius: '4px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: 13, color: COLORS.text }}>VIDRIO</h4>
              
              {/* Selector de Planchas */}
              {vidriosUnicos.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, fontWeight: 600, fontFamily: FONTS.body, color: COLORS.textLight }}>PLANCHA:</span>
                  <select
                    value={selectedVidrio || ''}
                    onChange={(e) => setSelectedVidrio(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 10,
                      fontFamily: FONTS.body,
                      fontWeight: 600,
                      border: `1px solid ${COLORS.text}`,
                      borderRadius: '3px',
                      backgroundColor: COLORS.white,
                      color: COLORS.text,
                      cursor: 'pointer',
                      maxWidth: '120px'
                    }}
                  >
                    {vidriosUnicos.map((vidrio, idx) => (
                      <option key={vidrio.nombre} value={vidrio.nombre}>
                        {idx + 1}. {vidrio.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Nombre y ubicación del producto */}
            {cortesVidrioSeleccionado.length > 0 && (
              <div style={{ marginBottom: '12px', padding: '8px', background: COLORS.gray[100], borderRadius: '4px', borderLeft: `3px solid ${COLORS.info}` }}>
                <div style={{ fontSize: 11, fontWeight: 600, fontFamily: FONTS.heading, color: COLORS.text }}>
                  {selectedVidrio || 'Producto'}
                </div>
                <div style={{ fontSize: 10, fontFamily: FONTS.body, color: COLORS.textLight, marginTop: '4px' }}>
                  📍 Ubicación: Fila {almacenFilaVidrio || '-'} / Col {almacenColumnaVidrio || '-'}
                </div>
              </div>
            )}

            {/* Área de medidas - SIMPLE */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4, fontFamily: FONTS.heading, color: COLORS.text }}>MEDIDAS (cm)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Ancho"
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: `1px solid ${COLORS.text}`,
                    borderRadius: '4px',
                    fontSize: 10,
                    fontFamily: FONTS.body,
                    color: COLORS.text
                  }}
                />
                <input
                  type="number"
                  placeholder="Alto"
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: `1px solid ${COLORS.text}`,
                    borderRadius: '4px',
                    fontSize: 10,
                    fontFamily: FONTS.body,
                    color: COLORS.text
                  }}
                />
              </div>
            </div>

            {/* Área de corte visual - Plancha 3m x 3m */}
            <div style={{
              border: `2px solid ${COLORS.text}`,
              backgroundColor: COLORS.border,
              minHeight: '280px',
              position: 'relative',
              borderRadius: '4px',
              padding: '8px'
            }}>
              <div style={{ fontSize: '9px', fontWeight: 600, marginBottom: '4px', textAlign: 'center', color: COLORS.text }}>
                PLANCHA {vidrioPlanchaAncho}cm × {vidrioPlanchaAlto}cm
              </div>
              {cortesVidrioSeleccionado.length === 0 ? (
                <div style={{ textAlign: 'center', color: COLORS.textLight, fontSize: 11, padding: '24px 0' }}>
                  Sin cortes de vidrio
                </div>
              ) : (
                <svg 
                  ref={svgVidrioRef}
                  width="100%" 
                  height="260" 
                  viewBox={`0 0 ${vidrioPlanchaAncho} ${vidrioPlanchaAlto}`} 
                  style={{ border: `1px solid ${COLORS.text}` }}
                >
                  <rect x="0" y="0" width={vidrioPlanchaAncho} height={vidrioPlanchaAlto} fill={COLORS.gray[300]} stroke={COLORS.text} strokeWidth="2" />
                  {calcularDistribucionVidrio().map((corte, idx) => (
                    <g key={`${corte.id_corte || idx}`}>
                      <rect
                        x={corte.x}
                        y={corte.y}
                        width={corte.ancho_cm}
                        height={corte.alto_cm}
                        fill={COLORS.gray[500]}
                        stroke={COLORS.text}
                        strokeWidth="1"
                        opacity="0.75"
                      />
                      <text
                        x={corte.x + 4}
                        y={corte.y + 12}
                        fontSize="10"
                        fill={COLORS.text}
                      >
                        {corte.ancho_cm}×{corte.alto_cm}
                      </text>
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </div>

          {/* Ubicación */}
          <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '4px', padding: '8px', fontSize: 10, backgroundColor: COLORS.backgroundLight }}>
            <label style={{ display: 'block', fontWeight: 700, marginBottom: 4, fontFamily: FONTS.heading, color: COLORS.text }}>UBICACION</label>
            <div style={{ width: '100%', height: '60px', backgroundColor: COLORS.border, borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontFamily: FONTS.body, color: COLORS.text }}>
                {almacenFilaVidrio || almacenColumnaVidrio ? `Fila ${almacenFilaVidrio || '-'} / Col ${almacenColumnaVidrio || '-'}` : 'Sin ubicacion'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Botón guardar */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          disabled={finalizando}
          style={{
            background: finalizando ? COLORS.gray[400] : COLORS.text,
            color: COLORS.white,
            border: `2px solid ${finalizando ? COLORS.gray[400] : COLORS.text}`,
            borderRadius: '8px',
            padding: '10px 40px',
            fontWeight: 700,
            fontSize: 14,
            cursor: finalizando ? 'not-allowed' : 'pointer',
            textTransform: 'uppercase',
            fontFamily: FONTS.heading,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            opacity: finalizando ? 0.6 : 1
          }}
          onClick={finalizarEntregaCompleta}
        >
          {finalizando ? 'FINALIZANDO...' : 'GUARDAR'}
        </button>
      </div>
    </div>
  );
};

export default Productos;
