-- ============================================================
-- ARM MERCH — Fix crítico: trigger update_stock_on_movement
-- El trigger actual actualiza stock SIN filtrar por campus_id
-- lo que causa que un movimiento en Punta Arenas afecte a
-- Puente Alto y viceversa.
-- ============================================================

-- ── 1. Ver la función actual del trigger ─────────────────────
SELECT pg_get_functiondef('update_stock_on_movement'::regproc);

-- ── 2. Corregir la función agregando AND campus_id ───────────
CREATE OR REPLACE FUNCTION public.update_stock_on_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  if new.type = 'entrada' then
    update inventory
    set stock = stock + new.quantity,
        updated_at = now()
    where product_id = new.product_id
      AND campus_id  = new.campus_id;   -- ← FILTRO POR CAMPUS

  elsif new.type in ('salida', 'ajuste') then
    update inventory
    set stock = stock - new.quantity,
        updated_at = now()
    where product_id = new.product_id
      AND campus_id  = new.campus_id;   -- ← FILTRO POR CAMPUS
  end if;
  return new;
end;
$$;

-- ── 3. Verificar que el trigger sigue activo ─────────────────
SELECT trigger_name, event_manipulation, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name ILIKE '%stock%movement%'
   OR trigger_name ILIKE '%movement%stock%';

-- ── 4. Test: verificar que la función fue actualizada ─────────
SELECT pg_get_functiondef('update_stock_on_movement'::regproc);
