import React, { useState, useCallback, useEffect } from 'react';
import { IconArrowLeft, IconUser, IconFileTypePdf, IconBell } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';
import Retazo from './Retazo';
import Materiales from './Materiales';
import Optimizacion from './Optimizacion';

const EntregaPedido = ({ notificacion, onBack }) => {

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [toast, setToast] = useState(null);

  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const [activeTab, setActiveTab] = useState('RETASOS');

  return (
    <div style={{
      padding: isMobile ? 12 : 20,
      fontFamily: FONTS.body
    }}>

      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          color: COLORS.white,
          background: toast.tipo === 'success' ? COLORS.success : COLORS.error,
          zIndex: 1000,
          fontWeight: 600
        }}>
          {toast.mensaje}
        </div>
      )}

      {/* HEADER */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 12,
        marginBottom: 20
      }}>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8
        }}>

          <button
            onClick={onBack}
            style={{
              background: COLORS.gray[600],
              color: COLORS.white,
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

          <IconUser stroke={1} size={26} />
          <IconBell stroke={1} size={26} style={{ cursor: 'pointer' }} />

          <button
            style={{
              background: COLORS.error,
              color: COLORS.white,
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
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

        <IconFileTypePdf stroke={1} size={28} style={{ cursor: 'pointer' }} />

      </div>

      <h2 style={{
        fontSize: isMobile ? 22 : 28,
        fontWeight: 700,
        marginBottom: 16,
        fontFamily: FONTS.heading,
        color: COLORS.text
      }}>
        ENTREGA
      </h2>

      <div style={{
        border: `2px solid ${COLORS.text}`,
        borderRadius: '6px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>

        {/* TABS */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          background: COLORS.gray[200],
          borderBottom: `2px solid ${COLORS.text}`
        }}>

          {['RETASOS', 'PRODUCTOS', 'CORTES'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: isMobile ? '100%' : 1,
                padding: '12px 20px',
                border: 'none',
                background: activeTab === tab ? COLORS.white : COLORS.gray[200],
                borderBottom: activeTab === tab ? `3px solid ${COLORS.info}` : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? 700 : 500,
                fontSize: 14
              }}
            >
              {tab}
            </button>
          ))}

        </div>

        <div style={{ padding: isMobile ? 16 : 24 }}>

          {/* CLIENTE Y FECHA */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '12px',
            marginBottom: '24px'
          }}>

            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6
              }}>
                CLIENTE
              </label>

              <input
                type="text"
                defaultValue={notificacion?.nombre || ''}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `2px solid ${COLORS.text}`,
                  borderRadius: '4px',
                  fontWeight: 600
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 700,
                marginBottom: 6
              }}>
                FECHA
              </label>

              <input
                type="text"
                defaultValue={notificacion?.fecha || ''}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `2px solid ${COLORS.text}`,
                  borderRadius: '4px'
                }}
              />
            </div>

          </div>

          {activeTab === 'RETASOS' && (
            <Retazo
              showHeader={false}
              onToast={showToast}
              notificacion={notificacion}
              onGuardarSuccess={() => setActiveTab('PRODUCTOS')}
              tipoNotificacion="ENTREGA"
            />
          )}

          {activeTab === 'PRODUCTOS' && (
            <Materiales
              onToast={showToast}
              notificacion={notificacion}
              onGuardarSuccess={() => setActiveTab('CORTES')}
              tipoNotificacion="ENTREGA"
            />
          )}

          {activeTab === 'CORTES' && (
            <Optimizacion
              notificacion={notificacion}
              onToast={showToast}
              soloCortes
              onFinalizarEntrega={onBack}
              tipoNotificacion="ENTREGA"
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default EntregaPedido;