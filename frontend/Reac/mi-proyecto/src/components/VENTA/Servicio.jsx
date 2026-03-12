import React, { useState, useEffect } from "react";
import { IconSearch, IconX, IconUser, IconBuilding } from "@tabler/icons-react";
import { COLORS, FONTS } from "../../colors";
import { getPresupuestos, updatePresupuesto, removePresupuesto, clearPresupuestos } from "../../utils/ramPresupuestos";
import PresupuestoServicio from "../PresupuestoServicio";
import { guardarPresupuestosConCliente } from "../../services/presupuestoGuardarService";

const CotizacionView = () => {
  const [tipoDocumentos, setTipoDocumentos] = useState([]);
  const [editingPresupuesto, setEditingPresupuesto] = useState(null);

  // fila actions
  const handleEditar = (p) => {
    setEditingPresupuesto(p);
  };
  const handleEliminar = (p) => {
    removePresupuesto(p.__ram_id);
    setLocalPresupuestos(prev => prev.filter(x => x.__ram_id !== p.__ram_id));
  };
  const handleClearAll = () => {
    if (window.confirm('¿Eliminar todos los presupuestos en memoria?')) {
      clearPresupuestos();
      setLocalPresupuestos([]);
    }
  };
  const handleSaveAll = async () => {
    // Validar que haya documento
    if (!digitos || digitos.trim() === '') {
      alert('Por favor ingresa un número de documento');
      return;
    }
    
    if (localPresupuestos.length === 0) {
      alert('No hay presupuestos para guardar');
      return;
    }
    
    // Llamar al servicio para guardar presupuestos
    await guardarPresupuestosConCliente({
      documento: digitos,
      nombreApis: nombreCliente,
      presupuestos: localPresupuestos,
      onSuccess: (result) => {
        alert(`✓ ${result.message}\n${result.clienteStatus}`);
        // Opcionalmente limpiar después de guardar
        clearPresupuestos();
        setLocalPresupuestos([]);
        setDigitos('');
        setNombreCliente('');
      },
      onError: (msg) => {
        alert(`✗ Error: ${msg}`);
      }
    });
  };
  const handleSaveEdited = (updated) => {
    updatePresupuesto(updated.__ram_id, updated);
    setLocalPresupuestos(prev => prev.map(x => x.__ram_id === updated.__ram_id ? updated : x));
    setEditingPresupuesto(null);
  };
  const handleCloseEdit = () => setEditingPresupuesto(null);
  const [tipoDocumentoSeleccionado, setTipoDocumentoSeleccionado] = useState(null);
  const [digitos, setDigitos] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [filtroTexto, setFiltroTexto] = useState("");
  const [busquedaEstado, setBusquedaEstado] = useState("");
  const [busquedaOk, setBusquedaOk] = useState(false);
  const [cargandoDoc, setCargandoDoc] = useState(false);
  // no guardaremos en servidor todavía; todo vive en memoria RAM
  const [localPresupuestos, setLocalPresupuestos] = useState([]);

  useEffect(() => {
    fetch('/api/tipo_documento')
      .then(res => res.json())
      .then(data => setTipoDocumentos(data.tipos || []))
      .catch(() => setTipoDocumentos([]));
  }, []);

  const getTipoDescripcion = () =>
    tipoDocumentos.find(tc => tc.id_tipo === tipoDocumentoSeleccionado)?.descripcion || '';

  const validarNumero = (tipo, numero) => {
    if (!tipo || !numero) return { ok: false, msg: 'Seleccione tipo e ingrese número.' };
    if (tipo === 'DNI' && !/^\d{7,8}$/.test(numero))
      return { ok: false, msg: 'El DNI debe tener 7 u 8 dígitos.' };
    if (tipo === 'RUC' && !/^\d{11}$/.test(numero))
      return { ok: false, msg: 'El RUC debe tener 11 dígitos.' };
    return { ok: true, msg: '' };
  };


  const consultarDocumentoBackend = async (tipo, numero) => {
    setCargandoDoc(true);
    setBusquedaEstado('Consultando...');
    setBusquedaOk(false);
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
        setBusquedaEstado('✓ Cliente encontrado');
        setBusquedaOk(true);
      } else {
        setNombreCliente('');
        setBusquedaOk(false);
        if (tipo === 'DNI' && numero.length === 7) {
          setBusquedaEstado('DNI no encontrado. Puedes ingresar el nombre manualmente.');
        } else {
          setBusquedaEstado(data.message || 'No se encontró información para ese documento.');
        }
      }
    } catch {
      setNombreCliente('');
      setBusquedaOk(false);
      setBusquedaEstado('Error de conexión con el servidor.');
    } finally {
      setCargandoDoc(false);
    }
  };


  const handleBuscarCliente = () => {
    const tipo = getTipoDescripcion();
    if (digitos.trim()) {
      const valid = validarNumero(tipo, digitos.trim());
      if (!valid.ok) { setBusquedaEstado(valid.msg); setBusquedaOk(false); return; }
      consultarDocumentoBackend(tipo, digitos.trim());
      return;
    }
    if (filtroTexto.trim()) {
      setBusquedaEstado(`Buscando "${filtroTexto}"...`);
      setBusquedaOk(false);
      fetch(`/api/clientes?filtro=${encodeURIComponent(filtroTexto.trim())}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setNombreCliente(data[0].nombre || '');
            setBusquedaEstado(`✓ Se encontraron ${data.length} resultado(s)`);
            setBusquedaOk(true);
          } else {
            setNombreCliente('');
            setBusquedaEstado('No se encontraron resultados.');
            setBusquedaOk(false);
          }
        })
        .catch(() => { setBusquedaEstado('Error de conexión.'); setBusquedaOk(false); });
      return;
    }
    setBusquedaEstado('Ingresa un número de documento o una razón social para buscar.');
    setBusquedaOk(false);
  };


  useEffect(() => {
    if (!tipoDocumentoSeleccionado || !digitos) { setBusquedaEstado(''); return; }
    const tipo = getTipoDescripcion();
    const valid = validarNumero(tipo, digitos);
    if (!valid.ok) { setBusquedaEstado(valid.msg); setBusquedaOk(false); setNombreCliente(''); return; }
    consultarDocumentoBackend(tipo, digitos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoDocumentoSeleccionado, digitos]);

  const limpiarCliente = () => {
    setNombreCliente('');
    setDigitos('');
    setFiltroTexto('');
    setBusquedaEstado('');
    setBusquedaOk(false);
    setTipoDocumentoSeleccionado(null);
  };



  // no necesitamos obtener presupuestos del backend por ahora

  useEffect(() => {
    // initialize from RAM storage when component mounts
    const existing = getPresupuestos();
    if (existing.length) setLocalPresupuestos(existing);

    const handleNew = (e) => {
      const nuevo = e?.detail || {};
      setLocalPresupuestos(prev => [...prev, nuevo]);
    };
    window.addEventListener('presupuestoGuardado', handleNew);
    return () => window.removeEventListener('presupuestoGuardado', handleNew);
  }, []);

  const inputStyle = {
    padding: '10px',
    boxSizing: 'border-box',
    borderRadius: '6px',
    border: `1px solid ${COLORS.border}`,
    fontSize: '1rem',
    fontFamily: FONTS.body,
    color: COLORS.text,
    background: COLORS.white,
  };

  const buttonStyle = {
    padding: '10px 22px',
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
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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

  return (
    <div style={{ fontFamily: FONTS.body, padding: '20px' }}>
      <div style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: `0 1px 6px ${COLORS.shadow}`
      }}>
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: '1.1rem', color: COLORS.text }}>
            Datos del cliente
          </span>
          {(nombreCliente || digitos || filtroTexto) && (
            <button
              onClick={limpiarCliente}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.textLight, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem' }}
            >
              <IconX size={14} /> Limpiar
            </button>
          )}
        </div>

        {/* Tipo de documento + número + botón */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div>
            <label style={{ fontFamily: FONTS.body, fontSize: '0.88rem', color: COLORS.textLight, display: 'block', marginBottom: '4px' }}>
              Tipo de documento
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {Array.isArray(tipoDocumentos) && tipoDocumentos.length > 0
                ? tipoDocumentos.map((tipo) => (
                  <label key={tipo.id_tipo || tipo.descripcion} style={radioLabelStyle(tipoDocumentoSeleccionado === tipo.id_tipo)}>
                    <input
                      type="radio"
                      name="tipo_documento"
                      value={tipo.id_tipo}
                      checked={tipoDocumentoSeleccionado === tipo.id_tipo}
                      onChange={e => {
                        setTipoDocumentoSeleccionado(e.target.value);
                        setDigitos('');
                        setBusquedaEstado('');
                        setBusquedaOk(false);
                      }}
                      style={{ marginRight: '8px', accentColor: COLORS.primary, width: '18px', height: '18px' }}
                    />
                    {tipo.descripcion}
                  </label>
                ))
                : <span style={{ color: COLORS.textLight, fontFamily: FONTS.body }}>Cargando tipos...</span>
              }
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '160px', maxWidth: '220px' }}>
            <label style={{ fontFamily: FONTS.body, fontSize: '0.88rem', color: COLORS.textLight, display: 'block', marginBottom: '4px' }}>
              Número de documento
            </label>
            <input
              type="text"
              placeholder={tipoDocumentoSeleccionado
                ? (getTipoDescripcion() === 'RUC' ? '11 dígitos' : '7 u 8 dígitos')
                : 'Seleccione tipo'}
              value={digitos}
              onChange={e => setDigitos(e.target.value.replace(/\D/g, ''))}
              maxLength={tipoDocumentoSeleccionado ? (getTipoDescripcion() === 'RUC' ? 11 : 8) : 11}
              disabled={!tipoDocumentoSeleccionado}
              onKeyDown={e => e.key === 'Enter' && handleBuscarCliente()}
              style={{ ...inputStyle, width: '100%', opacity: tipoDocumentoSeleccionado ? 1 : 0.5 }}
            />
          </div>

          <button
            onClick={handleBuscarCliente}
            disabled={cargandoDoc}
            style={{ ...buttonStyle, opacity: cargandoDoc ? 0.7 : 1 }}
          >
            <IconSearch size={16} />
            {cargandoDoc ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Mensaje de estado */}
        {busquedaEstado && (
          <div style={{
            fontSize: '0.9rem',
            fontFamily: FONTS.body,
            color: busquedaOk ? COLORS.success : COLORS.error,
            fontWeight: 500,
            marginBottom: '10px'
          }}>
            {busquedaEstado}
          </div>
        )}

        {/* Nombre/Razón social resultado — siempre editable */}
        <div>
          <label style={{ fontFamily: FONTS.body, fontSize: '0.88rem', color: COLORS.textLight, display: 'block', marginBottom: '4px' }}>
            Nombre / Razón social
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ color: COLORS.textLight }}>
              {getTipoDescripcion() === 'RUC' ? <IconBuilding size={18} /> : <IconUser size={18} />}
            </div>
            <input
              type="text"
              value={nombreCliente}
              onChange={e => setNombreCliente(e.target.value)}
              placeholder="Se completará automáticamente o escribe manualmente"
              style={{ ...inputStyle, flex: 1, borderColor: busquedaOk ? COLORS.success : COLORS.border }}
            />
          </div>
        </div>
      </div>

      {/* Tabla de Presupuestos */}
      <div style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: `0 1px 6px ${COLORS.shadow}`,
        marginTop: '20px'
      }}>
        <h3 style={{ fontFamily: FONTS.heading, fontWeight: 700, fontSize: '1.1rem', color: COLORS.text, marginBottom: '16px' }}>
          Presupuestos de Servicio
        </h3>

        {/* Tabla de presupuestos (solo lectura) */}
        <div style={{ overflowX: 'auto' }}>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr style={{ background: COLORS.lightBlue }}>
                <th className="border border-gray-300 px-4 py-2">Descripción</th>
                <th className="border border-gray-300 px-4 py-2">Cantidad</th>
                <th className="border border-gray-300 px-4 py-2">Precio unitario (S/)</th>
                <th className="border border-gray-300 px-4 py-2">Subtotal (S/)</th>
                <th className="border border-gray-300 px-4 py-2">IGV (S/)</th>
                <th className="border border-gray-300 px-4 py-2">Total (S/)</th>
                <th className="border border-gray-300 px-4 py-2">Opciones</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const all = [...localPresupuestos];
                if (all.length === 0) {
                  return (
                    <tr>
                      <td colSpan="7" className="text-center py-4">No hay presupuestos disponibles.</td>
                    </tr>
                  );
                }
                return all.map((p) => (
                  <tr key={p.id_presupuesto || JSON.stringify(p)}>
                    <td className="border border-gray-300 px-4 py-2">{p.descripcion}</td>
                    <td className="border border-gray-300 px-4 py-2">{p.cantidad}</td>
                    <td className="border border-gray-300 px-4 py-2">{p.precio_unitario}</td>
                    <td className="border border-gray-300 px-4 py-2">{p.subtotal}</td>
                    <td className="border border-gray-300 px-4 py-2">{p.igv}</td>
                    <td className="border border-gray-300 px-4 py-2">{p.total}</td>
                    <td className="border border-gray-300 px-4 py-2 flex gap-2">
                      <button className="px-2 py-1 bg-yellow-500 text-white rounded" onClick={() => handleEditar(p)}>
                        Editar
                      </button>
                      <button className="px-2 py-1 bg-red-500 text-white rounded" onClick={() => handleEliminar(p)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
        {/* editar modal */}
      {editingPresupuesto && (
        <PresupuestoServicio
          selectedServicio={{
            id_servicio: editingPresupuesto.servicio_id,
            nombre: editingPresupuesto.descripcion
          }}
          initialPresupuesto={editingPresupuesto}
          onSave={handleSaveEdited}
          handleCloseSelected={handleCloseEdit}
        />
      )}
      {/* botones globales */}
        <div style={{ marginTop: '12px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            className="px-4 py-2 bg-yellow-600 text-white rounded"
            onClick={handleClearAll}
          >
            Limpiar todo
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded"
            onClick={handleSaveAll}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CotizacionView;