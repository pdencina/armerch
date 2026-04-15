'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, TrendingDown } from 'lucide-react'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function getStartOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function DashboardPage() {
  const supabase = createClient()

  const [orders, setOrders] = useState<any[]>([])
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')

      const { data: itemsData } = await supabase
        .from('order_items')
        .select(`
          quantity,
          subtotal,
          product:products(name)
        `)

      setOrders(ordersData || [])
      setOrderItems(itemsData || [])
      setLoading(false)
    }

    load()
  }, [])

  const now = new Date()

  const metrics = useMemo(() => {
    const todayStart = getStartOfDay(now)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 7)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    const todayOrders = orders.filter(o => new Date(o.created_at) >= todayStart)
    const weekOrders = orders.filter(o => new Date(o.created_at) >= sevenDaysAgo)
    const monthOrders = orders.filter(o => new Date(o.created_at) >= monthStart)
    const lastMonthOrders = orders.filter(o => {
      const d = new Date(o.created_at)
      return d >= lastMonthStart && d <= lastMonthEnd
    })

    const totalToday = todayOrders.reduce((s, o) => s + Number(o.total), 0)
    const totalWeek = weekOrders.reduce((s, o) => s + Number(o.total), 0)
    const totalMonth = monthOrders.reduce((s, o) => s + Number(o.total), 0)
    const totalLastMonth = lastMonthOrders.reduce((s, o) => s + Number(o.total), 0)

    const growth =
      totalLastMonth > 0
        ? ((totalMonth - totalLastMonth) / totalLastMonth) * 100
        : 0

    const avgTicket =
      monthOrders.length > 0 ? totalMonth / monthOrders.length : 0

    return {
      totalToday,
      totalWeek,
      totalMonth,
      totalLastMonth,
      growth,
      avgTicket,
    }
  }, [orders])

  const dailyChart = useMemo(() => {
    const days: { label: string; total: number }[] = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)

      const start = getStartOfDay(d)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)

      const total = orders
        .filter(o => {
          const date = new Date(o.created_at)
          return date >= start && date < end
        })
        .reduce((s, o) => s + Number(o.total), 0)

      days.push({
        label: d.toLocaleDateString('es-CL', { weekday: 'short' }),
        total,
      })
    }

    return days
  }, [orders])

  const topProducts = useMemo(() => {
    const map = new Map()

    for (const item of orderItems) {
      const name = item.product?.name || 'Producto'

      if (!map.has(name)) {
        map.set(name, { name, qty: 0, total: 0 })
      }

      const current = map.get(name)
      current.qty += Number(item.quantity)
      current.total += Number(item.subtotal)
    }

    return Array.from(map.values())
      .sort((a: any, b: any) => b.qty - a.qty)
      .slice(0, 5)
  }, [orderItems])

  const maxDaily = Math.max(...dailyChart.map(d => d.total), 1)

  if (loading) return <p className="text-white p-5">Cargando dashboard...</p>

  return (
    <div className="p-5 space-y-6 text-white">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Hoy" value={formatCurrency(metrics.totalToday)} />
        <Card title="7 días" value={formatCurrency(metrics.totalWeek)} />
        <Card title="Mes" value={formatCurrency(metrics.totalMonth)} />
        <Card title="Ticket promedio" value={formatCurrency(metrics.avgTicket)} />
      </div>

      {/* Crecimiento */}
      <div className="rounded-xl bg-zinc-900 p-4 flex items-center justify-between">
        <p className="text-sm text-zinc-400">Crecimiento mensual</p>
        <div className={`flex items-center gap-2 ${metrics.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {metrics.growth >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
          <span className="font-bold">{metrics.growth.toFixed(1)}%</span>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-zinc-900 p-4 rounded-xl">
        <p className="text-sm text-zinc-400 mb-4">Ventas últimos 7 días</p>
        <div className="flex items-end gap-3 h-40">
          {dailyChart.map((d, i) => {
            const height = (d.total / maxDaily) * 100

            return (
              <div key={i} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-amber-500 rounded"
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs mt-2 text-zinc-400">{d.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top productos */}
      <div className="bg-zinc-900 p-4 rounded-xl">
        <p className="text-sm text-zinc-400 mb-4">Top productos</p>

        {topProducts.map((p: any, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-zinc-800">
            <span>{p.name}</span>
            <span className="text-green-400">{p.qty} uds</span>
          </div>
        ))}
      </div>

    </div>
  )
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-zinc-900 p-4 rounded-xl">
      <p className="text-xs text-zinc-400">{title}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  )
}