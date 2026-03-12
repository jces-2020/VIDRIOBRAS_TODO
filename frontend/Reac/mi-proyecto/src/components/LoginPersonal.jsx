import React, { useState, useEffect } from "react";
import IMG from '../assets/IMG.png';
import VentasBody from "./VENTA/VentasBody";
import ServicioPanel from "./VENTA/Servicio";
import Administracion from "./ADMINISTRACIÓN/Administracion";
import Obras from "./OBRAS/GestionObras";
import { useNavigate } from 'react-router-dom';

const LoginPersonal = () => {
  const [form, setForm] = useState({ nombre: "", codigo: "", area: "" });
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [autenticado, setAutenticado] = useState(false);
  const [areaUsuario, setAreaUsuario] = useState("");
  const [nombrePersonal, setNombrePersonal] = useState("");
  const [tab, setTab] = useState("Venta de productos");
  const navigate = useNavigate();

  const normalizarArea = (s) => {
    if (!s) return "";
    const normalizado = s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
    // Mapear "OPERACIONES" a "OBRAS" para compatibilidad
    if (normalizado === 'OPERACIONES') return 'OBRAS';
    return normalizado;
  }

  useEffect(() => {
    fetch("/api/tipo_personal/descripciones")
      .then((res) => res.json())
      .then((data) => setAreas(data))
      .catch(() => setAreas(["VENTAS", "ALMACÉN", "TRABAJO", "ADMINISTRACIÓN"]));
  }, []);

  // Al montar: si hay token de personal en localStorage, verificarlo y restaurar sesión
  useEffect(() => {
    const restore = async () => {
      let token = null;
      try { token = localStorage.getItem('personalToken'); } catch (e) {}
      if (!token) return;
      try {
        const res = await fetch('/api/personal/me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok && data.success && data.personal) {
          setAutenticado(true);
          const area = data.personal.area || '';
          setAreaUsuario(area);
          setNombrePersonal(data.personal.name || '');
          setForm((f) => ({ ...f, nombre: data.personal.name || f.nombre, area }));
          const areaNorm = normalizarArea(area);
          if (areaNorm === 'ALMACEN') {
            navigate('/almacen');
          }
          if (areaNorm === 'ADMINISTRACION') {
            navigate('/administracion');
          }
          if (areaNorm === 'OBRAS' || areaNorm === 'TRABAJO') {
            navigate('/obras');
          }
        } else {
          // token inválido/expirado -> limpiar
          try { localStorage.removeItem('personalToken'); } catch (e) {}
        }
      } catch (e) {
        // ignorar; no romper UI
      }
    };
    restore();
  }, [navigate]);

  useEffect(() => {
    if (form.area) {
      fetch(`/api/personal/buscar?area=${encodeURIComponent(form.area)}&codigo=all`)
        .then((res) => res.json())
        .then((data) => setUsuarios(data || []))
        .catch(() => setUsuarios([]));
    } else {
      setUsuarios([]);
    }
  }, [form.area]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setLoading(true);
    try {
      const res = await fetch("/api/personal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: form.nombre, codigo: form.codigo, area: form.area })
      });
      const data = await res.json();
      if (data.success) {
        setMensaje("¡Ingreso exitoso!");
        setAutenticado(true);
        setAreaUsuario(form.area);
        setNombrePersonal(form.nombre);
        // Guardar usuario en localStorage para que otros componentes puedan verificar rol
        const usuarioObj = { nombre: form.nombre, codigo: form.codigo, rol: form.area };
        try {
          localStorage.setItem('usuario', JSON.stringify(usuarioObj));
          if (data.token) {
            localStorage.setItem('personalToken', data.token);
          }
        } catch (e) { /* ignore storage errors */ }
        // Redirigir automáticamente según el área
        try {
          const areaNorm = normalizarArea(form.area);
          if (areaNorm === 'ALMACEN') {
            navigate('/almacen');
            return;
          }
          if (areaNorm === 'ADMINISTRACION') {
            navigate('/administracion');
            return;
          }
          if (areaNorm === 'OBRAS' || areaNorm === 'TRABAJO') {
            navigate('/obras');
            return;
          }
        } catch (e) {
          // si falló normalizar/navegar, continuar con el flujo normal
        }
      } else {
        setMensaje(data.error || "Nombre o código incorrecto");
      }
    } catch (err) {
      setMensaje("Error de conexión con el servidor");
    }
    setLoading(false);
  };

  if (autenticado) {
    const areaNorm = normalizarArea(areaUsuario);
    if (areaNorm === "VENTAS") return <VentasBody />;
    if (areaNorm === "ADMINISTRACION") return <Administracion />;
    if (areaNorm === "ALMACEN") {
      navigate('/almacen');
      return null;
    }
    if (areaNorm === "OBRAS" || areaNorm === "TRABAJO") {
      return <Obras />;
    }
  }
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        overflow: "hidden",
        marginTop: "-60px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 700,
          minHeight: 580,
          borderRadius: 32,
          boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
          background: "#fff",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "stretch",
          padding: 0,
          margin: 16,
          overflow: "hidden",
        }}
      >
        {/* Panel izquierdo con imagen */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: "none",
            background: `url(${IMG}) center center/cover no-repeat`,
            display: window.innerWidth < 700 ? "none" : "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: 0,
            clipPath: "polygon(0 0, 100% 0, 85% 100%, 0% 100%)",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          {/* Áreas dentro de la imagen */}
          <div
            style={{
              position: "absolute",
              top: 18,
              left: 0,
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              zIndex: 2,
            }}
          >
            {areas.map((label) => (
              <label
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#222",
                  background: "rgba(255,255,255,0.85)",
                  borderRadius: 8,
                  padding: "2px 8px",
                  boxShadow: "0 1px 4px #0001",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="area"
                  value={label}
                  checked={form.area === label}
                  onChange={() => setForm({ ...form, area: label, nombre: "", codigo: "" })}
                  style={{
                    accentColor: "#4dc3ff",
                    width: 15,
                    height: 15,
                    marginRight: 4,
                    cursor: "pointer",
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        {/* Panel derecho: login */}
        <div
          style={{
            flex: 1,
            background: "#fff",
            borderTopRightRadius: 32,
            borderBottomRightRadius: 32,
            minWidth: 0,
            maxWidth: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            padding: 24,
          }}
        >
          <div style={{ width: "100%", maxWidth: 340 }}>
            {/* INICIO barra azul */}
            <div
              style={{
                width: "100%",
                background: "#8ee0fa",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                padding: "8px 0 6px 0",
                textAlign: "center",
                fontWeight: 500,
                fontSize: 18,
                letterSpacing: 1,
                marginBottom: 8,
              }}
            >
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 28,
                marginBottom: 8,
                color: "#222",
                letterSpacing: 1,
              }}
            >
              Bienvenido
            </div>
            <div
              style={{
                color: "#888",
                fontSize: 16,
                marginBottom: 28,
              }}
            >
              Ingreso Personal VIDRIOBRAS
            </div>
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <input
                type="text"
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: "1.5px solid #bdbdbd",
                  fontSize: 17,
                  marginBottom: 4,
                }}
                required
              />
              <input
                type="text"
                placeholder="Código de la empresa"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: "1.5px solid #bdbdbd",
                  fontSize: 17,
                }}
                required
              />
              <button
                type="submit"
                style={{
                  background: "#ff4d4f",
                  color: "#fff",
                  fontWeight: 700,
                  border: "none",
                  borderRadius: 24,
                  padding: "14px 0",
                  fontSize: 18,
                  cursor: "pointer",
                  marginTop: 10,
                  letterSpacing: 1,
                }}
                disabled={loading}
              >
                {loading ? "Verificando..." : "Login"}
              </button>
            </form>
            {mensaje && (
              <div
                style={{
                  marginTop: 18,
                  color: mensaje.includes("exitoso") ? "#388e3c" : "red",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                {mensaje}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPersonal;