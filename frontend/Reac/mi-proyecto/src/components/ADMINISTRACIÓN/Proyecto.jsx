import React, { useEffect, useState } from 'react';
import { COLORS, FONTS } from '../../colors';

const cardStyle = {
  border: `1px solid ${COLORS.border}`,
  borderRadius: 16,
  boxShadow: '0 10px 26px rgba(0,0,0,0.06)',
  background: COLORS.white,
  padding: 24,
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.text,
  marginBottom: 6,
  fontFamily: FONTS.heading,
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  fontFamily: FONTS.body,
  fontSize: 14,
  marginTop: 4,
};

const buttonPrimaryStyle = {
  border: 'none',
  borderRadius: 12,
  padding: '12px 18px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: FONTS.heading,
  background: COLORS.success,
  color: COLORS.white,
  boxShadow: '0 10px 20px rgba(16,185,129,0.22)',
  width: '100%',
  fontSize: 15,
};

const buttonSecondaryStyle = {
  border: 'none',
  borderRadius: 10,
  padding: '8px 14px',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: FONTS.heading,
  background: COLORS.primary,
  color: COLORS.white,
  boxShadow: '0 8px 18px rgba(0,210,255,0.22)',
  fontSize: 14,
};

const buttonDangerStyle = {
  background: 'transparent',
  border: 'none',
  color: COLORS.error,
  cursor: 'pointer',
  textDecoration: 'underline',
  fontSize: 12,
  fontFamily: FONTS.body,
};

const Proyecto = ({ onToast }) => {
  const [tiposServicio, setTiposServicio] = useState([]);
  const [nombreServicio, setNombreServicio] = useState('');
  const [descripcionServicio, setDescripcionServicio] = useState('');
  const [tipoServicioId, setTipoServicioId] = useState('');
  const [imagenServicio, setImagenServicio] = useState(null);
  const [previewServicio, setPreviewServicio] = useState('');
  const [categoriasServicio, setCategoriasServicio] = useState([]);
  const [tiposCategoria, setTiposCategoria] = useState([]);
  const [nuevoTipoCategoria, setNuevoTipoCategoria] = useState('');
  const [nuevoNombreCategoria, setNuevoNombreCategoria] = useState('');
  const [categoriaTipoSeleccionado, setCategoriaTipoSeleccionado] = useState('');

  useEffect(() => {
    fetchTiposServicio();
    fetchCategoriasServicio();
    fetchTiposCategoria();
  }, []);

  const fetchTiposServicio = async () => {
    try {
      const res = await fetch('/api/tipo_servicio');
      if (!res.ok) throw new Error('No se pudo cargar tipos de servicio');
      const data = await res.json();
      setTiposServicio(Array.isArray(data) ? data : []);
    } catch (e) {
      onToast?.('Error al cargar tipos de servicio', 'error');
    }
  };

  const fetchCategoriasServicio = async () => {
    try {
      const res = await fetch('/api/categoria_servicio');
      if (!res.ok) throw new Error('No se pudo cargar categorías');
      const data = await res.json();
      setCategoriasServicio(Array.isArray(data) ? data : []);
    } catch (e) {
      onToast?.('Error al cargar categorías de servicio', 'error');
    }
  };

  const fetchTiposCategoria = async () => {
    try {
      const res = await fetch('/api/tipo_categoria');
      if (!res.ok) throw new Error('No se pudo cargar tipos');
      const data = await res.json();
      setTiposCategoria(Array.isArray(data) ? data : []);
    } catch (e) {
      onToast?.('Error al cargar tipos de categoría', 'error');
    }
  };

  const handleAgregarTipoCategoria = async () => {
    if (!nuevoTipoCategoria.trim()) {
      onToast?.('El nombre del tipo es obligatorio', 'error');
      return;
    }
    try {
      const res = await fetch('/api/tipo_categoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: nuevoTipoCategoria })
      });
      if (!res.ok) throw new Error('No se pudo agregar tipo');
      setNuevoTipoCategoria('');
      fetchTiposCategoria();
      onToast?.('Tipo agregado correctamente');
    } catch (e) {
      onToast?.('Error al agregar tipo', 'error');
    }
  };

  const handleAgregarCategoriaServicio = async () => {
    if (!nuevoNombreCategoria.trim() || !categoriaTipoSeleccionado) {
      onToast?.('Completa todos los campos', 'error');
      return;
    }
    try {
      const res = await fetch('/api/categoria_servicio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descripcion: nuevoNombreCategoria,
          tipo_categoria_id: categoriaTipoSeleccionado
        })
      });
      if (!res.ok) throw new Error('No se pudo agregar categoría');
      setNuevoNombreCategoria('');
      setCategoriaTipoSeleccionado('');
      fetchCategoriasServicio();
      onToast?.('Categoría agregada correctamente');
    } catch (e) {
      onToast?.('Error al agregar categoría', 'error');
    }
  };

  const handleEliminarCategoriaServicio = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    try {
      const res = await fetch(`/api/categoria_servicio/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar categoría');
      fetchCategoriasServicio();
      onToast?.('Categoría eliminada correctamente');
    } catch (e) {
      onToast?.('Error al eliminar categoría', 'error');
    }
  };

  const handleGuardarProyecto = async () => {
    if (!nombreServicio.trim()) {
      onToast?.('El nombre es obligatorio', 'error');
      return;
    }

    let imgUrl = null;
    if (imagenServicio) {
      const formData = new FormData();
      formData.append('file', imagenServicio);
      formData.append('tipo', tipoServicioId || 'otro');
      try {
        const resImg = await fetch('/api/servicio/upload-image', {
          method: 'POST',
          body: formData,
        });
        const dataImg = await resImg.json();
        if (resImg.ok && dataImg.url) {
          imgUrl = dataImg.url;
        } else {
          onToast?.('Error subiendo imagen', 'error');
          return;
        }
      } catch (e) {
        onToast?.('Error subiendo imagen', 'error');
        return;
      }
    }

    try {
      const body = {
        nombre: nombreServicio,
        descripcion: descripcionServicio,
        tipo_servicio_id: tipoServicioId,
        ING: imgUrl || undefined,
      };
      const res = await fetch('/api/servicio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Error guardando servicio');
      onToast?.('Proyecto/servicio registrado correctamente');
      setNombreServicio('');
      setDescripcionServicio('');
      setTipoServicioId('');
      setImagenServicio(null);
      setPreviewServicio('');
    } catch (e) {
      onToast?.('Error al guardar servicio', 'error');
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', fontFamily: FONTS.body }}>
      <div style={cardStyle}>
        <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, color: COLORS.text, fontFamily: FONTS.heading }}>
          Registrar nuevo proyecto/servicio
        </h3>

        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre</label>
            <input
              value={nombreServicio}
              onChange={e => setNombreServicio(e.target.value)}
              style={inputStyle}
              placeholder="Nombre del proyecto"
            />
          </div>

          <div>
            <label style={labelStyle}>Descripción</label>
            <textarea
              value={descripcionServicio}
              onChange={e => setDescripcionServicio(e.target.value)}
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              placeholder="Descripción del proyecto"
              rows={3}
            />
          </div>

          <div>
            <label style={labelStyle}>Tipo de servicio</label>
            <select value={tipoServicioId} onChange={e => setTipoServicioId(e.target.value)} style={inputStyle}>
              <option value="">-- Selecciona tipo --</option>
              {tiposServicio.map(t => (
                <option key={t.id_tipo} value={t.id_tipo}>{t.nombre || t.descripcion || t.id_tipo}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              src={previewServicio || 'https://via.placeholder.com/120'}
              alt="Vista previa"
              style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, border: `2px solid ${COLORS.border}`, background: COLORS.white }}
            />
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Subir imagen (opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files[0];
                  setImagenServicio(file);
                  setPreviewServicio(file ? URL.createObjectURL(file) : '');
                }}
                style={{ fontSize: 14, fontFamily: FONTS.body }}
              />
            </div>
          </div>
        </div>

        <button onClick={handleGuardarProyecto} style={{ ...buttonPrimaryStyle, marginTop: 20 }}>
          Guardar proyecto
        </button>
      </div>

      <div style={{ ...cardStyle, marginTop: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: COLORS.text, fontFamily: FONTS.heading }}>
          Gestión de Tipos de Categoría
        </h4>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input
            value={nuevoTipoCategoria}
            onChange={e => setNuevoTipoCategoria(e.target.value)}
            placeholder="Nuevo tipo"
            style={{ ...inputStyle, flex: 1, marginTop: 0 }}
          />
          <button onClick={handleAgregarTipoCategoria} style={buttonSecondaryStyle}>
            Agregar tipo
          </button>
        </div>
        <ul style={{ marginBottom: 16, paddingLeft: 0 }}>
          {tiposCategoria.map(t => (
            <li
              key={t.id_tipo_categoria}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
                padding: '8px 12px',
                background: COLORS.backgroundLight,
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                listStyle: 'none',
              }}
            >
              <span style={{ flex: 1, fontFamily: FONTS.body, fontSize: 14 }}>
                {t.nombre || t.descripcion || t.id_tipo_categoria}
              </span>
              <button onClick={() => handleEliminarTipoCategoria(t.id_tipo_categoria)} style={buttonDangerStyle}>
                Eliminar
              </button>
            </li>
          ))}
          {tiposCategoria.length === 0 && (
            <li style={{ color: COLORS.textLight, textAlign: 'center', padding: 12 }}>Sin tipos registrados</li>
          )}
        </ul>
      </div>

      <div style={{ ...cardStyle, marginTop: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, color: COLORS.text, fontFamily: FONTS.heading }}>
          Gestión de Categorías de Servicio/Proyecto
        </h4>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input
            value={nuevoNombreCategoria}
            onChange={e => setNuevoNombreCategoria(e.target.value)}
            placeholder="Nueva categoría"
            style={{ ...inputStyle, flex: 1, marginTop: 0 }}
          />
          <select
            value={categoriaTipoSeleccionado}
            onChange={e => setCategoriaTipoSeleccionado(e.target.value)}
            style={{ ...inputStyle, width: 'auto', marginTop: 0, minWidth: 150 }}
          >
            <option value="">Tipo</option>
            {tiposCategoria.map(t => (
              <option key={t.id_tipo_categoria} value={t.id_tipo_categoria}>
                {t.nombre || t.descripcion || t.id_tipo_categoria}
              </option>
            ))}
          </select>
          <button onClick={handleAgregarCategoriaServicio} style={buttonSecondaryStyle}>
            Agregar categoría
          </button>
        </div>

        <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead style={{ background: COLORS.gray[100] }}>
              <tr>
                <th style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 12px', textAlign: 'left', fontFamily: FONTS.heading }}>
                  Categoría
                </th>
                <th style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 12px', textAlign: 'left', fontFamily: FONTS.heading }}>
                  Tipo
                </th>
                <th style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 12px', textAlign: 'center', fontFamily: FONTS.heading }}>
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {categoriasServicio.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: 18, color: COLORS.textLight }}>
                    Sin categorías registradas
                  </td>
                </tr>
              ) : (
                categoriasServicio.map((c, idx) => (
                  <tr key={c.id_categoria_servicio} style={{ background: idx % 2 === 0 ? COLORS.white : COLORS.gray[50] }}>
                    <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 12px' }}>
                      {c.descripcion || c.nombre || c.id_categoria_servicio}
                    </td>
                    <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 12px' }}>
                      {c.tipo_nombre || c.tipo_categoria_id}
                    </td>
                    <td style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '10px 12px', textAlign: 'center' }}>
                      <button onClick={() => handleEliminarCategoriaServicio(c.id_categoria_servicio)} style={buttonDangerStyle}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Proyecto;
