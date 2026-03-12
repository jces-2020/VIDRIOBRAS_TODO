import React, { useState, useEffect } from "react";
import ServicioPanel from "./Servicio";
import { IconUser, IconFileTypePdf } from "@tabler/icons-react";
import CotizacionView from "./CotizacionProductos";
import CuadreCaja from "./CuadreCaja";
import { COLORS, FONTS } from "../../colors";

const VentasBody = () => {
  const [tab, setTab] = useState("productos");
  const [nombrePersonal, setNombrePersonal] = useState("");
  const [servicios, setServicios] = useState([]);

  useEffect(() => {
    // Obtener servicios para la tabla
    fetch('http://127.0.0.1:5000/api/servicios')
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          setServicios(data.data);
        }
      })
      .catch(() => setServicios([]));
  }, []);

  useEffect(() => {
    // Obtener el nombre real del personal autenticado
    const fetchNombrePersonal = async () => {
      try {
        const token = localStorage.getItem('personalToken');
        if (!token) return;
        const res = await fetch('/api/personal/nombre', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.nombre) {
          setNombrePersonal(data.nombre);
        } else {
          setNombrePersonal('Personal');
        }
      } catch {
        setNombrePersonal('Personal');
      }
    };
    fetchNombrePersonal();
  }, []);

  const navLinkStyle = (currentTab) => ({
    padding: "8px 16px",
    textDecoration: "none",
    color: tab === currentTab ? COLORS.primary : COLORS.textLight,
    display: "inline-block",
    marginRight: "2px",
    borderBottom: tab === currentTab ? `2px solid ${COLORS.primary}` : "2px solid transparent",
    marginBottom: "-1px",
    transition: "border-color 0.3s",
    fontFamily: FONTS.heading,
    fontWeight: 600
  });

  return (
    <div style={{ padding: 20, fontFamily: FONTS.body }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IconUser stroke={1} size={28} />
          <button style={{
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
              window.location.reload();
            }}
          >Cerrar sesión</button>
        </div>
        <div>
          <IconFileTypePdf stroke={1} size={28} style={{ cursor: "pointer" }} />
        </div>
      </div>

      <nav>
        <a href="#" onClick={(e) => { e.preventDefault(); setTab("productos"); }} style={navLinkStyle("productos")}>
          Venta de productos
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); setTab("servicio"); }} style={navLinkStyle("servicio")}>
          Servicio
        </a>
        <a href="#" onClick={(e) => { e.preventDefault(); setTab("cuadre"); }} style={navLinkStyle("cuadre")}>
          Cuadre de caja
        </a>
      </nav>

      <div style={{ 
        border: `2px solid ${COLORS.border}`, 
        padding: "24px", 
        borderRadius: "0 0.25rem 0.25rem 0.25rem",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
        backgroundColor: COLORS.white
      }}>
    {tab === "productos" && <CotizacionView />}
    {tab === "servicio" && <ServicioPanel servicios={servicios} />}
    {tab === "cuadre" && <CuadreCaja />}
      </div>
    </div>
  );
};

export default VentasBody;
