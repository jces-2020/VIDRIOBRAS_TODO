
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const CompletaDatosGoogle = ({ onDatosActualizados }) => {
  const [form, setForm] = useState({ nombre: "", numero: "", documento: "", tipo_documento_id: "", tipo: "", tipo_cliente_id: "" });
  const [tipoClienteIds, setTipoClienteIds] = useState({ RUC: "", DNI: "" });
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [docLoading, setDocLoading] = useState(false);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  // Cargar tipos de documento desde la base de datos
  useEffect(() => {
    fetch("http://localhost:5000/api/tipo_documento")
      .then(async r => {
        const t = await r.text();
        let j; try { j = JSON.parse(t); } catch { j = null; }
        if (j && j.success && Array.isArray(j.tipos)) {
          setTiposDocumento(j.tipos);
          // Buscar los IDs por descripción para tipo_cliente_id
          const toUpper = s => (s || "").toString().toUpperCase();
          const ruc = (j.tipos || []).find(t => toUpper(t.descripcion).includes("RUC"));
          const dni = (j.tipos || []).find(t => toUpper(t.descripcion).includes("DNI"));
          setTipoClienteIds({
            RUC: ruc ? ruc.id_tipo : "",
            DNI: dni ? dni.id_tipo : "",
          });
        }
      })
      .catch(() => setTiposDocumento([]));
  }, []);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const r = await fetch("http://localhost:5000/api/clientes/me", { headers: { Authorization: `Bearer ${token}` } });
        const t = await r.text();
        let j; try { j = JSON.parse(t); } catch { j = null; }
        if (r.ok && j?.success && j?.cliente) {
          setForm({
            nombre: j.cliente.nombre || "",
            numero: j.cliente.numero || "",
            documento: j.cliente.documento || ""
          });
        }
      } catch {}
      setCargandoDatos(false);
    })();
  }, [navigate]);


  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => {
      let nuevo = { ...f, [name]: value };
      // Si cambia el tipo_documento_id, actualizar el campo tipo (descripcion) y tipo_cliente_id
      if (name === 'tipo_documento_id') {
        const doc = tiposDocumento.find(td => td.id_tipo === value);
        nuevo.tipo = doc ? doc.descripcion : '';
        nuevo.documento = '';
        nuevo.nombre = f.nombre;
        // Asignar tipo_cliente_id según descripción
        if (doc) {
          if (doc.descripcion.toUpperCase().includes('RUC')) {
            nuevo.tipo_cliente_id = tipoClienteIds.RUC;
          } else if (doc.descripcion.toUpperCase().includes('DNI')) {
            nuevo.tipo_cliente_id = tipoClienteIds.DNI;
          } else {
            nuevo.tipo_cliente_id = '';
          }
        }
      }
      return nuevo;
    });
  };

  // Consultar APISPERU al salir del input de documento
  const handleDocumentoBlur = async () => {
    setMensaje("");
    setDocLoading(true);
    setForm(f => ({ ...f, nombre: f.nombre }));
    if (!form.documento || !form.tipo) {
      setMensaje("Debes ingresar un documento válido antes de continuar.");
      setDocLoading(false);
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/validar_documento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: form.tipo, numero: form.documento })
      });
      const data = await res.json();
      if (!data.success) {
        setMensaje(data.message || "No se encontró el documento en RENIEC/SUNAT");
        setForm(f => ({ ...f, nombre: "" }));
        setDocLoading(false);
        return;
      }
      if (form.tipo === "DNI") {
        const d = data.data;
        const nombreCompleto = `${d.nombres || ""} ${d.apellidoPaterno || ""} ${d.apellidoMaterno || ""}`.trim();
        setForm(f => ({ ...f, nombre: nombreCompleto }));
      } else if (form.tipo === "RUC") {
        setForm(f => ({ ...f, nombre: data.data.razonSocial || "" }));
      }
      setDocLoading(false);
    } catch (e) {
      setMensaje("Error consultando documento en APISPERU");
      setForm(f => ({ ...f, nombre: "" }));
      setDocLoading(false);
    }
  };

  const location = useLocation();
  const fromPath = location.state?.from;

  const handleSubmit = async e => {
    e.preventDefault();
    setMensaje("");
    // Sin validaciones, permitir guardar cualquier dato
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      // Solo enviar los campos que existen en la tabla cliente
      const body = {
        nombre: form.nombre,
        numero: form.numero,
        documento: form.documento,
        tipo_cliente_id: form.tipo_cliente_id
      };
      const res = await fetch("http://localhost:5000/api/clientes/actualiza_datos_google", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (json.success) {
        setMensaje("Datos actualizados correctamente.");
        // Guardar en localStorage para que el panel los muestre al instante
        try {
          if (form.nombre) localStorage.setItem('cliente_nombre', form.nombre);
          if (form.numero) localStorage.setItem('cliente_numero', form.numero);
          if (form.documento) localStorage.setItem('cliente_documento', form.documento);
        } catch {}
        if (onDatosActualizados) onDatosActualizados(form);
        setTimeout(() => {
          if (fromPath) {
            navigate(fromPath, { replace: true });
          } else {
            navigate("/user", { replace: true });
          }
        }, 1000);
      } else {
        setMensaje(json.message || "No se pudo actualizar");
      }
    } catch {
      setMensaje("Error de conexión");
    }
    setLoading(false);
  };

  if (cargandoDatos) {
    return <div style={{ textAlign: "center", marginTop: 40 }}>Cargando datos...</div>;
  }

  return (
    <div style={{ maxWidth: 400, margin: "40px auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px #0002", padding: 24 }}>
      <h2>Completa tus datos</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input name="numero" value={form.numero} onChange={handleChange} placeholder="Número de teléfono" required />
        <div style={{ display: 'flex', gap: 8 }}>
          <select name="tipo_documento_id" value={form.tipo_documento_id} onChange={handleChange} required style={{ width: 120, padding: 6 }}>
            <option value="">Selecciona tipo de documento</option>
            {tiposDocumento.map(td => (
              <option key={td.id_tipo} value={td.id_tipo}>{td.descripcion}</option>
            ))}
          </select>
          <input
            name="documento"
            value={form.documento}
            onChange={handleChange}
            onBlur={handleDocumentoBlur}
            placeholder={form.tipo || 'Documento'}
            required
            style={{ flex: 1, padding: 6 }}
          />
        </div>
        <input
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          placeholder="Nombre completo"
          required
          style={{ fontWeight: 600, marginBottom: 6 }}
        />
        {docLoading && <div style={{ color: '#1976d2', fontSize: 13 }}>Consultando documento...</div>}
        <button type="submit" disabled={loading} style={{ background: "#1976d2", color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", fontWeight: 700 }}>
          {loading ? "Guardando..." : "Guardar y continuar"}
        </button>
        {mensaje && <div style={{ color: mensaje.includes("correctamente") ? "green" : "red", marginTop: 8 }}>{mensaje}</div>}
      </form>
    </div>
  );
};

export default CompletaDatosGoogle;
