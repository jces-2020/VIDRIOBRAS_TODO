import React, { useEffect, useState } from "react";
import BarraProgreso from "./BarraProgreso";
import { useNavigate } from "react-router-dom";
import { COLORS, FONTS } from "../colors";




const PanelCliente = ({ onLogout }) => {
  const [progresoPedido, setProgresoPedido] = useState({ estado: null, progreso: 0 });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clienteId, setClienteId] = useState(null);
  const [token, setToken] = useState(null);
  
  const initialCliente = () => {
    try {
      return {
        nombre: localStorage.getItem('cliente_nombre') || '',
        correo: localStorage.getItem('cliente_correo') || '',
        numero: localStorage.getItem('cliente_numero') || '',
        documento: localStorage.getItem('cliente_documento') || ''
      };
    } catch { return null; }
  };
  const [cliente, setCliente] = useState(initialCliente);
  const [datosMostrar, setDatosMostrar] = useState(null);
  const [datosCompletos, setDatosCompletos] = useState(null);
  const [faltantes, setFaltantes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  // Datos demo para secciones aún no conectadas
  const frecuenciaCompra = [2, 3, 1, 4, 2, 5, 3];
  const descuentos = { productos: "10% en vidrios templados", servicios: "15% en instalación" };
  const servicios = [];
  const comprobantes = [];

  // Función para recargar barra de progreso
  const recargarBarraProgreso = async (cId, tkn) => {
    if (!cId || !tkn) {
      setProgresoPedido({ estado: null, progreso: 0, mostrar: false });
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/barra_progreso/${cId}`, {
        headers: { 
          'Authorization': `Bearer ${tkn}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        setProgresoPedido({ estado: null, progreso: 0, mostrar: false });
        return;
      }

      const data = await res.json();
      
      if (data.success) {
        console.log('[PanelCliente] Barra progreso actualizada:', data.estado);
        setProgresoPedido({ 
          estado: data.estado || null, 
          progreso: data.progreso || 0,
          mostrar: data.mostrar_barra || false
        });
      } else {
        setProgresoPedido({ estado: null, progreso: 0, mostrar: false });
      }
    } catch (error) {
      console.error('[PanelCliente] Error actualizando barra:', error);
      setProgresoPedido({ estado: null, progreso: 0, mostrar: false });
    }
  };


  // Sincronizar token con el carrito y cargar datos del cliente y pedidos
  useEffect(() => {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      navigate('/login');
      return;
    }
    
    setToken(authToken);
    window.dispatchEvent(new CustomEvent('tokenUpdated', { detail: { token: authToken } }));

    (async () => {
      try {
        // Consultar datos del cliente
        const r = await fetch('http://localhost:5000/api/clientes/me', { 
          headers: { 'Authorization': `Bearer ${authToken}` } 
        });
        
        if (r.status === 401) {
          localStorage.removeItem('auth_token');
          navigate('/login');
          return;
        }

        const j = await r.json();
        
        if (r.ok && j?.success && j?.cliente) {
          setCliente(prev => ({ ...(prev || {}), ...j.cliente }));
          // Guardar cliente ID y recargar barra de progreso
          if (j.cliente.id_cliente) {
            setClienteId(j.cliente.id_cliente);
            await recargarBarraProgreso(j.cliente.id_cliente, authToken);
          }
        }

        // Consultar datos completos
        const rDatos = await fetch('http://localhost:5000/api/clientes/datos_completos', { 
          headers: { 'Authorization': `Bearer ${authToken}` } 
        });
        
        if (rDatos.status === 401) {
          localStorage.removeItem('auth_token');
          navigate('/login');
          return;
        }

        const jDatos = await rDatos.json();
        
        setDatosCompletos(jDatos?.success ? jDatos.datos_completos : false);
        setFaltantes(jDatos?.faltantes || []);

      } catch (e) {
        setError(`Error: ${e.message || 'No se pudo cargar el perfil'}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const logout = () => {
    const keys = ['auth_token', 'cliente_id', 'cliente_correo', 'cliente_nombre', 'cliente_numero', 'cliente_documento', 'carrito_id'];
    keys.forEach(k => localStorage.removeItem(k));
    if (onLogout) onLogout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', padding: 24, background: COLORS.background }}>
      {/* Loading */}
      {loading && (
        <div style={{ width: '100%', textAlign: 'center', padding: 40, fontFamily: FONTS.body, color: COLORS.text, fontSize: 18 }}>
          ⏳ Cargando perfil...
        </div>
      )}
      
      {/* Error message */}
      {!loading && error && (
        <div style={{ color: COLORS.error, width: '100%', fontFamily: FONTS.body, padding: 10, background: '#ffe0e0', borderRadius: 6 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Contenido principal - solo mostrar si no está cargando */}
      {!loading && (
        <>
          {/* Panel izquierdo */}
          <div style={{ flex: 1, minWidth: 320 }}>
        <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: `0 2px 8px ${COLORS.shadow}` }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, fontFamily: FONTS.heading, color: COLORS.text }}>Información del Cliente</h3>
          {/* Mostrar todos los datos si están completos, si no mostrar aviso */}
          <>
            <div style={{ fontFamily: FONTS.body, color: COLORS.text, marginBottom: 6 }}><b>Nombre:</b> {cliente?.nombre || '-'}</div>
            <div style={{ fontFamily: FONTS.body, color: COLORS.text, marginBottom: 6 }}><b>Correo:</b> {cliente?.correo || '-'}</div>
            {cliente?.numero && <div style={{ fontFamily: FONTS.body, color: COLORS.text, marginBottom: 6 }}><b>Número:</b> {cliente.numero}</div>}
            {cliente?.documento && <div style={{ fontFamily: FONTS.body, color: COLORS.text, marginBottom: 6 }}><b>Documento:</b> {cliente.documento}</div>}
            {(!cliente?.numero || !cliente?.documento) && (
              <div style={{ color: COLORS.error, marginTop: 10, fontWeight: 600, fontFamily: FONTS.body }}>
                Por favor, complete sus datos para continuar.
              </div>
            )}
          </>
          {datosCompletos === true && datosMostrar && (
            <>
              {Object.entries(datosMostrar).map(([k, v]) => (
                <div key={k}><b>{k.charAt(0).toUpperCase() + k.slice(1).replace('_',' ')}:</b> {v || '-'}</div>
              ))}
            </>
          )}
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <button onClick={logout} style={{ background: COLORS.error, color: COLORS.white, border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: FONTS.heading, fontWeight: 600 }}>Cerrar sesión</button>
            {(!cliente?.numero || !cliente?.documento) && (
              <button onClick={() => navigate('/completa-datos-google')} style={{ background: COLORS.primary, color: COLORS.white, border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer', fontFamily: FONTS.heading, fontWeight: 600 }}>Completar datos</button>
            )}
          </div>
        </div>
        <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: `0 2px 8px ${COLORS.shadow}` }}>
          <h4 style={{ fontWeight: 600, fontSize: 17, marginBottom: 8, fontFamily: FONTS.heading, color: COLORS.text }}>Frecuencia de Compras</h4>
          <div style={{ height: 80, display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            {frecuenciaCompra.map((val, i) => (
              <div key={i} style={{ width: 18, height: val * 12, background: COLORS.primary, borderRadius: 4 }} title={`Mes ${i+1}: ${val} compras`}></div>
            ))}
          </div>
        </div>
        <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: `0 2px 8px ${COLORS.shadow}` }}>
          <h4 style={{ fontWeight: 600, fontSize: 17, marginBottom: 8, fontFamily: FONTS.heading, color: COLORS.text }}>Descuentos</h4>
          <div style={{ fontFamily: FONTS.body, color: COLORS.text, marginBottom: 6 }}><b>Productos:</b> {descuentos.productos}</div>
          <div style={{ fontFamily: FONTS.body, color: COLORS.text, marginBottom: 6 }}><b>Servicios:</b> {descuentos.servicios}</div>
        </div>
      </div>
      {/* Panel derecho */}
      <div style={{ flex: 2, minWidth: 400 }}>
        <BarraProgreso 
          estado={progresoPedido.estado} 
          progreso={progresoPedido.progreso} 
          mostrar={progresoPedido.mostrar} // <-- pasar prop mostrar
        />
        <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: `0 2px 8px ${COLORS.shadow}` }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, fontFamily: FONTS.heading, color: COLORS.text }}>Sigue tu Servicio</h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontFamily: FONTS.body, color: COLORS.text }}>
            {servicios.map(s => (
              <li key={s.id}><b>{s.tipo}:</b> {s.estado} (Fecha: {s.fecha})</li>
            ))}
          </ul>
        </div>
        <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, boxShadow: `0 2px 8px ${COLORS.shadow}` }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, fontFamily: FONTS.heading, color: COLORS.text }}>Comprobantes de Pago</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15, fontFamily: FONTS.body }}>
            <thead>
              <tr style={{ background: COLORS.lightBlue }}>
                <th style={{ padding: 6, borderRadius: 6, fontFamily: FONTS.heading, color: COLORS.text }}>Tipo</th>
                <th style={{ padding: 6, borderRadius: 6, fontFamily: FONTS.heading, color: COLORS.text }}>Fecha</th>
                <th style={{ padding: 6, borderRadius: 6, fontFamily: FONTS.heading, color: COLORS.text }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              {comprobantes.map(c => (
                <tr key={c.id}>
                  <td style={{ padding: 6, color: COLORS.text }}>{c.tipo}</td>
                  <td style={{ padding: 6, color: COLORS.text }}>{c.fecha}</td>
                  <td style={{ padding: 6, color: COLORS.text }}>S/ {c.monto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default PanelCliente;
