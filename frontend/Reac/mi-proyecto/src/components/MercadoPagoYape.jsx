import React, { useEffect, useState } from 'react';
import { COLORS, FONTS } from '../colors';

const MP_PUBLIC_KEY = 'TEST-dfb34bd8-a2a0-42b0-86d7-9b7ad185e78f';

export default function MercadoPagoYape({
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
	const [payerEmail, setPayerEmail] = useState(
		localStorage.getItem('cliente_correo') || ''
	);
	const [yapePhone, setYapePhone] = useState('');
	const [yapeOtp, setYapeOtp] = useState('');

	useEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://sdk.mercadopago.com/js/v2';
		script.async = true;

		script.onload = () => {
			if (!window.MercadoPago) {
				onPaymentError('No se pudo cargar Mercado Pago SDK');
				return;
			}

			const mpInstance = new window.MercadoPago(
				MP_PUBLIC_KEY,
				{ locale: 'es-PE' }
			);

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
			if (!yapePhone || !yapeOtp) {
				throw new Error('Ingresa celular y OTP de Yape');
			}

			if (!mp) {
				throw new Error('SDK de Mercado Pago no listo');
			}

			const emailCliente = payerEmail || localStorage.getItem('cliente_correo');
			const authToken = localStorage.getItem('auth_token');

			if (!authToken) {
				throw new Error('No hay sesión activa');
			}

			// Generar token Yape
			console.log('[YAPE] Generando token con:', { yapePhone, yapeOtp });
			const yape = mp.yape({ otp: yapeOtp, phoneNumber: yapePhone });
			const yapeToken = await yape.create();

			if (!yapeToken?.id) {
				throw new Error('No se pudo generar el token Yape');
			}

			console.log('[YAPE] ✅ Token generado:', yapeToken.id);

			// Enviar token al backend
			const paymentBody = {
				token: yapeToken.id,
				carrito_id: carritoId,
				cliente_id: clienteId,
				amount: Number(total),
				payment_method_id: 'yape',
				payer_email: emailCliente,
				installments: 1
			};

			console.log('[YAPE] Enviando pago al backend:', paymentBody);

			const res = await fetch('/api/pagos/procesar_pago', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${authToken}`
				},
				body: JSON.stringify(paymentBody)
			});

			const data = await res.json();

			if (!res.ok || !data.success) {
				throw new Error(data?.message || 'Pago rechazado');
			}

			console.log('[YAPE] ✅ Pago procesado:', data);
			onPaymentSuccess(data);

		} catch (err) {
			console.error('[YAPE] ❌ Error:', err.message);
			onPaymentError(err.message || 'Error al procesar Yape');
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
					🟣 Pago con Yape
				</h3>
				<button
					type="button"
					onClick={onBack}
					style={{
						padding: '6px 10px',
						border: '1px solid #ccc',
						borderRadius: 6,
						background: '#fff',
						cursor: 'pointer'
					}}
				>
					⬅ Volver
				</button>
			</div>

			{!mpLoaded && <p>⏳ Cargando formulario...</p>}

			<form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
				{/* Email */}
				<div>
					<label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
						📧 Email
					</label>
					<input
						type="email"
						value={payerEmail}
						onChange={(e) => setPayerEmail(e.target.value)}
						placeholder="tu@email.com"
						required
						style={{
							width: '100%',
							padding: 8,
							borderRadius: 4,
							border: '1px solid #ccc',
							fontFamily: FONTS.body
						}}
					/>
				</div>

				{/* Celular Yape */}
				<div>
					<label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
						📱 Celular Yape
					</label>
					<input
						type="tel"
						value={yapePhone}
						onChange={(e) => setYapePhone(e.target.value)}
						placeholder="111111111"
						required
						style={{
							width: '100%',
							padding: 8,
							borderRadius: 4,
							border: '1px solid #ccc',
							fontFamily: FONTS.body
						}}
					/>
				</div>

				{/* OTP Yape */}
				<div>
					<label style={{ fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
						🔐 OTP Yape
					</label>
					<input
						type="text"
						value={yapeOtp}
						onChange={(e) => setYapeOtp(e.target.value)}
						placeholder="123456"
						required
						style={{
							width: '100%',
							padding: 8,
							borderRadius: 4,
							border: '1px solid #ccc',
							fontFamily: FONTS.body
						}}
					/>
				</div>

				{/* Credenciales de prueba */}
				<div style={{
					backgroundColor: '#fff3cd',
					padding: 10,
					borderRadius: 4,
					fontSize: 12,
					color: '#856404'
				}}>
					⚡ <strong>Credenciales de prueba:</strong><br />
					Celular: 111111111 / OTP: 123456 → aprobado
				</div>

				{/* Total */}
				<div style={{
					backgroundColor: COLORS.primary,
					color: 'white',
					padding: 10,
					borderRadius: 4,
					textAlign: 'center',
					fontWeight: 'bold'
				}}>
					Total a pagar: S/ {Number(total).toFixed(2)}
				</div>

				{/* Botón enviar */}
				<button
					type="submit"
					disabled={isProcessing || !mpLoaded}
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
					{isProcessing ? '⏳ Procesando...' : '✅ Procesar pago Yape'}
				</button>
			</form>
		</div>
	);
}
