-- ============================================================
-- ARM MERCH — Migración: Sistema de permisos de módulos
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- Tabla de permisos de módulos por rol
CREATE TABLE IF NOT EXISTS module_permissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module     TEXT NOT NULL,           -- ej: 'products', 'reports', 'inventory'
  role       TEXT NOT NULL,           -- 'admin' | 'voluntario' (super_admin siempre ve todo)
  enabled    BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE (module, role)
);

-- RLS
ALTER TABLE module_permissions ENABLE ROW LEVEL SECURITY;

-- Todos pueden leer (el sidebar necesita leer esto sin autenticación especial)
CREATE POLICY "anyone_can_read" ON module_permissions
  FOR SELECT USING (true);

-- Solo super_admin puede modificar
CREATE POLICY "super_admin_can_modify" ON module_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Datos iniciales: todos los módulos habilitados para todos los roles
INSERT INTO module_permissions (module, role, enabled) VALUES
  -- Módulos para admin
  ('pos',        'admin', true),
  ('orders',     'admin', true),
  ('inventory',  'admin', true),
  ('movements',  'admin', true),
  ('products',   'admin', true),
  ('reports',    'admin', true),
  ('close_day',  'admin', true),
  ('categories', 'admin', true),
  -- Módulos para voluntario
  ('pos',        'voluntario', true),
  ('orders',     'voluntario', true)
ON CONFLICT (module, role) DO NOTHING;

-- Verificar
SELECT module, role, enabled FROM module_permissions ORDER BY role, module;
