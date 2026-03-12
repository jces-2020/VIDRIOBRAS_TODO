import React, { useState, useEffect, useRef } from "react";
import ModalMetodoPago from "./ModalMetodoPago";
import { realizarCompra } from "../../services/compraService";
import { registrarVenta } from "../../services/ventaService";
import { IconPlus, IconTrash, IconEdit } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { COLORS, FONTS } from "../../colors";
import ModalTipoProductoVidrio from "./ModalTipoProductoVidrio";
import ModalIngresoCortes from "./ModalIngresoCortes";
import { 
  agregarProductoCotizacion, 
  obtenerProductosCotizacion, 
  eliminarProductoCotizacion,
  limpiarCotizacion
} from "../../utils/ramCotizacion";

const CotizacionView = () => {
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [cotizacionProductos, setCotizacionProductos] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [popoverProducto, setPopoverProducto] = useState(null);
  const [popoverCantidad, setPopoverCantidad] = useState(1);
  const [modalTipoProductoVisible, setModalTipoProductoVisible] = useState(false);
  const [productoSeleccionadoTipo, setProductoSeleccionadoTipo] = useState(null);
  const [modalCortesVisible, setModalCortesVisible] = useState(false);
  const [productoSeleccionadoCortes, setProductoSeleccionadoCortes] = useState(null);
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);
  const popoverRef = useRef();
  const navigate = useNavigate();
  const [tipoDocumentos, setTipoDocumentos] = useState([]);
  const [tipoDocumentoSeleccionado, setTipoDocumentoSeleccionado] = useState(null);
  const [digitos, setDigitos] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [errorNombre, setErrorNombre] = useState("");
  const tokenApisPeru = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImkyNDE1OTE0QGNvbnRpbnVudGFsLmVkdS5wZSJ9.e9EuekJUwsqKvAGuELbs-0P65QkqdeMranSKv-Tqb9Y";

  useEffect(() => {
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        const cats = Array.from(new Set(data.map(p => p.categoria).filter(Boolean)));
        setCategorias(cats);
        setFilteredProducts(data);
      })
      .catch(() => {
        setProducts([]);
        setCategorias([]);
        setFilteredProducts([]);
      });
    // Cargar desde RAM
    setCotizacionProductos(obtenerProductosCotizacion());
  }, []);

  useEffect(() => {
    if (!categoriaSeleccionada) {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => {
        if (categoriaSeleccionada === 'ACCESORIOS') return (p.categoria === 'VIDRIOS');
        if (categoriaSeleccionada === 'VIDRIOS') return (p.categoria === 'ACCESORIOS');
        const catA = (p.categoria || '').toString().trim().toLowerCase();
        const catB = categoriaSeleccionada.toString().trim().toLowerCase();
        return catA === catB;
      }));
    }
  }, [categoriaSeleccionada, products]);
  
  const filteredProductsFiltered = filteredProducts.filter(p => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;
    return (
      (p.nombre && p.nombre.toLowerCase().includes(term)) ||
      (p.codigo && p.codigo.toLowerCase().includes(term))
    );
  });

  useEffect(() => {
    fetch('/api/tipo_documento')
      .then(res => res.json())
      .then(data => setTipoDocumentos(data.tipos || []))
      .catch(() => setTipoDocumentos([]));
  }, []);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'row',
    gap: '32px',
    fontFamily: FONTS.body,
    maxWidth: '1400px',
    margin: '40px auto',
    background: COLORS.white,
    boxShadow: `0 8px 32px ${COLORS.shadow}`,
    borderRadius: '18px',
    padding: '32px',
    minHeight: '700px',
  };

  const mainContentStyle = {
    flex: 3,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    background: COLORS.lightBlue,
    borderRadius: '14px',
    padding: '32px 28px',
    boxShadow: `0 2px 12px ${COLORS.shadow}`,
  };

  const sidePanelStyle = {
    flex: 1,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '14px',
    padding: '24px',
    backgroundColor: COLORS.light,
    boxShadow: `0 2px 12px ${COLORS.shadow}`,
    minWidth: '320px',
    maxWidth: '400px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '1.08rem',
    background: COLORS.white,
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: `0 1px 6px ${COLORS.shadow}`,
    fontFamily: FONTS.body,
  };

  const thTdStyle = {
    border: `1px solid ${COLORS.border}`,
    padding: '12px 10px',
    textAlign: 'left',
    fontWeight: 400,
    color: COLORS.text,
  };

  const thStyle = {
    ...thTdStyle,
    backgroundColor: COLORS.lightBlue,
    fontWeight: 600,
    fontSize: '1.1rem',
    fontFamily: FONTS.heading,
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    boxSizing: 'border-box',
    borderRadius: '6px',
    border: `1px solid ${COLORS.border}`,
    fontSize: '1rem',
    marginTop: '6px',
    marginBottom: '6px',
    fontFamily: FONTS.body,
    color: COLORS.text,
  };

  const buttonStyle = {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontWeight: 600,
    fontSize: '1rem',
    boxShadow: `0 2px 8px ${COLORS.shadow}`,
    transition: 'background 0.2s',
    fontFamily: FONTS.heading,
  };

  const radioLabelStyle = (checked) => ({
    display: 'flex',
    alignItems: 'center',
    background: checked ? COLORS.lightBlue : COLORS.light,
    borderRadius: '12px',
    padding: '6px 18px',
    fontWeight: 700,
    fontSize: '1.08rem',
    boxShadow: checked ? `0 2px 8px ${COLORS.shadow}` : 'none',
    border: checked ? `2px solid ${COLORS.primary}` : `2px solid ${COLORS.border}`,
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: FONTS.heading,
    color: COLORS.text,
  });

  const radioInputStyle = {
    marginRight: '8px',
    accentColor: COLORS.primary,
    width: '18px',
    height: '18px',
  };

  const validarNumero = (tipo, numero) => {
    if (!tipo || !numero) return { ok: false, msg: 'Seleccione tipo e ingrese número.' };
    if (tipo === 'DNI' && (!/^\d{7,8}$/.test(numero))) return { ok: false, msg: 'El DNI debe tener 7 u 8 dígitos.' };
    if (tipo === 'RUC' && (!/^\d{11}$/.test(numero))) return { ok: false, msg: 'El RUC debe tener 11 dígitos.' };
    return { ok: true, msg: '' };
  };

  const consultarDocumentoBackend = async (tipo, numero) => {
    setErrorNombre('Consultando...');
    setNombreCliente('');
    try {
      const res = await fetch('/api/consulta_documento_html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, numero })
      });
      const data = await res.json();
      if (data.success && data.html) {
        setNombreCliente(data.html);
        setErrorNombre('Consulta exitosa.');
      } else {
        // Si es DNI de 7 dígitos y no lo encontró, permitir continuar (base de datos incompleta)
        if (tipo === 'DNI' && numero.length === 7) {
          setNombreCliente('');
          setErrorNombre('DNI no encontrado en base de datos. Puedes continuar e ingresar el nombre manualmente.');
        } else {
          setNombreCliente('');
          setErrorNombre(data.message || 'No se encontró información para ese documento.');
        }
      }
    } catch (e) {
      setNombreCliente('');
      setErrorNombre('Error de conexión con el servidor.');
    }
  };

  useEffect(() => {
    if (!tipoDocumentoSeleccionado || !digitos) return;
    const tipo = tipoDocumentos.find(tc => tc.id_tipo === tipoDocumentoSeleccionado)?.descripcion;
    const valid = validarNumero(tipo, digitos);
    if (!valid.ok) {
      setErrorNombre(valid.msg);
      setNombreCliente('');
      return;
    }
    consultarDocumentoBackend(tipo, digitos);
  }, [tipoDocumentoSeleccionado, digitos]);

  return (
    <div style={containerStyle}>
      <div style={mainContentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontFamily: FONTS.heading, color: COLORS.text, fontSize: '2rem', marginBottom: '8px' }}>Cotización</h2>
            <div style={{marginTop: '8px'}}>
              <label style={{fontWeight:600, fontFamily: FONTS.body, color: COLORS.text, fontSize: '1.05rem'}}>Nombre/Razón social:</label>
              <input
                type="text"
                value={nombreCliente}
                onChange={e => setNombreCliente(e.target.value)}
                style={{...inputStyle, width:'320px', marginLeft:'12px'}}
                placeholder="Nombre/Razón social"
              />
              {errorNombre && !nombreCliente && (
                <div style={{color: COLORS.error, marginTop:'6px', fontWeight:500, fontFamily: FONTS.body}}>{errorNombre}</div>
              )}
            </div>
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: '1.08rem', display: 'block', marginBottom: '6px', fontFamily: FONTS.heading, color: COLORS.text }}>Tipo de documento:</label>
            <div style={{display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'center'}}>
              {(Array.isArray(tipoDocumentos) && tipoDocumentos.length > 0) ? tipoDocumentos.map((tipo) => (
                <label key={tipo.id_tipo || tipo.descripcion} style={radioLabelStyle(tipoDocumentoSeleccionado === tipo.id_tipo)}>
                  <input
                    type="radio"
                    name="tipo_documento"
                    value={tipo.id_tipo}
                    checked={tipoDocumentoSeleccionado === tipo.id_tipo}
                    onChange={e => setTipoDocumentoSeleccionado(e.target.value)}
                    style={radioInputStyle}
                  />
                  {tipo.descripcion}
                </label>
              )) : (
                <span style={{color: COLORS.textLight, fontFamily: FONTS.body}}>Cargando tipos...</span>
              )}
              <input
                type="text"
                placeholder={tipoDocumentoSeleccionado ? (tipoDocumentos.find(tc => tc.id_tipo === tipoDocumentoSeleccionado)?.descripcion === 'RUC' ? 'Ingrese los dígitos de RUC' : 'Ingrese los dígitos de DNI') : 'Seleccione tipo'}
                value={digitos}
                onChange={e => setDigitos(e.target.value.replace(/\D/g, ''))}
                maxLength={tipoDocumentoSeleccionado ? (tipoDocumentos.find(tc => tc.id_tipo === tipoDocumentoSeleccionado)?.descripcion === 'RUC' ? 11 : 8) : 11}
                style={{...inputStyle, width: '180px', marginLeft: '18px'}}
                disabled={!tipoDocumentoSeleccionado}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                {['Código', 'Nombre', 'Cantidad', 'Precio Unitario', 'Acciones'].map(header => <th key={header} style={{...thStyle, textAlign: 'center'}}>{header}</th>)}
              </tr>
            </thead>
            <tbody>
              {cotizacionProductos.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center', color: COLORS.textLight, fontFamily: FONTS.body, padding: '32px', fontSize: '1.05rem'}}>No hay productos agregados.</td></tr>
              ) : (
                cotizacionProductos.map((p, idx) => (
                  <tr key={p.id_producto || p.codigo || idx}>
                    <td style={thTdStyle}>{p.codigo}</td>
                    <td style={thTdStyle}>{p.nombre}</td>
                    <td style={thTdStyle}>{p.cantidad}</td>
                    <td style={thTdStyle}>S/ {typeof p.precio_unitario === 'number' ? p.precio_unitario.toFixed(2) : '0.00'}</td>
                    <td style={thTdStyle}>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', alignItems: 'center' }}>
                        {p.tipo_producto === 'CORTE' && p.cortes_detalles && (
                          <IconEdit 
                            size={20} 
                            cursor="pointer" 
                            color={COLORS.primary} 
                            onClick={() => {
                              setProductoEnEdicion(p);
                              setProductoSeleccionadoCortes({
                                codigo: p.codigo.replace('CORTE-', ''),
                                nombre: p.nombre.replace(/ \(\d+ CORTES\)$/, ''),
                                categoria: p.categoria,
                                precio_unitario: p.precio_unitario
                              });
                              setModalCortesVisible(true);
                            }} 
                          />
                        )}
                        <IconTrash size={20} cursor="pointer" color={COLORS.error} onClick={() => {
                          // Eliminar de RAM
                          eliminarProductoCotizacion(p.__cotiz_id);
                          // Actualizar estado
                          setCotizacionProductos(obtenerProductosCotizacion());
                        }} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
          <button
            style={{
              ...buttonStyle,
              flex: 1,
              background: COLORS.error,
            }}
            onClick={() => {
              if (confirm('¿Estás seguro de limpiar toda la cotización?')) {
                limpiarCotizacion();
                setCotizacionProductos([]);
              }
            }}
          >
            🗑️ Limpiar Cotización
          </button>
          <button
            style={{
              ...buttonStyle,
              flex: 2,
            }}
            onClick={() => setModalPagoOpen(true)}
          >
            💾 Realizar Compra
          </button>
        </div>
        {/* Modal de método de pago */}
        <ModalMetodoPago
          open={modalPagoOpen}
          onClose={() => setModalPagoOpen(false)}
          onSelect={async (metodo) => {
            setModalPagoOpen(false);
            // Validar datos
            if (!tipoDocumentoSeleccionado || !digitos) {
              alert('Seleccione tipo y número de documento');
              return;
            }
            // Preparar productos y cortes
            const productos = cotizacionProductos.map(p => ({
              id_producto: p.id_producto,
              nombre: p.nombre,
              cantidad: p.cantidad
            }));
            const cortes = cotizacionProductos.filter(p => p.tipo_producto === 'CORTE').map(c => ({
              ancho_cm: c.cortes_detalles?.ancho_cm || 0,
              alto_cm: c.cortes_detalles?.alto_cm || 0,
              cantidad: c.cortes_detalles?.cantidad || c.cantidad,
              producto_id: c.id_producto,
              nombre: c.nombre
            }));
            // Determinar nombre_api_peru si el cliente no existe
            let nombreApiPeru = '';
            // Siempre guardar el documento ingresado junto al nombre de APIS Perú si no hay cliente
            if (nombreCliente) {
              nombreApiPeru = `${digitos} - ${nombreCliente}`;
            } else {
              nombreApiPeru = digitos;
            }
            // Llamar backend
            const result = await realizarCompra({
              documento: digitos,
              productos,
              cortes,
              metodoPago: metodo,
              nombre_api_peru: nombreApiPeru
            });
            if (result.success) {
              // Calcular total
              const total = cotizacionProductos.reduce((acc, p) => acc + (p.precio_unitario * p.cantidad), 0);
              // Registrar venta
              const ventaRes = await registrarVenta({ total, metodo });
              if (ventaRes.success) {
                alert('Compra y venta registradas correctamente');
              } else {
                alert('Compra registrada, pero error al guardar la venta');
              }
              limpiarCotizacion();
              setCotizacionProductos([]);
            } else {
              alert(result.message || 'Error al guardar la compra');
            }
          }}
        />
      </div>
      <div style={sidePanelStyle}>
        <h4 style={{ fontFamily: FONTS.heading, color: COLORS.text, fontSize: '1.4rem', marginBottom: '16px', fontWeight: 700 }}>Filtros</h4>
        <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
          {["Todos", ...categorias].map((cat) => (
            <label key={cat} style={{
              display: 'flex', alignItems: 'center', background: categoriaSeleccionada === cat || (!categoriaSeleccionada && cat === "Todos") ? COLORS.lightBlue : COLORS.light,
              borderRadius: '10px', padding: '4px 10px', fontWeight: 600, fontSize: '0.98rem',
              boxShadow: categoriaSeleccionada === cat || (!categoriaSeleccionada && cat === "Todos") ? `0 2px 8px ${COLORS.shadow}` : 'none',
              border: categoriaSeleccionada === cat || (!categoriaSeleccionada && cat === "Todos") ? `2px solid ${COLORS.primary}` : `2px solid ${COLORS.border}`,
              cursor: 'pointer', transition: 'all 0.2s', minWidth: '80px', justifyContent: 'flex-start',
              fontFamily: FONTS.heading, color: COLORS.text
            }}>
              <input
                type="radio"
                name="categoria"
                value={cat === "Todos" ? "" : cat}
                checked={cat === "Todos" ? !categoriaSeleccionada : categoriaSeleccionada === cat}
                onChange={() => setCategoriaSeleccionada(cat === "Todos" ? "" : cat)}
                style={{ marginRight: '6px', accentColor: COLORS.primary, width: '15px', height: '15px' }}
              />
              {cat}
            </label>
          ))}
        </div>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Buscar por texto o código..."
            style={inputStyle}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <h4 style={{ fontFamily: FONTS.heading, color: COLORS.text, fontSize: '1.4rem', marginBottom: '16px', fontWeight: 700 }}>Productos</h4>
        <div style={{ maxHeight: '400px', overflowY: 'auto', position: 'relative' }}>
          {filteredProductsFiltered.length === 0 ? (
            <div style={{ color: COLORS.textLight, textAlign: 'center', marginTop: '30px', fontFamily: FONTS.body }}>No hay productos para esta categoría.</div>
          ) : (
            filteredProductsFiltered.map(p => (
              <div key={p.id_producto} style={{ display: 'flex', gap: '10px', border: `1px solid ${COLORS.border}`, padding: '10px', borderRadius: '4px', marginBottom: '10px', alignItems: 'center', position: 'relative' }}>
                <div style={{width: '60px', height: '60px', backgroundColor: COLORS.light, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                  {p.IMG_P ? <img src={p.IMG_P} alt={p.nombre} style={{maxWidth: '100%', maxHeight: '100%'}} /> : null}
                </div>
                <div style={{flex: 1}}>
                  <p style={{margin: 0, fontWeight: 'bold', fontFamily: FONTS.heading, color: COLORS.text, fontSize: '1.05rem'}}>{p.nombre}</p>
                  <p style={{margin: 0, fontSize: '0.95rem', fontFamily: FONTS.body, color: COLORS.textLight}}>Stock: {p.cantidad ?? 'N/A'}</p>
                </div>
                <button style={{...buttonStyle, padding: '5px 10px'}} onClick={() => {
                  // Si es VIDRIO o ALUMINIO, mostrar modal de tipo
                  if (p.categoria === 'VIDRIOS' || p.categoria === 'ALUMINIOS') {
                    setProductoSeleccionadoTipo(p);
                    setModalTipoProductoVisible(true);
                  } else {
                    // Si no, mostrar popover de cantidad
                    setPopoverProducto(p);
                    setPopoverCantidad(1);
                  }
                }}><IconPlus size={16}/></button>
                {popoverProducto && popoverProducto.codigo === p.codigo && (
                  <div ref={popoverRef} style={{
                    position: 'absolute',
                    left: '50%',
                    top: '100%',
                    transform: 'translate(-50%, 10px)',
                    background: COLORS.white,
                    border: `2px solid ${COLORS.primary}`,
                    borderRadius: '12px',
                    boxShadow: `0 4px 16px ${COLORS.shadow}`,
                    padding: '18px 24px',
                    zIndex: 10,
                    minWidth: '220px',
                    textAlign: 'center'
                  }}>
                    <div style={{fontWeight: 700, fontSize: '1.08rem', marginBottom: '10px', fontFamily: FONTS.heading, color: COLORS.text}}>CANTIDAD:</div>
                    <input type="number" min={1} max={popoverProducto.cantidad || 9999} step={1} value={popoverCantidad}
                      onChange={e => {
                        let val = e.target.value;
                        if (val === '') {
                          setPopoverCantidad('');
                          return;
                        }
                        if (/^\d+$/.test(val)) {
                          setPopoverCantidad(val);
                        }
                      }}
                      style={{width: '60px', fontSize: '1.1rem', textAlign: 'center', marginBottom: '10px'}}
                    />
                    <div style={{marginBottom: '10px', fontWeight: 500, color: popoverCantidad <= (popoverProducto.cantidad ?? 0) ? COLORS.success : COLORS.error, fontFamily: FONTS.body}}>
                      {popoverCantidad <= (popoverProducto.cantidad ?? 0) ? 'HAY SUFICIENTE STOCK' : 'NO HAY STOCK SUFICIENTE'}
                    </div>
                    <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                      <button style={{...buttonStyle, padding:'6px 16px'}}
                        disabled={popoverCantidad === '' || Number(popoverCantidad) > (popoverProducto.cantidad ?? 0) || Number(popoverCantidad) < 1}
                        onClick={() => {
                          const cantidadFinal = Number(popoverCantidad);
                          const tipoProducto = popoverProducto.tipo_producto || 'PRODUCTO';
                          
                          // Determinar código y nombre según tipo
                          let codigo = popoverProducto.codigo;
                          let nombre = popoverProducto.nombre;
                          
                          if (tipoProducto === 'PLANCHA') {
                            codigo = `PLANCHA-${popoverProducto.codigo}`;
                            nombre = `${popoverProducto.nombre} (PLANCHA)`;
                          } else if (tipoProducto === 'VARA') {
                            codigo = `VARA-${popoverProducto.codigo}`;
                            nombre = `${popoverProducto.nombre} (VARA)`;
                          }
                          
                          // Agregar a RAM
                          agregarProductoCotizacion({
                            codigo: codigo,
                            nombre: nombre,
                            cantidad: cantidadFinal,
                            precio_unitario: popoverProducto.precio_unitario,
                            id_producto: popoverProducto.id_producto,
                            tipo_producto: tipoProducto,
                            categoria: popoverProducto.categoria,  // Guardar categoría
                            producto_original: popoverProducto.codigo  // Guardar código original
                          });
                          // Actualizar estado
                          setCotizacionProductos(obtenerProductosCotizacion());
                          setPopoverProducto(null);
                          setPopoverCantidad(1);
                        }}>Agregar</button>
                      <button style={{...buttonStyle, backgroundColor: COLORS.error, padding:'6px 16px'}} onClick={()=>setPopoverProducto(null)}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Tipo Producto Vidrio/Aluminio */}
      {modalTipoProductoVisible && productoSeleccionadoTipo && (
        <ModalTipoProductoVidrio
          producto={productoSeleccionadoTipo}
          tipoProducto={productoSeleccionadoTipo.categoria}
          onCancel={() => {
            setModalTipoProductoVisible(false);
            setProductoSeleccionadoTipo(null);
          }}
          onPlancha={() => {
            setProductoSeleccionadoTipo({
              ...productoSeleccionadoTipo,
              tipo_producto: 'PLANCHA'
            });
            setModalTipoProductoVisible(false);
            setPopoverProducto({ ...productoSeleccionadoTipo, tipo_producto: 'PLANCHA' });
            setPopoverCantidad(1);
          }}
          onVara={() => {
            setProductoSeleccionadoTipo({
              ...productoSeleccionadoTipo,
              tipo_producto: 'VARA'
            });
            setModalTipoProductoVisible(false);
            setPopoverProducto({ ...productoSeleccionadoTipo, tipo_producto: 'VARA' });
            setPopoverCantidad(1);
          }}
          onCortes={() => {
            setModalTipoProductoVisible(false);
            setProductoSeleccionadoCortes(productoSeleccionadoTipo);
            setModalCortesVisible(true);
          }}
        />
      )}

      {/* Modal Ingreso Cortes */}
      {modalCortesVisible && productoSeleccionadoCortes && (
        <ModalIngresoCortes
          producto={productoSeleccionadoCortes}
          tipoProducto={productoSeleccionadoCortes.categoria}
          cortesExistentes={productoEnEdicion?.cortes_detalles || null}
          onGuardarCorte={(corteData) => {
            // Si estamos editando, primero eliminar el producto anterior
            if (productoEnEdicion) {
              eliminarProductoCotizacion(productoEnEdicion.__cotiz_id);
            }
            // Agregar cortes a RAM
            agregarProductoCotizacion({
              codigo: `CORTE-${corteData.producto_original.codigo}`,
              nombre: `${corteData.producto_original.nombre} (${corteData.total_cortes} CORTES)`,
              cantidad: corteData.total_cortes,
              precio_unitario: corteData.precio_unitario,
              id_producto: corteData.producto_original.codigo,
              tipo_producto: 'CORTE',
              categoria: productoSeleccionadoCortes.categoria,
              cortes_detalles: corteData.cortes_detalles,
              total_cortes: corteData.total_cortes
            });
            // Actualizar estado
            setCotizacionProductos(obtenerProductosCotizacion());
            setModalCortesVisible(false);
            setProductoSeleccionadoCortes(null);
            setProductoEnEdicion(null);
          }}
          onCancel={() => {
            setModalCortesVisible(false);
            setProductoSeleccionadoCortes(null);
            setProductoEnEdicion(null);
          }}
        />
      )}
    </div>
  );
}

export default CotizacionView;
