'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

const STATUS_COLOR: Record<string, string> = {
  completada: 'text-green-400 bg-green-500/10',
  pendiente:  'text-amber-400 bg-amber-500/10',
  cancelada:  'text-red-400 bg-red-500/10',
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const today = new Date().toDateString()

      const [{ data: orders }, { data: lowStock }, { data: recent }] = await Promise.all([
        supabase.from('orders').select('total, status, created_at').eq('status', 'completada'),
        supabase.from('products_with_stock').select('id, name, stock').lte('stock', 5).gt('stock', 0).limit(5),
        supabase.from('orders').select('id, order_number, total, status, payment_method, created_at, seller:profiles(full_name)').order('created_at', { ascending: false }).limit(8),
      ])

      const allOrders = (orders ?? []) as any[]
      const todayOrders = allOrders.filter(o => new Date(o.created_at).toDateString() === today)

      setData({
        todayTotal:  todayOrders.reduce((s: number, o: any) => s + Number(o.total), 0),
        todayCount:  todayOrders.length,
        monthTotal:  allOrders.reduce((s: number, o: any) => s + Number(o.total), 0),
        lowStock:    lowStock ?? [],
        recent:      recent ?? [],
      })
    }
    load()
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ventas hoy',     value: fmt(data.todayTotal),          color: 'text-amber-400' },
          { label: 'Órdenes hoy',    value: data.todayCount.toString(),    color: 'text-blue-400'  },
          { label: 'Ventas del mes', value: fmt(data.monthTotal),          color: 'text-green-400' },
          { label: 'Stock bajo',     value: data.lowStock.length.toString(), color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-4">
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
          <p className="text-sm font-medium text-white mb-3">Stock bajo</p>
          {data.lowStock.length === 0
            ? <p className="text-zinc-600 text-xs py-4 text-center">Todo el stock normal</p>
            : data.lowStock.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-zinc-300 truncate flex-1">{p.name}</span>
                <span className="text-xs font-bold text-orange-400 ml-2">{p.stock} uds.</span>
              </div>
            ))
          }
        </div>

        <div className="lg:col-span-2 bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
          <p className="text-sm font-medium text-white mb-3">Órdenes recientes</p>
          {data.recent.length === 0
            ? <p className="text-zinc-600 text-xs py-4 text-center">Sin órdenes</p>
            : data.recent.map((o: any) => (
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
