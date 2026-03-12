import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { COLORS, FONTS } from "../../colors";
import LoginRegister from "./LoginRegister";

const LoginInicioSesion = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const documentoInputRef = useRef(null);

  // Estado para alternar entre login y registro
  const [isLogin, setIsLogin] = useState(true);

  // Estados de login
  const [loginForm, setLoginForm] = useState({ correo: "", contraseña: "" });
  
  // Estados de registro
  const [tipoDoc, setTipoDoc] = useState("");
  const [form, setForm] = useState({
    nombre: "",
    correo: "",
    contraseña: "",
    numero: "",
    documento: "",
    tipo_documento: "",
    tipo_cliente_id: ""
  });
  const [documentoValido, setDocumentoValido] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  
  // Estados compartidos
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const stateFrom = location.state?.from;
  const searchFrom = (() => {
    try {
      const params = new URLSearchParams(location.search);
      return params.get("from") || undefined;
    } catch {
      return undefined;
    }
  })();
  const fromPath = stateFrom || searchFrom;

  // Cargar Google Identity Services solo una vez
  useEffect(() => {
    if (window.google && window.google.accounts) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Renderizar botón de Google según el modo (login o registro)
  useEffect(() => {
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
          setMensaje("No se pudo cargar el script de Google. Verifica tu conexión o recarga la página.");
        }
        return;
      }
      div.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: "1000681433446-mgbmp68bol11vjn56rfsb2ai9l732tbb.apps.googleusercontent.com",
        callback: async (response) => {
          setMensaje("Verificando con Google...");
          try {
            let res = await fetch("http://localhost:5000/api/auth/google-login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: response.credential })
            });
            let json = await res.json();
            if (json.success) {
              localStorage.setItem("auth_token", json.token);
              if (json.cliente) {
                if (json.cliente.id_cliente) localStorage.setItem("cliente_id", json.cliente.id_cliente);
                if (json.cliente.correo) localStorage.setItem("cliente_correo", json.cliente.correo);
                if (json.cliente.nombre) localStorage.setItem("cliente_nombre", json.cliente.nombre);
                if (json.cliente.numero) localStorage.setItem("cliente_numero", json.cliente.numero);
                if (json.cliente.documento) localStorage.setItem("cliente_documento", json.cliente.documento);
              }
              navigate(fromPath || "/user", { replace: true });
              return;
            }
            if (res.status === 404 || (json.message && json.message.toLowerCase().includes("no registrado"))) {
              res = await fetch("http://localhost:5000/api/auth/google-register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential })
              });
              json = await res.json();
              if (json.success) {
                localStorage.setItem("auth_token", json.token);
                if (json.cliente) {
                  if (json.cliente.id_cliente) localStorage.setItem("cliente_id", json.cliente.id_cliente);
                  if (json.cliente.correo) localStorage.setItem("cliente_correo", json.cliente.correo);
                  if (json.cliente.nombre) localStorage.setItem("cliente_nombre", json.cliente.nombre);
                  if (json.cliente.numero) localStorage.setItem("cliente_numero", json.cliente.numero);
                  if (json.cliente.documento) localStorage.setItem("cliente_documento", json.cliente.documento);
                }
                navigate(fromPath || "/user", { replace: true });
                return;
              }
              setMensaje(json.message || "No se pudo registrar con Google");
              return;
            }
            setMensaje(json.message || "No se pudo iniciar sesión con Google");
          } catch (err) {
            setMensaje("Error de conexión con Google Auth");
          }
        },
        ux_mode: "popup",
        auto_select: false
      });
      window.google.accounts.id.renderButton(div, {
        theme: "outline",
        size: "large",
        logo_alignment: "left",
        text: isRegistro ? 'signup_with' : 'signin_with',
        shape: "pill",
        type: isRegistro ? 'standard' : undefined
      });
    }
    renderGoogleButton(isLogin ? 'googleSignInDivLogin' : 'googleSignInDivRegistro');
  }, [isLogin, fromPath]);

  const handleTipoDoc = (tipo) => {
    const nextTipo = tipoDoc === tipo ? "" : tipo;
    setTipoDoc(nextTipo);
    setDocumentoValido(false);
    setMensaje("");
    setForm((prev) => ({
      ...prev,
      documento: "",
      tipo_documento: nextTipo,
      nombre: nextTipo ? prev.nombre : ""
    }));
    if (nextTipo && documentoInputRef.current) {
      setTimeout(() => documentoInputRef.current?.focus(), 50);
    }
  };

  const handleDocumentoBlur = async () => {
    setMensaje("");
    setDocLoading(false);
    setDocumentoValido(false);
    
    if (!tipoDoc) {
      setMensaje("Selecciona el tipo de documento (RUC o DNI)");
      return;
    }
    
    const expectedLength = tipoDoc === "DNI" ? 8 : 11;
    const doc = (form.documento || "").trim();
    
    if (doc.length !== expectedLength) {
      setMensaje(`El ${tipoDoc} debe tener ${expectedLength} dígitos`);
      return;
    }
    
    setDocLoading(true);
    
    try {
      // Usar endpoint del backend que tiene el token actualizado
      const res = await fetch('/api/consulta_documento_html', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
          tipo: tipoDoc, 
          numero: doc 
        })
      });
      
      const data = await res.json();
      
      if (!data.success || data.error) {
        setMensaje(data.message || "No se encontró el documento en RENIEC/SUNAT");
        setForm(f => ({ ...f, nombre: "" }));
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
      setForm(f => ({ ...f, nombre: "" }));
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
    if (!documentoValido) {
      setMensaje("Valida el documento antes de registrarte.");
      return;
    }
    if (!form.nombre || !form.correo || !form.contraseña || !form.numero) {
      setMensaje("Completa todos los campos obligatorios.");
      return;
    }
    setLoading(true);
    try {
      const body = {
        nombre: form.nombre,
        correo: form.correo,
        contraseña: form.contraseña,
        numero: form.numero,
        documento: form.documento,
        tipo_cliente_id: form.tipo_cliente_id,
        tipo_documento: form.tipo_documento
      };
      const res = await fetch("http://localhost:5000/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = { success: false, message: text || "Respuesta no válida del servidor" };
      }
      if (json.success) {
        setMensaje("¡Registro exitoso!");
        setForm({ nombre: "", correo:"", contraseña:"", numero: "", documento: "", tipo_documento: "", tipo_cliente_id: "" });
        setTipoDoc("");
        try {
          const nuevoClienteId = json.cliente?.id_cliente;
          const localCarrito = localStorage.getItem("carrito_id");
          if (nuevoClienteId && localCarrito) {
            await fetch("http://localhost:5000/api/carrito_compras/attach", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ carrito_id: localCarrito, cliente_id: nuevoClienteId })
            });
          }
        } catch (err) {
          console.warn("No se pudo asociar carrito tras registro:", err);
        }
        // Cambiar a vista de login tras registro exitoso
        setIsLogin(true);
      } else {
        const detalle = json.error?.message || json.error || json.message;
        setMensaje(detalle || "No se pudo registrar");
      }
      setLoading(false);
    } catch (err) {
      setMensaje("Error de conexión");
      setLoading(false);
    }
  };

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
        try {
          if (json.cliente?.id_cliente) {
            localStorage.setItem("cliente_id", json.cliente.id_cliente);
            if (json.cliente?.correo) localStorage.setItem("cliente_correo", json.cliente.correo);
            if (json.cliente?.nombre) localStorage.setItem("cliente_nombre", json.cliente.nombre);
            if (json.cliente?.numero) localStorage.setItem("cliente_numero", json.cliente.numero);
            if (json.cliente?.documento) localStorage.setItem("cliente_documento", json.cliente.documento);
          }
          if (json.token) {
            localStorage.setItem("auth_token", json.token);
          }
        } catch {}
        try {
          const localCarrito = localStorage.getItem("carrito_id");
          const clienteId = json.cliente?.id_cliente;
          if (clienteId) {
            if (localCarrito) {
              await fetch("http://localhost:5000/api/carrito_compras/attach", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ carrito_id: localCarrito, cliente_id: clienteId })
              });
            } else {
              const r = await fetch("http://localhost:5000/api/carrito_compras", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cliente_id: clienteId })
              });
              const j = await r.json().catch(() => ({}));
              if (j && j.carrito_id) {
                localStorage.setItem("carrito_id", j.carrito_id);
              }
            }
          }
        } catch (err) {
          console.warn("No se pudo asociar el carrito al cliente:", err);
        }
        navigate(fromPath || "/user", { replace: true });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col md:flex-row items-center justify-center p-4 sm:p-6 lg:p-8 gap-4 md:gap-0 w-full">
      {/* Login Panel */}
      <div className={`flex-1 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl bg-white/90 backdrop-blur-sm max-w-md w-full ${isLogin ? 'block' : 'hidden md:block'}`}>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-900 font-[inherit]">Iniciar Sesión</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={loginForm.correo}
            onChange={(e) => setLoginForm({ ...loginForm, correo: e.target.value })}
            className="p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base w-full"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={loginForm.contraseña}
            onChange={(e) => setLoginForm({ ...loginForm, contraseña: e.target.value })}
            className="p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base w-full"
            required
          />
          <button 
            type="submit" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition-all duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Cargando..." : "INICIAR SESIÓN"}
          </button>
        </form>
        <div className="text-center mt-6 text-sm text-gray-600 mb-6">O ingresa con</div>
        <div id="googleSignInDivLogin" className="flex justify-center"></div>
        <div className={`mt-4 text-center text-sm ${mensaje.includes("exitoso") ? 'text-green-600' : 'text-red-600'}`}>
          {mensaje}
        </div>
      </div>

      {/* Animated Blue Panel */}
      <div className={`relative flex-1 max-w-md w-full rounded-2xl shadow-xl overflow-hidden transition-all duration-700 ${isLogin ? 'order-1 md:order-2' : 'order-2 md:order-1'}`}>
        <div className="h-64 sm:h-72 md:h-80 lg:h-96 w-full bg-gradient-to-br from-indigo-500 to-blue-600 flex flex-col items-center justify-center p-6 sm:p-8 text-white text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 drop-shadow-lg">¡Bienvenido!</h2>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8 max-w-xs sm:max-w-sm">Ingrese sus datos personales para usar todas las funciones del sitio</p>
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 sm:py-4 px-8 sm:px-12 rounded-xl text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "REGÍSTRATE" : "INICIA SESIÓN"}
          </button>
        </div>
      </div>

      {/* Register Panel */}
      {!isLogin && (
        <div className="flex-1 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl bg-white/90 backdrop-blur-sm max-w-md w-full md:order-3">
          <LoginRegister
            isLogin={isLogin}
            tipoDoc={tipoDoc}
            handleTipoDoc={handleTipoDoc}
            form={form}
            setForm={setForm}
            handleDocumentoBlur={handleDocumentoBlur}
            documentoValido={documentoValido}
            docLoading={docLoading}
            mensaje={mensaje}
            handleSubmit={handleSubmit}
            documentoInputRef={documentoInputRef}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
};

export default LoginInicioSesion;

