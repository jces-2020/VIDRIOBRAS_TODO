import React, { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../colors';
import PresupuestoServicio from './PresupuestoServicio';

const Proyectos = () => {
  const [servicios, setServicios] = useState([]);
  const [carouselServicios, setCarouselServicios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedServicio, setSelectedServicio] = useState(null);
  const [presupuestoOpen, setPresupuestoOpen] = useState(false);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [areaUsuario, setAreaUsuario] = useState('');



  useEffect(() => {
    // Verificar si hay personal de ventas autenticado
    const verificarPersonalVentas = async () => {
      try {
        const token = localStorage.getItem('personalToken');
        if (!token) {
          setAreaUsuario('');
          return;
        }
        const res = await fetch('/api/personal/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.personal) {
          const area = (data.personal.area || '').toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
          setAreaUsuario(area);
        } else {
          setAreaUsuario('');
        }
      } catch (error) {
        console.error('Error al verificar personal:', error);
        setAreaUsuario('');
      }
    };
    verificarPersonalVentas();
  }, []);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/servicios')
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          const serviciosList = data.data;
          setServicios(serviciosList);
          setCarouselServicios(serviciosList.slice(0, 4)); // primeros 4
          if (serviciosList.length > 0) {
            setSelectedServicio(serviciosList[0]);
          }
        } else {
          console.error('Error fetching servicios:', data.error);
        }
      })
      .catch(error => console.error('Error fetching servicios:', error));
  }, []);

  useEffect(() => {
    if (carouselServicios.length > 0 && !selectedServicio) {
      const timer = setTimeout(() => {
        nextImage();
      }, 5000); // Cambia la imagen cada 5 segundos
      return () => clearTimeout(timer);
    }
  }, [currentImage, carouselServicios.length, selectedServicio]);

  const filteredServicios = servicios.filter(servicio =>
    servicio.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const nextImage = () => {
    setCurrentImage(currentImage === carouselServicios.length - 1 ? 0 : currentImage + 1);
  };

  const prevImage = () => {
    setCurrentImage(currentImage === 0 ? carouselServicios.length - 1 : currentImage - 1);
  };

  const handleServicioClick = (servicio) => {
    setSelectedServicio(servicio);
    // Si es personal de VENTAS, mostrar presupuesto
    if (areaUsuario === 'VENTAS') {
      setPresupuestoOpen(true);
    } else {
      // Si no es VENTAS, mostrar detalle del servicio
      setDetalleOpen(true);
    }
  };

  const handleCloseSelected = () => {
    setSelectedServicio(null);
    setPresupuestoOpen(false);
    setDetalleOpen(false);
  };





  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 relative max-w-md mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Buscar servicio..."
          className="font-body w-full p-2 pl-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ borderColor: COLORS.border, color: COLORS.text }}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>


      {/* Carrusel tipo coverflow por servicio (diseño de Productos) */}
      {carouselServicios.length === 0 && (
        <div className="text-center mb-4" style={{ color: COLORS.warning }}>
          No hay servicios para mostrar en el carrusel.
        </div>
      )}
      {carouselServicios.length > 0 && (
        <div className="relative mb-8 flex justify-center items-center h-80">
          <button onClick={prevImage} className="absolute left-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10" style={{ borderColor: COLORS.border }}>&#10094;</button>
          <div className="flex items-center justify-center w-full h-full">
            {carouselServicios.map((servicio, idx) => {
              const isActive = idx === currentImage;
              const isPrev = idx === (currentImage === 0 ? carouselServicios.length - 1 : currentImage - 1);
              const isNext = idx === (currentImage === carouselServicios.length - 1 ? 0 : currentImage + 1);
              return (
                <div
                  key={servicio.id_servicio}
                  className={`transition-all duration-500 ${isActive ? 'z-20 scale-110 shadow-2xl' : 'z-10 scale-90 opacity-60'} ${isPrev || isNext ? 'mx-[-40px]' : 'hidden md:block mx-[-60px]'} ${isActive || isPrev || isNext ? 'block' : 'hidden'}`}
                  style={{ position: 'relative' }}
                >
                  <img
                    src={servicio.imagen_public_url}
                    alt={servicio.nombre}
                    className="rounded-lg object-cover aspect-square max-w-[20rem] w-full h-auto border-4 border-white shadow-lg"
                  />
                </div>
              );
            })}
          </div>
          <button onClick={nextImage} className="absolute right-0 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow-md z-10" style={{ borderColor: COLORS.border }}>&#10095;</button>
        </div>
      )}

      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {filteredServicios.map(servicio => (
          <div key={servicio.id_servicio} className="break-inside-avoid border rounded-lg shadow-lg cursor-pointer" style={{ borderColor: COLORS.border }} onClick={() => handleServicioClick(servicio)}>
            <img 
              src={servicio.imagen_public_url} 
              alt={servicio.nombre} 
              className="w-full h-auto object-cover rounded-t-lg" 
            />
            <div className="p-4">
              <h2 className="font-heading text-xl font-bold" style={{ color: COLORS.text }}>{servicio.nombre}</h2>
            </div>
          </div>
        ))}
      </div>

      {presupuestoOpen && (
        <PresupuestoServicio
          selectedServicio={selectedServicio}
          handleCloseSelected={handleCloseSelected}
        />
      )}

      {detalleOpen && (
        <div
          role="button"
          tabIndex={0}
          onClick={handleCloseSelected}
          onKeyDown={(e) => e.key === 'Escape' && handleCloseSelected()}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 900
          }}
        />
      )}

      {detalleOpen && selectedServicio && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: 500,
            maxWidth: '95vw',
            backgroundColor: COLORS.white,
            boxShadow: '-8px 0 24px rgba(0,0,0,0.18)',
            zIndex: 1000,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontFamily: FONTS.heading, color: COLORS.text, fontSize: '1.6rem', fontWeight: 700 }}>
              Detalle del Servicio
            </h3>
            <button
              onClick={handleCloseSelected}
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: 28,
                color: COLORS.textLight,
                padding: 4
              }}
            >
              ✕
            </button>
          </div>

          <img
            src={selectedServicio.imagen_public_url || 'https://via.placeholder.com/500x300?text=Sin+Imagen'}
            alt={selectedServicio.nombre}
            style={{
              width: '100%',
              height: 280,
              objectFit: 'cover',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />

          <div>
            <h2 style={{ 
              fontFamily: FONTS.heading, 
              fontSize: '1.8rem', 
              fontWeight: 700, 
              color: COLORS.text,
              marginBottom: 12
            }}>
              {selectedServicio.nombre}
            </h2>
            <p style={{ 
              fontFamily: FONTS.body, 
              fontSize: '1.05rem', 
              color: COLORS.textLight,
              lineHeight: 1.6,
              margin: 0
            }}>
              {selectedServicio.descripcion || 'Servicio especializado para tus necesidades.'}
            </p>
          </div>

          <div style={{ 
            borderTop: `1px solid ${COLORS.border}`, 
            paddingTop: 16 
          }}>
            <h4 style={{ 
              fontFamily: FONTS.heading, 
              fontSize: '1.2rem', 
              fontWeight: 700, 
              color: COLORS.text,
              marginBottom: 16
            }}>
              Servicios Similares
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {servicios
                .filter(s => s.id_servicio !== selectedServicio.id_servicio)
                .slice(0, 4)
                .map((servicio) => (
                  <div
                    key={servicio.id_servicio}
                    onClick={() => {
                      setSelectedServicio(servicio);
                    }}
                    style={{
                      borderRadius: 8,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: `1px solid ${COLORS.border}`,
                      transition: 'all 0.2s',
                      background: COLORS.white
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <img
                      src={servicio.imagen_public_url || 'https://via.placeholder.com/200x120?text=Sin+Imagen'}
                      alt={servicio.nombre}
                      style={{ width: '100%', height: 120, objectFit: 'cover' }}
                    />
                    <div style={{ padding: 10 }}>
                      <div style={{ 
                        fontFamily: FONTS.heading, 
                        fontSize: '0.95rem', 
                        fontWeight: 600, 
                        color: COLORS.text,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {servicio.nombre}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proyectos;
