'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type CashSession = {
  id: string
  opened_at: string
  closed_at?: string | null
  opening_amount: number
  closing_amount_declared?: number | null
  sales_total: number
  orders_count: number
  difference: number
  status: 'open' | 'closed'
  notes?: string | null
}

type PaymentSummary = {
  method: string
  total: number
}

function fmt(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

export default function CloseDayPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<CashSession | null>(null)
  const [history, setHistory] = useState<CashSession[]>([])
  const [dailySalesTotal, setDailySalesTotal] = useState(0)
  const [dailyOrdersCount, setDailyOrdersCount] = useState(0)
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary[]>([])

  const [openingAmount, setOpeningAmount] = useState(0)
  const [closingAmount, setClosingAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadSession() {
    setLoading(true)

    const {
      data: { session: authSession },
    } = await supabase.auth.getSession()

    if (!authSession?.access_token) {
      toast.error('No autenticado')
      setLoading(false)
      return
    }

    const res = await fetch('/api/cash-session', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authSession.access_token}`,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'No se pudo cargar caja')
      setLoading(false)
      return
    }

    setSession(data.session ?? null)
    setHistory(data.history ?? [])
    setDailySalesTotal(Number(data.daily_summary?.sales_total ?? 0))
    setDailyOrdersCount(Number(data.daily_summary?.orders_count ?? 0))
    setPaymentSummary(data.daily_summary?.payment_summary ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadSession()
  }, [])

  async function openCash() {
    setSaving(true)

    const {
      data: { session: authSession },
    } = await supabase.auth.getSession()

    if (!authSession?.access_token) {
      toast.error('No autenticado')
      setSaving(false)
      return
    }

    const res = await fetch('/api/cash-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authSession.access_token}`,
      },
      body: JSON.stringify({
        action: 'open',
        opening_amount: Number(openingAmount),
        notes: notes || null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'No se pudo abrir caja')
      setSaving(false)
      return
    }

    toast.success('Caja abierta correctamente')
    setNotes('')
    setOpeningAmount(0)
    await loadSession()
    setSaving(false)
  }

  async function closeCash() {
    setSaving(true)

    const {
      data: { session: authSession },
    } = await supabase.auth.getSession()

    if (!authSession?.access_token) {
      toast.error('No autenticado')
      setSaving(false)
      return
    }

    const res = await fetch('/api/cash-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authSession.access_token}`,
      },
      body: JSON.stringify({
        action: 'close',
        closing_amount_declared: Number(closingAmount),
        notes: notes || null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'No se pudo cerrar caja')
      setSaving(false)
      return
    }

    toast.success('Caja cerrada correctamente')
    setNotes('')
    setClosingAmount(0)
    await loadSession()
    setSaving(false)
  }

  const expectedCash = useMemo(() => {
    if (!session) return 0
    return Number(session.opening_amount ?? 0) + Number(dailySalesTotal ?? 0)
  }, [session, dailySalesTotal])

  const projectedDifference = useMemo(() => {
    if (!session) return 0
    return Number(closingAmount || 0) - expectedCash
  }, [closingAmount, expectedCash, session])

  if (loading) {
    return <div className="text-white">Cargando cierre de caja...</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Cierre de caja</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Apertura, cierre e historial del campus actual.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <InfoCard title="Ventas de hoy" value={fmt(dailySalesTotal)} />
        <InfoCard title="Órdenes de hoy" value={String(dailyOrdersCount)} />
        <InfoCard title="Caja abierta" value={session ? 'Sí' : 'No'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {!session ? (
            <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-5">
              <h2 className="text-lg font-semibold text-white">Abrir caja</h2>

              <div className="mt-5 grid gap-4">
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">
                    Monto inicial
                  </label>
                  <input
                    type="number"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-black"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-zinc-400">
                    Nota
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-black"
                  />
                </div>

                <button
                  onClick={openCash}
                  disabled={saving}
                  className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-60"
                >
                  {saving ? 'Abriendo...' : 'Abrir caja'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-5">
                <h2 className="text-lg font-semibold text-white">Caja abierta</h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <SummaryBox
                    label="Abierta desde"
                    value={new Date(session.opened_at).toLocaleString('es-CL')}
                  />
                  <SummaryBox
                    label="Monto inicial"
                    value={fmt(session.opening_amount)}
                  />
                  <SummaryBox
                    label="Ventas acumuladas hoy"
                    value={fmt(dailySalesTotal)}
                  />
                  <SummaryBox
                    label="Caja esperada"
                    value={fmt(expectedCash)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-5">
                <h2 className="text-lg font-semibold text-white">Cerrar caja</h2>

                <div className="mt-5 grid gap-4">
                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">
                      Monto contado al cierre
                    </label>
                    <input
                      type="number"
                      value={closingAmount}
                      onChange={(e) => setClosingAmount(Number(e.target.value))}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-black"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SummaryBox
                      label="Caja esperada"
                      value={fmt(expectedCash)}
                    />
                    <SummaryBox
                      label="Diferencia proyectada"
                      value={fmt(projectedDifference)}
                      valueClassName={
                        projectedDifference === 0
                          ? 'text-white'
                          : projectedDifference > 0
                            ? 'text-green-400'
                            : 'text-red-400'
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-zinc-400">
                      Nota
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-black"
                    />
                  </div>

                  <button
                    onClick={closeCash}
                    disabled={saving}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
                  >
                    {saving ? 'Cerrando...' : 'Cerrar caja'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-5">
            <h2 className="text-lg font-semibold text-white">Resumen diario</h2>

            <div className="mt-4 space-y-3">
              {paymentSummary.length === 0 ? (
                <p className="text-sm text-zinc-500">Sin ventas hoy.</p>
              ) : (
                paymentSummary.map((item) => (
                  <div
                    key={item.method}
                    className="flex items-center justify-between rounded-xl bg-zinc-950/50 px-4 py-3"
                  >
                    <span className="text-sm text-zinc-300">{item.method}</span>
                    <span className="text-sm font-semibold text-white">
                      {fmt(item.total)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-5">
            <h2 className="text-lg font-semibold text-white">Historial de cierres</h2>

            <div className="mt-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-zinc-500">Sin historial aún.</p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl bg-zinc-950/50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {item.status === 'open' ? 'Caja abierta' : 'Caja cerrada'}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(item.opened_at).toLocaleString('es-CL')}
                        </p>
                      </div>

                      <span
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          item.status === 'open'
                            ? 'bg-amber-500/10 text-amber-300'
                            : 'bg-green-500/10 text-green-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <MiniLine label="Apertura" value={fmt(item.opening_amount)} />
                      <MiniLine label="Ventas" value={fmt(item.sales_total)} />
                      <MiniLine label="Órdenes" value={String(item.orders_count)} />
                      <MiniLine
                        label="Diferencia"
                        value={fmt(item.difference)}
                        valueClassName={
                          Number(item.difference) === 0
                            ? 'text-white'
                            : Number(item.difference) > 0
                              ? 'text-green-400'
                              : 'text-red-400'
                        }
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-4">
      <p className="text-xs text-zinc-500">{title}</p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  )
}

function SummaryBox({
  label,
  value,
  valueClassName = 'text-white',
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="rounded-xl bg-zinc-950/50 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-1 text-base font-semibold ${valueClassName}`}>{value}</p>
    </div>
  )
}

function MiniLine({
  label,
  value,
  valueClassName = 'text-white',
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-3 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className={`text-xs font-semibold ${valueClassName}`}>{value}</span>
    </div>
  )
}