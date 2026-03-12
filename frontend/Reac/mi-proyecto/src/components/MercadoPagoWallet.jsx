import React, { useEffect, useState } from 'react';
import { COLORS, FONTS } from '../colors';

const MP_PUBLIC_KEY = 'TEST-dfb34bd8-a2a0-42b0-86d7-9b7ad185e78f';

export default function MercadoPagoWallet({
	carritoId,
	clienteId,
	total,
	items,
	onPaymentSuccess,
	onPaymentError,
	onLoading,
	onBack
}) {
	const [isLoading, setIsLoading] = useState(true);
	const [mpLoaded, setMpLoaded] = useState(false);
	const [mp, setMp] = useState(null);
	const [preferenceId, setPreferenceId] = useState(null);
	const [error, setError] = useState(null);

	// 1. Cargar SDK de Mercado Pago
	useEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://sdk.mercadopago.com/js/v2';
		script.async = true;

		script.onload = () => {
			if (!window.MercadoPago) {
				setError('No se pudo cargar Mercado Pago SDK');
				onPaymentError('No se pudo cargar Mercado Pago SDK');
				return;
			}

			const mpInstance = new window.MercadoPago(MP_PUBLIC_KEY, {
				locale: 'es-PE'
			});

			setMp(mpInstance);
			setMpLoaded(true);
		};

		script.onerror = () => {
			setError('Error al cargar el SDK de Mercado Pago');
			onPaymentError('Error al cargar el SDK de Mercado Pago');
		};

		document.body.appendChild(script);

		return () => {
			if (document.body.contains(script)) {
				document.body.removeChild(script);
			}
		};
	}, [onPaymentError]);

	// 2. Crear preferencia en el backend
	useEffect(() => {
		if (!mpLoaded) return;

		const crearPreferencia = async () => {
			try {
				setIsLoading(true);
				const authToken = localStorage.getItem('auth_token');
				const clienteIdLS = localStorage.getItem('cliente_id');
				const emailCliente = localStorage.getItem('cliente_correo');

				if (!authToken || !clienteIdLS) {
					throw new Error('No hay sesión activa');
				}

				const body = {
					carrito_id: carritoId,
					cliente_id: clienteIdLS,
					items: items || [],
					email_cliente: emailCliente,
					total: total,
					purpose: 'wallet_purchase'  // ✅ Especificar que es para Wallet
				};

				console.log('[WALLET] Creando preferencia:', body);

				const res = await fetch('/api/pagos/crear_preferencia', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${authToken}`
					},
					body: JSON.stringify(body)
				});

				const data = await res.json();
				console.log('[WALLET] Respuesta preferencia:', data);

				if (!res.ok || !data.success) {
					throw new Error(data?.message || 'No se pudo crear la preferencia');
				}

				setPreferenceId(data.preference_id);
				console.log('[WALLET] ✅ Preferencia creada:', data.preference_id);

			} catch (err) {
				console.error('[WALLET] Error creando preferencia:', err);
				setError(err.message);
				onPaymentError(err.message || 'Error al crear preferencia');
			} finally {
				setIsLoading(false);
			}
		};

		crearPreferencia();
	}, [mpLoaded]);

	// 3. Inicializar Brick de Wallet cuando tengamos preferenceId
	useEffect(() => {
		if (!mp || !preferenceId) return;

		const initWallet = async () => {
			try {
				console.log('[WALLET] Inicializando Brick de Wallet con preferencia:', preferenceId);

				await mp.bricks().create('wallet', 'wallet_container', {
					initialization: {
						preferenceId: preferenceId
					},
					onError: (error) => {
						console.error('[WALLET] Error en Brick:', error);
						onPaymentError('Error en el proceso de pago');
					},
					onSubmit: async (formData) => {
						console.log('[WALLET] Pago procesado:', formData);
						// El pago se procesa automáticamente por Mercado Pago
						// Los webhooks notificarán el resultado
					}
				});

				console.log('[WALLET] ✅ Brick de Wallet inicializado');
			} catch (err) {
				console.error('[WALLET] Error inicializando Brick:', err);
				setError('Error al inicializar el formulario de pago');
				onPaymentError('Error al inicializar el formulario de pago');
			}
		};

		initWallet();
	}, [mp, preferenceId]);


	// Solo popup: no inicializar el Brick en el DOM principal
	const handleOpenPopup = () => {
			const popup = window.open('', 'mp_wallet_popup', 'width=500,height=700');
			if (!popup) return;

			popup.document.write(`
				<html>
					<head>
						<title>Pagar con Mercado Pago</title>
						<style>
							body { font-family: Arial, sans-serif; background: #f9f9f9; margin:0; padding:0; }
							.header { background: ${COLORS.primary}; color: #fff; padding: 16px; text-align: center; font-size: 20px; }
							.info { background: #e3f2fd; color: #1565c0; padding: 10px; border-radius: 4px; margin: 16px; font-size: 13px; }
							.total { background: ${COLORS.primary}; color: #fff; padding: 12px; border-radius: 4px; margin: 16px; text-align: center; font-weight: bold; }
						</style>
					</head>
					<body>
						<div class="header">💳 Pagar con Cuenta Mercado Pago</div>
						<div class="total">Total a pagar: S/ ${Number(total).toFixed(2)}</div>
						<div id="wallet_container"></div>
						<div class="info">
							💡 <strong>Información:</strong><br />
							Inicia sesión con tu cuenta de Mercado Pago o Mercado Libre para pagar de forma segura. También puedes agregar una nueva tarjeta durante el pago.
						</div>
					</body>
				</html>
			`);
			popup.document.close();

			const script = popup.document.createElement('script');
			script.src = 'https://sdk.mercadopago.com/js/v2';
			script.async = true;
			script.onload = async () => {
				if (!popup.window.MercadoPago) {
					popup.alert('No se pudo cargar Mercado Pago SDK');
					return;
				}
				const mpInstance = new popup.window.MercadoPago(MP_PUBLIC_KEY, { locale: 'es-PE' });
				try {
					await mpInstance.bricks().create('wallet', 'wallet_container', {
						initialization: { preferenceId },
						onError: (error) => {
							popup.alert('Error en el proceso de pago');
						},
						onSubmit: async (formData) => {
							// El pago se procesa automáticamente
						}
					});
				} catch (err) {
					popup.alert('Error al inicializar el formulario de pago');
				}
			};
			popup.document.body.appendChild(script);
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
					💳 Pagar con Cuenta Mercado Pago
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


			{/* Mensaje de carga */}
			{isLoading && (
				<div style={{
					textAlign: 'center',
					padding: 20,
					color: '#666'
				}}>
					⏳ Preparando formulario de pago...
				</div>
			)}

			{/* No mostrar error de inicialización del Brick aquí, solo errores de preferencia o de carga SDK */}
			{error && !preferenceId && (
				<div style={{
					backgroundColor: '#f8d7da',
					color: '#721c24',
					padding: 12,
					borderRadius: 4,
					marginBottom: 20,
					fontFamily: FONTS.body
				}}>
					❌ {error}
				</div>
			)}

			{/* Botón para abrir el Brick en popup */}
			{!isLoading && preferenceId && (
				<button
					type="button"
					onClick={handleOpenPopup}
					style={{
						padding: 14,
						background: COLORS.primary,
						color: '#fff',
						border: 'none',
						borderRadius: 6,
						fontWeight: 'bold',
						cursor: 'pointer',
						fontSize: 16,
						width: '100%',
						marginBottom: 16
					}}
				>
					💳 Abrir pago en ventana aparte
				</button>
			)}

			{/* Ya no se renderiza el Brick aquí, solo en el popup */}

			{/* Información adicional */}
			<div style={{
				marginTop: 20,
				padding: 12,
				backgroundColor: '#e3f2fd',
				borderRadius: 4,
				fontSize: 12,
				color: '#1565c0',
				fontFamily: FONTS.body
			}}>
				💡 <strong>Información:</strong><br />
				Inicia sesión con tu cuenta de Mercado Pago o Mercado Libre para pagar de forma segura. También puedes agregar una nueva tarjeta durante el pago.
			</div>
		</div>
	);
}
