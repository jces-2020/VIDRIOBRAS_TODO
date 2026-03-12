import React, { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../colors';
import { addPresupuesto } from '../utils/ramPresupuestos';

const PresupuestoServicio = ({ selectedServicio, handleCloseSelected, initialPresupuesto = null, onSave = null }) => {
  const [presupuesto, setPresupuesto] = useState({
    ancho: '',
    alto: '',
    materiales: '',
    manoObra: '',
    transporte: '',
    indirectos: '10',
    ganancia: '30',
    cliente_documento: '',
    cliente_razon_social: ''
  });

  const updatePresupuesto = (field, value) => {
    setPresupuesto((prev) => ({ ...prev, [field]: value }));
  };

  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const anchoCm = toNumber(presupuesto.ancho);

  // when initialPresupuesto changes, populate fields
  useEffect(() => {
    if (initialPresupuesto) {
      setPresupuesto({
        ancho: initialPresupuesto.ancho || '',
        alto: initialPresupuesto.alto || '',
        materiales: initialPresupuesto.materiales || '',
        manoObra: initialPresupuesto.manoObra || '',
        transporte: initialPresupuesto.transporte || '',
        indirectos: initialPresupuesto.indirectos || '10',
        ganancia: initialPresupuesto.ganancia || '30',
        cliente_documento: initialPresupuesto.cliente_documento || '',
        cliente_razon_social: ''
      });
    }
  }, [initialPresupuesto]);
  const altoCm = toNumber(presupuesto.alto);
  const areaM2 = (anchoCm / 100) * (altoCm / 100);
  const costoMateriales = toNumber(presupuesto.materiales);
  const costoManoObra = toNumber(presupuesto.manoObra);
  const costoTransporte = toNumber(presupuesto.transporte);
  const pctIndirectos = toNumber(presupuesto.indirectos);
  const pctGanancia = toNumber(presupuesto.ganancia);
  const costoBase = costoMateriales + costoManoObra + costoTransporte;
  const costoIndirectos = costoBase * (pctIndirectos / 100);
  const subtotal = costoBase + costoIndirectos;
  const total = subtotal * (1 + pctGanancia / 100);

  const handleGuardarPresupuesto = () => {
    if (!selectedServicio?.id_servicio) {
      alert('El campo servicio_id es requerido.');
      return;
    }

    // Build same structure as before so consuming table remains unchanged
    const precioUnitario = total; // cost after ganancia
    const cantidad = 1;
    const subtotalNew = precioUnitario * cantidad;
    const igv = parseFloat((subtotalNew * 0.18).toFixed(2));
    const totalFinal = parseFloat((subtotalNew + igv).toFixed(2));

    const presupuestoData = {
      servicio_id: selectedServicio.id_servicio,
      descripcion: selectedServicio.nombre,
      cliente_documento: presupuesto.cliente_documento,
      // keep original inputs so we can edit later
      ancho: presupuesto.ancho,
      alto: presupuesto.alto,
      materiales: presupuesto.materiales,
      manoObra: presupuesto.manoObra,
      transporte: presupuesto.transporte,
      indirectos: presupuesto.indirectos,
      ganancia: presupuesto.ganancia,
      cantidad,
      precio_unitario: precioUnitario.toFixed(2),
      subtotal: subtotalNew.toFixed(2),
      igv,
      total: totalFinal
    };

    if (initialPresupuesto) {
      // editing existing entry
      if (typeof onSave === 'function') {
        onSave({ ...initialPresupuesto, ...presupuestoData });
      }
      alert('Presupuesto modificado');
    } else {
      const added = addPresupuesto(presupuestoData);
      window.dispatchEvent(new CustomEvent('presupuestoGuardado', { detail: added }));
      alert('Presupuesto preparado en memoria');
    }

    setPresupuesto({
      ancho: '',
      alto: '',
      materiales: '',
      manoObra: '',
      transporte: '',
      indirectos: '10',
      ganancia: '30',
      cliente_documento: '',
      cliente_razon_social: ''
    });
    handleCloseSelected();
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={handleCloseSelected}
        onKeyDown={(e) => e.key === 'Escape' && handleCloseSelected()}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.25)',
          zIndex: 900
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 420,
          maxWidth: '95vw',
          backgroundColor: COLORS.white,
          boxShadow: '-8px 0 24px rgba(0,0,0,0.18)',
          zIndex: 1000,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: FONTS.heading, color: COLORS.text }}>Presupuesto de servicio</h3>
          <button
            onClick={handleCloseSelected}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
          >
            X
          </button>
        </div>

        <div style={{ color: COLORS.textLight }}>
          Proyecto: <b>{selectedServicio?.nombre || '-'}</b>
        </div>

        {selectedServicio?.imagen_public_url && (
          <img
            src={selectedServicio.imagen_public_url}
            alt={selectedServicio.nombre}
            className="w-full h-40 object-cover rounded"
          />
        )}

        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Ancho (cm)</label>
              <input
                type="number"
                value={presupuesto.ancho}
                onChange={(e) => updatePresupuesto('ancho', e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Alto (cm)</label>
              <input
                type="number"
                value={presupuesto.alto}
                onChange={(e) => updatePresupuesto('alto', e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body }}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700 }}>Costo materiales (S/)</label>
            <input
              type="number"
              value={presupuesto.materiales}
              onChange={(e) => updatePresupuesto('materiales', e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700 }}>Mano de obra (S/)</label>
            <input
              type="number"
              value={presupuesto.manoObra}
              onChange={(e) => updatePresupuesto('manoObra', e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700 }}>Transporte (S/)</label>
            <input
              type="number"
              value={presupuesto.transporte}
              onChange={(e) => updatePresupuesto('transporte', e.target.value)}
              style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Indirectos (%)</label>
              <input
                type="number"
                value={presupuesto.indirectos}
                onChange={(e) => updatePresupuesto('indIndirectos', e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700 }}>Ganancia (%)</label>
              <input
                type="number"
                value={presupuesto.ganancia}
                onChange={(e) => updatePresupuesto('ganancia', e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', borderTop: `1px solid ${COLORS.border}`, paddingTop: 12 }}>
          <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text }}>
            Area: {areaM2 ? areaM2.toFixed(2) : '0.00'} m2
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text }}>
            Costo base: S/ {costoBase.toFixed(2)}
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text }}>
            Indirectos: S/ {costoIndirectos.toFixed(2)}
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 12, color: COLORS.text }}>
            Subtotal: S/ {subtotal.toFixed(2)}
          </div>
          <div style={{ fontFamily: FONTS.heading, fontSize: 16, color: COLORS.primary, marginTop: 6 }}>
            Total: S/ {total.toFixed(2)}
          </div>
          <button
            onClick={handleGuardarPresupuesto}
            style={{
              width: '100%',
              marginTop: 16,
              padding: '12px 20px',
              background: COLORS.primary,
              color: COLORS.white,
              border: 'none',
              borderRadius: 8,
              fontFamily: FONTS.heading,
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e)=>{
              e.currentTarget.style.transform='translateY(0)';
              e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            💾 Guardar Presupuesto
          </button>
        </div>
      </div>
    </>
  );
};

export default PresupuestoServicio;