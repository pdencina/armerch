'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown, RefreshCw, Search } from 'lucide-react'

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })

const TYPE_STYLES: Record<string, string> = {
  entrada: 'bg-green-500/10 text-green-400 border-green-500/20',
  salida:  'bg-red-500/10 text-red-400 border-red-500/20',
  ajuste:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

export default function MovementsPage() {
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [campusName, setCampusName] = useState<string|null>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase
      .from('profiles').select('role, campus_id, campus:campus(name)')
      .eq('id', session.user.id).single()

    const role     = profile?.role ?? 'voluntario'
    const campusId = profile?.campus_id ?? null
    setCampusName((profile?.campus as any)?.name ?? null)

    let query = supabase.from('inventory_movements')
      .select(`id, type, quantity, notes, created_at,
        product:products(name, sku),
        created_by_profile:profiles!inventory_movements_created_by_fkey(full_name),
        inventory:inventory(campus_id)`)
      .order('created_at', { ascending: false })
      .limit(200)

    // Admin ve solo movimientos de su campus
    if (role !== 'super_admin' && campusId) {
      // Filtrar por productos asignados al campus
    }

    const { data } = await query

    // Filtrar por campus en el cliente si es admin
    let result = data ?? []
    if (role !== 'super_admin' && campusId) {
      result = result.filter((m: any) => m.inventory?.campus_id === campusId)
    }

    setMovements(result)
    setLoading(false)
  }

  const filtered = movements.filter(m => {
    const q = search.toLowerCase()
    return (!search || (m.product?.name ?? '').toLowerCase().includes(q) || (m.notes ?? '').toLowerCase().includes(q))
      && (!typeFilter || m.type === typeFilter)
  })

  const totals = {
    entradas: movements.filter(m => m.type === 'entrada').reduce((s, m) => s + m.quantity, 0),
    salidas:  movements.filter(m => m.type === 'salida').reduce((s, m) => s + m.quantity, 0),
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">Movimientos de inventario</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {campusName ? <span>Campus: <span className="text-amber-400">{campusName}</span></span> : 'Todos los campus'}
            {' · '}{movements.length} registros
          </p>
        </div>
        <button onClick={loadData} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition text-zinc-400">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={13} className="text-green-400" /><span className="text-xs text-zinc-500">Entradas</span></div>
          <p className="text-xl font-bold text-green-400">+{totals.entradas}</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1"><TrendingDown size={13} className="text-red-400" /><span className="text-xs text-zinc-500">Salidas</span></div>
          <p className="text-xl font-bold text-red-400">-{totals.salidas}</p>
        </div>
        <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1"><span className="text-xs text-zinc-500">Balance</span></div>
          <p className={`text-xl font-bold ${totals.entradas - totals.salidas >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {totals.entradas - totals.salidas >= 0 ? '+' : ''}{totals.entradas - totals.salidas}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por producto o nota..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition">
          <option value="">Todos los tipos</option>
          <option value="entrada">Entradas</option>
          <option value="salida">Salidas</option>
          <option value="ajuste">Ajustes</option>
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700/60">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500">Cantidad</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden sm:table-cell">Notas</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden md:table-cell">Usuario</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 hidden lg:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-zinc-600 text-sm">Sin movimientos</td></tr>
                ) : filtered.map(m => (
                  <tr key={m.id} className="border-b border-zinc-700/30 hover:bg-zinc-700/10 transition">
                    <td className="px-4 py-3">
                      <p className="text-sm text-zinc-200 font-medium">{m.product?.name ?? '—'}</p>
                      <p className="text-xs text-zinc-600">{m.product?.sku ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-lg border capitalize ${TYPE_STYLES[m.type] ?? ''}`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold ${m.type === 'entrada' ? 'text-green-400' : m.type === 'salida' ? 'text-red-400' : 'text-blue-400'}`}>
                        {m.type === 'entrada' ? '+' : m.type === 'salida' ? '-' : '±'}{m.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-zinc-500">{m.notes ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-zinc-500">{m.created_by_profile?.full_name ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-zinc-600">{fmtDate(m.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
