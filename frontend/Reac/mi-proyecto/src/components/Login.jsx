import React, { useState, useEffect, useRef } from "react";
import { IconBrandGoogleFilled } from '@tabler/icons-react';
import { COLORS, FONTS } from "../colors";
import { useNavigate, useLocation } from "react-router-dom";
import PanelCliente from "./PanelCliente";

const Login = () => {
  // --- Declaración de todos los estados y refs al inicio ---
  // ...existing code...
  const [tiposCliente, setTiposCliente] = useState([]);
  const [tipoClienteIds, setTipoClienteIds] = useState({ RUC: "", DNI: "" });
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    contraseña: "",
    confirmar: "",
    numero: "",
    documento: "",
    tipo_documento: "",
    tipo_cliente_id: ""
  });
  const [documentoValido, setDocumentoValido] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [logueado, setLogueado] = useState(false);
  const [loginForm, setLoginForm] = useState({ correo: '', contraseña: '' });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const documentoInputRef = useRef(null);
  const [tipoDoc, setTipoDoc] = useState("");
  // --- Fin declaración de estados ---

  // Cargar Google Identity Services solo una vez
  useEffect(() => {
    if (window.google && window.google.accounts) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Renderizar botón de Google solo en registro
  useEffect(() => {
    // Mostrar el botón de Google tanto en login como en registro
    let retryCount = 0;
    function renderGoogleButton(targetId) {
      const isRegistro = targetId === 'googleSignInDivRegistro';
      const div = document.getElementById(targetId);
      if (!div) return;
      if (!window.google || !window.google.accounts) {
        if (retryCount < 10) {
          retryCount++;
          setTimeout(() => renderGoogleButton(targetId), 300);
        } else {
          setMensaje('No se pudo cargar el script de Google. Verifica tu conexión o recarga la página.');
        }
        return;
      }
      div.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: '1000681433446-mgbmp68bol11vjn56rfsb2ai9l732tbb.apps.googleusercontent.com',
        callback: async (response) => {
          setMensaje('Verificando con Google...');
          try {
            // Siempre intentar login primero
            let res = await fetch('http://localhost:5000/api/auth/google-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ credential: response.credential })
            });
            let json = await res.json();
            if (json.success) {
              localStorage.setItem('auth_token', json.token);
              if (json.cliente) {
                if (json.cliente.id_cliente) localStorage.setItem('cliente_id', json.cliente.id_cliente);
                if (json.cliente.correo) localStorage.setItem('cliente_correo', json.cliente.correo);
                if (json.cliente.nombre) localStorage.setItem('cliente_nombre', json.cliente.nombre);
                if (json.cliente.numero) localStorage.setItem('cliente_numero', json.cliente.numero);
                if (json.cliente.documento) localStorage.setItem('cliente_documento', json.cliente.documento);
              }
              navigate('/user', { replace: true });
              return;
            }
            // Si el usuario no existe, intentar registro
            if (res.status === 404 || (json.message && json.message.toLowerCase().includes('no registrado'))) {
              res = await fetch('http://localhost:5000/api/auth/google-register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
              });
              json = await res.json();
              if (json.success) {
                localStorage.setItem('auth_token', json.token);
                if (json.cliente) {
                  if (json.cliente.id_cliente) localStorage.setItem('cliente_id', json.cliente.id_cliente);
                  if (json.cliente.correo) localStorage.setItem('cliente_correo', json.cliente.correo);
                  if (json.cliente.nombre) localStorage.setItem('cliente_nombre', json.cliente.nombre);
                  if (json.cliente.numero) localStorage.setItem('cliente_numero', json.cliente.numero);
                  if (json.cliente.documento) localStorage.setItem('cliente_documento', json.cliente.documento);
                }
                navigate('/user', { replace: true });
                return;
              } else {
                setMensaje(json.message || 'No se pudo registrar con Google');
                return;
              }
            }
            setMensaje(json.message || 'No se pudo iniciar sesión con Google');
          } catch (err) {
            setMensaje('Error de conexión con Google Auth');
          }
        },
        ux_mode: 'popup',
        auto_select: false
      });
      window.google.accounts.id.renderButton(
        div,
        {
          theme: 'outline',
          size: 'large',
          logo_alignment: 'left',
          text: isRegistro ? 'signup_with' : 'signin_with',
          shape: 'pill',
          type: isRegistro ? 'standard' : undefined
        }
      );
    }
    renderGoogleButton(isLogin ? 'googleSignInDivLogin' : 'googleSignInDivRegistro');
  }, [isLogin]);
  const navigate = useNavigate();
  const location = useLocation();
  // Ruta desde la que llegamos al login (viene por state y, como respaldo, por query ?from=)
  const stateFrom = location.state?.from;
  const searchFrom = (() => {
    try {
      const params = new URLSearchParams(location.search);
      return params.get('from') || undefined;
    } catch { return undefined; }
  })();
  const fromPath = stateFrom || searchFrom;

  useEffect(() => {
    // Si hay un token válido, marcar como logueado automáticamente
    try {
      const t = localStorage.getItem('auth_token');
      if (t) {
        const parts = t.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          if (!payload.exp || (payload.exp * 1000) > Date.now()) {
            setLogueado(true);
          } else {
            // expirado, limpiar
            localStorage.removeItem('auth_token');
          }
        }
      }
    } catch {}
    // Consultar tipos de documento (RUC/DNI) al cargar el componente
    // Endpoint real en backend: /api/tipo_documento
      fetch("http://localhost:5000/api/tipo_documento")
        .then(async (res) => {
          const raw = await res.text();
          try {
            return JSON.parse(raw);
          } catch {
            console.error("Respuesta no JSON para /api/tipo_documento:", raw);
            return [];
          }
        })
        .then((data) => {
          // Soporta tanto array como objeto con data
          const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
          setTiposCliente(arr);
          // Buscar los IDs por descripción
          const toUpper = (s) => (s || "").toString().toUpperCase();
          const ruc = (arr || []).find((t) => toUpper(t.descripcion).includes("RUC"));
          const dni = (arr || []).find((t) => toUpper(t.descripcion).includes("DNI"));
          setTipoClienteIds({
            RUC: ruc ? ruc.id_tipo : "",
            DNI: dni ? dni.id_tipo : "",
          });
        })
        .catch((err) => {
          console.error("Error obteniendo tipos de documento:", err);
        });
  }, []);
  // ...existing code...

  const handleTipoDoc = (tipo) => {
    setTipoDoc(tipo);
    setForm({ ...form, tipo_documento: tipo, tipo_cliente_id: tipo === "RUC" ? tipoClienteIds.RUC : tipoClienteIds.DNI, documento: "", nombre: "" });
  };

  // Consulta APISPERU al salir del input de documento
  const handleDocumentoBlur = async () => {
    setMensaje("");
    setDocLoading(false);
    setDocumentoValido(false);
    if (!form.documento || !tipoDoc) {
      setMensaje("Debes ingresar un RUC o DNI válido antes de continuar.");
      setDocumentoValido(false);
      return;
    }
    setDocLoading(true);
    try {
      // Usar endpoint del backend que tiene el token actualizado
      const res = await fetch('/api/consulta_documento_html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tipo: tipoDoc, 
          numero: form.documento 
        })
      });
      
      const data = await res.json();
      
      if (!data.success || data.error) {
        setMensaje(data.message || "No se encontró el documento en RENIEC/SUNAT");
        setForm(f => ({ ...f, nombre: "", documento: "" }));
        setDocLoading(false);
        setDocumentoValido(false);
        setTimeout(() => {
          if (documentoInputRef.current) documentoInputRef.current.focus();
        }, 100);
        return;
      }
      
      // data.html contiene el nombre completo ya formateado por el backend
      if (data.html) {
        setForm(f => ({ ...f, nombre: data.html }));
      }
      
      setDocLoading(false);
      setDocumentoValido(true);
    } catch (e) {
      setMensaje("Error consultando documento. Verifica tu conexión.");
      setForm(f => ({ ...f, nombre: "", documento: "" }));
      setDocLoading(false);
      setDocumentoValido(false);
      setTimeout(() => {
        if (documentoInputRef.current) documentoInputRef.current.focus();
      }, 100);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    // Validaciones básicas
    if (!form.tipo_cliente_id) {
      setMensaje("Selecciona RUC o DNI antes de registrar.");
      return;
    }
    if (!form.nombre || !form.correo || !form.contraseña || !form.numero || !form.documento) {
      setMensaje("Completa todos los campos del registro.");
      return;
    }
    if (!form.nombre) {
      setMensaje("Primero consulta el documento para obtener el nombre.");
      return;
    }
    if (form.contraseña !== (form.confirmar || form.contraseña)) {
      setMensaje("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      // Enviar todos los datos que aparecen en la imagen
      const body = {
        nombre: form.nombre,
        correo: form.correo,
        contraseña: form.contraseña,
        numero: form.numero,
        documento: form.documento,
        tipo_cliente_id: form.tipo_cliente_id,
        tipo_documento: form.tipo_documento // Por si el backend lo requiere
      };
      const res = await fetch("http://localhost:5000/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const text = await res.text();
      let json;
      try { json = JSON.parse(text); } catch { json = { success: false, message: text || 'Respuesta no válida del servidor' }; }
      if (json.success) {
        setMensaje("¡Registro exitoso!");
        setForm({ nombre: "", correo: "", contraseña: "", confirmar: "", numero: "", documento: "", tipo_documento: "", tipo_cliente_id: "" });
        setTipoDoc("");
        // Intentar asociar el carrito local al nuevo cliente
        try {
          const nuevoClienteId = json.cliente?.id_cliente;
          const localCarrito = localStorage.getItem('carrito_id');
          if (nuevoClienteId && localCarrito) {
            await fetch('http://localhost:5000/api/carrito_compras/attach', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ carrito_id: localCarrito, cliente_id: nuevoClienteId })
            });
          }
        } catch (err) {
          console.warn('No se pudo asociar carrito tras registro:', err);
        }
        // Tras registrarse con éxito, mostrar vista de Iniciar Sesión
        setIsLogin(true);
      } else {
        // Si el backend devolvió detalle de error (por ejemplo unique violation de correo)
        const detalle = json.error?.message || json.error || json.message;
        setMensaje(detalle || "No se pudo registrar");
      }
      setLoading(false);
    } catch (err) {
      setMensaje("Error de conexión");
      setLoading(false);
    }
  };

  // Lógica de inicio de sesión
  const handleLogin = async (e) => {
    e.preventDefault();
    setMensaje("");
    if (!loginForm.correo || !loginForm.contraseña) {
      setMensaje("Completa todos los campos.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/clientes/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: loginForm.correo, contraseña: loginForm.contraseña })
      });
      const json = await res.json();
      if (res.status === 200 && json.success) {
        setMensaje("¡Inicio de sesión exitoso!");
        // Guardar cliente en almacenamiento para verificar sesión en otras vistas
        try {
          if (json.cliente?.id_cliente) {
            localStorage.setItem('cliente_id', json.cliente.id_cliente);
            if (json.cliente?.correo) localStorage.setItem('cliente_correo', json.cliente.correo);
            if (json.cliente?.nombre) localStorage.setItem('cliente_nombre', json.cliente.nombre);
            if (json.cliente?.numero) localStorage.setItem('cliente_numero', json.cliente.numero);
            if (json.cliente?.documento) localStorage.setItem('cliente_documento', json.cliente.documento);
          }
          if (json.token) {
            localStorage.setItem('auth_token', json.token);
          }
        } catch {}
        // Asociar carrito local al cliente autenticado si existe
        try {
          const localCarrito = localStorage.getItem('carrito_id');
          const clienteId = json.cliente?.id_cliente;
          if (clienteId) {
            if (localCarrito) {
              // Vincula carrito anónimo al cliente
              await fetch('http://localhost:5000/api/carrito_compras/attach', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carrito_id: localCarrito, cliente_id: clienteId })
              });
            } else {
              // Si no hay carrito local, crea/obtiene uno asociado al cliente
              const r = await fetch('http://localhost:5000/api/carrito_compras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cliente_id: clienteId })
              });
              const j = await r.json().catch(() => ({}));
              if (j && j.carrito_id) {
                localStorage.setItem('carrito_id', j.carrito_id);
              }
            }
          }
        } catch (err) {
          console.warn('No se pudo asociar el carrito al cliente:', err);
        }
        // Si venimos de otra pantalla (por ejemplo, /carrito), volver allí
        if (fromPath) {
          navigate(fromPath, { replace: true });
        } else {
          // Si no hay 'from', mantenemos el comportamiento anterior
          setLogueado(true);
        }
      } else if (res.status === 404) {
        setMensaje("Este usuario no está registrado");
      } else if (res.status === 403 && json.message && json.message.includes("Google")) {
        setMensaje("Este usuario fue registrado con Google. Por favor, inicie sesión usando Google.");
      } else if (res.status === 401) {
        setMensaje("Contraseña incorrecta");
      } else {
        setMensaje(json.message || "Credenciales incorrectas");
      }
      setLoading(false);
    } catch (err) {
      setMensaje("Error de conexión");
      setLoading(false);
    }
  };

  // Hooks para verificación de datos completos (fuera de condicionales)
  // --- INICIO CÓDIGO COMENTADO ---
  /*
  const [datosCompletos, setDatosCompletos] = useState(null);
  const navigateDatos = useNavigate();
  useEffect(() => {
    if (!logueado) return;
    const token = localStorage.getItem('auth_token');
    console.log('[DEBUG] Token JWT en localStorage:', token);
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          console.log('[DEBUG] Payload decodificado del JWT:', payload);
        } else {
          console.warn('[DEBUG] El token no tiene 3 partes.');
        }
      } catch (e) {
        console.error('[DEBUG] Error decodificando el token JWT:', e);
      }
    } else {
      console.warn('[DEBUG] No hay token JWT en localStorage.');
      return;
    }
    (async () => {
      try {
        const r = await fetch('http://localhost:5000/api/clientes/me', { headers: { 'Authorization': `Bearer ${token}` } });
        const t = await r.text();
        let j; try { j = JSON.parse(t); } catch { j = null; }
        const cliente = j?.cliente || {};
        // LOG de depuración
        console.log('[DEBUG] Datos cliente recibidos en /me:', cliente);
        // Validar que los campos no sean null, undefined, vacíos o solo espacios
        const isEmpty = v => !v || (typeof v === 'string' && v.trim() === '');
        if (isEmpty(cliente?.nombre) || isEmpty(cliente?.numero) || isEmpty(cliente?.documento)) {
          console.warn('[DEBUG] Faltan datos completos. nombre:', cliente?.nombre, 'numero:', cliente?.numero, 'documento:', cliente?.documento);
          setDatosCompletos(false);
          navigateDatos('/completa-datos-google', { state: { from: fromPath }, replace: true });
        } else {
          setDatosCompletos(true);
          if (fromPath) {
            console.log('[DEBUG] Redirigiendo a fromPath:', fromPath);
            navigate(fromPath, { replace: true });
          }
        }
      } catch (e) {
        console.error('[DEBUG] Error verificando datos completos:', e);
        setDatosCompletos(false);
      }
    })();
  }, [logueado, navigateDatos, fromPath, navigate]);
  */
  // --- FIN CÓDIGO COMENTADO ---

  if (logueado) {
  return <PanelCliente onLogout={() => { setLogueado(false); setIsLogin(true); setMensaje(""); }} />;
  }
  return (
    <div style={{ width: '100vw', minHeight: '0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: COLORS.background, paddingTop: 28 }}>
  <div style={{ width: "100%", maxWidth: 760, minHeight: 340, height: 'auto', background: "rgba(255,255,255,0.95)", borderRadius: 18, boxShadow: "0 4px 24px rgba(0,0,0,0.10)", display: "flex", flexDirection: 'row', overflow: "hidden", position: 'relative' }}>
        {/* Columna izquierda: Login */}
  <div style={{ flex: 1, padding: 24, display: isLogin ? 'flex' : 'none', flexDirection: "column", justifyContent: "center", zIndex: 1, transition: 'all 0.6s cubic-bezier(.68,-0.55,.27,1.55)' }}>
    <h2 className="font-heading" style={{ fontWeight: 700, fontSize: 28, marginBottom: 12, marginTop: 0, textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Iniciar Sesión</h2>
    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        type="email"
        placeholder="Correo electrónico"
        value={loginForm.correo}
        onChange={e => setLoginForm({ ...loginForm, correo: e.target.value })}
        className="font-body"
        style={{ marginBottom: 12, padding: 10, borderRadius: 6, borderColor: COLORS.border, fontSize: 16, fontFamily: FONTS.body }}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={loginForm.contraseña}
        onChange={e => setLoginForm({ ...loginForm, contraseña: e.target.value })}
        className="font-body"
        style={{ marginBottom: 12, padding: 10, borderRadius: 6, borderColor: COLORS.border, fontSize: 16, fontFamily: FONTS.body }}
        required
      />
      <button type="submit" className="font-heading" style={{ background: COLORS.info, color: COLORS.white, fontWeight: 700, border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 18, cursor: 'pointer', marginBottom: 10, fontFamily: FONTS.heading }} disabled={loading}>
        {loading ? 'Cargando...' : 'INICIAR SESIÓN'}
      </button>
    </form>
    <a href="#" className="font-body" style={{ color: COLORS.info, textAlign: 'center', fontSize: 14, textDecoration: 'underline', fontFamily: FONTS.body }}>¿Olvidaste tu contraseña?</a>
    <div className="font-body" style={{ margin: '18px 0', textAlign: 'center', color: COLORS.textLight, fontFamily: FONTS.body }}>O ingresa con</div>
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
      {/* Botón Google Identity Services (popup) para login */}
      <div id="googleSignInDivLogin" style={{ display: isLogin ? 'flex' : 'none', justifyContent: 'center', marginTop: 12 }}></div>
    </div>
    {mensaje && (
      <div className="font-body" style={{ marginTop: 16, color: mensaje.includes("exitoso") ? COLORS.success : COLORS.error, textAlign: 'center', fontFamily: FONTS.body }}>
        {mensaje}
      </div>
    )}
  </div>
        {/* Panel azul animado, nunca cubre, solo cambia de lado */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'all 0.7s cubic-bezier(.68,-0.55,.27,1.55)'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: isLogin ? '100%' : '0%',
            transform: isLogin ? 'translateX(-100%)' : 'translateX(0%)',
            width: '100%',
            height: '100%',
            background: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
            color: COLORS.white,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: window.innerWidth < 700 ? 10 : 18,
            minHeight: 220,
            borderRadius: isLogin ? '0 18px 18px 0' : '18px 0 0 18px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
            transition: 'left 0.7s cubic-bezier(.68,-0.55,.27,1.55), transform 0.7s cubic-bezier(.68,-0.55,.27,1.55), border-radius 0.7s cubic-bezier(.68,-0.55,.27,1.55)',
            zIndex: 2
          }}>
            <h2 className="font-heading" style={{ fontWeight: 700, fontSize: 32, marginBottom: 12, marginTop: 0, textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.white }}>¡Bienvenido!</h2>
            <p className="font-body" style={{ textAlign: 'center', marginBottom: 28, marginTop: 0, fontFamily: FONTS.body, color: COLORS.white }}>Ingrese sus datos personales para usar todas las funciones del sitio</p>
            <button
              className="font-heading"
              style={{ background: COLORS.accent, color: COLORS.dark, fontWeight: 700, border: 'none', borderRadius: 10, padding: '16px 36px', fontSize: 20, cursor: 'pointer', marginTop: 10, fontFamily: FONTS.heading }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'REGÍSTRATE' : 'INICIA SESIÓN'}
            </button>
          </div>
        </div>
    {/* Columna derecha: Registro */}
  <div style={{ flex: 1, padding: 24, display: !isLogin ? 'flex' : 'none', flexDirection: "column", justifyContent: "center", zIndex: 1, transition: 'all 0.6s cubic-bezier(.68,-0.55,.27,1.55)' }}>
          <h2 className="font-heading" style={{ fontWeight: 700, fontSize: 28, marginBottom: 12, marginTop: 0, textAlign: 'center', fontFamily: FONTS.heading, color: COLORS.text }}>Registro</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, background: COLORS.gray[400], borderRadius: 8, padding: 6, alignItems: 'center', justifyContent: 'center' }}>
                <label className="font-body" style={{ color: COLORS.white, fontWeight: 600, fontFamily: FONTS.body }}>
                  <input type="checkbox" checked={tipoDoc === 'RUC'} onChange={() => handleTipoDoc('RUC')} /> RUC
                </label>
                <label className="font-body" style={{ color: COLORS.white, fontWeight: 600, fontFamily: FONTS.body }}>
                  <input type="checkbox" checked={tipoDoc === 'DNI'} onChange={() => handleTipoDoc('DNI')} /> DNI
                </label>
                <input
                  type="text"
                  placeholder={tipoDoc}
                  value={form.documento}
                  onChange={e => setForm({ ...form, documento: e.target.value })}
                  onBlur={handleDocumentoBlur}
                  ref={documentoInputRef}
                  className="font-body"
                  style={{ flex: 1, padding: 8, borderRadius: 6, borderColor: COLORS.border, fontSize: 16, background: COLORS.gray[100], fontFamily: FONTS.body }}
                  disabled={!tipoDoc}
                  maxLength={tipoDoc === 'DNI' ? 8 : 11}
                />
              </div>
              {/* Mensaje de error/documento */}
              {mensaje && (mensaje.includes('documento') || mensaje.includes('APISPERU')) && (
                <div className="font-body" style={{ color: COLORS.error, fontSize: 14, marginTop: 2, marginLeft: 4, fontFamily: FONTS.body }}>{mensaje}</div>
              )}
            </div>
            {/* El campo de nombre ya no es editable, se rellena automáticamente */}
            <input type="text" placeholder="Nombre completo" value={form.nombre} readOnly className="font-body" style={{ padding: 10, borderRadius: 6, borderColor: COLORS.border, fontSize: 16, background: COLORS.gray[50], color: COLORS.textLight, fontFamily: FONTS.body }} required />
            {docLoading && <div className="font-body" style={{ color: COLORS.info, fontSize: 14, fontFamily: FONTS.body }}>Consultando documento...</div>}
            {!docLoading && documentoValido && !form.nombre && (
              <div className="font-body" style={{ color: COLORS.error, fontSize: 14, marginTop: 2, marginLeft: 4, fontFamily: FONTS.body }}>
                No se pudo obtener el nombre de este documento. Verifica el número ingresado o revisa tu documento.
              </div>
            )}
            <input type="text" placeholder="Correo electrónico" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} className="font-body" style={{ padding: 10, borderRadius: 6, borderColor: COLORS.border, fontSize: 16, fontFamily: FONTS.body }} required disabled={!documentoValido} />
            <input type="password" placeholder="Contraseña" value={form.contraseña} onChange={e => setForm({ ...form, contraseña: e.target.value })} className="font-body" style={{ padding: 10, borderRadius: 6, borderColor: COLORS.border, fontSize: 16, fontFamily: FONTS.body }} required disabled={!documentoValido} />
            <input type="text" placeholder="Número de teléfono" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} className="font-body" style={{ padding: 10, borderRadius: 6, borderColor: COLORS.border, fontSize: 16, fontFamily: FONTS.body }} required disabled={!documentoValido} />
            <button type="submit" className="font-heading" style={{ background: COLORS.info, color: COLORS.white, fontWeight: 700, border: 'none', borderRadius: 8, padding: '12px 0', fontSize: 18, cursor: documentoValido && form.nombre ? 'pointer' : 'not-allowed', marginTop: 10, fontFamily: FONTS.heading }} disabled={!documentoValido || !form.nombre}>REGÍSTRATE</button>
            {/* Botón Google Identity Services (popup) para registro */}
            <div id="googleSignInDivRegistro" style={{ display: !isLogin ? 'flex' : 'none', justifyContent: 'center', marginTop: 12 }}></div>
          </form>
          {mensaje && (
            <div className="font-body" style={{ marginTop: 16, color: mensaje.includes("exitoso") ? COLORS.success : COLORS.error, fontFamily: FONTS.body }}>
              {mensaje}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Login;
