'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  ShoppingCart, Receipt, Package, ArrowLeftRight,
  ClipboardList, BarChart3, Calculator, Tags,
  Shield, LayoutDashboard, RefreshCw,
} from 'lucide-react'

// ── Definición de todos los módulos configurables ──────────────────────────
const ALL_MODULES = [
  { key: 'pos',        label: 'Punto de Venta',  icon: ShoppingCart,   section: 'Ventas',         superAdminOnly: false },
  { key: 'orders',     label: 'Órdenes',          icon: Receipt,        section: 'Ventas',         superAdminOnly: false },
  { key: 'inventory',  label: 'Inventario',       icon: Package,        section: 'Inventario',     superAdminOnly: false },
  { key: 'movements',  label: 'Movimientos',      icon: ArrowLeftRight, section: 'Inventario',     superAdminOnly: false },
  { key: 'products',   label: 'Productos',        icon: ClipboardList,  section: 'Gestión',        superAdminOnly: false },
  { key: 'reports',    label: 'Reportes',         icon: BarChart3,      section: 'Gestión',        superAdminOnly: false },
  { key: 'close_day',  label: 'Cierre de Caja',   icon: Calculator,     section: 'Gestión',        superAdminOnly: false },
  { key: 'categories', label: 'Categorías',       icon: Tags,           section: 'Configuración',  superAdminOnly: false },
]

// Módulos disponibles para cada rol (subset del total)
const ROLE_MODULES: Record<string, string[]> = {
  admin:      ['pos', 'orders', 'inventory', 'movements', 'products', 'reports', 'close_day', 'categories'],
  voluntario: ['pos', 'orders'],
}

const ROLES = [
  { key: 'admin',     label: 'Admin Campus',  color: 'bg-blue-500/15 text-blue-400 border-blue-500/25',    dot: 'bg-blue-400' },
  { key: 'voluntario',label: 'Voluntario',    color: 'bg-green-500/15 text-green-400 border-green-500/25', dot: 'bg-green-400' },
]

type PermMap = Record<string, Record<string, boolean>> // { role: { module: enabled } }

export default function ModulePermissionsPage() {
  const supabase = createClient()
  const [perms, setPerms]       = useState<PermMap>({})
  const [saving, setSaving]     = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('module_permissions')
      .select('module, role, enabled')

    if (error) { toast.error(error.message); setLoading(false); return }

    const map: PermMap = {}
    ;(data ?? []).forEach((row: any) => {
      if (!map[row.role]) map[row.role] = {}
      map[row.role][row.module] = row.enabled
    })
    setPerms(map)
    setLoading(false)
  }

  async function toggle(role: string, module: string, current: boolean) {
    const key = `${role}:${module}`
    setSaving(key)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { toast.error('Sin sesión'); setSaving(null); return }

    const { error } = await supabase
      .from('module_permissions')
      .upsert({ module, role, enabled: !current, updated_at: new Date().toISOString() },
               { onConflict: 'module,role' })

    if (error) {
      toast.error(`Error: ${error.message}`)
    } else {
      setPerms(prev => ({
        ...prev,
        [role]: { ...(prev[role] ?? {}), [module]: !current }
      }))
      toast.success(`${!current ? 'Activado' : 'Desactivado'} para ${role}`)
    }
    setSaving(null)
  }

  const sections = Array.from(new Set(ALL_MODULES.map(m => m.section)))

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Permisos de Módulos</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Activa o desactiva módulos por rol. El Super Admin siempre tiene acceso completo.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:text-white"
        >
          <RefreshCw size={12} /> Recargar
        </button>
      </div>

      {/* Super Admin notice */}
      <div className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/8 px-4 py-3">
        <Shield size={14} className="text-violet-400 shrink-0" />
        <p className="text-xs text-violet-300">
          <strong>Super Admin</strong> siempre tiene acceso a todos los módulos — no se puede restringir.
        </p>
      </div>

      {/* Role columns header */}
      <div className="grid grid-cols-[1fr_repeat(2,_140px)] gap-3 px-1">
        <div />
        {ROLES.map(role => (
          <div key={role.key} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${role.color}`}>
            <span className={`h-2 w-2 rounded-full ${role.dot}`} />
            <span className="text-xs font-semibold">{role.label}</span>
          </div>
        ))}
      </div>

      {/* Modules by section */}
      {sections.map(section => {
        const sectionModules = ALL_MODULES.filter(m => m.section === section)
        return (
          <div key={section} className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="border-b border-zinc-800 bg-zinc-800/50 px-4 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{section}</p>
            </div>

            <div className="divide-y divide-zinc-800">
              {sectionModules.map(mod => {
                const Icon = mod.icon
                return (
                  <div key={mod.key} className="grid grid-cols-[1fr_repeat(2,_140px)] gap-3 items-center px-4 py-3">

                    {/* Module info */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
                        <Icon size={14} className="text-zinc-400" />
                      </div>
                      <span className="text-sm text-zinc-200">{mod.label}</span>
                    </div>

                    {/* Toggle per role */}
                    {ROLES.map(role => {
                      const isAvailable = ROLE_MODULES[role.key]?.includes(mod.key)
                      const isEnabled   = perms[role.key]?.[mod.key] ?? false
                      const isSaving    = saving === `${role.key}:${mod.key}`

                      if (!isAvailable) {
                        return (
                          <div key={role.key} className="flex justify-center">
                            <span className="text-[10px] text-zinc-700">N/A</span>
                          </div>
                        )
                      }

                      return (
                        <div key={role.key} className="flex justify-center">
                          <button
                            onClick={() => toggle(role.key, mod.key, isEnabled)}
                            disabled={!!saving}
                            className={`relative flex h-6 w-11 items-center rounded-full transition-all duration-200 ${
                              isEnabled ? 'bg-amber-500' : 'bg-zinc-700'
                            } ${saving ? 'opacity-50' : 'cursor-pointer'}`}
                          >
                            {isSaving ? (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                              </span>
                            ) : (
                              <span className={`absolute h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${
                                isEnabled ? 'left-6' : 'left-1'
                              }`} />
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <p className="text-center text-xs text-zinc-600 pb-4">
        Los cambios se aplican en la próxima carga de página de cada usuario.
      </p>
    </div>
  )
}
