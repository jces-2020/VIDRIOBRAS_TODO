import React, { useEffect, useRef, useState } from 'react';
import '../App.css';

function Inicio() {

  const servicios = [
    { id: 1, nombre: 'Instalación de Vidrios', desc: 'Instalación profesional de vidrios con seguridad y acabados de alta calidad.' },
    { id: 2, nombre: 'Estructuras de Aluminio', desc: 'Montaje de marcos, ventanas y estructuras resistentes y duraderas.' },
    { id: 3, nombre: 'Accesorios para Vidriería', desc: 'Venta de chapas, silicona, herrajes y materiales especializados.' }
  ];

  const areas = [
    {
      nombre: 'Área de Almacén',
      desc: 'Gestiona la recepción, almacenamiento y control del inventario de materiales para garantizar disponibilidad en cada proyecto.'
    },
    {
      nombre: 'Área de Ventas',
      desc: 'Encargada de la atención al cliente, facturación, cotizaciones y registro de productos y servicios.'
    }
  ];

  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        setVisible(rect.top < window.innerHeight - 100);
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="w-full flex flex-col items-center">

      {/* HERO */}
      <div
        className="w-full flex relative items-center justify-center"
        style={{
          minHeight: '650px',
          background: 'linear-gradient(135deg, #80C2DC 0%, #FFFFFF 40%, #FFFFFF 60%, #941918 120%)'
        }}
      >

        <div
          style={{
            width: '100%',
            minHeight: '650px',
            backgroundImage: 'url(/tienda%20anime.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        

        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '4.5rem',
            fontWeight: '800',
            color: '#ffffff',
            textShadow: '0 8px 30px rgba(0,0,0,0.15)'
          }}>
            CALIDAD EN SUS <br /> PRODUCTOS
          </h2>
        </div>
      </div>

      {/* SOBRE LA EMPRESA */}
      <div className="w-full px-8 py-20 bg-white text-center">
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '20px' }}>
          Sobre Nosotros
        </h2>

        <p style={{ maxWidth: 900, margin: 'auto', lineHeight: 1.8, color: '#444' }}>
          Somos una empresa especializada en la venta de vidrios, aluminio y accesorios
          para vidriería, además de brindar servicios profesionales de instalación.
          Atendemos clientes particulares y empresas ofreciendo soluciones seguras,
          duraderas y con acabados de alta calidad. Nos encontramos ubicados en
          Huancayo y trabajamos con procesos organizados que garantizan eficiencia
          en cada proyecto.
        </p>
      </div>

      {/* SERVICIOS */}
      <div className="w-full px-8 py-20 bg-gray-50 text-center">
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '40px' }}>
          Nuestros Servicios
        </h2>

        <div style={{ display: 'flex', gap: 30, justifyContent: 'center', flexWrap: 'wrap' }}>
          {servicios.map(serv => (
            <div key={serv.id} style={{
              width: 300,
              background: '#fff',
              padding: 25,
              borderRadius: 15,
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ color: '#941918', fontWeight: 700 }}>{serv.nombre}</h3>
              <p style={{ marginTop: 10, color: '#555' }}>{serv.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ÁREAS DE TRABAJO */}
      <div
        ref={sectionRef}
        className={`w-full px-8 py-20 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}
        style={{ background: '#fff' }}
      >
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 700, marginBottom: 40 }}>
          Áreas de Trabajo
        </h2>

        <div style={{ display: 'flex', gap: 30, justifyContent: 'center', flexWrap: 'wrap' }}>
          {areas.map((area, i) => (
            <div key={i} style={{
              width: 350,
              padding: 30,
              borderRadius: 18,
              boxShadow: '0 12px 35px rgba(0,0,0,0.08)',
              borderTop: '6px solid #80C2DC'
            }}>
              <h3 style={{ fontWeight: 700 }}>{area.nombre}</h3>
              <p style={{ marginTop: 10, color: '#555', lineHeight: 1.7 }}>{area.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MISIÓN Y VISIÓN */}
      <div className="w-full flex flex-col md:flex-row justify-center gap-10 px-8 py-20 bg-gray-50">

        <div style={{
          maxWidth: 500,
          background: '#fff',
          borderRadius: 18,
          padding: 30,
          boxShadow: '0 12px 35px rgba(0,0,0,0.08)',
          borderTop: '6px solid #941918'
        }}>
          <h3 style={{ color: '#941918', fontWeight: 700 }}>MISIÓN</h3>
          <p style={{ lineHeight: 1.7 }}>
            Realizar instalaciones con materiales de alta calidad, garantizando seguridad,
            durabilidad y satisfacción total del cliente.
          </p>
        </div>

        <div style={{
          maxWidth: 500,
          background: '#fff',
          borderRadius: 18,
          padding: 30,
          boxShadow: '0 12px 35px rgba(0,0,0,0.08)',
          borderTop: '6px solid #80C2DC'
        }}>
          <h3 style={{ color: '#80C2DC', fontWeight: 700 }}>VISIÓN</h3>
          <p style={{ lineHeight: 1.7 }}>
            Expandirnos a nivel regional y consolidarnos como líderes en instalación
            y distribución de vidrio y aluminio.
          </p>
        </div>

      </div>

    </section>
  );
}

export default Inicio;