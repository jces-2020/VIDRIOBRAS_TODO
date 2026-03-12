import React, { useState, useCallback } from 'react';
import { IconArrowLeft, IconUser, IconFileTypePdf, IconBell } from '@tabler/icons-react';
import Retazo from './Retazo';
import Materiales from './Materiales';
import Productos from './Productos';

const OptimizacionCortes = ({ notificacion, onBack, soloCortes = false }) => {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const [activeTab, setActiveTab] = useState('RETASOS');

  if (soloCortes) {
    return (
      <div style={{ padding: 0, fontFamily: 'Arial, sans-serif' }}>
        <Productos notificacion={notificacion} onToast={showToast} showHeader={false} />
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      {toast && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white ${toast.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.mensaje}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: '#6b7280',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <IconArrowLeft stroke={1} size={20} />
            Atrás
          </button>
          <IconUser stroke={1} size={28} />
          <IconBell stroke={1} size={28} style={{ cursor: 'pointer' }} />
          <button
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer'
            }}
            onClick={() => {
              localStorage.removeItem('personalToken');
              localStorage.removeItem('staff');
              localStorage.removeItem('area');
              window.location.href = '/';
            }}
          >
            Cerrar sesión
          </button>
        </div>
        <div>
          <IconFileTypePdf stroke={1} size={28} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      {/* Título */}
      <h2 className="text-2xl font-bold mb-2">ÁREA DE TRABAJO</h2>

      {/* Contenedor principal */}
      <div style={{
        border: '2px solid #000',
        borderRadius: '6px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {/* Barra de pestañas */}
        <div style={{ display: 'flex', gap: 0, background: '#f3f4f6', borderBottom: '2px solid #000' }}>
          {['RETASOS', 'PRODUCTOS', 'CORTES'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: activeTab === tab ? '#fff' : '#f3f4f6',
                borderBottom: activeTab === tab ? '3px solid #3b82f6' : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: 14,
                color: activeTab === tab ? '#1f2937' : '#6b7280',
                transition: 'all 0.2s',
                flex: 1
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Contenido principal */}
        <div style={{ padding: '24px' }}>
          {/* Cabecera: Cliente / Fecha / Seguimiento / Inicia */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 2fr 0.8fr', gap: '12px', marginBottom: '24px', alignItems: 'end' }}>
            <div>
              <label className="block text-sm font-medium mb-1">CLIENTE</label>
              <input
                type="text"
                defaultValue={notificacion?.nombre || 'PEPITO SAN'}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontWeight: 600
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="date"
                defaultValue={notificacion?.fecha || ''}
                style={{
                  flex: 1,
                  padding: '8px',
                  border: '2px solid #000',
                  borderRadius: '4px',
                  fontWeight: 500
                }}
              />
              <button style={{
                padding: '8px 12px',
                border: '2px solid #000',
                borderRadius: '4px',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '18px'
              }}>
                📅
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2 text-center">SEGUIMIENTO</label>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '24px' }}>🚚</span>
                <span style={{ fontSize: '24px' }}>💼</span>
                <span style={{ fontSize: '24px' }}>🚛</span>
                <span style={{ fontSize: '24px' }}>🏠</span>
                <span style={{ fontSize: '24px' }}>📋</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <label className="block text-xs font-medium mb-2">INICIA</label>
              <div style={{
                width: 54,
                height: 30,
                borderRadius: 16,
                border: '2px solid #000',
                background: '#10b981',
                position: 'relative',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}>
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  transition: 'all 0.2s'
                }} />
              </div>
            </div>
          </div>

          {activeTab === 'RETASOS' && (
            <Retazo 
              notificacion={notificacion} 
              onToast={showToast} 
              showHeader={false}
              tipoNotificacion="OPTIMIZACION"
              onGuardarSuccess={() => setActiveTab('PRODUCTOS')}
            />
          )}

          {activeTab === 'PRODUCTOS' && (
            <Materiales 
              notificacion={notificacion} 
              onToast={showToast}
              tipoNotificacion="OPTIMIZACION"
            />
          )}

          {activeTab === 'CORTES' && (
            <Productos 
              notificacion={notificacion} 
              onToast={showToast} 
              showHeader={false} 
              onFinalizarEntrega={onBack}
              tipoNotificacion="OPTIMIZACION"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OptimizacionCortes;
