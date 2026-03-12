# -*- coding: utf-8 -*-
"""
Controlador de pagos con Mercado Pago
"""

from flask import Blueprint, request, jsonify
from app.services.mercado_pago_service import mercado_pago_service
from app.services.supabase_client import supabase
from app.controllers.clientes_controller import verify_jwt
import uuid

pagos_mp_bp = Blueprint("pagos_mp", __name__)

# --------------------------------------------------
# PROCESAR PAGO TEST (MODO DESARROLLO)
# --------------------------------------------------
@pagos_mp_bp.route("/api/pagos/procesar_pago_test", methods=["POST"])
def procesar_pago_test():
    """
    ✅ ENDPOINT PARA DESARROLLO - Simula un pago exitoso sin Mercado Pago real
    Usar esto para probar el flujo completo sin tarjeta real
    """
    try:
        print("[MP_TEST] ===== /api/pagos/procesar_pago_test =====", flush=True)
        
        # Validar JWT
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "message": "Token no proporcionado"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = verify_jwt(token)
        if not payload:
            return jsonify({"success": False, "message": "Token inválido"}), 401

        cliente_id_token = payload.get("sub")

        # Obtener datos
        data = request.get_json() or {}
        carrito_id = data.get("carrito_id")
        cliente_id = data.get("cliente_id")
        amount = data.get("amount")
        payer_email = data.get("payer_email")

        if not carrito_id or not cliente_id or not amount or not payer_email:
            print("[MP_TEST] ❌ Datos incompletos", flush=True)
            return jsonify({
                "success": False,
                "message": "Datos incompletos: carrito_id, cliente_id, amount, payer_email requeridos"
            }), 400

        # Validar que cliente coincida
        if cliente_id != cliente_id_token:
            return jsonify({"success": False, "message": "No autorizado"}), 403

        # ✅ SIMULAR PAGO EXITOSO
        payment_id = str(uuid.uuid4())
        
        print(f"[MP_TEST] 🧪 Simulando pago exitoso", flush=True)
        print(f"[MP_TEST] Cliente: {cliente_id}, Monto: S/ {amount}, Email: {payer_email}", flush=True)
        print(f"[MP_TEST] ✅ Payment ID simulado: {payment_id}", flush=True)

        return jsonify({
            "success": True,
            "message": "✅ Pago simulado exitosamente (MODO DESARROLLO)",
            "payment_id": payment_id,
            "status": "approved",
            "status_detail": "accredited",
            "amount": amount,
            "userMessage": "✅ ¡Pago Simulado Exitoso!",
            "userDetail": f"ID Pago: {payment_id} (DESARROLLO)"
        }), 200

    except Exception as e:
        print(f"[MP_TEST] ❌ Error: {e}", flush=True)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# --------------------------------------------------
# CREAR PREFERENCIA DE PAGO
# --------------------------------------------------
@pagos_mp_bp.route("/api/pagos/crear_preferencia", methods=["POST"])
def crear_preferencia():
    try:
        # ---------------- JWT ----------------
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "message": "Token no proporcionado"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = verify_jwt(token)
        if not payload:
            return jsonify({"success": False, "message": "Token inválido"}), 401

        cliente_id_token = payload.get("sub")

        # ---------------- BODY ----------------
        data = request.get_json() or {}
        carrito_id = data.get("carrito_id")
        cliente_id = data.get("cliente_id")

        if not carrito_id or not cliente_id:
            return jsonify({"success": False, "message": "Faltan datos"}), 400

        if cliente_id != cliente_id_token:
            return jsonify({"success": False, "message": "No autorizado"}), 403

        # ---------------- CARRITO ----------------
        productos_carrito = supabase.table("productos_carrito") \
            .select("producto_id, cantidad") \
            .eq("carrito_id", carrito_id) \
            .execute().data or []

        if not productos_carrito:
            return jsonify({"success": False, "message": "Carrito vacío"}), 400

        producto_ids = [p["producto_id"] for p in productos_carrito]

        productos = supabase.table("productos") \
            .select("id_producto, nombre, precio_unitario, codigo") \
            .in_("id_producto", producto_ids) \
            .execute().data or []

        productos_map = {p["id_producto"]: p for p in productos}

        # ---------------- EMAIL CLIENTE ----------------
        # ✅ Obtener email real del cliente desde Supabase
        cliente_data = supabase.table("cliente") \
            .select("correo") \
            .eq("id_cliente", cliente_id) \
            .execute().data
        
        if not cliente_data:
            return jsonify({"success": False, "message": "Cliente no encontrado"}), 404
        
        email_cliente = cliente_data[0]["correo"]

        # ---------------- ITEMS ----------------
        items = []
        total = 0

        for pc in productos_carrito:
            prod = productos_map.get(pc["producto_id"])
            if not prod:
                continue

            cantidad = int(pc["cantidad"])
            precio = float(prod["precio_unitario"])
            subtotal = cantidad * precio
            total += subtotal

            items.append({
                "title": prod["nombre"],
                "quantity": cantidad,
                "unit_price": precio,
                "currency_id": "PEN",
                "description": f"Código: {prod.get('codigo', 'N/A')}"
            })

        if total <= 0:
            return jsonify({"success": False, "message": "Total inválido"}), 400

        # ---------------- MERCADO PAGO ----------------
        resultado = mercado_pago_service.crear_preferencia_pago(
            carrito_id=carrito_id,
            cliente_id=cliente_id,
            items=items,
            email_cliente=email_cliente,
            total=total
        )

        if resultado.get("success"):
            return jsonify({
                "success": True,
                "init_point": resultado["init_point"],
                "preference_id": resultado["preference_id"],
                "total": total
            }), 200

        return jsonify({
            "success": False,
            "message": "Error creando preferencia",
            "details": resultado
        }), 500

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# --------------------------------------------------
# PROCESAR PAGO (CORS OPTIONS FIX)
# --------------------------------------------------
@pagos_mp_bp.route(
    "/api/pagos/procesar_pago",
    methods=["POST", "OPTIONS"]
)
def procesar_pago():
    # -------- PRE-FLIGHT CORS --------
    if request.method == "OPTIONS":
        return "", 200

    try:
        # ---------------- JWT ----------------
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "message": "Token no proporcionado"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = verify_jwt(token)
        if not payload:
            return jsonify({"success": False, "message": "Token inválido"}), 401

        data = request.get_json() or {}

        # ---------------- BODY ----------------
        token_mp = data.get("token")
        carrito_id = data.get("carrito_id")
        cliente_id = data.get("cliente_id")
        amount = data.get("amount")
        payment_method_id = data.get("payment_method_id")
        issuer_id = data.get("issuer_id")
        installments = data.get("installments", 1)
        payer_email = data.get("payer_email")
        payer_identification = data.get("payer_identification") or {}

        if not token_mp or not carrito_id or not cliente_id or not amount or not payment_method_id or not payer_email:
            return jsonify({
                "success": False,
                "message": "Datos incompletos"
            }), 400

        # Validar que el cliente del token coincida
        cliente_id_token = payload.get("sub")
        if cliente_id != cliente_id_token:
            return jsonify({"success": False, "message": "No autorizado"}), 403

        # ---------------- MERCADO PAGO ----------------
        resultado = mercado_pago_service.procesar_pago_con_token(
            token=token_mp,
            carrito_id=carrito_id,
            cliente_id=cliente_id,
            amount=float(amount),
            payment_method_id=payment_method_id,
            issuer_id=issuer_id,
            installments=int(installments),
            payer_email=payer_email,
            payer_identification=payer_identification
        )

        if resultado.get("success"):
            return jsonify({
                "success": True,
                "message": "Pago procesado correctamente",
                "payment_id": resultado.get("payment_id"),
                "status": resultado.get("status"),
                "status_detail": resultado.get("status_detail"),
                "amount": resultado.get("amount")
            }), 200

        return jsonify({
            "success": False,
            "message": "Pago rechazado",
            "error": resultado.get("error"),
            "cause": resultado.get("cause")
        }), 400

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# --------------------------------------------------
# CONFIRMAR PAGO Y GUARDAR CARRITO + PRODUCTOS
# --------------------------------------------------
@pagos_mp_bp.route("/api/pagos/confirmar_compra", methods=["POST"])
def confirmar_compra():
    """
    Después de que el pago es exitoso, este endpoint:
    1. Usa el carrito_id existente
    2. Guarda productos PLANCHA en productos_carrito
    3. Guarda productos CORTE en tabla cortes
    4. Crea notificación de entrega
    
    Body: {
        "carrito_id": "uuid",
        "cliente_id": "uuid",
        "productos": [
            {
                "producto_id": "uuid",
                "cantidad": 2,
                "tipo_venta": "plancha"
            },
            {
                "producto_id": "uuid",
                "tipo_venta": "corte",
                "cortes": [
                    {"ancho_cm": 100, "alto_cm": 200, "cantidad": 1},
                    {"ancho_cm": 150, "alto_cm": 300, "cantidad": 2}
                ]
            }
        ],
        "payment_id": "12345"
    }
    """
    try:
        # Validar JWT
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"success": False, "message": "Token no proporcionado"}), 401

        token = auth_header.split(" ", 1)[1]
        payload = verify_jwt(token)
        if not payload:
            return jsonify({"success": False, "message": "Token inválido"}), 401

        cliente_id_token = payload.get("sub")

        # Obtener data
        data = request.get_json() or {}
        carrito_id = data.get("carrito_id")
        cliente_id = data.get("cliente_id")
        productos = data.get("productos", [])
        payment_id = data.get("payment_id")

        if not carrito_id or not cliente_id or not productos or not payment_id:
            return jsonify({
                "success": False,
                "message": "Datos incompletos: carrito_id, cliente_id, productos, payment_id requeridos"
            }), 400

        # Validar que el cliente del token coincida
        if cliente_id != cliente_id_token:
            return jsonify({"success": False, "message": "No autorizado"}), 403

        # Si carrito_id es temporal (comienza con 'temp_'), generar UUID real
        if str(carrito_id).startswith('temp_'):
            carrito_id = str(uuid.uuid4())
            print(f"[CONFIRMAR_COMPRA] Convirtiendo carrito temporal a UUID: {carrito_id}")

        # 1. Verificar/Crear carrito si no existe
        try:
            carrito_check = supabase.table("carrito_compras") \
                .select("id_carrito") \
                .eq("id_carrito", carrito_id) \
                .limit(1) \
                .execute()
            
            if not carrito_check.data:
                # Crear nuevo carrito si no existe
                print(f"[CONFIRMAR_COMPRA] Creando carrito: {carrito_id} para cliente: {cliente_id}")
                carrito_data = {
                    "id_carrito": carrito_id,
                    "cliente_id": cliente_id,
                    "estado": "inicio"
                }
                carrito_insert = supabase.table("carrito_compras").insert(carrito_data).execute()
                print(f"[CONFIRMAR_COMPRA] ✅ Carrito creado exitosamente")
            else:
                print(f"[CONFIRMAR_COMPRA] Carrito ya existe: {carrito_id}")
        except Exception as e:
            print(f"[CONFIRMAR_COMPRA] ❌ Error verificando/creando carrito: {str(e)}")
            return jsonify({
                "success": False,
                "message": f"Error verificando/creando carrito: {str(e)}"
            }), 500

        # 2. Separar productos en PLANCHA y CORTE
        productos_plancha = []
        cortes_personalizados = []

        print(f"[CONFIRMAR_COMPRA] Procesando {len(productos)} productos del carrito")
        
        for idx, prod in enumerate(productos):
            producto_id = prod.get("producto_id")
            tipo_venta = prod.get("tipo_venta", "plancha")
            
            print(f"[CONFIRMAR_COMPRA] Producto {idx}: ID={producto_id}, Tipo={tipo_venta}")
            
            if not producto_id:
                print(f"[CONFIRMAR_COMPRA] ⚠️ Producto {idx} sin ID, saltando")
                continue
            
            if tipo_venta == "plancha":
                try:
                    cantidad = int(prod.get("cantidad", 1))
                except (ValueError, TypeError):
                    cantidad = 1
                
                if cantidad <= 0:
                    cantidad = 1
                
                print(f"[CONFIRMAR_COMPRA] ✅ Plancha: producto_id={producto_id}, cantidad={cantidad}")
                productos_plancha.append({
                    "producto_id": producto_id,
                    "carrito_id": carrito_id,
                    "cantidad": cantidad
                })
            
            elif tipo_venta == "corte":
                cortes_arr = prod.get("cortes", [])
                print(f"[CONFIRMAR_COMPRA] Corte: {len(cortes_arr)} especificaciones")
                
                for corte_idx, corte in enumerate(cortes_arr):
                    # Convertir a float para validación
                    try:
                        ancho_cm = float(corte.get("ancho_cm", 0))
                    except (ValueError, TypeError):
                        print(f"[CONFIRMAR_COMPRA] ⚠️ Corte {corte_idx}: ancho_cm inválido, saltando")
                        continue
                    
                    try:
                        alto_cm = float(corte.get("alto_cm", 0))
                    except (ValueError, TypeError):
                        print(f"[CONFIRMAR_COMPRA] ⚠️ Corte {corte_idx}: alto_cm inválido, saltando")
                        continue
                    
                    try:
                        cantidad = int(corte.get("cantidad", 1))
                    except (ValueError, TypeError):
                        cantidad = 1
                    
                    # Validaciones
                    if ancho_cm <= 0:
                        print(f"[CONFIRMAR_COMPRA] ⚠️ Corte {corte_idx}: ancho_cm <= 0, saltando")
                        continue
                    if alto_cm <= 0:
                        print(f"[CONFIRMAR_COMPRA] ⚠️ Corte {corte_idx}: alto_cm <= 0, saltando")
                        continue
                    if cantidad <= 0:
                        cantidad = 1
                    
                    print(f"[CONFIRMAR_COMPRA] ✅ Corte: {ancho_cm}x{alto_cm}cm, cantidad={cantidad}")
                    cortes_personalizados.append({
                        "carrito_id": carrito_id,
                        "producto_id": producto_id,
                        "ancho_cm": float(ancho_cm),
                        "alto_cm": float(alto_cm),
                        "cantidad": int(cantidad),
                        "estado": "pendiente"
                    })

        # 3. Insertar PLANCHAS en productos_carrito (agrupar por producto_id)
        if productos_plancha:
            try:
                # Agrupar por producto_id para sumar cantidades si hay duplicados
                productos_agrupados = {}
                for pp in productos_plancha:
                    prod_id = pp["producto_id"]
                    if prod_id not in productos_agrupados:
                        productos_agrupados[prod_id] = pp
                    else:
                        # Si el mismo producto aparece dos veces, sumar cantidad
                        productos_agrupados[prod_id]["cantidad"] += pp["cantidad"]
                
                productos_plancha_final = list(productos_agrupados.values())
                print(f"[CONFIRMAR_COMPRA] Insertando {len(productos_plancha_final)} productos plancha únicos")
                
                supabase.table("productos_carrito").insert(productos_plancha_final).execute()
                print(f"[CONFIRMAR_COMPRA] ✅ Productos plancha guardados")
            except Exception as e:
                print(f"[CONFIRMAR_COMPRA] ❌ Error guardando productos plancha: {str(e)}")
                return jsonify({
                    "success": False,
                    "message": f"Error guardando productos plancha: {str(e)}",
                    "carrito_id": carrito_id
                }), 500

        # 4. Insertar CORTES en tabla cortes
        if cortes_personalizados:
            try:
                print(f"[CONFIRMAR_COMPRA] Insertando {len(cortes_personalizados)} cortes")
                supabase.table("cortes").insert(cortes_personalizados).execute()
                print(f"[CONFIRMAR_COMPRA] ✅ Cortes guardados")
            except Exception as e:
                print(f"[CONFIRMAR_COMPRA] ❌ Error guardando cortes: {str(e)}")
                return jsonify({
                    "success": False,
                    "message": f"Error guardando cortes: {str(e)}",
                    "carrito_id": carrito_id
                }), 500

        # 5. Crear notificación de entrega
        try:
            from app.services.notificacion_entrega_service import crear_notificacion_entrega

            # Obtener nombre del cliente
            cli = supabase.table("cliente").select("nombre").eq("id_cliente", cliente_id).limit(1).execute()
            nombre_cliente = None
            if cli and cli.data:
                nombre_cliente = cli.data[0].get("nombre")

            total_items = 0
            total_items += sum(pp.get("cantidad", 0) for pp in productos_plancha)
            total_items += sum(c.get("cantidad", 0) for c in cortes_personalizados)

            descripcion = f"Pago {payment_id} - items: {total_items}"

            notif_result = crear_notificacion_entrega(
                cliente_id=cliente_id,
                carrito_id=carrito_id,
                nombre_cliente=nombre_cliente or "Cliente",
                cantidad_items=total_items,
                descripcion=descripcion
            )

            if not notif_result.get("success"):
                print(f"[CONFIRMAR_COMPRA] ⚠️ Notificación no creada: {notif_result.get('error')}")
        except Exception as e:
            # Log pero no fallar
            print(f"[CONFIRMAR_COMPRA] Error creando notificación: {str(e)}")

        return jsonify({
            "success": True,
            "message": "Compra confirmada exitosamente",
            "carrito_id": carrito_id,
            "productos_plancha_guardados": len(productos_plancha),
            "cortes_guardados": len(cortes_personalizados)
        }), 200

    except Exception as e:
        print(f"[ERROR CONFIRMAR_COMPRA] {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error procesando compra: {str(e)}"
        }), 500
