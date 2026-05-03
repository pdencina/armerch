-- ============================================================
-- ARM MERCH — Tabla module_permissions
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS module_permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module     TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('admin', 'voluntario')),
  enabled    BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(module, role)
);

ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;

-- Drop policies if exist then recreate
DROP POLICY IF EXISTS "super_admin_all" ON module_permissions;
DROP POLICY IF EXISTS "authenticated_read" ON module_permissions;

-- Super admin puede hacer todo
CREATE POLICY "super_admin_all" ON module_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'super_admin'
    )
  );

-- Cualquier usuario autenticado puede leer
CREATE POLICY "authenticated_read" ON module_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

SELECT 'module_permissions table ready' AS resultado;
