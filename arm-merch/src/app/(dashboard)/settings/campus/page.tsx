'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, X, Loader2, MapPin, Users, Package, TrendingUp, Edit2, Check } from 'lucide-react'

const CAMPUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'ARM Santiago':    { bg:'bg-blue-500/10',   text:'text-blue-400',   border:'border-blue-500/30',   dot:'bg-blue-400' },
  'ARM Puente Alto': { bg:'bg-purple-500/10', text:'text-purple-400', border:'border-purple-500/30', dot:'bg-purple-400' },
  'ARM Punta Arenas':{ bg:'bg-teal-500/10',   text:'text-teal-400',   border:'border-teal-500/30',   dot:'bg-teal-400' },
  'ARM Montevideo':  { bg:'bg-amber-500/10',  text:'text-amber-400',  border:'border-amber-500/30',  dot:'bg-amber-400' },
  'ARM Maracaibo':   { bg:'bg-red-500/10',    text:'text-red-400',    border:'border-red-500/30',    dot:'bg-red-400' },
}
const DEFAULT_COLOR = { bg:'bg-zinc-800/50', text:'text-zinc-400', border:'border-zinc-700/40', dot:'bg-zinc-500' }

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 }).format(n)

export default function CampusAdminPage() {
  const [campus, setCampus]         = useState<any[]>([])
  const [stats, setStats]           = useState<Record<string, any>>({})
  const [loading, setLoading]       = useState(true)
  const [showNew, setShowNew]       = useState(false)
  const [newName, setNewName]       = useState('')
  const [newCity, setNewCity]       = useState('')
  const [newCountry, setNewCountry] = useState('Chile')
  const [saving, setSaving]         = useState(false)
  const [editId, setEditId]         = useState<string | null>(null)
  const [editName, setEditName]     = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const supabase = createClient()
    const { data: campusList } = await supabase.from('campus').select('*').order('name')

    if (!campusList) { setLoading(false); return }
    setCampus(campusList)

    // Cargar stats por campus
    const statsMap: Record<string, any> = {}
    await Promise.all(campusList.map(async c => {
      const [
        { count: userCount },
        { data: inv },
        { data: orders },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('campus_id', c.id),
        supabase.from('inventory').select('stock, product:products(price)').eq('campus_id', c.id),
        supabase.from('orders').select('total, seller:profiles!inner(campus_id)')
          .eq('status', 'completada').eq('seller.campus_id', c.id)
          .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ])

      const stockValue = (inv ?? []).reduce((s: number, i: any) => s + (i.stock ?? 0) * (i.product?.price ?? 0), 0)
      const monthSales = (orders ?? []).reduce((s: number, o: any) => s + Number(o.total), 0)

      statsMap[c.id] = {
        users:      userCount ?? 0,
        products:   (inv ?? []).length,
        stockValue,
        monthSales,
        orderCount: (orders ?? []).length,
      }
    }))

    setStats(statsMap)
    setLoading(false)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    const { error } = await createClient().from('campus').insert({ name: newName.trim(), city: newCity.trim() || null, country: newCountry.trim() || null, active: true })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(`Campus "${newName.trim()}" creado`)
    setNewName(''); setNewCity(''); setNewCountry('Chile'); setShowNew(false)
    loadAll()
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return
    const { error } = await createClient().from('campus').update({ name: editName.trim() }).eq('id', id)
    if (error) { toast.error(error.message); return }
    toast.success('Campus renombrado')
    setEditId(null); setEditName('')
    loadAll()
  }

  async function toggleActive(id: string, active: boolean) {
    await createClient().from('campus').update({ active }).eq('id', id)
    toast.success(active ? 'Campus activado' : 'Campus desactivado')
    loadAll()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">Administración de campus</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{campus.filter(c => c.active).length} campus activos</p>
        </div>
        <button onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl px-4 py-2.5 text-sm transition active:scale-[0.98]">
          <Plus size={15} />Nuevo campus
        </button>
      </div>

      {/* Form nuevo campus */}
      {showNew && (
        <form onSubmit={handleCreate} className="bg-zinc-800/30 border border-amber-500/20 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-sm font-medium text-white">Agregar nuevo campus</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Nombre *</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="ARM Ciudad"
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition" />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Ciudad</label>
              <input type="text" value={newCity} onChange={e => setNewCity(e.target.value)} placeholder="Santiago"
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition" />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">País</label>
              <input type="text" value={newCountry} onChange={e => setNewCountry(e.target.value)} placeholder="Chile"
                className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowNew(false)}
              className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-xl text-sm transition">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold rounded-xl text-sm transition flex items-center gap-2">
              {saving && <Loader2 size={13} className="animate-spin" />}
              Crear campus
            </button>
          </div>
        </form>
      )}

      {/* Grid de campus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {campus.map(c => {
          const color = CAMPUS_COLORS[c.name] ?? DEFAULT_COLOR
          const s     = stats[c.id] ?? {}
          const isEditing = editId === c.id

          return (
            <div key={c.id} className={`rounded-xl border p-4 flex flex-col gap-3 ${color.bg} ${color.border} ${!c.active ? 'opacity-50' : ''}`}>
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.dot}`} />
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key==='Enter') handleRename(c.id); if (e.key==='Escape') setEditId(null) }}
                        className="flex-1 bg-zinc-800 border border-zinc-600 text-white rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-amber-500" />
                      <button onClick={() => handleRename(c.id)} className={`${color.text} hover:opacity-80`}><Check size={14} /></button>
                      <button onClick={() => setEditId(null)} className="text-zinc-500 hover:text-zinc-300"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${color.text}`}>{c.name}</p>
                      <button onClick={() => { setEditId(c.id); setEditName(c.name) }}
                        className="text-zinc-600 hover:text-zinc-400 transition shrink-0"><Edit2 size={11} /></button>
                    </div>
                  )}
                </div>
                <button onClick={() => toggleActive(c.id, !c.active)}
                  className={`text-[9px] font-semibold px-2 py-1 rounded-lg border shrink-0 transition ${
                    c.active ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                             : 'bg-zinc-700/50 text-zinc-500 border-zinc-600 hover:bg-zinc-700'
                  }`}>
                  {c.active ? 'Activo' : 'Inactivo'}
                </button>
              </div>

              {/* Ubicación */}
              {(c.city || c.country) && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={11} className="text-zinc-600" />
                  <span className="text-xs text-zinc-500">{[c.city, c.country].filter(Boolean).join(', ')}</span>
                </div>
              )}

              {/* Stats del campus */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/10 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Users size={11} className="text-zinc-500" />
                    <span className="text-[10px] text-zinc-500">Usuarios</span>
                  </div>
                  <p className={`text-base font-bold ${color.text}`}>{s.users ?? 0}</p>
                </div>
                <div className="bg-black/10 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Package size={11} className="text-zinc-500" />
                    <span className="text-[10px] text-zinc-500">Productos</span>
                  </div>
                  <p className={`text-base font-bold ${color.text}`}>{s.products ?? 0}</p>
                </div>
                <div className="bg-black/10 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <TrendingUp size={11} className="text-zinc-500" />
                    <span className="text-[10px] text-zinc-500">Ventas del mes</span>
                  </div>
                  <p className={`text-sm font-bold ${color.text}`}>{fmt(s.monthSales ?? 0)}</p>
                </div>
                <div className="bg-black/10 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Package size={11} className="text-zinc-500" />
                    <span className="text-[10px] text-zinc-500">Valor stock</span>
                  </div>
                  <p className={`text-sm font-bold ${color.text}`}>{fmt(s.stockValue ?? 0)}</p>
                </div>
              </div>

              {/* Órdenes del mes */}
              <div className="flex items-center justify-between pt-1 border-t border-black/10">
                <span className="text-[10px] text-zinc-500">Órdenes este mes</span>
                <span className={`text-xs font-semibold ${color.text}`}>{s.orderCount ?? 0} órdenes</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
