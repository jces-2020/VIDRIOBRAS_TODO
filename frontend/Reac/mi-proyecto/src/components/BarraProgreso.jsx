import React from "react";
import { COLORS, FONTS } from "../colors";

const BarraProgreso = ({ estado, progreso = 0, mostrar = false }) => {
  if (!mostrar || !estado) {
    return (
      <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, fontFamily: FONTS.heading, color: COLORS.text }}>Estado del Pedido</h3>
        <p style={{ color: COLORS.textLight, fontStyle: 'italic', fontFamily: FONTS.body }}>No hay pedido en proceso</p>
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.white, borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, fontFamily: FONTS.heading, color: COLORS.text }}>Sigue tu Pedido</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, fontFamily: FONTS.body, color: COLORS.text }}>
        <span><b>Estado:</b> {estado}</span>
        <span><b>Progreso:</b> {progreso}%</span>
      </div>
      <div style={{ background: COLORS.light, borderRadius: 8, height: 12, overflow: 'hidden', marginBottom: 8 }}>
        <div 
          style={{ 
            width: `${progreso}%`, 
            height: '100%', 
            background: COLORS.primary, 
            transition: 'width .3s ease' 
          }} 
        />
      </div>
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: COLORS.textLight, fontFamily: FONTS.body }}>
        {['Inicio', 'En proceso', 'Entregado'].map((e, i) => (
          <span key={e} style={{ fontWeight: estado === e ? 700 : 400, color: estado === e ? COLORS.primary : COLORS.textLight }}>{e}</span>
        ))}
      </div>
    </div>
  );
};

export default BarraProgreso;