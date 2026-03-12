-- Crear tabla presupuestos para almacenar presupuestos de servicios
CREATE TABLE IF NOT EXISTS public.presupuestos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  servicio_id uuid,
  servicio_nombre character varying,
  cliente_documento character varying NOT NULL,
  cliente_razon_social character varying NOT NULL,
  ancho_cm numeric,
  alto_cm numeric,
  area_m2 numeric,
  costo_materiales numeric,
  costo_mano_obra numeric,
  costo_transporte numeric,
  porcentaje_indirectos numeric,
  porcentaje_ganancia numeric,
  costo_base numeric,
  costo_indirectos numeric,
  subtotal numeric,
  total numeric,
  modelo_imagen_url text,
  fecha_creacion timestamp without time zone DEFAULT now(),
  CONSTRAINT presupuestos_pkey PRIMARY KEY (id),
  CONSTRAINT presupuestos_servicio_id_fkey FOREIGN KEY (servicio_id) REFERENCES public.servicio(id_servicio)
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_presupuestos_cliente_documento ON public.presupuestos(cliente_documento);
CREATE INDEX IF NOT EXISTS idx_presupuestos_cliente_razon_social ON public.presupuestos(cliente_razon_social);
CREATE INDEX IF NOT EXISTS idx_presupuestos_fecha_creacion ON public.presupuestos(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_presupuestos_servicio_id ON public.presupuestos(servicio_id);

-- Comentarios en la tabla
COMMENT ON TABLE public.presupuestos IS 'Tabla para almacenar presupuestos de servicios creados por el área de VENTAS. cliente_id ahora puede ser NULL para presupuestos sin cliente asignado';
COMMENT ON COLUMN public.presupuestos.cliente_documento IS 'RUC o DNI del cliente';
COMMENT ON COLUMN public.presupuestos.cliente_razon_social IS 'Razón social o nombre completo del cliente';
COMMENT ON COLUMN public.presupuestos.modelo_imagen_url IS 'URL de la imagen del modelo/servicio seleccionado';
