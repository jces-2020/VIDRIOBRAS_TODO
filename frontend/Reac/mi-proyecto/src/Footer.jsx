import React, { useEffect, useState } from 'react';
import { COLORS, FONTS } from './colors';

function Footer() {
  const [showFooter, setShowFooter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Verifica si el usuario está al final de la página
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 2;
      setShowFooter(atBottom);
    };

    window.addEventListener('scroll', handleScroll);
  // No mostrar el footer al cargar, solo cuando el usuario hace scroll

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!showFooter) return null;

  return (
    <footer
      className="w-full py-1 flex flex-col items-center justify-center fixed left-0 bottom-0"
      style={{
        background: `linear-gradient(90deg, ${COLORS.primary} 60%, ${COLORS.secondary} 100%)`,
        color: COLORS.light,
        width: '100vw',
        zIndex: 100
      }}
    >
      <span className="font-body text-xs sm:text-sm font-semibold text-center w-full" style={{ fontFamily: FONTS.body }}>
        © 2025 VIDRIOBRAS. Todos los derechos reservados.
      </span>
    </footer>
  );
}

export default Footer;
