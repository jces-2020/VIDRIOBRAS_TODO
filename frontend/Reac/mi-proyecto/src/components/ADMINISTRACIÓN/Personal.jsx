import React, { useEffect, useState, useCallback } from "react";
import { COLORS, FONTS } from "../../colors";

const Personal = () => {
  const [personalList, setPersonalList] = useState([]);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [personalBonos, setPersonalBonos] = useState([]);
  const [allBonos, setAllBonos] = useState([]);
  const [selectedBonoToAdd, setSelectedBonoToAdd] = useState("");
  const [montoPago, setMontoPago] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((mensaje, tipo = "success") => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchPersonal = async () => {
    try {
      const res = await fetch("/api/personal");
      const data = await res.json();
      setPersonalList(data.success ? data.data : []);
    } catch (e) {
      showToast("Error al cargar personal", "error");
    }
  };

  const fetchAllBonos = async () => {
    try {
      const res = await fetch("/api/bonos");
      const data = await res.json();
      setAllBonos(data.success ? data.data : []);
    } catch (e) {
      showToast("Error al cargar bonos", "error");
    }
  };

  const fetchPersonalBonos = async (personalId) => {
    try {
      const res = await fetch(`/api/personal/${personalId}/bonos`);
      const data = await res.json();
      setPersonalBonos(data.success ? data.data : []);
    } catch (e) {
      showToast("Error al cargar bonos", "error");
    }
  };

  useEffect(() => {
    fetchPersonal();
    fetchAllBonos();
  }, []);

  const handleSelectPersonal = (personal) => {
    setSelectedPersonal(personal);
    fetchPersonalBonos(personal.id_personal);
    setMontoPago("");
  };

  const handleAddBono = async () => {
    if (!selectedBonoToAdd || !selectedPersonal) return;
    try {
      const res = await fetch(`/api/personal/${selectedPersonal.id_personal}/bonos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bono_id: selectedBonoToAdd }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Bono asignado");
        setSelectedBonoToAdd("");
        fetchPersonalBonos(selectedPersonal.id_personal);
      } else {
        showToast("Error al asignar bono", "error");
      }
    } catch (e) {
      showToast("Error al asignar bono", "error");
    }
  };

  const handleRemoveBono = async (bonoId) => {
    if (!selectedPersonal) return;
    try {
      const res = await fetch(`/api/personal/${selectedPersonal.id_personal}/bonos/${bonoId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Bono eliminado");
        fetchPersonalBonos(selectedPersonal.id_personal);
      } else {
        showToast("Error al eliminar bono", "error");
      }
    } catch (e) {
      showToast("Error al eliminar bono", "error");
    }
  };

  const handlePagar = async () => {
    if (!selectedPersonal || !montoPago) {
      showToast("Ingresa el monto", "error");
      return;
    }
    try {
      const res = await fetch(`/api/personal/${selectedPersonal.id_personal}/pago`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monto: parseFloat(montoPago), fecha: new Date().toISOString().split("T")[0] }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Pago registrado");
        setMontoPago("");
      } else {
        showToast("Error al registrar pago", "error");
      }
    } catch (e) {
      showToast("Error al registrar pago", "error");
    }
  };

  const nextPayText = (() => {
    const today = new Date();
    const day = today.getDate();
    const nextPayDay = day < 15 ? 15 : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const nextPayMonth = day < 15 ? today.getMonth() : today.getMonth() + 1;
    const nextPayDate = new Date(today.getFullYear(), nextPayMonth, nextPayDay);
    return nextPayDate.toLocaleDateString("es-ES");
  })();

  return (
    <div style={{ display: "grid", gridTemplateColumns: selectedPersonal ? "1fr 1.2fr" : "1fr", gap: 20 }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            padding: "10px 14px",
            borderRadius: 12,
            color: COLORS.white,
            background: toast.tipo === "success" ? COLORS.success : COLORS.error,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            fontWeight: 700,
            zIndex: 50,
            fontFamily: FONTS.heading,
          }}
        >
          {toast.mensaje}
        </div>
      )}

      {/* Tabla de personal */}
      <div>
        <h3 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 12, fontFamily: FONTS.heading, color: COLORS.text }}>
          Personal de la Empresa
        </h3>
        <div style={{ maxHeight: "600px", overflowY: "auto", border: `1px solid ${COLORS.border}`, borderRadius: 10, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", fontSize: "0.95rem", background: COLORS.white }}>
            <thead style={{ position: "sticky", top: 0, background: COLORS.light }}>
              <tr>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: "10px", textAlign: "left", fontFamily: FONTS.heading, color: COLORS.text }}>Nombre</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: "10px", textAlign: "left", fontFamily: FONTS.heading, color: COLORS.text }}>Código</th>
                <th style={{ border: `1px solid ${COLORS.border}`, padding: "10px", textAlign: "left", fontFamily: FONTS.heading, color: COLORS.text }}>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {personalList.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: 14, color: COLORS.textLight, fontFamily: FONTS.body }}>
                    Sin personal registrado
                  </td>
                </tr>
              ) : (
                personalList.map((p) => {
                  const isSelected = selectedPersonal?.id_personal === p.id_personal;
                  return (
                    <tr
                      key={p.id_personal}
                      onClick={() => handleSelectPersonal(p)}
                      style={{
                        cursor: "pointer",
                        background: isSelected ? COLORS.backgroundLight : COLORS.white,
                        borderBottom: `1px solid ${COLORS.border}`,
                      }}
                    >
                      <td style={{ padding: "10px", fontFamily: FONTS.body, color: COLORS.text }}>{p.nombre || "Sin nombre"}</td>
                      <td style={{ padding: "10px", fontFamily: FONTS.body, color: COLORS.text }}>{p.Codigo || "-"}</td>
                      <td style={{ padding: "10px", fontFamily: FONTS.body, color: COLORS.text }}>{p.tipo_personal?.descripcion || "Sin tipo"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel de detalles del personal */}
      {selectedPersonal && (
        <div style={{ background: COLORS.backgroundLight, padding: 18, borderRadius: 12, border: `1px solid ${COLORS.border}`, boxShadow: "0 8px 22px rgba(0,0,0,0.06)" }}>
          <h4 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 12, fontFamily: FONTS.heading, color: COLORS.text }}>
            Detalles de {selectedPersonal.nombre}
          </h4>
          <div style={{ marginBottom: 12, padding: 12, background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, fontSize: "0.95rem" }}>
              <div style={{ fontFamily: FONTS.body, color: COLORS.text }}><strong>Código:</strong> {selectedPersonal.Codigo || "-"}</div>
              <div style={{ fontFamily: FONTS.body, color: COLORS.text }}><strong>CV:</strong> {selectedPersonal.cv || "-"}</div>
              <div style={{ fontFamily: FONTS.body, color: COLORS.text }}><strong>Fecha de nacimiento:</strong> {selectedPersonal.fecha_nacimiento || "-"}</div>
              <div style={{ fontFamily: FONTS.body, color: COLORS.text }}><strong>Tipo:</strong> {selectedPersonal.tipo_personal?.descripcion || "Sin tipo"}</div>
            </div>
          </div>

          {/* Bonos */}
          <div style={{ marginBottom: 14 }}>
            <h5 style={{ fontWeight: 800, marginBottom: 8, fontFamily: FONTS.heading, color: COLORS.text }}>Bonos Asignados</h5>
            <div style={{ background: COLORS.white, padding: 10, borderRadius: 10, border: `1px solid ${COLORS.border}`, maxHeight: 180, overflowY: "auto" }}>
              {personalBonos.length === 0 ? (
                <div style={{ color: COLORS.textLight, fontFamily: FONTS.body, fontSize: "0.95rem" }}>Sin bonos asignados</div>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                  {personalBonos.map((b) => (
                    <li key={b.bono_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, fontFamily: FONTS.body }}>
                      <span>{b.bonos?.descripcion || b.bono_id}</span>
                      <button
                        onClick={() => handleRemoveBono(b.bono_id)}
                        style={{ color: COLORS.error, background: "transparent", border: "none", cursor: "pointer", fontFamily: FONTS.heading, fontWeight: 700 }}
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <select
                value={selectedBonoToAdd}
                onChange={(e) => setSelectedBonoToAdd(e.target.value)}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body, color: COLORS.text }}
              >
                <option value="">-- Seleccionar bono --</option>
                {allBonos.map((b) => (
                  <option key={b.id_bono} value={b.id_bono}>{b.descripcion}</option>
                ))}
              </select>
              <button
                onClick={handleAddBono}
                style={{ background: COLORS.primary, color: COLORS.white, border: "none", borderRadius: 8, padding: "10px 14px", fontWeight: 700, fontFamily: FONTS.heading, cursor: "pointer", boxShadow: "0 6px 16px rgba(59,130,246,0.25)" }}
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Próximos pagos */}
          <div style={{ marginBottom: 14, padding: 12, background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
            <h5 style={{ fontWeight: 800, marginBottom: 6, fontFamily: FONTS.heading, color: COLORS.text }}>Próximos pagos estimados</h5>
            <div style={{ fontFamily: FONTS.body, color: COLORS.textLight }}>Próximo pago: {nextPayText}</div>
          </div>

          {/* Registrar pago */}
          <div style={{ padding: 12, background: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
            <h5 style={{ fontWeight: 800, marginBottom: 8, fontFamily: FONTS.heading, color: COLORS.text }}>Registrar Pago</h5>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="number"
                placeholder="Monto"
                value={montoPago}
                onChange={(e) => setMontoPago(e.target.value)}
                style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.body, color: COLORS.text }}
              />
              <button
                onClick={handlePagar}
                style={{ background: COLORS.success, color: COLORS.white, border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, fontFamily: FONTS.heading, cursor: "pointer", boxShadow: "0 6px 16px rgba(16,185,129,0.25)" }}
              >
                Pagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Personal;
