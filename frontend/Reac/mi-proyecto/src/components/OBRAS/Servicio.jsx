import React, { useState, useCallback } from 'react';
import { IconArrowLeft, IconUser, IconFileTypePdf, IconBell } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';
import Remetro from './Remetro';
import Retazo from './Retazo';
import ProductosServicio from './ProductosServicio';
import Instalacion from './Instalacion';

const ServicioTrabajo = ({ notificacion, onBack }) => {
  const [toast, setToast] = useState(null);
  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const [activeTab, setActiveTab] = useState('REMETRO');

  return (
    <div style={{ 
      padding: 24, 
      fontFamily: FONTS.body,
      background: COLORS.backgroundLight,
      minHeight: '100vh'
    }}>
      {toast && (
        <div style={{
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
          fontFamily: FONTS.body
        }}>
          {toast.mensaje}
        </div>
      )}

      {/* Header con botón atrás */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: COLORS.gray[500],
              color: COLORS.white,
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: FONTS.heading,
              fontSize: 14
            }}
          >
            <IconArrowLeft stroke={1} size={20} />
            Atrás
          </button>
          <IconUser stroke={1} size={28} color={COLORS.text} />
          <IconBell stroke={1} size={28} style={{ cursor: 'pointer' }} color={COLORS.primary} />
          <button
            style={{
              background: COLORS.error,
              color: COLORS.white,
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              fontFamily: FONTS.heading
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
          <IconFileTypePdf stroke={1} size={28} style={{ cursor: 'pointer' }} color={COLORS.text} />
        </div>
      </div>

      {/* Título */}
      <h2 style={{
        fontFamily: FONTS.heading,
        fontSize: 24,
        fontWeight: 700,
        marginBottom: 24,
        color: COLORS.text
      }}>
        SERVICIO - {notificacion?.nombre || 'Sin nombre'}
      </h2>

      {/* Contenedor principal con pestañas */}
      <div style={{
        border: `2px solid ${COLORS.border}`,
        borderRadius: 12,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        background: COLORS.white
      }}>
        {/* Barra de pestañas */}
        <div style={{
          display: 'flex',
          backgroundColor: COLORS.gray[50],
          borderBottom: `2px solid ${COLORS.border}`,
          gap: 0
        }}>
          {['REMETRO', 'RETAZO', 'PRODUCTOS', 'INSTALACION'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: 'none',
                background: activeTab === tab ? COLORS.white : COLORS.gray[50],
                borderBottom: activeTab === tab ? `3px solid ${COLORS.primary}` : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: 14,
                color: activeTab === tab ? COLORS.text : COLORS.textLight,
                transition: 'all 0.2s',
                fontFamily: FONTS.heading
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Contenido de pestañas */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'REMETRO' && (
            <Remetro 
              notificacion={notificacion} 
              onToast={showToast} 
              tipoNotificacion="SERVICIO"
            />
          )}

          {activeTab === 'RETAZO' && (
            <Retazo 
              notificacion={notificacion} 
              onToast={showToast}
              tipoNotificacion="SERVICIO"
              onGuardarSuccess={() => setActiveTab('PRODUCTOS')}
            />
          )}

          {activeTab === 'PRODUCTOS' && (
            <ProductosServicio 
              notificacion={notificacion} 
              onToast={showToast}
            />
          )}

          {activeTab === 'INSTALACION' && (
            <Instalacion 
              notificacion={notificacion} 
              onToast={showToast}
              tipoNotificacion="SERVICIO"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicioTrabajo;
