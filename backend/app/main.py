from flask import Flask, render_template, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

# ===============================
# LOAD ENV
# ===============================
load_dotenv()


# ===============================
# CREAR APP
# ===============================
app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)


# ===============================
# CORS
# ===============================
CORS(app, resources={r"/*": {"origins": "*"}})


# ===============================
# IMPORTAR CONTROLLERS
# ===============================

# Clientes
from controllers.cliente_datos_api_controller import cliente_datos_api
from controllers.clientes_datos_completos_api_controller import clientes_datos_completos_api
from controllers.clientes_controller import clientes_bp
from controllers.clientes_admin_controller import clientes_admin_bp

# Productos
from controllers.productos_controller import productos_bp
from controllers.productos_api_controller import productos_api_bp
from controllers.productos_carrito_api_controller import productos_carrito_api
from controllers.productos_utils_controller import productos_utils_bp

# Carrito
from controllers.carrito_controller import carrito_bp
from controllers.carrito_compras_api_controller import carrito_compras_api
from controllers.carrito_interactivo_controller import carrito_interactivo_bp
from controllers.barra_progreso_api_controller import barra_progreso_api

# Servicios
from controllers.servicios_controller import servicios_bp
from controllers.servicio_api_controller import servicio_api_bp
from controllers.progreso_servicio_controller import progreso_blueprint

# Personal
from controllers.personal_admin_controller import personal_admin_bp
from controllers.personal_nombre_api_controller import personal_nombre_api
from controllers.tipo_personal_controller import tipo_personal_bp

# Documento
from controllers.documento_api_controller import bp as documento_api_bp
from controllers.tipo_cliente_controller import tipo_documento_bp
from controllers.tipo_cliente_api_controller import bp as tipo_cliente_api_bp
from controllers.verifica_estado_cliente_api_controller import verifica_estado_cliente_api

# Cotización
from controllers.cotizacion_api import bp_html as cotizacion_api_bp

# Dashboard
from controllers.ai_dashboard_controller import ai_dashboard_bp

# Caja
from controllers.gastos_diarios_controller import gastos_diarios_bp
from controllers.cuadre_caja_diario_controller import cuadre_caja_diario_bp

# Obras
from controllers.gestion_obras_controller import obras_bp
from controllers.servicio_trabajo_controller import servicio_trabajo_bp
from controllers.optimizacion_cortes_controller import optimizacion_cortes_bp
from controllers.entrega_pedido_controller import entrega_pedido_bp
from controllers.categoria_servicio_api_controller import categoria_servicio_api_bp
from controllers.pedidos_detalle_controller import pedidos_detalle_api
from controllers.debug_notif_controller import debug_notif_bp
from controllers.cortes_controller import cortes_api
from controllers.cortes_produccion_controller import cortes_produccion_bp
from controllers.merma_controller import merma_bp
from controllers.entrega_reporte_controller import entrega_reporte_bp
from controllers.entrega_productos_controller import entrega_productos_bp
from controllers.entrega_finalizacion_controller import entrega_finalizacion_bp
from controllers.entrega_productos_confirmar_controller import entrega_productos_confirmar_bp

# Mercado Pago
from controllers.pagos_mercado_pago_controller import pagos_mp_bp
from controllers.otros_metodos_pago_controller import otros_metodos_bp
from controllers.mp_test_controller import mp_test_bp
from controllers.mp_verificar_controller import mp_verificar_bp

# Google
from controllers.google_auth_controller import bp as google_auth_bp
from controllers.iniciogoogle import bp as google_login_bp

# Facturación Electrónica
from controllers.facturacion_controller import bp as facturacion_bp
from controllers.test_facturacion_controller import test_facturacion_bp

# Presupuestos
from controllers.presupuestos_controller import presupuestos_bp
from controllers.presupuesto_cliente_controller import presupuesto_cliente_bp

# Supabase debug
from services.supabase_client import IS_SERVICE, SUPABASE_URL

# Compra API
from controllers.compra_api_controller import compra_api

# Venta API
from controllers.venta_api_controller import venta_api


# ===============================
# REGISTRAR BLUEPRINTS
# ===============================

# Productos
app.register_blueprint(productos_bp)
app.register_blueprint(productos_api_bp)
app.register_blueprint(productos_utils_bp)
app.register_blueprint(productos_carrito_api)

# Servicios
app.register_blueprint(servicios_bp)
app.register_blueprint(servicio_api_bp)
app.register_blueprint(progreso_blueprint)

# Clientes
app.register_blueprint(clientes_bp)
app.register_blueprint(clientes_admin_bp)
app.register_blueprint(cliente_datos_api)
app.register_blueprint(clientes_datos_completos_api)

# Documento
app.register_blueprint(tipo_documento_bp)
app.register_blueprint(documento_api_bp)
app.register_blueprint(tipo_cliente_api_bp)
app.register_blueprint(verifica_estado_cliente_api)

# Personal
app.register_blueprint(tipo_personal_bp)
app.register_blueprint(personal_admin_bp)
app.register_blueprint(personal_nombre_api)

# Carrito
app.register_blueprint(carrito_bp)
app.register_blueprint(carrito_compras_api)
app.register_blueprint(carrito_interactivo_bp)
app.register_blueprint(barra_progreso_api)

# Cotización
app.register_blueprint(cotizacion_api_bp)

# Dashboard
app.register_blueprint(ai_dashboard_bp)

# Caja
app.register_blueprint(gastos_diarios_bp)
app.register_blueprint(cuadre_caja_diario_bp)
from controllers.caja_cuadre_controller import caja_cuadre_bp
app.register_blueprint(caja_cuadre_bp)

# Obras
app.register_blueprint(obras_bp)
app.register_blueprint(servicio_trabajo_bp)
app.register_blueprint(optimizacion_cortes_bp)
app.register_blueprint(entrega_pedido_bp)
app.register_blueprint(categoria_servicio_api_bp)
app.register_blueprint(pedidos_detalle_api)
app.register_blueprint(debug_notif_bp)
app.register_blueprint(cortes_api)
app.register_blueprint(cortes_produccion_bp)
app.register_blueprint(merma_bp)
app.register_blueprint(entrega_reporte_bp)
app.register_blueprint(entrega_productos_bp)
app.register_blueprint(entrega_finalizacion_bp)
app.register_blueprint(entrega_productos_confirmar_bp)

# Mercado Pago
app.register_blueprint(pagos_mp_bp)
app.register_blueprint(otros_metodos_bp)
app.register_blueprint(mp_test_bp)
app.register_blueprint(mp_verificar_bp)

# Google
app.register_blueprint(google_auth_bp)
app.register_blueprint(google_login_bp)

# Facturación
app.register_blueprint(facturacion_bp)
app.register_blueprint(test_facturacion_bp)

# Presupuestos
app.register_blueprint(presupuestos_bp)
app.register_blueprint(presupuesto_cliente_bp)

# Compra API
app.register_blueprint(compra_api)

# Venta API
app.register_blueprint(venta_api)


# ===============================
# RUTAS BASE
# ===============================

@app.route("/ping")
def ping():
    return "pong", 200


@app.route("/")
def root():
    return """
    <h2>Backend VidrioBras</h2>
    <ul>
        <li>/ping</li>
        <li>/test-facturacion</li>
    </ul>
    """


@app.route("/_debug_supabase")
def debug_supabase():

    return jsonify({
        "is_service": bool(IS_SERVICE),
        "supabase_url": SUPABASE_URL
    })


# ===============================
# RUN
# ===============================

if __name__ == "__main__":

    print("====================================")
    print("Servidor iniciado")
    print("Modo APISPERU:", os.getenv("APISPERU_ENV"))
    print("====================================")

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
