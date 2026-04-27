-- ============================================================
-- ARM MERCH — Migración: Tallas para productos de vestuario
-- ============================================================

-- ── 1. Columna has_sizes en products ─────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS has_sizes BOOLEAN DEFAULT FALSE;

-- ── 2. Tabla de tallas por producto ──────────────────────────
CREATE TABLE IF NOT EXISTS product_sizes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size       TEXT NOT NULL,         -- 'XS','S','M','L','XL','XXL','XXXL'
  stock      INTEGER DEFAULT 0,
  active     BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, size)
);

ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sizes_read" ON product_sizes
  FOR SELECT USING (true);

CREATE POLICY "sizes_write" ON product_sizes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- ── 3. Columna size en order_items ────────────────────────────
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS size TEXT DEFAULT NULL;

-- ── 4. Índice ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_product_sizes_product
  ON product_sizes(product_id) WHERE active = TRUE;

SELECT 'Migración de tallas completada' AS resultado;


-- ── 5. Actualizar la vista products_with_stock para incluir has_sizes ────────
-- Primero ver la definición actual de la vista
-- Si la vista usa SELECT * FROM products, has_sizes se incluye automáticamente.
-- Si usa columnas explícitas, agregar has_sizes manualmente.

-- Ejecutar esto para verificar si has_sizes ya está en la vista:
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'products_with_stock'
  AND column_name = 'has_sizes';

-- Si el resultado está vacío, recrear la vista (ajustar según tu definición actual):
-- CREATE OR REPLACE VIEW products_with_stock AS
-- SELECT
--   p.*,                    -- incluye has_sizes automáticamente
--   i.stock,
--   i.low_stock_alert,
--   i.campus_id,
--   CASE WHEN i.stock <= i.low_stock_alert THEN true ELSE false END AS low_stock
-- FROM products p
-- LEFT JOIN inventory i ON i.product_id = p.id
-- WHERE p.active = true;
