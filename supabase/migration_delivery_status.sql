-- ============================================================
-- ARM MERCH — Migración: Sistema de pedidos pendientes de entrega
-- Versión segura — no toca políticas existentes
-- ============================================================

-- ── 1. Columna delivery_status en orders ─────────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_status TEXT
    CHECK (delivery_status IN ('pending', 'ready', 'delivered'))
    DEFAULT NULL;

-- ── 2. Tabla de historial de entregas ────────────────────────
CREATE TABLE IF NOT EXISTS delivery_updates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status  TEXT,
  to_status    TEXT NOT NULL,
  notes        TEXT,
  updated_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS solo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'delivery_updates' AND policyname = 'delivery_updates_read'
  ) THEN
    ALTER TABLE delivery_updates ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "delivery_updates_read" ON delivery_updates
      FOR SELECT USING (true);
    CREATE POLICY "delivery_updates_write" ON delivery_updates
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN ('super_admin', 'admin')
        )
      );
  END IF;
END $$;

-- ── 3. Índices ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status
  ON orders(delivery_status) WHERE delivery_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_campus_delivery
  ON orders(campus_id, delivery_status) WHERE delivery_status IS NOT NULL;

-- ── 4. Verificar ──────────────────────────────────────────────
SELECT
  'delivery_status agregado' AS resultado,
  COUNT(*) FILTER (WHERE delivery_status IS NOT NULL) AS pedidos_pendientes,
  COUNT(*) AS total_ordenes
FROM orders;
