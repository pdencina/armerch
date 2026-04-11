'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Printer, CheckCircle } from 'lucide-react'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const METHODS = ['efectivo','transferencia','debito','credito'] as const
const METHOD_LABEL: Record<string, string> = {
  efectivo:'Efectivo', transferencia:'Transferencia', debito:'Débito', credito:'Crédito'
}

export default function CloseDayPage() {
  const [date, setDate]     = useState(new Date().toISOString().split('T')[0])
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const [campusId, setCampusId]   = useState<string|null>(null)
  const [campusName, setCampusName] = useState<string|null>(null)
  const [userRole, setUserRole]   = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase.from('profiles').select('role, campus_id, campus:campus(name)').eq('id', session.user.id).single()
        .then(({ data: p }) => {
          setUserRole(p?.role ?? '')
          setCampusId(p?.campus_id ?? null)
          setCampusName((p?.campus as any)?.name ?? null)
        })
    })
  }, [])

  useEffect(() => { if (userRole) loadData(date) }, [date, userRole, campusId])

  async function loadData(d: string) {
    setLoading(true)
    const supabase = createClient()
    const start = new Date(d).toISOString()
    const end   = new Date(new Date(d).getTime() + 86400000).toISOString()

    const { data: orders } = await supabase.from('orders')
      .select('id, total, subtotal, discount, payment_method, status, created_at, order_number, notes, seller:profiles(full_name), order_items(quantity, unit_price, product:products(name))')
      .gte('created_at', start).lt('created_at', end)
      .eq('status', 'completada')
      .order('created_at')

    const list = orders ?? []
    const byMethod: Record<string, { count: number; total: number }> = {}
    METHODS.forEach(m => byMethod[m] = { count: 0, total: 0 })

    list.forEach((o: any) => {
      const m = o.payment_method as string
      if (byMethod[m]) { byMethod[m].count++; byMethod[m].total += Number(o.total) }
      else { byMethod[m] = { count: 1, total: Number(o.total) } }
    })

    const bySeller: Record<string, { name: string; count: number; total: number }> = {}
    list.forEach((o: any) => {
      const sid = o.seller?.full_name ?? 'Sin asignar'
      if (!bySeller[sid]) bySeller[sid] = { name: sid, count: 0, total: 0 }
      bySeller[sid].count++; bySeller[sid].total += Number(o.total)
    })

    setData({
      orders: list,
      total:  list.reduce((s: number, o: any) => s + Number(o.total), 0),
      count:  list.length,
      byMethod,
      bySeller: Object.values(bySeller).sort((a: any, b: any) => b.total - a.total),
    })
    setLoading(false)
  }

  function handlePrint() {
    if (!data) return
    const d = new Date(date).toLocaleDateString('es-CL', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })
    const win = window.open('', '_blank', 'width=500,height=700')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:4mm;color:#000}
      .c{text-align:center}.b{font-weight:bold}.xl{font-size:18px}
      .d{border-top:1px dashed #000;margin:6px 0}
      .row{display:flex;justify-content:space-between;margin:2px 0}
      .m{color:#555;font-size:11px}
      @media print{body{width:80mm}@page{margin:0;size:80mm auto}}
    </style></head><body>
      <div class="c"><div class="b xl">ARM MERCH</div><div class="m">ARM Global</div></div>
      <div class="d"></div>
      <div class="c b">CIERRE DE CAJA</div>
      <div class="c m">${d}</div>
      <div class="d"></div>
      <div class="row"><span class="m">Total órdenes</span><span class="b">${data.count}</span></div>
      <div class="row"><span class="m">Total recaudado</span><span class="b">${fmt(data.total)}</span></div>
      <div class="d"></div>
      <div class="b" style="margin-bottom:4px">POR MÉTODO DE PAGO</div>
      ${METHODS.map(m => data.byMethod[m]?.count > 0 ? `<div class="row"><span class="m">${METHOD_LABEL[m]}</span><span>${fmt(data.byMethod[m].total)} (${data.byMethod[m].count})</span></div>` : '').join('')}
      <div class="d"></div>
      <div class="b" style="margin-bottom:4px">POR VOLUNTARIO</div>
      ${data.bySeller.map((s: any) => `<div class="row"><span class="m">${s.name}</span><span>${fmt(s.total)}</span></div>`).join('')}
      <div class="d"></div>
      <div class="c m">Generado: ${new Date().toLocaleTimeString('es-CL')}</div>
      <div class="c m">— ARM Global —</div>
    </body></html>`)
    win.document.close(); win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-white">Cierre de caja</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Resumen diario de ventas</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition" />
          <button onClick={handlePrint} disabled={!data || data.count === 0}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 border border-zinc-600 text-zinc-200 font-medium rounded-xl px-4 py-2 text-sm transition">
            <Printer size={14} />Imprimir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Stats principales */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-4">
              <p className="text-xs text-zinc-500">Total recaudado</p>
              <p className="text-2xl font-bold text-amber-400">{fmt(data.total)}</p>
            </div>
            <div className="bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-4">
              <p className="text-xs text-zinc-500">Órdenes completadas</p>
              <p className="text-2xl font-bold text-white">{data.count}</p>
            </div>
          </div>

          {/* Por método de pago */}
          <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
            <p className="text-sm font-medium text-white mb-3">Por método de pago</p>
            {METHODS.map(m => data.byMethod[m]?.count > 0 && (
              <div key={m} className="flex items-center justify-between py-2 border-b border-zinc-700/30 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-zinc-300 font-medium">{METHOD_LABEL[m]}</span>
                  <span className="text-xs text-zinc-500">{data.byMethod[m].count} orden{data.byMethod[m].count !== 1 ? 'es' : ''}</span>
                </div>
                <span className="text-sm font-bold text-amber-400">{fmt(data.byMethod[m].total)}</span>
              </div>
            ))}
            {data.count === 0 && <p className="text-zinc-600 text-xs text-center py-4">Sin ventas este día</p>}
          </div>

          {/* Por voluntario */}
          {data.bySeller.length > 0 && (
            <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
              <p className="text-sm font-medium text-white mb-3">Por voluntario</p>
              {data.bySeller.map((s: any) => (
                <div key={s.name} className="flex items-center justify-between py-2 border-b border-zinc-700/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-amber-400">{s.name[0]}</span>
                    </div>
                    <span className="text-sm text-zinc-300">{s.name}</span>
                    <span className="text-xs text-zinc-500">{s.count} venta{s.count !== 1 ? 's' : ''}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{fmt(s.total)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Detalle órdenes */}
          {data.orders.length > 0 && (
            <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
              <p className="text-sm font-medium text-white mb-3">Detalle de órdenes</p>
              {data.orders.map((o: any) => (
                <div key={o.id} className="flex items-center gap-3 py-1.5 border-b border-zinc-700/30 last:border-0">
                  <span className="text-xs text-zinc-600 font-mono w-10">#{o.order_number}</span>
                  <span className="text-xs text-zinc-400 flex-1 truncate">{o.notes?.replace('Cliente: ','').split(' | ')[0] ?? '—'}</span>
                  <span className="text-xs text-zinc-500 capitalize hidden sm:block">{METHOD_LABEL[o.payment_method] ?? o.payment_method}</span>
                  <span className="text-xs font-bold text-amber-400">{fmt(o.total)}</span>
                </div>
              ))}
            </div>
          )}

          {data.count === 0 && (
            <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-10 text-center">
              <CheckCircle size={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No hay ventas registradas para este día</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
