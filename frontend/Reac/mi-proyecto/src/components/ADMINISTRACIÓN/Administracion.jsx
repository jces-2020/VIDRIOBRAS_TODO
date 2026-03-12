import React, { useEffect, useState, useCallback } from 'react';
import { IconUser, IconFileTypePdf } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';
import Gastos from './Gastos';
import Cuadre from './Cuadre';
import Cliente from './Cliente';
import Personal from './Personal';
import Proyecto from './Proyecto';

const Administracion = () => {
  // Tabs principales estilo mockup
  // INICIO -> muestra panel de Proyecto
  // PEDIDO -> muestra panel de Entrega
  const [activeTab, setActiveTab] = useState('inicio');
  const [toast, setToast] = useState(null);

  // (El panel de Pedido/Entrega se movió a Obras.jsx)

  const [dashboard, setDashboard] = useState({ servicios: 0, productos: 0, clientes: 0, pedidos: 0 });
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Dashboard en INICIO
  useEffect(() => {
    if (activeTab !== 'inicio') return;
    setDashboardLoading(true);
    fetch('/api/ai/dashboard')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const counts = data?.counts || {};
        setDashboard({
          servicios: counts.servicios ?? 0,
          productos: counts.productos ?? 0,
          clientes: counts.clientes ?? 0,
          pedidos: counts.pedidos ?? 0,
        });
      })
      .catch(() => {
        setDashboard({ servicios: 0, productos: 0, clientes: 0, pedidos: 0 });
      })
      .finally(() => setDashboardLoading(false));
  }, [activeTab]);

  // Datos de dashboard para charts mini (INICIO)
  const cardItems = [
    { label: 'Servicios', value: dashboard.servicios },
    { label: 'Productos', value: dashboard.productos },
    { label: 'Clientes', value: dashboard.clientes },
    { label: 'Pedidos', value: dashboard.pedidos },
  ];
  const barItems = [{ label: 'Servicios', value: dashboard.servicios }];
  const scatterItems = [{ label: 'Productos', value: dashboard.productos }];
  const lineItems = [{ label: 'Clientes', value: dashboard.clientes }];
  const chartHeight = 150;
  const chartWidth = 280;
  const barMax = Math.max(...barItems.map(c => c.value || 0), 1);
  const scatterMax = Math.max(...scatterItems.map(c => c.value || 0), 1);
  const lineMax = Math.max(...lineItems.map(c => c.value || 0), 1);

  return (
    <div
      style={{
        padding: 24,
        fontFamily: FONTS.body,
        background: COLORS.backgroundLight,
        minHeight: '100vh',
        color: COLORS.text,
      }}
    >
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            padding: '12px 16px',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            color: COLORS.white,
            background: toast.tipo === 'success' ? COLORS.success : COLORS.error,
            fontWeight: 700,
            zIndex: 30,
          }}
        >
          {toast.mensaje}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconUser stroke={1} size={28} />
          <button
            style={{
              background: COLORS.error,
              color: COLORS.white,
              border: 'none',
              borderRadius: 10,
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: 15,
              cursor: 'pointer',
              marginLeft: '8px',
              boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
              fontFamily: FONTS.heading,
            }}
            onClick={() => {
              localStorage.removeItem('personalToken');
              window.location.href = '/personal';
            }}
          >
            Cerrar sesión
          </button>
        </div>

        {/* Selector estilo mockup */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'flex',
          gap: 0,
          background: COLORS.white,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 28,
          padding: 6,
          boxShadow: '0 10px 28px rgba(0,0,0,0.06)',
        }}>
          {[
            { key: 'inicio', label: 'INICIO' },
            { key: 'personal', label: 'PERSONAL' },
            { key: 'gastos', label: 'GASTOS' },
            { key: 'cuadre', label: 'CUADRE' },
            { key: 'clientes', label: 'CLIENTES' },
            { key: 'proyecto', label: 'PROYECTO' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: '10px 16px',
                borderRadius: 14,
                border: `1px solid ${activeTab === t.key ? COLORS.primary : COLORS.border}`,
                background: activeTab === t.key ? COLORS.primary : COLORS.white,
                color: activeTab === t.key ? COLORS.white : COLORS.text,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: activeTab === t.key ? '0 8px 18px rgba(59,130,246,0.25)' : 'none',
                fontFamily: FONTS.heading,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        </div>

        <div>
          <IconFileTypePdf stroke={1} size={28} style={{ cursor: "pointer" }} />
        </div>
      </div>

      {/* Buscador visual (placeholder) - Oculto por ahora */}

      <div style={{ 
        border: `1px solid ${COLORS.border}`,
        padding: 24,
        borderRadius: 16,
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
        background: COLORS.white,
      }}>
        {activeTab === 'inicio' && (
          <div style={{ marginBottom: 16 }}>
            {dashboardLoading ? (
              <div>Cargando dashboard...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 18 }}>
                  {cardItems.map(card => (
                    <div key={card.label} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, background: COLORS.backgroundLight, boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}>
                      <div style={{ fontWeight: 800, marginBottom: 6, color: COLORS.text, fontFamily: FONTS.heading }}>{card.label}</div>
                      <div style={{ fontSize: 30, fontWeight: 800, color: COLORS.text }}>{card.value}</div>
                      <div style={{ marginTop: 10, height: 60, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                        {[1, 2, 3, 4].map((_, idx) => (
                          <div key={idx} style={{ flex: 1, height: Math.max(12, card.value * 6 - idx * 8), background: COLORS.primary, borderRadius: 4, opacity: 0.85 }}></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mini charts estilo ejemplo: barras, puntos y línea */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, background: COLORS.white, boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontWeight: 800, marginBottom: 8, color: COLORS.text, fontFamily: FONTS.heading }}>Barras</div>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="160">
                      {barItems.map((item, idx) => {
                        const slot = (chartWidth - 60) / Math.max(barItems.length, 1);
                        const x = 30 + idx * slot;
                        const h = Math.max(4, ((item.value || 0) / barMax) * (chartHeight - 40));
                        const y = chartHeight - 20 - h;
                        return (
                          <g key={item.label}>
                            <rect x={x} y={y} width={slot - 18} height={h} fill={COLORS.primary} rx={6} />
                            <text x={x + (slot - 18) / 2} y={chartHeight - 6} fontSize="12" textAnchor="middle" fill={COLORS.text}>{item.label}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, background: COLORS.white, boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontWeight: 800, marginBottom: 8, color: COLORS.text, fontFamily: FONTS.heading }}>Puntos</div>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="160">
                      {scatterItems.map((item, idx) => {
                        const xStep = (chartWidth - 60) / Math.max(scatterItems.length - 1, 1);
                        const x = 30 + idx * xStep;
                        const y = chartHeight - 20 - ((item.value || 0) / scatterMax) * (chartHeight - 50);
                        return (
                          <g key={item.label}>
                            <circle cx={x} cy={y} r={7} fill={COLORS.secondary} />
                            <text x={x} y={chartHeight - 6} fontSize="12" textAnchor="middle" fill={COLORS.text}>{item.label}</text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, background: COLORS.white, boxShadow: '0 6px 18px rgba(0,0,0,0.04)' }}>
                    <div style={{ fontWeight: 800, marginBottom: 8, color: COLORS.text, fontFamily: FONTS.heading }}>Línea</div>
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="160">
                      {(() => {
                        const xStep = (chartWidth - 60) / Math.max(lineItems.length - 1, 1);
                        const points = lineItems.map((item, idx) => {
                          const x = 30 + idx * xStep;
                          const y = chartHeight - 20 - ((item.value || 0) / lineMax) * (chartHeight - 50);
                          return { x, y };
                        });
                        const path = points
                          .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
                          .join(' ');
                        return (
                          <>
                            <path d={path} fill="none" stroke={COLORS.secondary} strokeWidth={3} strokeLinejoin="round" />
                            {points.map((p, idx) => (
                              <g key={lineItems[idx].label}>
                                <circle cx={p.x} cy={p.y} r={5} fill={COLORS.secondary} />
                                <text x={p.x} y={chartHeight - 6} fontSize="12" textAnchor="middle" fill={COLORS.text}>{lineItems[idx].label}</text>
                              </g>
                            ))}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {activeTab === 'proyecto' && <Proyecto onToast={showToast} />}

        {activeTab === 'personal' && <Personal />}

        {activeTab === 'gastos' && <Gastos onToast={showToast} />}
        {activeTab === 'cuadre' && <Cuadre onToast={showToast} />}
        {activeTab === 'clientes' && <Cliente onToast={showToast} />}

        {/* El panel de Pedido ahora está en el área Obras */}
      </div>
    </div>
  );
};

export default Administracion;
