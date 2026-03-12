import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconUser, IconFileTypePdf } from '@tabler/icons-react';
import { COLORS, FONTS } from '../../colors';
import RegistroProductos from './RegistroProductos';
import ControlStock from './ControlStock';

const AlmacenBody = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('registro');
  const [toast, setToast] = useState(null);
  const [productosCache, setProductosCache] = useState([]);
  const [categoriasCache, setCategoriasCache] = useState([]);

  const showToast = useCallback((mensaje, tipo = 'success') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const cargarProductos = useCallback(async () => {
    try {
      const res = await fetch('/api/productos');
      if (!res.ok) throw new Error('No se pudo conectar al servidor.');
      const data = await res.json();
      setProductosCache(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast(`Error al cargar productos: ${error.message}`, 'error');
    }
  }, [showToast]);

  const cargarCategorias = useCallback(async () => {
    try {
      const res = await fetch('/api/categorias');
      if (!res.ok) throw new Error('No se pudo conectar al servidor.');
      const data = await res.json();
      setCategoriasCache(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast(`Error al cargar categorías: ${error.message}`, 'error');
    }
  }, [showToast]);

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, [cargarProductos, cargarCategorias]);

  return (
    <div style={{ padding: 20, fontFamily: FONTS.body }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          padding: 16,
          borderRadius: 8,
          boxShadow: '0 10px 15px rgba(0,0,0,0.1)',
          color: COLORS.white,
          backgroundColor: toast.tipo === 'success' ? COLORS.success : COLORS.error,
          fontFamily: FONTS.body,
          fontWeight: 500
        }}>
          {toast.mensaje}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconUser stroke={1} size={28} />
          <button
            style={{
              background: COLORS.error,
              color: COLORS.white,
              border: 'none',
              borderRadius: '8px',
              padding: '8px 18px',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              marginLeft: '8px',
              fontFamily: FONTS.heading
            }}
            onClick={() => {
              localStorage.removeItem('personalToken');
              localStorage.removeItem('auth_token');
              localStorage.removeItem('cliente_id');
              localStorage.removeItem('cliente_correo');
              navigate('/login');
            }}
          >
            Cerrar sesión
          </button>
        </div>
        <div>
          <IconFileTypePdf stroke={1} size={28} style={{ cursor: 'pointer' }} />
        </div>
      </div>

      <nav>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setTab('registro'); }}
          style={{
            padding: '8px 16px',
            textDecoration: 'none',
            color: tab === 'registro' ? COLORS.primary : COLORS.textLight,
            display: 'inline-block',
            marginRight: '2px',
            borderBottom: tab === 'registro' ? `2px solid ${COLORS.primary}` : '2px solid transparent',
            marginBottom: '-1px',
            transition: 'border-color 0.3s',
            fontFamily: FONTS.heading,
            fontWeight: 600
          }}
        >
          Registro de Productos
        </a>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setTab('stock'); }}
          style={{
            padding: '8px 16px',
            textDecoration: 'none',
            color: tab === 'stock' ? COLORS.primary : COLORS.textLight,
            display: 'inline-block',
            marginRight: '2px',
            borderBottom: tab === 'stock' ? `2px solid ${COLORS.primary}` : '2px solid transparent',
            marginBottom: '-1px',
            transition: 'border-color 0.3s',
            fontFamily: FONTS.heading,
            fontWeight: 600
          }}
        >
          Control de Stock
        </a>
      </nav>

      <div style={{
        border: `2px solid ${COLORS.border}`,
        padding: '24px',
        borderRadius: '0 0.25rem 0.25rem 0.25rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        backgroundColor: COLORS.white
      }}>
        {tab === 'registro' && (
          <RegistroProductos
            categoriasCache={categoriasCache}
            productosCache={productosCache}
            cargarProductos={cargarProductos}
            showToast={showToast}
          />
        )}
        {tab === 'stock' && (
          <ControlStock productosCache={productosCache} />
        )}
      </div>
    </div>
  );
};

export default AlmacenBody;
