import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../colors';
import { construirReporteEntrega } from '../../utils/entregaReporte';

const TOLERANCIA_CM = 30;

const Retazo = ({ notificacion, onToast, onGuardarSuccess, showHeader = true, tipoNotificacion = 'SERVICIO' }) => {
  const [cargando, setCargando] = useState(true);
  const [cortes, setCortes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [carritoId, setCarritoId] = useState('');
  const [mermaCache, setMermaCache] = useState({});
  const [mermaCargando, setMermaCargando] = useState(false);
  const [cortesSeleccionados, setCortesSeleccionados] = useState({});
  const [mermasSeleccionadas, setMermasSeleccionadas] = useState({});
  const [guardando, setGuardando] = useState(false);
  
  // Estados para búsqueda de merma manual (solo SERVICIO)
  const [anchoBusqueda, setAnchoBusqueda] = useState('');
  const [altoBusqueda, setAltoBusqueda] = useState('');
  const [toleranciaBusqueda, setToleranciaBusqueda] = useState('10');
  const [mermasBusqueda, setMermasBusqueda] = useState([]);
  const [buscandoMermaManual, setBuscandoMermaManual] = useState(false);

  // Obtener cortes del cliente desde la API
  useEffect(() => {
    const fetchCortes = async () => {
      console.log('[RETAZO] Notificación recibida:', notificacion);
      
      if (!notificacion?.id) {
        console.error('[RETAZO] No hay ID en notificación:', notificacion);
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        console.log('[RETAZO] Obteniendo cortes para notificacion ID:', notificacion.id);
        
        const response = await fetch(`/api/cortes/notificacion/${notificacion.id}`);
        const data = await response.json();

        if (data.success) {
          console.log('[RETAZO] Cortes recibidos:', data);
          setCortes(data.productos || []);
          setClienteId(data.cliente_id || '');
          setCarritoId(data.carrito_id || '');
          if (!Array.isArray(data.productos) || data.productos.length === 0) {
            onToast && onToast(data.message || 'El cliente no agregó cortes', 'success');
          }
        } else {
          const msg = data.message || data.error || 'Error al cargar cortes';
          console.error('[RETAZO] Error al obtener cortes:', msg);
          onToast && onToast(msg, 'error');
        }
      } catch (error) {
        console.error('[RETAZO] Error en fetch:', error);
        onToast && onToast('Error al conectar con el servidor', 'error');
      } finally {
        setCargando(false);
      }
    };

    fetchCortes();
  }, [notificacion?.id, onToast]);

  // Búsqueda automática de mermas para ENTREGA
  useEffect(() => {
    if (tipoNotificacion === 'ENTREGA' && cortes.length > 0 && !cargando) {
      console.log('[RETAZO] Ejecutando búsqueda automática de mermas para ENTREGA');
      buscarMermaAutomatica(cortes);
    }
  }, [tipoNotificacion, cortes, cargando]);

  useEffect(() => {
    const categoriaIds = [...new Set((cortes || [])
      .map((prod) => prod.categoria_id)
      .filter(Boolean))];

    const pendientes = categoriaIds.filter((id) => !mermaCache[id]);
    if (pendientes.length === 0) {
      return;
    }

    let cancelado = false;

    const fetchMermas = async () => {
      setMermaCargando(true);
      try {
        await Promise.all(pendientes.map(async (categoriaId) => {
          const response = await fetch(`/api/merma/categoria/${categoriaId}`);
          const data = await response.json();
          if (!cancelado) {
            if (data.success) {
              setMermaCache((prev) => ({
                ...prev,
                [categoriaId]: Array.isArray(data.data) ? data.data : []
              }));
            } else {
              onToast && onToast(data.message || 'Error al cargar mermas', 'error');
            }
          }
        }));
      } catch (error) {
        if (!cancelado) {
          console.error('[RETAZO] Error al cargar mermas:', error);
          onToast && onToast('Error al conectar con el servidor', 'error');
        }
      } finally {
        if (!cancelado) {
          setMermaCargando(false);
        }
      }
    };

    fetchMermas();
    return () => {
      cancelado = true;
    };
  }, [cortes, mermaCache, onToast]);

  const normalizarNumero = (valor) => {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
  };

  const coincideConCorte = (corte, merma) => {
    const anchoCorte = normalizarNumero(corte.ancho_cm);
    const altoCorte = normalizarNumero(corte.alto_cm);
    const anchoMerma = normalizarNumero(merma.ancho_cm);
    const altoMerma = normalizarNumero(merma.alto_cm);

    const coincideDirecto =
      Math.abs(anchoMerma - anchoCorte) <= TOLERANCIA_CM &&
      Math.abs(altoMerma - altoCorte) <= TOLERANCIA_CM;

    const coincideInvertido =
      Math.abs(anchoMerma - altoCorte) <= TOLERANCIA_CM &&
      Math.abs(altoMerma - anchoCorte) <= TOLERANCIA_CM;

    return coincideDirecto || coincideInvertido;
  };

  const obtenerDescripcionMerma = (merma) => {
    return merma['descripción'] || merma.descripcion || '';
  };

  const obtenerMermasCoincidentes = (producto) => {
    const mermas = mermaCache[producto.categoria_id] || [];
    const cortesProducto = producto.cortes || [];

    return mermas
      .map((merma) => {
        const corteMatch = cortesProducto.find((corte) => coincideConCorte(corte, merma));
        if (!corteMatch) {
          return null;
        }
        return {
          ...merma,
          _corteMatch: corteMatch
        };
      })
      .filter(Boolean);
  };

  const hayMermasCoincidentes = () => {
    return (cortes || []).some((producto) => obtenerMermasCoincidentes(producto).length > 0);
  };

  const obtenerPlanchaPorCorte = () => {
    const productosSinMerma = (cortes || [])
      .filter((producto) => obtenerMermasCoincidentes(producto).length === 0)
      .map((producto) => ({
        producto_id: producto.producto_id,
        producto_nombre: producto.producto_nombre,
        producto_codigo: producto.producto_codigo,
        producto_descripcion: producto.producto_descripcion || '',
        categoria_id: producto.categoria_id,
        categoria: producto.categoria,
        cantidad: 1
      }))
      .filter((producto) => producto.producto_id);

    const vistos = new Set();
    return productosSinMerma.filter((producto) => {
      if (vistos.has(producto.producto_id)) {
        return false;
      }
      vistos.add(producto.producto_id);
      return true;
    });
  };

  const toggleCorteSeleccionado = (producto, corte) => {
    setCortesSeleccionados((prev) => {
      const existe = Boolean(prev[corte.id_corte]);
      if (existe) {
        const copia = { ...prev };
        delete copia[corte.id_corte];
        return copia;
      }

      return {
        ...prev,
        [corte.id_corte]: {
          ...corte,
          producto_id: producto.producto_id,
          producto_nombre: producto.producto_nombre,
          producto_codigo: producto.producto_codigo,
          producto_descripcion: producto.producto_descripcion || '',
          categoria_id: producto.categoria_id,
          categoria: producto.categoria
        }
      };
    });
  };

  const toggleMermaSeleccionada = (merma) => {
    setMermasSeleccionadas((prev) => {
      const existe = Boolean(prev[merma.id_merma]);
      if (existe) {
        const copia = { ...prev };
        delete copia[merma.id_merma];
        return copia;
      }

      return {
        ...prev,
        [merma.id_merma]: {
          ...merma,
          descripcion: obtenerDescripcionMerma(merma)
        }
      };
    });
  };

  const recalcularProducto = (producto) => {
    const cortesFiltrados = (producto.cortes || []).filter((corte) => !cortesSeleccionados[corte.id_corte]);
    const totalCortes = cortesFiltrados.reduce((acc, corte) => acc + (corte.cantidad || 0), 0);
    const areaTotal = cortesFiltrados.reduce((acc, corte) => acc + (corte.area_m2 || 0) * (corte.cantidad || 0), 0);

    return {
      ...producto,
      cortes: cortesFiltrados,
      total_cortes: totalCortes,
      area_total_m2: Number.isFinite(areaTotal) ? Number(areaTotal.toFixed(4)) : 0
    };
  };

  const limpiarSeleccion = () => {
    setCortesSeleccionados({});
    setMermasSeleccionadas({});
  };

  const buscarMermaManual = async () => {
    if (!anchoBusqueda || !altoBusqueda) {
      onToast && onToast('Ingrese ancho y alto para buscar merma', 'error');
      return;
    }

    try {
      setBuscandoMermaManual(true);
      const tolerancia = toleranciaBusqueda || '10';
      
      console.log('[RETAZO] Buscando merma manual:', { ancho: anchoBusqueda, alto: altoBusqueda, tolerancia });
      
      const response = await fetch(`/api/merma/buscar?ancho=${anchoBusqueda}&alto=${altoBusqueda}&tolerancia=${tolerancia}`);
      const data = await response.json();
      
      console.log('[RETAZO] Mermas encontradas:', data);
      
      if (data.success) {
        setMermasBusqueda(data.mermas || []);
        onToast && onToast(`Se encontraron ${data.total} mermas disponibles`, 'success');
      } else {
        setMermasBusqueda([]);
        onToast && onToast(data.message || 'Error al buscar merma', 'error');
      }
    } catch (error) {
      console.error('[RETAZO] Error buscando merma:', error);
      setMermasBusqueda([]);
      onToast && onToast('Error al buscar merma disponible', 'error');
    } finally {
      setBuscandoMermaManual(false);
    }
  };

  // Búsqueda automática de merma para ENTREGA (busca por todos los cortes del cliente)
  const buscarMermaAutomatica = async (cortesCliente) => {
    if (!cortesCliente || cortesCliente.length === 0) {
      console.log('[RETAZO] No hay cortes para buscar merma automática');
      return;
    }

    try {
      console.log('[RETAZO] Iniciando búsqueda automática de mermas para ENTREGA');
      setBuscandoMermaManual(true);

      // Obtener dimensiones únicas de todos los cortes
      const dimensiones = new Set();
      cortesCliente.forEach(producto => {
        (producto.cortes || []).forEach(corte => {
          const ancho = parseFloat(corte.ancho_cm) || 0;
          const alto = parseFloat(corte.alto_cm) || 0;
          if (ancho > 0 && alto > 0) {
            dimensiones.add(`${ancho}x${alto}`);
          }
        });
      });

      console.log('[RETAZO] Dimensiones únicas a buscar:', Array.from(dimensiones));

      // Buscar mermas para cada dimensión única
      const todasLasMermas = [];
      for (const dim of dimensiones) {
        const [ancho, alto] = dim.split('x');
        try {
          const response = await fetch(`/api/merma/buscar?ancho=${ancho}&alto=${alto}&tolerancia=10`);
          const data = await response.json();
          if (data.success && data.mermas) {
            todasLasMermas.push(...data.mermas);
          }
        } catch (err) {
          console.error(`[RETAZO] Error buscando merma para ${dim}:`, err);
        }
      }

      // Eliminar duplicados por id_merma
      const mermasUnicas = Array.from(
        new Map(todasLasMermas.map(m => [m.id_merma, m])).values()
      );

      console.log('[RETAZO] Mermas encontradas automáticamente:', mermasUnicas.length);
      setMermasBusqueda(mermasUnicas);
      
      if (mermasUnicas.length > 0) {
        onToast && onToast(`Se encontraron ${mermasUnicas.length} mermas automáticamente`, 'success');
      }
    } catch (error) {
      console.error('[RETAZO] Error en búsqueda automática:', error);
    } finally {
      setBuscandoMermaManual(false);
    }
  };

  // Toggle selección de mermas desde búsqueda
  const toggleMermaBusqueda = (merma) => {
    setMermasSeleccionadas(prev => {
      const nuevo = { ...prev };
      if (nuevo[merma.id_merma]) {
        delete nuevo[merma.id_merma];
      } else {
        nuevo[merma.id_merma] = merma;
      }
      return nuevo;
    });
  };

  const guardarProgresoRetazo = async (cortesSeleccionadosData, mermasSeleccionadasData) => {
    try {
      const personalToken = localStorage.getItem('personalToken');
      const personalId = localStorage.getItem('personal_id');

      if (!personalId) {
        onToast('Error: No se encontró el ID del personal', 'error');
        return false;
      }

      const response = await fetch('/api/progreso/guardar-retazo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(personalToken && { 'Authorization': `Bearer ${personalToken}` })
        },
        body: JSON.stringify({
          notificacion_id: notificacion?.id,
          personal_id: personalId,
          datos: {
            cortes_seleccionados: Object.values(cortesSeleccionadosData),
            mermas_seleccionadas: Object.values(mermasSeleccionadasData),
            total_cortes: Object.keys(cortesSeleccionadosData).length,
            total_mermas: Object.keys(mermasSeleccionadasData).length
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        onToast('✅ Materiales guardados correctamente (50% completado)', 'success');
        console.log('Progreso RETAZO guardado:', data);
        return true;
      } else {
        onToast(data.message || 'Error al guardar progreso RETAZO', 'error');
        console.error('Error en respuesta:', data);
        return false;
      }
    } catch (error) {
      console.error('Error guardando progreso RETAZO:', error);
      onToast('Error al guardar materiales: ' + error.message, 'error');
      return false;
    }
  };

  const handleGuardar = async () => {
    const idsCortes = Object.keys(cortesSeleccionados);
    const idsMermas = Object.keys(mermasSeleccionadas);

    if (idsCortes.length === 0 && idsMermas.length === 0) {
      if (!mermaCargando && !hayMermasCoincidentes()) {
        const planchaPorCorte = obtenerPlanchaPorCorte();
        const reporteSinMerma = construirReporteEntrega({
          notificacion,
          clienteNombre: notificacion?.nombre || '',
          fecha: notificacion?.fecha || new Date().toLocaleDateString('es-PE'),
          planchaPorCorte
        });

        const resReporte = await fetch('/api/entrega/reporte-temp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reporteSinMerma)
        });
        const dataReporte = await resReporte.json();
        if (!dataReporte.success) {
          onToast && onToast(dataReporte.message || 'Error al guardar reporte', 'error');
          return;
        }

        onToast && onToast('No hay mermas para seleccionar, continuando', 'success');
        onGuardarSuccess && onGuardarSuccess();
        return;
      }

      onToast && onToast('Selecciona cortes o mermas para guardar', 'error');
      return;
    }

    setGuardando(true);
    try {
      // Primero guardar el progreso RETAZO
      const progresoGuardado = await guardarProgresoRetazo(cortesSeleccionados, mermasSeleccionadas);
      if (!progresoGuardado) {
        setGuardando(false);
        return;
      }

      const solicitudes = [
        idsCortes.length
          ? fetch('/api/cortes/eliminar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: idsCortes })
            })
          : Promise.resolve(null),
        idsMermas.length
          ? fetch('/api/merma/eliminar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: idsMermas })
            })
          : Promise.resolve(null)
      ];

      const [resCortes, resMermas] = await Promise.all(solicitudes);
      const dataCortes = resCortes ? await resCortes.json() : { success: true };
      const dataMermas = resMermas ? await resMermas.json() : { success: true };

      if (!dataCortes.success || !dataMermas.success) {
        onToast && onToast('Error al guardar la entrega', 'error');
        return;
      }

      setCortes((prev) => prev
        .map((producto) => recalcularProducto(producto))
        .filter((producto) => (producto.cortes || []).length > 0));

      setMermaCache((prev) => {
        const nuevo = { ...prev };
        Object.keys(nuevo).forEach((categoriaId) => {
          nuevo[categoriaId] = (nuevo[categoriaId] || []).filter(
            (merma) => !mermasSeleccionadas[merma.id_merma]
          );
        });
        return nuevo;
      });

      const reporte = construirReporteEntrega({
        notificacion,
        clienteNombre: notificacion?.nombre || '',
        fecha: notificacion?.fecha || new Date().toLocaleDateString('es-PE'),
        cortes: Object.values(cortesSeleccionados),
        mermas: Object.values(mermasSeleccionadas),
        planchaPorCorte: obtenerPlanchaPorCorte()
      });

      const resReporte = await fetch('/api/entrega/reporte-temp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reporte)
      });
      const dataReporte = await resReporte.json();
      if (!dataReporte.success) {
        onToast && onToast(dataReporte.message || 'Error al guardar reporte', 'error');
        return;
      }

      limpiarSeleccion();
      onToast && onToast('Entrega guardada', 'success');
      onGuardarSuccess && onGuardarSuccess();
    } catch (error) {
      console.error('[RETAZO] Error al guardar:', error);
      onToast && onToast('Error al guardar la entrega', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      {showHeader && (
        <>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, fontFamily: FONTS.heading, color: COLORS.text }}>Cortes Solicitados</h3>

          {/* Header: Cliente - Seguimiento - Fecha */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '24px' }}>
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
                marginBottom: 6,
                fontFamily: FONTS.heading,
                color: COLORS.text
              }}>SEGUIMIENTO</label>
              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                justifyContent: 'space-around',
                padding: '8px',
                border: `2px solid ${COLORS.border}`,
                borderRadius: '4px',
                backgroundColor: COLORS.backgroundLight
              }}>
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

      {/* Estado de carga */}
      {cargando && (
        <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textLight, fontFamily: FONTS.body }}>
          Cargando cortes del cliente...
        </div>
      )}

      {/* Sin cortes */}
      {!cargando && cortes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: COLORS.textLight, fontFamily: FONTS.body, border: `2px dashed ${COLORS.border}`, borderRadius: '8px' }}>
          No hay cortes registrados para este pedido
        </div>
      )}

      {/* Mostrar cortes agrupados por producto */}
      {!cargando && cortes.length > 0 && (
        <>
          {cortes.map((producto, idx) => (
            <div key={idx} style={{ 
              marginBottom: '24px', 
              border: `2px solid ${COLORS.border}`, 
              borderRadius: '8px', 
              padding: '16px',
              background: COLORS.white 
            }}>
              {/* Cabecera del producto */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px',
                paddingBottom: '12px',
                borderBottom: `2px solid ${COLORS.gray[200]}`
              }}>
                <div>
                  <h4 style={{ 
                    fontFamily: FONTS.heading, 
                    fontWeight: 700, 
                    fontSize: 16, 
                    color: COLORS.text,
                    marginBottom: '4px'
                  }}>
                    {producto.producto_nombre}
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', fontSize: 13, color: COLORS.textLight }}>
                    <span style={{ fontFamily: 'monospace' }}>Código: <strong>{producto.producto_codigo}</strong></span>
                    <span>Categoría: <strong>{producto.categoria}</strong></span>
                    <span>Total cortes: <strong>{producto.total_cortes}</strong></span>
                    <span>Área total: <strong>{producto.area_total_m2?.toFixed(2)} m²</strong></span>
                  </div>
                </div>
              </div>

              {/* Tablas: cortes y mermas coincidentes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '16px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', fontFamily: FONTS.body }}>
                    <thead style={{ background: COLORS.gray[200] }}>
                      <tr>
                        <th style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Sel</th>
                        <th style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>#</th>
                        <th style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'left', fontFamily: FONTS.heading, color: COLORS.text }}>Producto</th>
                        <th style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'left', fontFamily: FONTS.heading, color: COLORS.text }}>Descripción</th>
                        <th style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Ancho (cm)</th>
                        <th style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Alto (cm)</th>
                        <th style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Cantidad</th>
                        <th style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Área Unit. (m²)</th>
                        <th style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {producto.cortes.map((corte, corteIdx) => (
                        <tr key={corte.id_corte} style={{ background: COLORS.white }}>
                          <td style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(cortesSeleccionados[corte.id_corte])}
                              onChange={() => toggleCorteSeleccionado(producto, corte)}
                              style={{ cursor: 'pointer', width: 16, height: 16 }}
                            />
                          </td>
                          <td style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text }}>
                            {corteIdx + 1}
                          </td>
                          <td style={{ border: `1px solid ${COLORS.border}`, padding: '8px', fontFamily: FONTS.body, color: COLORS.text }}>
                            {producto.producto_nombre}
                          </td>
                          <td style={{ border: `1px solid ${COLORS.border}`, padding: '8px', fontFamily: FONTS.body, color: COLORS.text }}>
                            {producto.producto_descripcion || '-'}
                          </td>
                          <td style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text, fontWeight: 600 }}>
                            {corte.ancho_cm}
                          </td>
                          <td style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text, fontWeight: 600 }}>
                            {corte.alto_cm}
                          </td>
                          <td style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text }}>
                            {corte.cantidad}
                          </td>
                          <td style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text }}>
                            {corte.area_m2?.toFixed(4)}
                          </td>
                          <td style={{ border: `1px solid ${COLORS.border}`, padding: '8px', textAlign: 'center' }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: 11,
                              fontWeight: 600,
                              fontFamily: FONTS.heading,
                              background: corte.estado === 'completado' ? '#86efac' :
                                         corte.estado === 'en_proceso' ? '#fde047' : '#fca5a5',
                              color: corte.estado === 'completado' ? '#15803d' :
                                     corte.estado === 'en_proceso' ? '#854d0e' : '#991b1b'
                            }}>
                              {corte.estado || 'pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ overflowX: 'auto', border: `1px solid ${COLORS.border}`, borderRadius: '6px' }}>
                  <div style={{
                    padding: '10px 12px',
                    background: COLORS.gray[200],
                    borderBottom: `1px solid ${COLORS.border}`,
                    fontFamily: FONTS.heading,
                    fontWeight: 700,
                    fontSize: 13,
                    color: COLORS.text
                  }}>
                    Mermas Coincidentes (±{TOLERANCIA_CM} cm)
                  </div>
                  {Object.keys(mermasSeleccionadas).length > 0 && (
                    <div style={{
                      padding: '10px 12px',
                      borderBottom: `1px solid ${COLORS.border}`,
                      background: COLORS.white
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.text, marginBottom: 6, fontFamily: FONTS.heading }}>
                        Seleccionadas
                      </div>
                      {Object.values(mermasSeleccionadas).map((merma) => (
                        <div key={merma.id_merma} style={{ fontSize: 12, color: COLORS.text, marginBottom: 4, fontFamily: FONTS.body }}>
                          {merma.nombre || 'Merma'} - Area: {merma.area || 0}, Lugar: {merma.lugar || '-'}, Cantidad: {merma.cantidad || 0}
                        </div>
                      ))}
                    </div>
                  )}
                  {mermaCargando && (mermaCache[producto.categoria_id] || []).length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: COLORS.textLight, fontFamily: FONTS.body }}>
                      Cargando mermas...
                    </div>
                  ) : (
                    <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse', fontFamily: FONTS.body }}>
                      <thead style={{ background: COLORS.gray[100] }}>
                        <tr>
                          <th style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Sel</th>
                          <th style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'left', fontFamily: FONTS.heading, color: COLORS.text }}>Merma</th>
                          <th style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'left', fontFamily: FONTS.heading, color: COLORS.text }}>Descripción</th>
                          <th style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Ancho</th>
                          <th style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Alto</th>
                          <th style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Area</th>
                          <th style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Lugar</th>
                          <th style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Cantidad</th>
                          <th style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Corte</th>
                        </tr>
                      </thead>
                      <tbody>
                        {obtenerMermasCoincidentes(producto).length === 0 ? (
                          <tr>
                            <td colSpan="9" style={{ border: `1px solid ${COLORS.border}`, padding: '10px', textAlign: 'center', color: COLORS.textLight }}>
                              No hay mermas que coincidan
                            </td>
                          </tr>
                        ) : (
                          obtenerMermasCoincidentes(producto).map((merma) => (
                            <tr key={merma.id_merma} style={{ background: COLORS.white }}>
                              <td style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(mermasSeleccionadas[merma.id_merma])}
                                  onChange={() => toggleMermaSeleccionada(merma)}
                                  style={{ cursor: 'pointer', width: 16, height: 16 }}
                                />
                              </td>
                              <td style={{ border: `1px solid ${COLORS.border}`, padding: '6px', fontFamily: FONTS.body, color: COLORS.text }}>
                                {merma.nombre || '-'}
                              </td>
                              <td style={{ border: `1px solid ${COLORS.border}`, padding: '6px', fontFamily: FONTS.body, color: COLORS.text }}>
                                {obtenerDescripcionMerma(merma) || '-'}
                              </td>
                              <td style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text }}>
                                {merma.ancho_cm}
                              </td>
                              <td style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text }}>
                                {merma.alto_cm}
                              </td>
                              <td style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text }}>
                                {merma.area || '-'}
                              </td>
                              <td style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text }}>
                                {merma.lugar || '-'}
                              </td>
                              <td style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text }}>
                                {merma.cantidad || 0}
                              </td>
                              <td style={{ border: `1px solid ${COLORS.border}`, padding: '6px', textAlign: 'center', fontFamily: FONTS.body, color: COLORS.text }}>
                                {merma._corteMatch?.ancho_cm} x {merma._corteMatch?.alto_cm}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
            <button
              onClick={handleGuardar}
              disabled={guardando}
              style={{
                background: COLORS.text,
                color: COLORS.white,
                border: `2px solid ${COLORS.text}`,
                borderRadius: '8px',
                padding: '10px 40px',
                fontWeight: 700,
                fontSize: 14,
                cursor: guardando ? 'not-allowed' : 'pointer',
                fontFamily: FONTS.heading,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                opacity: guardando ? 0.7 : 1
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </>
      )}

      {/* Sección de búsqueda de MERMA - Solo visible en SERVICIO */}
      {tipoNotificacion === 'SERVICIO' && (
        <div style={{
          marginTop: '32px',
          padding: '20px',
          border: `2px solid ${COLORS.primary}`,
          borderRadius: '8px',
          backgroundColor: COLORS.gray[50]
        }}>
          <h3 style={{
            fontFamily: FONTS.heading,
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 16,
            color: COLORS.primary,
            textTransform: 'uppercase'
          }}>
            🔍 Buscar MERMA Disponible
          </h3>

          {/* Controles de búsqueda manual */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'end', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                fontSize: 12, 
                fontWeight: 600, 
                marginBottom: 6,
                fontFamily: FONTS.body,
                color: COLORS.text
              }}>ANCHO (cm)</label>
              <input
                type="number"
                value={anchoBusqueda}
                onChange={(e) => setAnchoBusqueda(e.target.value)}
                placeholder="Ej: 100"
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

            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                fontSize: 12, 
                fontWeight: 600, 
                marginBottom: 6,
                fontFamily: FONTS.body,
                color: COLORS.text
              }}>ALTO (cm)</label>
              <input
                type="number"
                value={altoBusqueda}
                onChange={(e) => setAltoBusqueda(e.target.value)}
                placeholder="Ej: 200"
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

            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                fontSize: 12, 
                fontWeight: 600, 
                marginBottom: 6,
                fontFamily: FONTS.body,
                color: COLORS.text
              }}>TOLERANCIA (cm)</label>
              <input
                type="number"
                value={toleranciaBusqueda}
                onChange={(e) => setToleranciaBusqueda(e.target.value)}
                placeholder="10"
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

            <button
              onClick={buscarMermaManual}
              disabled={buscandoMermaManual}
              style={{
                background: buscandoMermaManual ? COLORS.gray[400] : COLORS.primary,
                color: COLORS.white,
                border: 'none',
                borderRadius: '6px',
                padding: '10px 24px',
                fontWeight: 600,
                fontSize: 14,
                cursor: buscandoMermaManual ? 'not-allowed' : 'pointer',
                fontFamily: FONTS.heading,
                minWidth: '120px'
              }}
            >
              {buscandoMermaManual ? 'Buscando...' : 'BUSCAR'}
            </button>
          </div>

          {/* Tabla de resultados de merma */}
          {mermasBusqueda.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: '6px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <table style={{ width: '100%', fontSize: 13, fontFamily: FONTS.body }}>
                <thead style={{ 
                  background: COLORS.gray[100], 
                  position: 'sticky', 
                  top: 0,
                  borderBottom: `2px solid ${COLORS.border}`
                }}>
                  <tr>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, width: '50px' }}>✓</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Nombre</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Ancho (cm)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Alto (cm)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Área (m²)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Cantidad</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Lugar</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {mermasBusqueda.map((merma, idx) => (
                    <tr 
                      key={merma.id_merma}
                      style={{
                        borderBottom: idx < mermasBusqueda.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                        background: mermasSeleccionadas[merma.id_merma] ? COLORS.light : (idx % 2 === 0 ? COLORS.white : COLORS.gray[50]),
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleMermaBusqueda(merma)}
                    >
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={!!mermasSeleccionadas[merma.id_merma]}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => toggleMermaBusqueda(merma)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                      </td>
                      <td style={{ padding: '10px 12px' }}>{merma.nombre}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{merma.ancho_cm}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{merma.alto_cm}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>{merma.area?.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: COLORS.success }}>
                        {merma.cantidad}
                      </td>
                      <td style={{ padding: '10px 12px' }}>{merma.lugar}</td>
                      <td style={{ padding: '10px 12px', fontSize: 12, color: COLORS.textLight }}>
                        {merma.descripción || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{
              marginTop: '8px',
              fontSize: 12,
              color: COLORS.textLight,
              fontFamily: FONTS.body,
              textAlign: 'right'
            }}>
              Total: {mermasBusqueda.length} merma(s) disponible(s) | Seleccionadas: {Object.keys(mermasSeleccionadas).length}
            </div>

            {/* Botón Guardar */}
            {Object.keys(mermasSeleccionadas).length > 0 && (
              <button
                onClick={handleGuardar}
                disabled={guardando}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  padding: '14px',
                  background: guardando ? COLORS.gray[400] : COLORS.success,
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: FONTS.heading,
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                {guardando ? '⏳ Guardando...' : '💾 Guardar y Continuar'
              }
              </button>
            )}
          </div>
          )}

          {/* Mensaje cuando no hay resultados después de buscar */}
          {!buscandoMermaManual && mermasBusqueda.length === 0 && anchoBusqueda && altoBusqueda && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: COLORS.gray[100],
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: 14,
              color: COLORS.textLight,
              fontFamily: FONTS.body
            }}>
              No se encontraron mermas disponibles con las medidas especificadas
            </div>
          )}
        </div>
      )}

      {/* Sección de resultados automáticos para ENTREGA */}
      {tipoNotificacion === 'ENTREGA' && (
        <div style={{ marginTop: '32px' }}>
          {/* Indicador de búsqueda automática */}
          {buscandoMermaManual && (
            <div style={{ 
              padding: '12px', 
              background: COLORS.info, 
              color: COLORS.white, 
              borderRadius: '6px', 
              marginBottom: '16px',
              fontFamily: FONTS.body,
              fontSize: 14
            }}>
              🔄 Buscando mermas automáticamente basado en las dimensiones de los cortes...
            </div>
          )}

          {/* Tabla de resultados automáticos */}
          {mermasBusqueda.length > 0 && (
            <div style={{
              padding: '20px',
              border: `2px solid ${COLORS.success}`,
              borderRadius: '8px',
              backgroundColor: COLORS.gray[50]
            }}>
              <h3 style={{
                fontFamily: FONTS.heading,
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 16,
                color: COLORS.success,
                textTransform: 'uppercase'
              }}>
                ✅ Mermas Encontradas Automáticamente
              </h3>
              
              <div style={{
                background: COLORS.white,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '6px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                <table style={{ width: '100%', fontSize: 13, fontFamily: FONTS.body }}>
                  <thead style={{ 
                    background: COLORS.gray[100], 
                    position: 'sticky', 
                    top: 0,
                    borderBottom: `2px solid ${COLORS.border}`
                  }}>
                    <tr>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, width: '50px' }}>✓</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Nombre</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Ancho (cm)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Alto (cm)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Área (m²)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700 }}>Cantidad</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Lugar</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700 }}>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mermasBusqueda.map((merma, idx) => (
                      <tr 
                        key={merma.id_merma}
                        style={{
                          borderBottom: idx < mermasBusqueda.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                          background: mermasSeleccionadas[merma.id_merma] ? COLORS.light : (idx % 2 === 0 ? COLORS.white : COLORS.gray[50]),
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleMermaBusqueda(merma)}
                      >
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={!!mermasSeleccionadas[merma.id_merma]}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => toggleMermaBusqueda(merma)}
                            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                          />
                        </td>
                        <td style={{ padding: '10px 12px' }}>{merma.nombre}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{merma.ancho_cm}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{merma.alto_cm}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{merma.area?.toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: COLORS.success }}>
                          {merma.cantidad}
                        </td>
                        <td style={{ padding: '10px 12px' }}>{merma.lugar}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12, color: COLORS.textLight }}>
                          {merma.descripción || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div style={{
                marginTop: '8px',
                fontSize: 12,
                color: COLORS.textLight,
                fontFamily: FONTS.body,
                textAlign: 'right'
              }}>
                Total: {mermasBusqueda.length} merma(s) disponible(s) | Seleccionadas: {Object.keys(mermasSeleccionadas).length}
              </div>

              {/* Botón Guardar para ENTREGA */}
              {Object.keys(mermasSeleccionadas).length > 0 && (
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  style={{
                    marginTop: '16px',
                    width: '100%',
                    padding: '14px',
                    background: guardando ? COLORS.gray[400] : COLORS.success,
                    color: COLORS.white,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: FONTS.heading,
                    cursor: guardando ? 'not-allowed' : 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {guardando ? '⏳ Guardando...' : '💾 Guardar y Continuar a Productos'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Retazo;
