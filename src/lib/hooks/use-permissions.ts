import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Default permissions per role ──────────────────────────────────────────────
// Super Admin siempre tiene todo — no consulta BD
const SUPER_ADMIN_DEFAULTS: Record<string, boolean> = {}

const ADMIN_DEFAULTS: Record<string, boolean> = {
  'dashboard.view': true,
  'pos.view': true, 'pos.sell': true, 'pos.all_payments': true, 'pos.discount': false,
  'pos.smart_pos': true, 'pos.link_payment': true, 'pos.pending_orders': true,
  'orders.view': true, 'orders.export': true, 'orders.refund': false,
  'deliveries.view': true, 'deliveries.ready': false, 'deliveries.deliver': true, 'deliveries.whatsapp': true,
  'inventory.view': true, 'inventory.movements': true, 'inventory.scan': true, 'inventory.adjust': false,
  'movements.view': true,
  'products.view': true, 'products.create': false, 'products.edit': false, 'products.delete': false,
  'products.labels': true, 'products.prices': true,
  'reports.view': true, 'reports.all_campus': false, 'reports.export': false,
  'close_day.view': true, 'close_day.open': true, 'close_day.close': true, 'close_day.all': false,
  'categories.view': true, 'categories.manage': false,
}

const VOLUNTARIO_DEFAULTS: Record<string, boolean> = {
  'dashboard.view': false,
  'pos.view': true, 'pos.sell': true, 'pos.all_payments': false, 'pos.discount': false,
  'pos.smart_pos': false, 'pos.link_payment': false, 'pos.pending_orders': false,
  'orders.view': true, 'orders.export': false, 'orders.refund': false,
  'deliveries.view': true, 'deliveries.ready': false, 'deliveries.deliver': true, 'deliveries.whatsapp': false,
  'inventory.view': true, 'inventory.movements': false, 'inventory.scan': false, 'inventory.adjust': false,
  'movements.view': false,
  'products.view': true, 'products.create': false, 'products.edit': false, 'products.delete': false,
  'products.labels': false, 'products.prices': false,
  'reports.view': false, 'reports.all_campus': false, 'reports.export': false,
  'close_day.view': false, 'close_day.open': false, 'close_day.close': false, 'close_day.all': false,
  'categories.view': false, 'categories.manage': false,
}

type PermissionMap = Record<string, boolean>

let cachedPerms: PermissionMap | null = null
let cachedRole: string | null = null

export function usePermissions(role: string | null) {
  const [perms, setPerms] = useState<PermissionMap>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!role) return

    // Super Admin siempre tiene todo
    if (role === 'super_admin') {
      setPerms(new Proxy({}, { get: () => true }))
      setLoaded(true)
      return
    }

    // Use cache if same role
    if (cachedRole === role && cachedPerms) {
      setPerms(cachedPerms)
      setLoaded(true)
      return
    }

    const defaults = role === 'admin' ? ADMIN_DEFAULTS : VOLUNTARIO_DEFAULTS

    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('module_permissions')
        .select('module, enabled')
        .eq('role', role)

      const overrides: PermissionMap = {}
      ;(data ?? []).forEach((row: any) => {
        overrides[row.module] = row.enabled
      })

      const merged = { ...defaults, ...overrides }
      cachedPerms = merged
      cachedRole  = role
      setPerms(merged)
      setLoaded(true)
    }

    load()
  }, [role])

  // Helper: check if a permission key is allowed
  function can(key: string): boolean {
    if (role === 'super_admin') return true
    return perms[key] ?? false
  }

  return { perms, can, loaded }
}
