import React from 'react';
import { Link } from 'react-router-dom'; // Importar Link
import { IconUserX, IconMapPin, IconBrandWhatsapp, IconBrandFacebook } from '@tabler/icons-react';
import { COLORS, FONTS } from './colors';

// Recibe props: open (bool), onClose (func)
function MenuDesplegable({ open, onClose }) {
  return (
    <div
      className={`fixed z-40 shadow-lg transform transition-transform duration-300 overflow-y-auto ${open ? 'translate-x-0' : 'translate-x-full'}`}
      style={{
  background: COLORS.accent,
        top: 'var(--navbar-height, 64px)',
        height: 'calc(100vh - var(--navbar-height, 64px))',
        right: 0,
        left: 'auto',
        width: '3.5rem', // 2.5rem = 40px, igual que antes pero ahora pegado al borde derecho
        borderRadius: '0.5rem 0 0 0.5rem',
        maxWidth: '320px',
        minWidth: '95px',
        paddingLeft: '0.5rem',
        paddingRight: '0.5rem'
      }}
    >
      <div className="flex flex-col h-full justify-between">
        {/* Palabras menú */}
        <nav className="flex flex-col items-start mt-16 gap-1 pl-1 w-full">
          <Link to="/productos" className="font-heading text-[9px] sm:text-[10px] md:text-xs font-semibold transition whitespace-nowrap w-full text-left"
            style={{ color: COLORS.black }}
            onMouseOver={e => e.currentTarget.style.color = COLORS.primary}
            onMouseOut={e => e.currentTarget.style.color = COLORS.black}
            onClick={onClose}
          >PRODUCTOS</Link>
          <Link to="/proyectos" className="font-heading text-[9px] sm:text-[10px] md:text-xs font-semibold transition whitespace-nowrap w-full text-left"
            style={{ color: COLORS.black }}
            onMouseOver={e => e.currentTarget.style.color = COLORS.primary}
            onMouseOut={e => e.currentTarget.style.color = COLORS.black}
            onClick={onClose} // Cierra el menú al hacer clic
          >PROYECTOS</Link>
        </nav>
        {/* Iconos abajo */}
        <div className="flex flex-col items-center mb-8 gap-6 w-full">
          <Link to="/personal" className="transition flex justify-center w-full"
            style={{ color: COLORS.black }}
            onMouseOver={e => e.currentTarget.style.color = COLORS.primary}
            onMouseOut={e => e.currentTarget.style.color = COLORS.black}
            onClick={onClose}
          >
            <IconUserX size={28} stroke={1} color={COLORS.black} />
          </Link>
          <a href="https://wa.me/" target="_blank" rel="noopener noreferrer" className="transition flex justify-center w-full"
            style={{ color: '#25D366' }}
            onMouseOver={e => e.currentTarget.style.color = COLORS.primary}
            onMouseOut={e => e.currentTarget.style.color = '#25D366'}
          >
            <IconBrandWhatsapp size={28} stroke={1} color="#25D366" />
          </a>
          <a href="#ubicacion" className="transition flex justify-center w-full"
            style={{ color: COLORS.black }}
            onMouseOver={e => e.currentTarget.style.color = COLORS.primary}
            onMouseOut={e => e.currentTarget.style.color = COLORS.black}
          >
            <IconMapPin size={28} stroke={1} color={COLORS.black} />
          </a>
          <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer" className="transition flex justify-center w-full"
            style={{ color: '#1877F3' }}
            onMouseOver={e => e.currentTarget.style.color = COLORS.primary}
            onMouseOut={e => e.currentTarget.style.color = '#1877F3'}
          >
            <IconBrandFacebook size={28} stroke={1} color="#1877F3" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default MenuDesplegable;
