-- ============================================================
-- ARM MERCH — Agregar campo barcode a productos
-- ============================================================

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS barcode TEXT DEFAULT NULL;

-- Índice para búsqueda rápida por código de barra
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode
  ON products(barcode) WHERE barcode IS NOT NULL;

-- Verificar
SELECT 'barcode agregado a products' AS resultado;
