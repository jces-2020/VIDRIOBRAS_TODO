import React, { useEffect, useState } from 'react';
import { COLORS, FONTS } from '../colors';
import MercadoPagoYape from './MercadoPagoYape';
import MercadoPagoWallet from './MercadoPagoWallet';
import MercadoPagoOtros from './MercadoPagoOtros';

const MP_PUBLIC_KEY = 'TEST-dfb34bd8-a2a0-42b0-86d7-9b7ad185e78f';
const USE_TEST_MODE = true; // ✅ EN DESARROLLO - Cambiar a false para activar CardForm real en PRODUCCIÓN

export default function MercadoPagoCardForm({ 
  carritoId, 
  clienteId, 
  total, 
  onPaymentSuccess, 
  onPaymentError,
  onLoading 
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [mpLoaded, setMpLoaded] = useState(USE_TEST_MODE ? true : false);
  const [mp, setMp] = useState(null);
  const [payerEmail, setPayerEmail] = useState(localStorage.getItem('cliente_correo') || '');
  const [cardNumber, setCardNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [installments, setInstallments] = useState([]);
  const [selectedInstallment, setSelectedInstallment] = useState(1);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);
  const [showYape, setShowYape] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showOtros, setShowOtros] = useState(false);

  // Cargar SDK solo en producción (cuando USE_TEST_MODE = false)
  useEffect(() => {
    if (USE_TEST_MODE) return; // En desarrollo no cargamos el SDK

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;

    script.onload = () => {
      if (!window.MercadoPago) {
        onPaymentError('No se pudo cargar Mercado Pago SDK');
        return;
      }

      const mpInstance = new window.MercadoPago(MP_PUBLIC_KEY, { locale: 'es-PE' });
      setMp(mpInstance);
      setMpLoaded(true);
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onPaymentError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    onLoading(true);

    try {
      const jwt = localStorage.getItem('auth_token');
      const clienteIdLS = localStorage.getItem('cliente_id');
      const emailCliente = localStorage.getItem('cliente_correo');

      if (!jwt || !clienteIdLS) {
        throw new Error('No hay sesión activa');
      }

      // ✅ EN DESARROLLO: Usar endpoint simulado
      if (USE_TEST_MODE) {
        console.log('[MP-DEV] Simulando pago sin Mercado Pago real');
        const res = await fetch('/api/pagos/procesar_pago_test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify({
            carrito_id: carritoId,
            cliente_id: clienteIdLS,
            amount: total,
            payer_email: emailCliente
          })
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'Error procesando pago');
        }

        console.log('[MP-DEV] ✅ Pago simulado exitoso');
        onPaymentSuccess(data);
        return;
      }

      // ✅ EN PRODUCCIÓN: Usar CardForm real con Mercado Pago
      const cardNumberValue = document.getElementById('cardNumber').value.replace(/\s/g, '');
      const [month, year] = document.getElementById('expirationDate').value.split('/');
      
      const tokenData = {
        cardNumber: cardNumberValue,
        cardholderName: document.getElementById('cardholderName').value,
        cardExpirationMonth: month.trim(),
        cardExpirationYear: '20' + year.trim(),
        securityCode: document.getElementById('securityCode').value,
        identificationType: document.getElementById('identificationType').value,
        identificationNumber: document.getElementById('identificationNumber').value
      };

      const token = await mp.createCardToken(tokenData);
      
      let paymentMethodToUse = paymentMethod;
      if (!paymentMethodToUse) {
        const pmResponse = await mp.getPaymentMethods({ bin: cardNumberValue.substring(0, 6) });
        paymentMethodToUse = pmResponse.results?.[0] || null;
      }

      if (!paymentMethodToUse) {
        throw new Error('No se pudo identificar la tarjeta');
      }

      const body = {
        token: token.id,
        carrito_id: carritoId,
        cliente_id: clienteIdLS,
        amount: total,
        payment_method_id: paymentMethodToUse.id,
        issuer_id: paymentMethodToUse.issuer?.id?.toString(),
        installments: selectedInstallment || 1,
        payer_email: emailCliente,
        payer_identification: {
          type: tokenData.identificationType,
          number: tokenData.identificationNumber
        }
      };

      const res = await fetch('/api/pagos/procesar_pago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Pago rechazado');
      }

      onPaymentSuccess(data);

    } catch (err) {
      console.error('[MP] Error:', err);
      onPaymentError(err.message);
    } finally {
      setIsProcessing(false);
      onLoading(false);
    }
  };

  return (
    <div style={{
      padding: 20,
      border: `2px solid ${COLORS.primary}`,
      borderRadius: 8,
      maxWidth: 600,
      backgroundColor: '#f9f9f9'
    }}>
      {showOtros ? (
        <MercadoPagoOtros
          carritoId={carritoId}
          clienteId={clienteId}
          total={total}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
          onLoading={onLoading}
          onBack={() => setShowOtros(false)}
        />
      ) : showWallet ? (
        <MercadoPagoWallet
          carritoId={carritoId}
          clienteId={clienteId}
          total={total}
          items={[]}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
          onLoading={onLoading}
          onBack={() => setShowWallet(false)}
        />
      ) : showYape ? (
        <MercadoPagoYape
          carritoId={carritoId}
          clienteId={clienteId}
          total={total}
          onPaymentSuccess={onPaymentSuccess}
          onPaymentError={onPaymentError}
          onLoading={onLoading}
          onBack={() => setShowYape(false)}
        />
      ) : (
        <>
          <h3 style={{fontFamily: FONTS.title, color: COLORS.primary}}>
            💳 Pago con Tarjeta
          </h3>

          {/* ✅ EN DESARROLLO: Solo mostrar botón "Pagar" */}
          {USE_TEST_MODE ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                backgroundColor: '#e8f5e9',
                padding: 12,
                borderRadius: 4,
                fontSize: 12,
                color: '#2e7d32',
                fontWeight: 'bold'
              }}>
                🧪 <strong>MODO DESARROLLO:</strong><br />
                El pago será simulado. Usa esto para probar el flujo completo (guardar datos + comprobante).
              </div>

              <div style={{
                backgroundColor: COLORS.primary,
                color: 'white',
                padding: 16,
                borderRadius: 6,
                textAlign: 'center',
                fontSize: 18,
                fontWeight: 'bold'
              }}>
                Total a pagar: S/ {Number(total).toFixed(2)}
              </div>

              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                style={{
                  padding: 16,
                  background: isProcessing ? '#ccc' : COLORS.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 'bold',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: 18
                }}
              >
                {isProcessing ? '⏳ Procesando pago...' : `💳 Pagar S/ ${total.toFixed(2)}`}
              </button>
            </div>
          ) : (
            // ✅ EN PRODUCCIÓN: Mostrar formulario completo
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                  📧 Email
                </label>
                <input 
                  id="payerEmail"
                  type="email"
                  placeholder="tu-email@dominio.com"
                  required
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  style={textStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                  💳 Número de tarjeta
                </label>
                <input 
                  id="cardNumber"
                  type="text"
                  placeholder="4509 9535 6623 3704"
                  maxLength="19"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={textStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                    📅 Vencimiento
                  </label>
                  <input 
                    id="expirationDate"
                    type="text"
                    placeholder="12/30"
                    maxLength="5"
                    required
                    style={textStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                    🔒 CVV
                  </label>
                  <input 
                    id="securityCode"
                    type="text"
                    placeholder="123"
                    maxLength="4"
                    required
                    style={textStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                  👤 Titular
                </label>
                <input 
                  id="cardholderName"
                  type="text"
                  placeholder="APRO"
                  required
                  style={textStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                    📋 Tipo documento
                  </label>
                  <select id="identificationType" required style={textStyle}>
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                    <option value="RUC">RUC</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                    🆔 Número
                  </label>
                  <input 
                    id="identificationNumber"
                    type="text"
                    placeholder="12345678"
                    required
                    style={textStyle}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing || !mpLoaded}
                style={{
                  padding: 12,
                  background: isProcessing ? '#ccc' : COLORS.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 'bold',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  fontSize: 16
                }}
              >
                {isProcessing ? '⏳ Procesando pago...' : `💳 Pagar S/ ${total.toFixed(2)}`}
              </button>

              <button
                type="button"
                onClick={() => setShowYape(true)}
                style={{
                  padding: 12,
                  background: '#7B2CBF',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 16,
                  marginTop: 8
                }}
              >
                🟣 Pagar con Yape
              </button>

              <button
                type="button"
                onClick={() => setShowWallet(true)}
                style={{
                  padding: 12,
                  background: '#00C3E6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 16,
                  marginTop: 8
                }}
              >
                💙 Pagar con Mercado Pago
              </button>

              <button
                type="button"
                onClick={() => setShowOtros(true)}
                style={{
                  padding: 12,
                  background: '#1976D2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: 16,
                  marginTop: 8
                }}
              >
                🏦 Otros Métodos de Pago
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}

const textStyle = {
  width: '100%',
  padding: 10,
  border: '1px solid #ccc',
  borderRadius: 4,
  fontSize: 14
};
