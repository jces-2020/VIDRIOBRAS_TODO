import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { COLORS, FONTS } from './colors';
import { IconUser, IconShoppingCart, IconAlbumOff } from '@tabler/icons-react';
import MenuDesplegable from './MenuDesplegable';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <nav
        className="w-full flex flex-col sm:flex-row items-center justify-between px-2 sm:px-8 py-2 sm:py-3 gap-2 sm:gap-0 shadow fixed top-0 left-0 z-50 overflow-x-hidden"
        style={{ background: `linear-gradient(90deg, ${COLORS.primary} 60%, ${COLORS.secondary} 100%)` }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-0">
          <img
            src="/LOGO.svg"
            alt="Vidriobras Logo"
            className="h-12 w-auto sm:h-16 object-contain rounded"
            style={{ background: 'transparent', padding: 0 }}
          />
        </div>

        {/* Enlace a Inicio en el centro */}
        {location.pathname !== '/' && (
          <div className="hidden sm:flex justify-center flex-grow">
            <Link to="/" className="font-heading text-white text-xl font-bold hover:text-gray-200 transition-colors">
              INICIO
            </Link>
          </div>
        )}

        {/* Iconos y buscador a la derecha */}
        <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto justify-end">
          <div className="relative w-full max-w-xs sm:w-72 mb-2 sm:mb-0">
            <input
              type="text"
              placeholder="Buscar..."
              className="font-body w-full px-3 sm:px-4 py-2 rounded-full shadow border border-gray-300 focus:outline-none text-sm sm:text-base"
              style={{ background: COLORS.light, color: COLORS.dark }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.secondary }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
              </svg>
            </span>
          </div>
          <button
            className="text-3xl rounded-full p-2 transition"
            style={{ color: COLORS.dark, background: COLORS.light }}
            onClick={() => {
              // Si hay token válido, ir al panel de cliente; si no, a login
              try {
                const t = localStorage.getItem('auth_token');
                if (t) {
                  const parts = t.split('.');
                  if (parts.length === 3) {
                    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                    if (!payload.exp || (payload.exp * 1000) > Date.now()) {
                      navigate('/user'); // Ir directamente al panel de usuario
                      return;
                    }
                  }
                }
              } catch {}
              navigate('/login'); // Si no hay token o está expirado, ir a login
            }}
          >
            <IconUser stroke={2} size={28} />
          </button>
          <button
            className="text-3xl rounded-full p-2 transition"
            style={{ color: COLORS.dark, background: COLORS.light }}
            onClick={() => navigate('/carrito')}
          >
            <IconShoppingCart stroke={2} size={28} />
          </button>
          <div style={{ background: COLORS.accent, borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="ml-2 p-0">
            <button
              className="rounded p-2 text-3xl transition"
              style={{ background: 'transparent', color: COLORS.dark }}
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
      <MenuDesplegable open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

export default Navbar;