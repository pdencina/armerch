-- ============================================================
-- MIGRACIÓN: AR MERCH — Carrito Avanzado con Descuentos
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── 1. Columnas nuevas en order_items ──
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS discount_pct  NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_total    INTEGER      DEFAULT 0;

-- ── 2. Columnas nuevas en orders ──
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_code  TEXT,
  ADD COLUMN IF NOT EXISTS notes       TEXT;

-- Rellenar subtotal para registros existentes
UPDATE orders SET subtotal = total WHERE subtotal = 0;

-- ── 3. Tabla de promociones ──
CREATE TABLE IF NOT EXISTS promotions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE NOT NULL,
  label        TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value        NUMERIC(10,2) NOT NULL,
  min_amount   INTEGER,
  max_uses     INTEGER,
  used_count   INTEGER DEFAULT 0,
  active       BOOLEAN DEFAULT TRUE,
  valid_from   TIMESTAMPTZ,
  valid_until  TIMESTAMPTZ,
  campus_id    UUID REFERENCES campus(id),
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para promociones
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promotions_select" ON promotions
  FOR SELECT USING (active = TRUE);

CREATE POLICY "promotions_manage" ON promotions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- ── 4. Función para decrementar stock ──
-- Si ya tienes una función parecida, omitir o adaptar
CREATE OR REPLACE FUNCTION decrement_stock(
  p_product_id UUID,
  p_campus_id  UUID,
  p_quantity   INTEGER
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE inventory
  SET quantity = quantity - p_quantity
  WHERE product_id = p_product_id
    AND campus_id = p_campus_id
    AND quantity >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock insuficiente para el producto %', p_product_id;
  END IF;
END;
$$;

-- ── 5. Índices de performance ──
CREATE INDEX IF NOT EXISTS idx_orders_campus_created
  ON orders(campus_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_promotions_code
  ON promotions(code) WHERE active = TRUE;

-- ── 6. Datos de ejemplo para promociones ──
INSERT INTO promotions (code, label, type, value, min_amount)
VALUES
  ('DESCUENTO10', '10% de descuento', 'percent', 10, 5000),
  ('PROMO2000', '$2.000 de descuento', 'fixed', 2000, 10000),
  ('ARM20', '20% especial ARM', 'percent', 20, 0)
ON CONFLICT (code) DO NOTHING;
