'use client'

import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, ShoppingBag, AlertTriangle, Calendar } from 'lucide-react'

interface Props {
  todayTotal: number
  todayCount: number
  monthTotal: number
  lowStock: any[]
  topProducts: any[]
  recentOrders: any[]
  hourlyData: { hour: string; total: number }[]
  dailyData: { day: string; total: number }[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const fmtDate = (d: string) =>
  new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d))

const STATUS_COLOR: Record<string, string> = {
  completada: 'text-green-400 bg-green-500/10',
  pendiente:  'text-amber-400 bg-amber-500/10',
  cancelada:  'text-red-400 bg-red-500/10',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs">
      <p className="text-zinc-400 mb-0.5">{label}</p>
      <p className="text-amber-400 font-bold">{fmt(payload[0].value)}</p>
    </div>
  )
}

export default function DashboardClient({
  todayTotal, todayCount, monthTotal,
  lowStock, recentOrders, hourlyData, dailyData,
}: Props) {
  return (
    <div className="flex flex-col gap-5">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Ventas hoy',       value: fmt(todayTotal),  icon: TrendingUp,   color: 'text-amber-400' },
          { label: 'Órdenes hoy',      value: todayCount.toString(), icon: ShoppingBag, color: 'text-blue-400' },
          { label: 'Ventas del mes',   value: fmt(monthTotal),  icon: Calendar,     color: 'text-green-400' },
          { label: 'Alertas de stock', value: lowStock.length.toString(), icon: AlertTriangle, color: 'text-orange-400' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-zinc-700/60 flex items-center justify-center shrink-0">
                <Icon size={16} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-zinc-500">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Ventas por hora hoy */}
        <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
          <p className="text-sm font-medium text-white mb-4">Ventas por hora — hoy</p>
          {hourlyData.every(d => d.total === 0) ? (
            <div className="h-40 flex items-center justify-center text-zinc-600 text-sm">
              Sin ventas registradas hoy
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={hourlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} fill="url(#grad1)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Ventas del mes */}
        <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
          <p className="text-sm font-medium text-white mb-4">Ventas del mes</p>
          {dailyData.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-zinc-600 text-sm">
              Sin ventas este mes
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <XAxis dataKey="day" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#f59e0b" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Alertas de stock + Órdenes recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Stock bajo */}
        <div className="bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
          <p className="text-sm font-medium text-white mb-3">Stock bajo</p>
          {lowStock.length === 0 ? (
            <p className="text-zinc-600 text-xs py-4 text-center">Todo el stock está en niveles normales</p>
          ) : (
            <div className="flex flex-col gap-2">
              {lowStock.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300 truncate flex-1">{p.name}</span>
                  <span className={`text-xs font-bold ml-2 ${p.stock === 0 ? 'text-red-400' : 'text-orange-400'}`}>
                    {p.stock} uds.
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Órdenes recientes */}
        <div className="lg:col-span-2 bg-zinc-800/30 border border-zinc-700/40 rounded-xl p-4">
          <p className="text-sm font-medium text-white mb-3">Órdenes recientes</p>
          {recentOrders.length === 0 ? (
            <p className="text-zinc-600 text-xs py-4 text-center">Sin órdenes registradas</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center gap-3 py-1.5 border-b border-zinc-700/30 last:border-0">
                  <span className="text-xs text-zinc-600 font-mono w-10">#{o.order_number}</span>
                  <span className="text-xs text-zinc-400 flex-1 truncate">{o.seller?.full_name ?? '—'}</span>
                  <span className="text-xs text-zinc-500 hidden sm:block">{fmtDate(o.created_at)}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] ?? ''}`}>
                    {o.status}
                  </span>
                  <span className="text-xs font-bold text-amber-400 min-w-[70px] text-right">{fmt(o.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
