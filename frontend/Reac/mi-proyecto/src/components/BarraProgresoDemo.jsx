import React from "react";

const BarraProgresoDemo = ({ estado = "Sin pedidos", progreso = 0 }) => (
  <div style={{ background: '#f5f7fa', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 2px 8px #0001' }}>
    <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Sigue tu Pedido</h3>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
      <span><b>Estado:</b> {estado}</span>
      {estado !== "Sin pedidos" && <span><b>Progreso:</b> {progreso}%</span>}
    </div>
    <div style={{ background: '#e6eef8', borderRadius: 8, height: 12, overflow: 'hidden', marginBottom: 8 }}>
      <div 
        style={{ 
          width: estado === "Sin pedidos" ? "0%" : `${progreso}%`, 
          height: '100%', 
          background: '#1976d2', 
          transition: 'width .3s ease' 
        }} 
      />
    </div>
    <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#5a6b7b' }}>
      {['Inicio', 'En proceso', 'Entregado'].map((e, i) => (
        <span key={e} style={{ fontWeight: estado === e ? 700 : 400 }}>{e}</span>
      ))}
    </div>
  </div>
);

export default BarraProgresoDemo;
