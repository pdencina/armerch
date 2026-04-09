import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()

  const [
    { data: ordersRaw },
    { data: lowStockRaw },
    { data: recentRaw },
  ] = await Promise.all([
    supabase.from('orders').select('total, status, created_at').eq('status', 'completada'),
    supabase.from('products_with_stock').select('id, name, stock, low_stock_alert').lte('stock', 5).gt('stock', 0).limit(5),
    supabase.from('orders').select('id, order_number, total, status, payment_method, created_at, seller:profiles(full_name)').order('created_at', { ascending: false }).limit(8),
  ])

  type O = { total: number; created_at: string }
  const orders     = (ordersRaw ?? []) as O[]
  const lowStock   = (lowStockRaw ?? []) as any[]
  const recent     = (recentRaw ?? []) as any[]

  const today      = new Date().toDateString()
  const todayTotal = orders.filter(o => new Date(o.created_at).toDateString() === today).reduce((s, o) => s + Number(o.total), 0)
  const monthTotal = orders.reduce((s, o) => s + Number(o.total), 0)
  const fmt        = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)
  const fmtDate    = (d: string) => new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  const STATUS_COLOR: Record<string, string> = {
    completada: 'text-green-400 bg-green-500/10',
    pendiente:  'text-amber-400 bg-amber-500/10',
    cancelada:  'text-red-400 bg-red-500/10',
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ventas hoy',     value: fmt(todayTotal),         color: 'text-amber-400' },
          { label: 'Órdenes hoy',    value: orders.filter(o => new Date(o.created_at).toDateString() === today).length.toString(), color: 'text-blue-400' },
          { label: 'Ventas del mes', value: fmt(monthTotal),          color: 'text-green-400' },
          { label: 'Stock bajo',     value: lowStock.length.toString(), color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-4">
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stock bajo */}
        <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
          <p className="text-sm font-medium text-white mb-3">Stock bajo</p>
          {lowStock.length === 0
            ? <p className="text-zinc-600 text-xs py-4 text-center">Todo el stock normal</p>
            : lowStock.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-zinc-300 truncate flex-1">{p.name}</span>
                <span className="text-xs font-bold text-orange-400 ml-2">{p.stock} uds.</span>
              </div>
            ))
          }
        </div>

        {/* Órdenes recientes */}
        <div className="lg:col-span-2 bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
          <p className="text-sm font-medium text-white mb-3">Órdenes recientes</p>
          {recent.length === 0
            ? <p className="text-zinc-600 text-xs py-4 text-center">Sin órdenes</p>
            : recent.map((o: any) => (
              <div key={o.id} className="flex items-center gap-3 py-1.5 border-b border-zinc-700/30 last:border-0">
                <span className="text-xs text-zinc-600 font-mono w-10">#{o.order_number}</span>
                <span className="text-xs text-zinc-400 flex-1 truncate">{o.seller?.full_name ?? '—'}</span>
                <span className="text-xs text-zinc-500 hidden sm:block">{fmtDate(o.created_at)}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] ?? ''}`}>
                  {o.status}
                </span>
                <span className="text-xs font-bold text-amber-400 min-w-[70px] text-right">{fmt(o.total)}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}
