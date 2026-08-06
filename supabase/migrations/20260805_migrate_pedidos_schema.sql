-- Migración para actualizar tabla pedidos con nuevas columnas
-- Ejecutar solo si la tabla ya existe con el schema anterior

-- Agregar columna paga_con si no existe
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS paga_con text;

-- Renombrar columna envio a costo_envio si existe
ALTER TABLE pedidos 
RENAME COLUMN IF EXISTS envio TO costo_envio;

-- Renombrar columna productos a items si existe
ALTER TABLE pedidos 
RENAME COLUMN IF EXISTS productos TO items;

-- Agregar columnas de imagen al repartidor si no existen
ALTER TABLE repartidores
  ADD COLUMN IF NOT EXISTS foto_perfil text,
  ADD COLUMN IF NOT EXISTS foto_portada text;

-- Actualizar el check constraint para usar los estados modernos
-- Primero, eliminar el constraint existente
ALTER TABLE pedidos 
DROP CONSTRAINT IF EXISTS pedidos_estado_check;

-- Luego agregar el nuevo constraint
ALTER TABLE pedidos 
ADD CONSTRAINT pedidos_estado_check 
CHECK (estado in ('pendiente','en_preparacion','en_camino','completado'));
