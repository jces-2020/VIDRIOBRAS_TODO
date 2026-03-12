import React, { useCallback, useEffect, useRef, useState } from 'react';
import { COLORS, FONTS } from '../../colors';

const RegistroProductos = ({ categoriasCache, productosCache, cargarProductos, showToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoriaId, setFiltroCategoriaId] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);

  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [grosor, setGrosor] = useState('');
  const [fila, setFila] = useState('');
  const [columna, setColumna] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState('');
  const [originalImgUrl, setOriginalImgUrl] = useState('');
  const [productosAnotados, setProductosAnotados] = useState([]);

  const fileInputRef = useRef(null);

  const categoriaSeleccionadaObj = categoriasCache.find(c => String(c.id_categoria) === String(categoriaId));
  const esAccesorio = categoriaSeleccionadaObj?.nombre?.toLowerCase() === 'accesorios' || categoriaSeleccionadaObj?.nombre_categoria?.toLowerCase() === 'accesorios';

  const limpiarFormulario = useCallback(() => {
    setNombre('');
    setCodigo('');
    setCategoriaId('');
    setCantidad('');
    setPrecio('');
    setDescripcion('');
    setGrosor('');
    setFila('');
    setColumna('');
    setNewImageFile(null);
    setPreviewSrc('');
    setOriginalImgUrl('');
    setSeleccionado(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  useEffect(() => {
    if (seleccionado) {
      setNombre(seleccionado.nombre || '');
      setCodigo(seleccionado.codigo || '');
      setCategoriaId(String(seleccionado.categoria_id || seleccionado.id_categoria || ''));
      setCantidad(String(seleccionado.cantidad || ''));
      setPrecio(String(seleccionado.precio || seleccionado.precio_unitario || ''));
      setDescripcion(seleccionado.descripcion || '');
      setGrosor(seleccionado.grosor || '');
      setFila(seleccionado.fila || '');
      setColumna(seleccionado.columna || '');
      setNewImageFile(null);
      setPreviewSrc(seleccionado.IMG_P && seleccionado.IMG_P !== '' ? seleccionado.IMG_P : '');
      setOriginalImgUrl(seleccionado.IMG_P || '');
    }
  }, [seleccionado, productosCache]);

  useEffect(() => {
    if (esAccesorio) setGrosor('');
  }, [esAccesorio]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setNewImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewSrc(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAnotarProducto = async () => {
    if (!nombre.trim()) {
      showToast('El nombre del producto es obligatorio.', 'error');
      return;
    }
    if (!codigo.trim()) {
      showToast('El código del producto es obligatorio.', 'error');
      return;
    }
    if (!categoriaId) {
      showToast('Debes seleccionar una categoría.', 'error');
      return;
    }
    if (!cantidad || Number(cantidad) < 1) {
      showToast('La cantidad debe ser al menos 1.', 'error');
      return;
    }
    if (!precio || Number(precio) <= 0) {
      showToast('El precio debe ser mayor a 0.', 'error');
      return;
    }

    const productoExistente = productosCache.find(p => p.codigo === codigo);
    const datosProducto = {
      nombre,
      codigo,
      categoria_id: categoriaId,
      cantidad,
      precio,
      descripcion,
      grosor: esAccesorio ? '' : grosor,
      fila,
      columna,
    };

    let imgUrl = originalImgUrl;
    if (newImageFile) {
      const formData = new FormData();
      formData.append('file', newImageFile);
      try {
        const resImg = await fetch('/api/productos/upload-image', {
          method: 'POST',
          body: formData,
        });
        const dataImg = await resImg.json();
        if (resImg.ok && dataImg.url) {
          imgUrl = dataImg.url;
        } else {
          showToast('Error subiendo imagen', 'error');
          return;
        }
      } catch (e) {
        showToast('Error subiendo imagen', 'error');
        return;
      }
    }
    datosProducto.IMG_P = imgUrl || '';

    try {
      let res;
      if (productoExistente) {
        res = await fetch(`/api/productos/${productoExistente.id_producto}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosProducto),
        });
      } else {
        res = await fetch('/api/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(datosProducto),
        });
      }

      if (!res.ok) throw new Error('Error guardando producto');
      showToast(`Producto ${productoExistente ? 'actualizado' : 'registrado'} correctamente`);

      const anotado = { ...datosProducto };
      setProductosAnotados(prev => [...prev, anotado]);

      await cargarProductos();
      limpiarFormulario();
    } catch (e) {
      showToast('Error al guardar producto', 'error');
    }
  };

  const handleGuardarTodos = async () => {
    if (productosAnotados.length === 0) {
      showToast('No hay productos anotados para guardar.', 'error');
      return;
    }
    try {
      for (const p of productosAnotados) {
        const productoExistente = productosCache.find(pr => pr.codigo === p.codigo);
        if (productoExistente) {
          await fetch(`/api/productos/${productoExistente.id_producto}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
          });
        } else {
          await fetch('/api/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
          });
        }
      }
      showToast('Todos los productos han sido guardados');
      setProductosAnotados([]);
      await cargarProductos();
    } catch (e) {
      showToast('Error al guardar productos', 'error');
    }
  };

  const handleEliminar = async () => {
    if (!seleccionado) {
      showToast('Selecciona un producto para eliminar.', 'error');
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar el producto "${seleccionado.nombre}"?`)) return;
    try {
      const res = await fetch(`/api/productos/${seleccionado.id_producto}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar el producto.');
      showToast('Producto eliminado correctamente');
      await cargarProductos();
      limpiarFormulario();
    } catch (e) {
      showToast('Error al eliminar producto', 'error');
    }
  };

  const productosFiltrados = productosCache.filter(p => {
    const porBusqueda = !searchTerm.trim() ||
      (p.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.codigo || '').toLowerCase().includes(searchTerm.toLowerCase());
    const porCategoria = !filtroCategoriaId || String(p.categoria_id || p.id_categoria) === filtroCategoriaId;
    return porCategoria && porBusqueda;
  });

  return (
    <>
      <div className="mb-6">
        <label style={{ fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.text }} className="mb-2 block">Filtrar por Categoría</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltroCategoriaId('')}
            style={{
              padding: '8px 16px',
              fontSize: '0.875rem',
              fontWeight: 'bold',
              borderRadius: '9999px',
              border: `2px solid ${!filtroCategoriaId ? COLORS.primary : COLORS.border}`,
              backgroundColor: !filtroCategoriaId ? COLORS.primary : COLORS.white,
              color: !filtroCategoriaId ? COLORS.white : COLORS.text,
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontFamily: FONTS.heading
            }}
          >
            TODOS
          </button>
          {categoriasCache.map(c => (
            <button
              key={c.id_categoria}
              onClick={() => {
                const newCatId = String(c.id_categoria);
                if (filtroCategoriaId === newCatId) {
                  setFiltroCategoriaId('');
                } else {
                  setFiltroCategoriaId(newCatId);
                }
              }}
              style={{
                padding: '8px 16px',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                borderRadius: '9999px',
                border: `2px solid ${filtroCategoriaId === String(c.id_categoria) ? COLORS.primary : COLORS.border}`,
                backgroundColor: filtroCategoriaId === String(c.id_categoria) ? COLORS.primary : COLORS.white,
                color: filtroCategoriaId === String(c.id_categoria) ? COLORS.white : COLORS.text,
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontFamily: FONTS.heading
              }}
            >
              {(c.nombre_categoria || c.nombre || c.descripcion || `ID: ${c.id_categoria}`).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 30%', minWidth: '280px', maxWidth: '340px', display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontWeight: 600, color: COLORS.text, marginBottom: '0.5rem', fontFamily: FONTS.heading }}>Productos existentes</label>
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            style={{
              width: '100%',
              padding: '0.5rem',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '0.375rem',
              marginBottom: '0.75rem',
              fontFamily: FONTS.body,
              color: COLORS.text
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div style={{ flexGrow: 1, border: `1px solid ${COLORS.border}`, borderRadius: '0.375rem', padding: '0.5rem', overflowY: 'auto', height: '12rem', backgroundColor: COLORS.backgroundLight }}>
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map(p => (
                <div
                  key={p.id_producto}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    backgroundColor: seleccionado?.id_producto === p.id_producto ? COLORS.light : 'transparent',
                    fontFamily: FONTS.body
                  }}
                  onClick={() => setSeleccionado(p)}
                  onMouseEnter={(e) => {
                    if (seleccionado?.id_producto !== p.id_producto) {
                      e.currentTarget.style.backgroundColor = COLORS.gray[100];
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (seleccionado?.id_producto !== p.id_producto) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <img src={p.IMG_P && p.IMG_P !== '' ? p.IMG_P : 'https://via.placeholder.com/40'} alt={p.nombre} style={{ width: '2.5rem', height: '2.5rem', objectFit: 'cover', borderRadius: '0.375rem' }} />
                  <span style={{ fontWeight: 500, color: COLORS.text }}>{p.nombre || 'Sin nombre'}</span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: COLORS.textLight, marginTop: '2.5rem', fontFamily: FONTS.body }}>No se encontraron productos.</div>
            )}
          </div>
          <button onClick={limpiarFormulario} style={{
            marginTop: '1rem',
            width: '100%',
            backgroundColor: COLORS.success,
            color: COLORS.white,
            padding: '0.5rem',
            borderRadius: '0.375rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            fontFamily: FONTS.heading
          }}>
            + Agregar Nuevo Producto
          </button>
        </div>

        <div style={{ flex: '1 1 60%', minWidth: '320px', backgroundColor: COLORS.backgroundLight, padding: '1.5rem', borderRadius: '0.5rem', border: `1px solid ${COLORS.border}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
          <div className="min-w-0 flex flex-col" style={{ width: '100%' }}>
            <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: COLORS.text, marginBottom: '1rem', fontFamily: FONTS.heading }}>Formulario de Producto</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: COLORS.textLight, fontFamily: FONTS.body }}>Nombre</label>
                <input value={nombre} onChange={e => setNombre(e.target.value)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.border}`, borderRadius: '0.375rem', fontFamily: FONTS.body, color: COLORS.text }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: COLORS.textLight, fontFamily: FONTS.body }}>Código</label>
                <input value={codigo} onChange={e => setCodigo(e.target.value)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.border}`, borderRadius: '0.375rem', fontFamily: FONTS.body, color: COLORS.text }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: COLORS.textLight, fontFamily: FONTS.body }}>Categoría</label>
                <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.border}`, borderRadius: '0.375rem', backgroundColor: COLORS.white, fontFamily: FONTS.body, color: COLORS.text }}>
                  <option value="">-- Selecciona una categoría --</option>
                  {categoriasCache.map(c => (
                    <option key={c.id_categoria} value={c.id_categoria}>
                      {c.nombre_categoria || c.nombre || c.descripcion || `ID: ${c.id_categoria}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: COLORS.textLight, fontFamily: FONTS.body }}>Cantidad</label>
                <input
                  type="number"
                  value={cantidad}
                  min={1}
                  onChange={e => {
                    const productoExistente = productosCache.find(p => p.codigo === codigo);
                    const val = e.target.value;
                    if (productoExistente && Number(val) < 1) return;
                    setCantidad(val);
                  }}
                  style={{ marginTop: '0.25rem', width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.border}`, borderRadius: '0.375rem', fontFamily: FONTS.body, color: COLORS.text }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: COLORS.textLight, fontFamily: FONTS.body }}>Precio Unitario</label>
                <input type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.border}`, borderRadius: '0.375rem', fontFamily: FONTS.body, color: COLORS.text }} />
              </div>
              {!esAccesorio && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: COLORS.textLight, fontFamily: FONTS.body }}>Grosor</label>
                  <input value={grosor} onChange={e => setGrosor(e.target.value)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.border}`, borderRadius: '0.375rem', fontFamily: FONTS.body, color: COLORS.text }} />
                </div>
              )}
              <div className="sm:col-span-2">
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: COLORS.textLight, fontFamily: FONTS.body }}>Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.border}`, borderRadius: '0.375rem', fontFamily: FONTS.body, color: COLORS.text }} rows="3"></textarea>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: COLORS.textLight, fontFamily: FONTS.body }}>Fila</label>
                <input value={fila} onChange={e => setFila(e.target.value)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.border}`, borderRadius: '0.375rem', fontFamily: FONTS.body, color: COLORS.text }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: COLORS.textLight, fontFamily: FONTS.body }}>Columna</label>
                <input value={columna} onChange={e => setColumna(e.target.value)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.5rem', border: `1px solid ${COLORS.border}`, borderRadius: '0.375rem', fontFamily: FONTS.body, color: COLORS.text }} />
              </div>
              <div className="sm:col-span-2 flex items-center gap-4">
                <img src={previewSrc || 'https://via.placeholder.com/150'} alt="Vista previa" style={{ width: '8rem', height: '8rem', objectFit: 'cover', borderRadius: '0.5rem', border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.white }} />
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: COLORS.textLight, marginBottom: '0.25rem', fontFamily: FONTS.body }}>Subir imagen (opcional)</label>
                  <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="text-sm" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={handleEliminar} disabled={!seleccionado} style={{
                backgroundColor: seleccionado ? COLORS.error : COLORS.gray[300],
                color: COLORS.white,
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontWeight: 600,
                border: 'none',
                cursor: seleccionado ? 'pointer' : 'not-allowed',
                fontFamily: FONTS.heading
              }}>
                Eliminar
              </button>
              <button onClick={limpiarFormulario} style={{
                backgroundColor: COLORS.gray[500],
                color: COLORS.white,
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontFamily: FONTS.heading
              }}>
                Limpiar
              </button>
              <button onClick={handleAnotarProducto} style={{
                backgroundColor: COLORS.accent,
                color: COLORS.text,
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontFamily: FONTS.heading
              }}>
                Guardar producto
              </button>
            </div>
          </div>

          <div className="min-w-0 flex flex-col justify-start" style={{ width: '100%' }}>
            <h5 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: COLORS.text, fontFamily: FONTS.heading }}>Productos anotados (reporte)</h5>
            <table style={{ width: '100%', border: `1px solid ${COLORS.border}`, fontSize: '0.875rem', backgroundColor: COLORS.white, borderCollapse: 'collapse', fontFamily: FONTS.body }}>
              <thead>
                <tr style={{ backgroundColor: COLORS.gray[200] }}>
                  <th style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.text }}>Código</th>
                  <th style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.text }}>Nombre</th>
                  <th style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.text }}>Cantidad</th>
                  <th style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.text }}>Categoría</th>
                </tr>
              </thead>
              <tbody>
                {productosAnotados.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: COLORS.gray[400], padding: '0.5rem', fontFamily: FONTS.body }}>Sin productos anotados</td></tr>
                ) : (
                  productosAnotados.map((p, idx) => {
                    const cat = categoriasCache.find(c => String(c.id_categoria) === String(p.categoria_id));
                    return (
                      <tr key={p.codigo + '-' + idx}>
                        <td style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', color: COLORS.text }}>{p.codigo}</td>
                        <td style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', color: COLORS.text }}>{p.nombre}</td>
                        <td style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', color: COLORS.text }}>{p.cantidad}</td>
                        <td style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', color: COLORS.text }}>{cat ? (cat.nombre_categoria || cat.nombre || cat.descripcion) : p.categoria_id}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <button style={{
              marginTop: '1rem',
              width: '100%',
              backgroundColor: COLORS.secondary,
              color: COLORS.white,
              padding: '0.5rem',
              borderRadius: '0.375rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              fontFamily: FONTS.heading
            }}>
              Generar reporte
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegistroProductos;
