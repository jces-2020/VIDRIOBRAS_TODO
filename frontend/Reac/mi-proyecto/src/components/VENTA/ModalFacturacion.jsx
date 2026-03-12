import React, { useMemo, useState } from 'react';
import { COLORS, FONTS } from '../../colors';

const DEFAULT_FORM = {
  tipo_comprobante: 'boleta',
  nombre: 'Cliente de prueba',
  documento: '',
  direccion: 'Direccion cliente',
  provincia: 'LIMA',
  departamento: 'LIMA',
  distrito: 'LIMA',
  ubigeo: '150101',
  correo: 'cliente@test.com'
};

const ModalFacturacion = ({ productos, onClose }) => {
  // Guardar productos localmente en el modal para que persistan
  const [productosLocales] = useState(
    Array.isArray(productos) ? [...productos] : []
  );
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const productosJson = useMemo(() => {
    const safeProductos = Array.isArray(productosLocales) ? productosLocales : [];
    return JSON.stringify(safeProductos, null, 2);
  }, [productosLocales]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const calcularTotales = () => {
    const safeProductos = Array.isArray(productosLocales) ? productosLocales : [];
    const total = safeProductos.reduce((acc, p) => {
      const cantidad = Number(p.cantidad || 1);
      const precio = Number(p.precio_unitario || 0);
      return acc + (cantidad * precio);
    }, 0);
    const subtotal = Number((total / 1.18).toFixed(2));
    const igv = Number((total - subtotal).toFixed(2));
    return { subtotal, igv, total: Number(total.toFixed(2)) };
  };

  const emitirComprobante = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResultado(null);
    setMensaje('');

    try {
      const totales = calcularTotales();
      const payload = {
        cliente_data: {
          nombre: form.nombre,
          documento: form.documento,
          direccion: form.direccion,
          provincia: form.provincia,
          departamento: form.departamento,
          distrito: form.distrito,
          ubigeo: form.ubigeo,
          correo: form.correo
        },
        productos: productosLocales,
        totales
      };

      const response = await fetch('/api/facturacion/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Error al generar el comprobante');
        return;
      }

      setResultado(data.data);
      setMensaje(data.message || 'Comprobante generado correctamente');
    } catch (err) {
      setError(`Error: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const descargarXml = () => {
    if (!resultado?.xml) return;
    const blob = new Blob([resultado.xml], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resultado.serie}-${resultado.correlativo}.xml`;
    link.click();
  };

  const generarPdf = async () => {
    if (!resultado?.payload) {
      alert('No hay payload disponible para generar PDF');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/facturacion/generar-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultado.payload)
      });
      const data = await response.json();

      if (!data.success) {
        alert(`Error generando PDF: ${data.message || 'Error'}`);
        return;
      }

      const pdfBase64 = data.pdf;
      const binaryString = atob(pdfBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resultado.serie}-${resultado.correlativo}.pdf`;
      link.click();
    } catch (err) {
      alert(`Error: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 20,
        width: 520,
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        fontFamily: FONTS.body
      }}>
        <h1 style={{ color: COLORS.text, marginBottom: 16 }}>Test Facturación Electrónica</h1>

        <form onSubmit={emitirComprobante}>
          <label style={{ display: 'block', marginTop: 12, fontWeight: 700 }}>Tipo de comprobante</label>
          <select
            name="tipo_comprobante"
            value={form.tipo_comprobante}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 8, marginTop: 5, border: '1px solid #ccc', borderRadius: 5 }}
          >
            <option value="boleta">Boleta</option>
            <option value="factura">Factura</option>
          </select>

          <label style={{ display: 'block', marginTop: 12, fontWeight: 700 }}>Nombre cliente</label>
          <input
            name="nombre"
            required
            value={form.nombre}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 5, border: '1px solid #ccc', borderRadius: 5 }}
          />

          <label style={{ display: 'block', marginTop: 12, fontWeight: 700 }}>Documento (DNI o RUC)</label>
          <input
            name="documento"
            required
            value={form.documento}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 5, border: '1px solid #ccc', borderRadius: 5 }}
          />

          <label style={{ display: 'block', marginTop: 12, fontWeight: 700 }}>Dirección</label>
          <input
            name="direccion"
            required
            value={form.direccion}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 5, border: '1px solid #ccc', borderRadius: 5 }}
          />

          <label style={{ display: 'block', marginTop: 12, fontWeight: 700 }}>Provincia</label>
          <input
            name="provincia"
            required
            value={form.provincia}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 5, border: '1px solid #ccc', borderRadius: 5 }}
          />

          <label style={{ display: 'block', marginTop: 12, fontWeight: 700 }}>Departamento</label>
          <input
            name="departamento"
            required
            value={form.departamento}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 5, border: '1px solid #ccc', borderRadius: 5 }}
          />

          <label style={{ display: 'block', marginTop: 12, fontWeight: 700 }}>Distrito</label>
          <input
            name="distrito"
            required
            value={form.distrito}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 5, border: '1px solid #ccc', borderRadius: 5 }}
          />

          <label style={{ display: 'block', marginTop: 12, fontWeight: 700 }}>Ubigeo</label>
          <input
            name="ubigeo"
            required
            value={form.ubigeo}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 5, border: '1px solid #ccc', borderRadius: 5 }}
          />

          <label style={{ display: 'block', marginTop: 12, fontWeight: 700 }}>Correo</label>
          <input
            name="correo"
            value={form.correo}
            onChange={handleChange}
            style={{ width: '100%', padding: 8, marginTop: 5, border: '1px solid #ccc', borderRadius: 5 }}
          />

          {/* JSON de productos - Oculto pero funciona internamente */}
          <label style={{ display: 'none', marginTop: 12, fontWeight: 700 }}>Productos (JSON)</label>
          <textarea
            name="productos"
            rows="5"
            value={productosJson}
            readOnly
            style={{ display: 'none', width: '100%', padding: 8, marginTop: 5, border: '1px solid #ccc', borderRadius: 5 }}
          />

          {error && (
            <div style={{ marginTop: 12, color: COLORS.error }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 20,
              padding: 12,
              width: '100%',
              border: 'none',
              background: loading ? COLORS.gray[300] : '#007bff',
              color: 'white',
              fontSize: 16,
              borderRadius: 5,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Generando...' : 'Generar comprobante'}
          </button>
        </form>

        <div style={{ marginTop: 20, padding: 15, background: '#f0f8ff', borderRadius: 5, border: '1px solid #ddd' }}>
          {mensaje && resultado && (
            <div style={{ marginBottom: 8, color: '#28a745', fontWeight: 'bold' }}>
              ✅ {resultado.tipo} {resultado.serie}-{resultado.correlativo} generada exitosamente
            </div>
          )}
          {error && (
            <div style={{ color: '#d32f2f', fontWeight: 'bold' }}>
              ❌ {error}
            </div>
          )}
        </div>

        <div style={{ marginTop: 20, display: resultado ? 'block' : 'none' }}>
          <button
            type="button"
            onClick={descargarXml}
            style={{ marginTop: 8, width: '100%', background: '#28a745', color: '#fff', border: 'none', padding: 12, borderRadius: 5 }}
          >
            Descargar XML
          </button>
          <button
            type="button"
            onClick={generarPdf}
            style={{ marginTop: 8, width: '100%', background: '#007bff', color: '#fff', border: 'none', padding: 12, borderRadius: 5 }}
          >
            Generar PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ marginTop: 8, width: '100%', background: '#941918', color: '#fff', border: 'none', padding: 12, borderRadius: 5, fontSize: 16, fontWeight: 'bold' }}
          >
            Ir al Panel del Cliente
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalFacturacion;
