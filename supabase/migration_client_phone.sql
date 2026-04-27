-- ============================================================
-- ARM MERCH — Migración: Teléfono del cliente
-- ============================================================

-- Agregar client_phone a orders (si no existe)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS client_phone TEXT DEFAULT NULL;

-- Agregar client_phone a order_contacts (si no existe)
ALTER TABLE order_contacts
  ADD COLUMN IF NOT EXISTS client_phone TEXT DEFAULT NULL;

-- Verificar
SELECT 'orders.client_phone' AS col, COUNT(*) FROM orders WHERE client_phone IS NOT NULL
UNION ALL
SELECT 'order_contacts.client_phone', COUNT(*) FROM order_contacts WHERE client_phone IS NOT NULL;
