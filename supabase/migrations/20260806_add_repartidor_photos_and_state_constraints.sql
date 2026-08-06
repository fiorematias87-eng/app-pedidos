-- Migration: Add repartidor photos, normalize pedido states, indexes and realtime publication
-- Date: 2026-08-06

BEGIN;

-- 1) Add photo columns to repartidores
ALTER TABLE public.repartidores
  ADD COLUMN IF NOT EXISTS foto_perfil text,
  ADD COLUMN IF NOT EXISTS foto_portada text;

-- 2) Ensure pedidos.estado uses the canonical enum values
ALTER TABLE public.pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check;
ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_estado_check CHECK (estado IN ('pendiente','en_preparacion','en_camino','completado'));

-- 3) Migrate legacy state values to the new canonical states
UPDATE public.pedidos SET estado = 'en_preparacion' WHERE estado IN ('en_cocina');
UPDATE public.pedidos SET estado = 'completado' WHERE estado IN ('entregado');

-- 4) Useful indexes to keep Admin queries fast
CREATE INDEX IF NOT EXISTS idx_pedidos_estado_created_at ON public.pedidos (estado, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_repartidor_estado ON public.pedidos (repartidor_id, estado);

-- 5) Create publication for realtime replication (used by supabase_realtime)
CREATE PUBLICATION IF NOT EXISTS supabase_realtime FOR TABLE public.repartidores, public.pedidos;

COMMIT;

-- Notes:
-- - Run this migration in Supabase SQL editor or with psql/supabase CLI.
-- - After applying, create the storage bucket `repartidores_assets` and test uploads from the Delivery UI.
