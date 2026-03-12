import React, { useState } from 'react';
import { COLORS, FONTS } from '../../colors';

const ControlStock = ({ productosCache }) => {
  const [pedidoCantidades, setPedidoCantidades] = useState({});

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: COLORS.text, fontFamily: FONTS.heading }}>
          EN STOCK (&gt; 10 unidades)
        </h3>
        <table style={{ width: '100%', border: `1px solid ${COLORS.border}`, fontSize: '0.875rem', backgroundColor: COLORS.white, borderCollapse: 'collapse', fontFamily: FONTS.body }}>
          <thead>
            <tr style={{ backgroundColor: COLORS.gray[200] }}>
              <th style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.text }}>Nombre</th>
              <th style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.text }}>Cantidad</th>
              <th style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.text }}>Fecha ingreso</th>
            </tr>
          </thead>
          <tbody>
            {productosCache.filter(p => Number(p.cantidad) > 10).map(p => {
              const fecha = p.almacen_fecha_ingreso || (p.almacen && p.almacen.fecha_ingreso) || p.fecha_ingreso || '-';
              return (
                <tr key={p.id_producto}>
                  <td style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', color: COLORS.text }}>{p.nombre}</td>
                  <td style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', color: COLORS.text }}>{p.cantidad}</td>
                  <td style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', color: COLORS.text }}>{fecha}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', color: COLORS.text, fontFamily: FONTS.heading }}>
          PEDIDO (≤ 10 unidades)
        </h3>
        <table style={{ width: '100%', border: `1px solid ${COLORS.border}`, fontSize: '0.875rem', backgroundColor: COLORS.white, borderCollapse: 'collapse', fontFamily: FONTS.body }}>
          <thead>
            <tr style={{ backgroundColor: COLORS.gray[200] }}>
              <th style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.text }}>Nombre</th>
              <th style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.text }}>Cantidad</th>
              <th style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.text }}>Fecha ingreso</th>
              <th style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', fontFamily: FONTS.heading, fontWeight: 600, color: COLORS.text }}>Cantidad a pedir</th>
            </tr>
          </thead>
          <tbody>
            {productosCache.filter(p => Number(p.cantidad) <= 10).map(p => {
              const fecha = p.almacen_fecha_ingreso || (p.almacen && p.almacen.fecha_ingreso) || p.fecha_ingreso || '-';
              return (
                <tr key={p.id_producto}>
                  <td style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', color: COLORS.text }}>{p.nombre}</td>
                  <td style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', color: COLORS.text }}>{p.cantidad}</td>
                  <td style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem', color: COLORS.text }}>{fecha}</td>
                  <td style={{ border: `1px solid ${COLORS.border}`, padding: '0.5rem' }}>
                    <input
                      type="number"
                      min={1}
                      value={pedidoCantidades[p.id_producto] || ''}
                      onChange={e => setPedidoCantidades(prev => ({ ...prev, [p.id_producto]: e.target.value }))}
                      style={{
                        width: '5rem',
                        padding: '0.25rem',
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '0.25rem',
                        fontFamily: FONTS.body,
                        color: COLORS.text
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <button
          style={{
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
          }}
          onClick={() => {
            const pedido = productosCache
              .filter(p => Number(p.cantidad) <= 10)
              .map(p => ({
                id: p.id_producto,
                nombre: p.nombre,
                cantidad_actual: p.cantidad,
                cantidad_pedir: pedidoCantidades[p.id_producto] || 0
              }))
              .filter(p => Number(p.cantidad_pedir) > 0);
            if (pedido.length === 0) {
              alert('No se ha anotado ninguna cantidad para pedir.');
              return;
            }
            alert('Pedido generado:\n' + pedido.map(p => `${p.nombre}: ${p.cantidad_pedir}`).join('\n'));
          }}
        >
          Enviar pedido
        </button>
      </div>
    </div>
  );
};

export default ControlStock;
