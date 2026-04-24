'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowDownCircle, ArrowUpCircle, SlidersHorizontal,
  Package, RefreshCw, Search, X, TrendingDown,
  TrendingUp, Activity, ChevronDown,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

const fmtDateFull = (v?: string | null) =>
  v ? new Date(v).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

const getName = (raw: any) => (Array.isArray(raw) ? raw[0] : raw)

// ─── Type config ─────────────────────────────────────────────────────────────
const TYPE_CFG = {
  entrada: {
    label: 'Entrada',
    icon:  ArrowDownCircle,
    row:   'border-l-2 border-l-emerald-500/40',
    badge: 'bg-emerald-500/12 text-emerald-400 ring-1 ring-emerald-500/20',
    qty:   'text-emerald-400',
    dot:   'bg-emerald-400',
  },
  salida: {
    label: 'Salida',
    icon:  ArrowUpCircle,
    row:   'border-l-2 border-l-red-500/40',
    badge: 'bg-red-500/12 text-red-400 ring-1 ring-red-500/20',
    qty:   'text-red-400',
    dot:   'bg-red-400',
  },
  ajuste: {
    label: 'Ajuste',
    icon:  SlidersHorizontal,
    row:   'border-l-2 border-l-amber-500/40',
    badge: 'bg-amber-500/12 text-amber-400 ring-1 ring-amber-500/20',
    qty:   'text-amber-400',
    dot:   'bg-amber-400',
  },
} as const

type MovType = keyof typeof TYPE_CFG

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
        <p className="mt-0.5 text-xl font-black text-white">{value}</p>
        {sub && <p className="text-[10px] text-zinc-600">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function MovementsPage() {
  const supabase = createClient()

  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [search, setSearch]       = useState('')
  const [typeFilter, setTypeFilter] = useState<MovType | ''>('')
  const [dateFilter, setDateFilter] = useState('')

  // Expanded row
  const [expanded, setExpanded]   = useState<string | null>(null)

  async function load(silent = false) {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); setRefreshing(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, campus_id')
      .eq('id', session.user.id)
      .single()

    let query = supabase
      .from('inventory_movements')
      .select(`
        id, product_id, campus_id, type, quantity, notes, created_at, created_by,
        product:products(name, sku),
        campus:campus(name),
        user_profile:profiles!inventory_movements_created_by_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    if (profile?.role !== 'super_admin' && profile?.campus_id) {
      query = query.eq('campus_id', profile.campus_id)
    }

    const { data } = await query
    setMovements(data ?? [])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  // ── Derived ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return movements.filter(m => {
      const product = getName(m.product)
      const campus  = getName(m.campus)
      const user    = getName(m.user_profile)

      const matchSearch = !search || [
        product?.name, product?.sku, campus?.name, user?.full_name, m.notes
      ].some(v => v?.toLowerCase().includes(search.toLowerCase()))

      const matchType = !typeFilter || m.type === typeFilter
      const matchDate = !dateFilter || m.created_at?.startsWith(dateFilter)

      return matchSearch && matchType && matchDate
    })
  }, [movements, search, typeFilter, dateFilter])

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayMov = movements.filter(m => m.created_at?.startsWith(today))
    return {
      total:    movements.length,
      entradas: movements.filter(m => m.type === 'entrada').reduce((s, m) => s + Number(m.quantity), 0),
      salidas:  movements.filter(m => m.type === 'salida').reduce((s, m) => s + Number(m.quantity), 0),
      today:    todayMov.length,
    }
  }, [movements])

  const hasFilters = search || typeFilter || dateFilter

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-500" />
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Movimientos de inventario</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Historial de entradas, salidas y ajustes
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Activity}    label="Total movimientos" value={stats.total}    color="bg-zinc-700/60 text-zinc-300" />
        <StatCard icon={TrendingDown} label="Unidades entrada"  value={stats.entradas} color="bg-emerald-500/12 text-emerald-400" sub="historial completo" />
        <StatCard icon={TrendingUp}   label="Unidades salida"   value={stats.salidas}  color="bg-red-500/12 text-red-400"     sub="historial completo" />
        <StatCard icon={Package}      label="Movimientos hoy"   value={stats.today}    color="bg-amber-500/12 text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto, SKU, usuario..."
            className="h-9 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-8 pr-3 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-amber-500/40"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Type filter */}
        <div className="relative">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as MovType | '')}
            className="h-9 appearance-none rounded-xl border border-zinc-800 bg-zinc-900 pl-3 pr-8 text-sm text-zinc-300 outline-none transition focus:border-amber-500/40"
          >
            <option value="">Todos los tipos</option>
            <option value="entrada">Entrada</option>
            <option value="salida">Salida</option>
            <option value="ajuste">Ajuste</option>
          </select>
          <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500" />
        </div>

        {/* Date filter */}
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          className="h-9 rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-300 outline-none transition focus:border-amber-500/40"
        />

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setTypeFilter(''); setDateFilter('') }}
            className="flex items-center gap-1 rounded-xl border border-zinc-700 px-3 text-xs text-zinc-500 transition hover:border-zinc-500 hover:text-zinc-300"
          >
            <X size={11} /> Limpiar
          </button>
        )}

        {/* Results count */}
        <div className="flex items-center rounded-xl border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-500">
          {filtered.length} resultados
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800">

        {/* Table header */}
        <div className="grid grid-cols-[28px_1fr_80px_130px_140px_120px] gap-0 border-b border-zinc-800 bg-zinc-800/60 px-4 py-2.5">
          {['', 'Producto', 'Tipo', 'Cantidad', 'Fecha', 'Usuario'].map((h, i) => (
            <div key={i} className={`text-[10px] font-semibold uppercase tracking-widest text-zinc-500 ${i > 1 ? 'text-right' : ''}`}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-zinc-800/60">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Package size={36} className="text-zinc-800" />
              <p className="mt-3 text-sm text-zinc-600">
                {hasFilters ? 'Sin resultados para los filtros aplicados' : 'No hay movimientos registrados'}
              </p>
            </div>
          ) : (
            filtered.map(m => {
              const type    = (m.type ?? 'ajuste') as MovType
              const cfg     = TYPE_CFG[type] ?? TYPE_CFG.ajuste
              const Icon    = cfg.icon
              const product = getName(m.product)
              const campus  = getName(m.campus)
              const user    = getName(m.user_profile)
              const isOpen  = expanded === m.id

              return (
                <div key={m.id} className={`${cfg.row} bg-zinc-950/20 transition hover:bg-zinc-900/60`}>

                  {/* Main row */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : m.id)}
                    className="grid w-full grid-cols-[28px_1fr_80px_130px_140px_120px] gap-0 px-4 py-3 text-left"
                  >
                    {/* Dot */}
                    <div className="flex items-center">
                      <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                    </div>

                    {/* Product */}
                    <div className="min-w-0 pr-3">
                      <p className="truncate text-sm font-medium text-zinc-200">
                        {product?.name ?? '—'}
                      </p>
                      {product?.sku && (
                        <p className="text-[10px] text-zinc-600">{product.sku}</p>
                      )}
                    </div>

                    {/* Type badge */}
                    <div className="flex items-center justify-end">
                      <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.badge}`}>
                        <Icon size={10} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center justify-end">
                      <span className={`text-sm font-black ${cfg.qty}`}>
                        {type === 'salida' ? '−' : type === 'entrada' ? '+' : '±'}{m.quantity ?? 0}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="flex items-center justify-end">
                      <span className="text-xs text-zinc-400">{fmtDate(m.created_at)}</span>
                    </div>

                    {/* User */}
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[9px] font-bold text-zinc-300">
                        {user?.full_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="max-w-[72px] truncate text-xs text-zinc-400">
                        {user?.full_name ?? '—'}
                      </span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isOpen && (
                    <div className="border-t border-zinc-800/60 bg-zinc-900/40 px-4 py-3">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Campus</p>
                          <p className="mt-0.5 text-zinc-300">{campus?.name ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Fecha completa</p>
                          <p className="mt-0.5 text-zinc-300">{fmtDateFull(m.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600">ID movimiento</p>
                          <p className="mt-0.5 font-mono text-[10px] text-zinc-500">{m.id.slice(0, 8)}…</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-zinc-600">Nota</p>
                          <p className="mt-0.5 text-zinc-300">{m.notes ?? '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {filtered.length > 0 && (
          <div className="border-t border-zinc-800 bg-zinc-900/40 px-4 py-2.5 text-center text-[10px] text-zinc-600">
            {filtered.length === 200
              ? 'Mostrando los últimos 200 movimientos'
              : `${filtered.length} movimiento${filtered.length !== 1 ? 's' : ''} en total`}
          </div>
        )}
      </div>
    </div>
  )
}
