# -*- coding: utf-8 -*-
"""
Servicio de integración con Mercado Pago
"""

import mercadopago
import os
import uuid
import re
from typing import Optional, Dict, List, Any
from dotenv import load_dotenv
from mercadopago import config

load_dotenv()


class MercadoPagoService:

    def __init__(self):
        access_token = os.getenv("MERCADO_PAGO_ACCESS_TOKEN")
        if not access_token:
            raise ValueError("MERCADO_PAGO_ACCESS_TOKEN no configurado en .env")

        print("[MP_SERVICE] SDK inicializado")
        self.sdk = mercadopago.SDK(access_token)

    # --------------------------------------------------
    # VALIDAR EMAIL (COMENTADO - ACEPTA CUALQUIER EMAIL)
    # --------------------------------------------------
    def _validar_email_test(self, email: str):
        # ✅ Ahora acepta cualquier email válido
        # Mercado Pago automáticamente lo convierte a test user en modo TEST
        if not email:
            raise ValueError("Email de comprador es obligatorio")

    # --------------------------------------------------
    # CREAR PREFERENCIA (CHECKOUT)
    # --------------------------------------------------
    def crear_preferencia_pago(
        self,
        carrito_id: str,
        cliente_id: str,
        items: List[Dict[str, Any]],
        email_cliente: str,
        total: float
    ) -> Dict[str, Any]:

        try:
            self._validar_email_test(email_cliente)

            preference_data = {
                "items": items,
                "payer": {
                    "email": email_cliente
                },
                "binary_mode": True,
                "statement_descriptor": "VIDRIOBRAS",
                "external_reference": carrito_id
            }

            print("[MP_SERVICE] Creando preferencia...")
            result = self.sdk.preference().create(preference_data)

            if result.get("status") == 201:
                response = result["response"]
                print(f"[MP_SERVICE] ✅ Preferencia creada {response.get('id')}")
                return {
                    "success": True,
                    "preference_id": response.get("id"),
                    "init_point": response.get("init_point"),
                    "sandbox_init_point": response.get("sandbox_init_point")
                }

            return {
                "success": False,
                "status": result.get("status"),
                "error": result.get("response", {}).get("message"),
                "cause": result.get("response", {}).get("cause")
            }

        except Exception as e:
            print(f"[MP_SERVICE] ❌ Error preferencia: {e}")
            return {"success": False, "error": str(e)}

    # --------------------------------------------------
    # PROCESAR PAGO DIRECTO (CARDFORM)
    # --------------------------------------------------
    def procesar_pago_con_token(
        self,
        token: str,
        carrito_id: str,
        cliente_id: str,
        amount: float,
        payment_method_id: str,
        issuer_id: Optional[str],
        installments: int,
        payer_email: str,
        payer_identification: Dict[str, str]
    ) -> Dict[str, Any]:

        try:
            # ✅ Email acepta cualquier formato (igual que mp_test que funciona)
            print(f"[MP_SERVICE] Procesando pago directo...")
            print(f"[MP_SERVICE] Email: {payer_email}")
            print(f"[MP_SERVICE] Monto: {amount}")
            print(f"[MP_SERVICE] Payment Method: {payment_method_id}")

            payment_data = {
                "transaction_amount": float(amount),
                "token": token,
                "description": f"Pedido VIDRIOBRAS - Carrito {carrito_id}",
                "installments": int(installments),
                "payment_method_id": payment_method_id,
                "binary_mode": True,
                "payer": {
                    "email": payer_email,
                    "identification": {
                        "type": payer_identification.get("type", "DNI"),
                        "number": payer_identification.get("number", "00000000")
                    }
                },
                "external_reference": carrito_id,
                "metadata": {
                    "carrito_id": carrito_id,
                    "cliente_id": cliente_id
                }
            }

            # 🧹 issuer_id solo si existe
            if issuer_id:
                payment_data["issuer_id"] = issuer_id

            request_options = config.RequestOptions()
            request_options.custom_headers = {
                "x-idempotency-key": str(uuid.uuid4())
            }

            print(f"[MP_SERVICE] Payment Data: {payment_data}")
            result = self.sdk.payment().create(payment_data, request_options)
            print(f"[MP_SERVICE] Respuesta: {result}")

            if result.get("status") == 201:
                response = result["response"]
                print("[MP_SERVICE] ✅ Pago aprobado")
                return {
                    "success": True,
                    "payment_id": response.get("id"),
                    "status": response.get("status"),
                    "status_detail": response.get("status_detail"),
                    "amount": response.get("transaction_amount")
                }

            return {
                "success": False,
                "status": result.get("status"),
                "error": result.get("response", {}).get("message"),
                "cause": result.get("response", {}).get("cause")
            }

        except Exception as e:
            print(f"[MP_SERVICE] ❌ Error pago: {e}")
            return {"success": False, "error": str(e)}


# Instancia global
mercado_pago_service = MercadoPagoService()
