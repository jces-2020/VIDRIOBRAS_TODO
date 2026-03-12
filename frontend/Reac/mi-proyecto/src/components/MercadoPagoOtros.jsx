import React, { useEffect, useState } from 'react';
import { COLORS, FONTS } from '../colors';

const MP_PUBLIC_KEY = 'TEST-dfb34bd8-a2a0-42b0-86d7-9b7ad185e78f';

export default function MercadoPagoOtros({
	carritoId,
	clienteId,
	total,
	onPaymentSuccess,
	onPaymentError,
	onLoading,
	onBack
}) {
	const [isProcessing, setIsProcessing] = useState(false);
	const [mpLoaded, setMpLoaded] = useState(false);
	const [mp, setMp] = useState(null);
	const [docTypes, setDocTypes] = useState([]);
	const [paymentMethods, setPaymentMethods] = useState([]);

	// Form state
	const [payerFirstName, setPayerFirstName] = useState('');
	const [payerLastName, setPayerLastName] = useState('');
	const [email, setEmail] = useState(localStorage.getItem('cliente_correo') || '');
	const [identificationType, setIdentificationType] = useState('');
	const [identificationNumber, setIdentificationNumber] = useState('');
	const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pagoefectivo_atm');

	// 1. Cargar SDK de Mercado Pago
	useEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://sdk.mercadopago.com/js/v2';
		script.async = true;

		script.onload = () => {
			if (!window.MercadoPago) {
				onPaymentError('No se pudo cargar Mercado Pago SDK');
				return;
			}

			const mpInstance = new window.MercadoPago(MP_PUBLIC_KEY, {
				locale: 'es-PE'
			});

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

	// 2. Obtener tipos de documentos cuando MP cargue
	useEffect(() => {
		if (!mp) return;

		const getDocTypes = async () => {
			try {
				console.log('[OTROS] Obteniendo tipos de documento...');
				const types = await mp.getIdentificationTypes();
				console.log('[OTROS] Tipos de documento:', types);
				setDocTypes(types || []);

				if (types && types.length > 0) {
					setIdentificationType(types[0].id);
				}
			} catch (err) {
				console.error('[OTROS] Error obteniendo tipos de documento:', err);
				onPaymentError('Error al obtener tipos de documento');
			}
		};

		getDocTypes();
	}, [mp]);

	// 3. Obtener métodos de pago disponibles
	useEffect(() => {
		if (!mp) return;

		const getPaymentMethods = async () => {
			try {
				console.log('[OTROS] Obteniendo métodos de pago...');
				const methods = await mp.getPaymentMethods();
				console.log('[OTROS] Métodos disponibles:', methods);

				// Filtrar solo métodos que no son tarjetas (excluir credit_card, debit_card)
				const otherMethods = (methods?.results || []).filter(
					m => !['credit_card', 'debit_card', 'yape'].includes(m.id)
				);
				setPaymentMethods(otherMethods);

				// Seleccionar PagoEfectivo por defecto si existe
				const pagoEfectivo = otherMethods.find(m => m.id === 'pagoefectivo_atm');
				if (pagoEfectivo) {
					setSelectedPaymentMethod('pagoefectivo_atm');
				}
			} catch (err) {
				console.error('[OTROS] Error obteniendo métodos:', err);
				// No es crítico si falla, usar pagoefectivo por defecto
			}
		};

		getPaymentMethods();
	}, [mp]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsProcessing(true);
		onLoading(true);

		try {
			if (!payerFirstName || !payerLastName || !email || !identificationType || !identificationNumber) {
				throw new Error('Por favor completa todos los campos');
			}

			const authToken = localStorage.getItem('auth_token');
			const clienteIdLS = localStorage.getItem('cliente_id');

			if (!authToken || !clienteIdLS) {
				throw new Error('No hay sesión activa');
			}

			const paymentData = {
				transaction_amount: Number(total),
				description: `Pedido VIDRIOBRAS - Carrito ${carritoId}`,
				payment_method_id: selectedPaymentMethod,
				payer: {
					email: email,
					first_name: payerFirstName,
					last_name: payerLastName,
					identification: {
						type: identificationType,
						number: identificationNumber
					}
				},
				carrito_id: carritoId,
				cliente_id: clienteIdLS
			};

			console.log('[OTROS] Enviando pago:', paymentData);

			const res = await fetch('/api/pagos/procesar_otros_metodos', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`
				},
				body: JSON.stringify(paymentData)
			});

			const data = await res.json();
			console.log('[OTROS] Respuesta completa:', data);
			console.log('[OTROS] External URL:', data.external_resource_url);
			console.log('[OTROS] Success:', data.success);

			if (!res.ok || !data.success) {
				throw new Error(data?.message || 'Pago rechazado');
			}

			// Si hay external_resource_url (PagoEfectivo), redirigir
			if (data.external_resource_url) {
				console.log('[OTROS] Redirigiendo a:', data.external_resource_url);
				window.location.href = data.external_resource_url;
			} else {
				console.log('[OTROS] ✅ Pago procesado:', data);
				onPaymentSuccess(data);
			}

		} catch (err) {
			console.error('[OTROS] Error:', err);
			onPaymentError(err.message || 'Error al procesar el pago');
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
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<h3 style={{
					fontFamily: FONTS.title,
					color: COLORS.primary
				}}>
					🏦 Otros Métodos de Pago
				</h3>
				<button
					type="button"
					onClick={onBack}
					style={{
						padding: '6px 10px',
						border: '1px solid #ccc',
						borderRadius: 6,
						background: '#fff',
						cursor: 'pointer',
						fontFamily: FONTS.body
					}}
				>
					⬅ Volver
				</button>
			</div>

			{/* Información del pago */}
			<div style={{
				backgroundColor: COLORS.primary,
				color: 'white',
				padding: 12,
				borderRadius: 4,
				marginBottom: 20,
				textAlign: 'center',
				fontWeight: 'bold'
			}}>
				Total a pagar: S/ {Number(total).toFixed(2)}
			</div>

			<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
				{/* Nombre */}
				<div>
					<label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
						👤 Nombre
					</label>
					<input
						type="text"
						value={payerFirstName}
						onChange={(e) => setPayerFirstName(e.target.value)}
						placeholder="Juan"
						required
						style={textStyle}
					/>
				</div>

				{/* Apellido */}
				<div>
					<label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
						👤 Apellido
					</label>
					<input
						type="text"
						value={payerLastName}
						onChange={(e) => setPayerLastName(e.target.value)}
						placeholder="Pérez"
						required
						style={textStyle}
					/>
				</div>

				{/* Email */}
				<div>
					<label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
						📧 Email
					</label>
					<input
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="tu@email.com"
						required
						style={textStyle}
					/>
				</div>

				{/* Tipo de Documento */}
				<div>
					<label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
						📋 Tipo de Documento
					</label>
					<select
						value={identificationType}
						onChange={(e) => setIdentificationType(e.target.value)}
						required
						style={textStyle}
					>
						<option value="">Selecciona tipo de documento</option>
						{docTypes.map((doc) => (
							<option key={doc.id} value={doc.id}>
								{doc.name}
							</option>
						))}
					</select>
				</div>

				{/* Número de Documento */}
				<div>
					<label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
						🆔 Número de Documento
					</label>
					<input
						type="text"
						value={identificationNumber}
						onChange={(e) => setIdentificationNumber(e.target.value)}
						placeholder="12345678"
						required
						style={textStyle}
					/>
				</div>

				{/* Método de Pago */}
				<div>
					<label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
						🏦 Método de Pago
					</label>
					<select
						value={selectedPaymentMethod}
						onChange={(e) => setSelectedPaymentMethod(e.target.value)}
						required
						style={textStyle}
					>
						<option value="pagoefectivo_atm">PagoEfectivo (Cajeros)</option>
						{paymentMethods.map((method) => (
							<option key={method.id} value={method.id}>
								{method.name}
							</option>
						))}
					</select>
				</div>

				{/* Información sobre PagoEfectivo */}
				{selectedPaymentMethod === 'pagoefectivo_atm' && (
					<div style={{
						backgroundColor: '#fff3cd',
						padding: 12,
						borderRadius: 4,
						fontSize: 12,
						color: '#856404',
						fontFamily: FONTS.body
					}}>
						ℹ️ <strong>PagoEfectivo:</strong><br />
						Después de procesar, recibirás un código para pagar en cualquier cajero automático de las principales redes del Perú.
					</div>
				)}

				{/* Botón enviar */}
				<button
					type="submit"
					disabled={isProcessing}
					style={{
						width: '100%',
						padding: 12,
						backgroundColor: isProcessing ? '#ccc' : COLORS.primary,
						color: 'white',
						border: 'none',
						borderRadius: 4,
						fontWeight: 'bold',
						cursor: isProcessing ? 'not-allowed' : 'pointer',
						fontFamily: FONTS.body
					}}
				>
					{isProcessing ? '⏳ Procesando...' : `💳 Pagar S/ ${total.toFixed(2)}`}
				</button>
			</form>
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
