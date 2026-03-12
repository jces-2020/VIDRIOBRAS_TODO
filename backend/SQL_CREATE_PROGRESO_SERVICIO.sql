-- SQL para crear tabla progreso_servicio
-- Agregar a Supabase directamente

CREATE TABLE IF NOT EXISTS public.progreso_servicio (
  id_progreso UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notificacion_id UUID NOT NULL,
  
  -- TIMESTAMPS de cada paso
  paso_remetro_fecha TIMESTAMP,
  paso_remetro_completado BOOLEAN DEFAULT FALSE,
  paso_remetro_datos JSONB DEFAULT '{}',
  
  paso_retazo_fecha TIMESTAMP,
  paso_retazo_completado BOOLEAN DEFAULT FALSE,
  paso_retazo_datos JSONB DEFAULT '{}',
  
  paso_productos_fecha TIMESTAMP,
  paso_productos_completado BOOLEAN DEFAULT FALSE,
  paso_productos_datos JSONB DEFAULT '{}',
  
  paso_instalacion_fecha TIMESTAMP,
  paso_instalacion_completado BOOLEAN DEFAULT FALSE,
  paso_instalacion_datos JSONB DEFAULT '{}',
  
  -- Control de progreso
  porcentaje_completado NUMERIC(3,0) DEFAULT 0,
  estado_actual VARCHAR(50) DEFAULT 'PENDIENTE',
  
  -- Auditoría
  personal_id UUID,
  creado_en TIMESTAMP DEFAULT NOW(),
  actualizado_en TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_notificacion FOREIGN KEY (notificacion_id) REFERENCES public.notificacion_trabajo(id_notificacion) ON DELETE CASCADE,
  CONSTRAINT fk_personal FOREIGN KEY (personal_id) REFERENCES public.personal(id_personal) ON DELETE SET NULL,
  CONSTRAINT progreso_servicio_estado_check CHECK (estado_actual IN (
    'PENDIENTE', 'EN_REMETRO', 'EN_RETAZO', 'EN_PRODUCTOS', 'EN_INSTALACION', 'COMPLETADO'
  ))
);

-- Crear indices para queries rápidas
CREATE INDEX idx_progreso_notificacion ON public.progreso_servicio(notificacion_id);
CREATE INDEX idx_progreso_estado ON public.progreso_servicio(estado_actual);
CREATE INDEX idx_progreso_personal ON public.progreso_servicio(personal_id);

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_progreso_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_progreso_timestamp
BEFORE UPDATE ON public.progreso_servicio
FOR EACH ROW
EXECUTE FUNCTION update_progreso_timestamp();

-- Vista para consultas simples
CREATE OR REPLACE VIEW public.vista_progreso_servicio AS
SELECT 
  ns.id_notificacion,
  ns.nombre as cliente_nombre,
  ns.descripcion,
  ps.id_progreso,
  ps.porcentaje_completado,
  ps.estado_actual,
  ps.paso_remetro_completado,
  ps.paso_retazo_completado,
  ps.paso_productos_completado,
  ps.paso_instalacion_completado,
  ps.paso_remetro_fecha,
  ps.paso_retazo_fecha,
  ps.paso_productos_fecha,
  ps.paso_instalacion_fecha,
  COALESCE(p.nombre, 'Sin asignar') as personal_asignado,
  ps.creado_en,
  ps.actualizado_en
FROM public.notificacion_trabajo ns
LEFT JOIN public.progreso_servicio ps ON ns.id_notificacion = ps.notificacion_id
LEFT JOIN public.personal p ON ps.personal_id = p.id_personal;
