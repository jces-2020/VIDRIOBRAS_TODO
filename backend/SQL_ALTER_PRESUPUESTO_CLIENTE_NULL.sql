-- Ejecutar este script en la consola SQL de Supabase para permitir valores nulos
-- en la columna cliente_id de la tabla "presupuesto".

ALTER TABLE public.presupuesto
    ALTER COLUMN cliente_id DROP NOT NULL;

-- Opcionalmente, si desea eliminar también la restricción de clave foránea
-- (dejarla permite que la columna sea nula pero siga refiriendo a cliente):
-- ALTER TABLE public.presupuesto
--     DROP CONSTRAINT IF EXISTS presupuesto_cliente_id_fkey;
-- ALTER TABLE public.presupuesto
--     ADD CONSTRAINT presupuesto_cliente_id_fkey
--     FOREIGN KEY (cliente_id) REFERENCES public.cliente(id_cliente) ON DELETE CASCADE;
