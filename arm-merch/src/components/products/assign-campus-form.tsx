'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ConfirmActionModal from '@/components/ui/confirm-action-modal'
import { toast } from 'sonner'

type Campus = {
  id: string
  name: string
}

interface Props {
  productId: string
  productName: string
  campuses: Campus[]
}

export default function AssignCampusForm({
  productId,
  productName,
  campuses,
}: Props) {
  const supabase = createClient()

  const [campusId, setCampusId] = useState('')
  const [stock, setStock] = useState(0)
  const [lowStockAlert, setLowStockAlert] = useState(5)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const selectedCampusName = useMemo(() => {
    return campuses.find((c) => c.id === campusId)?.name ?? 'campus seleccionado'
  }, [campuses, campusId])

  async function handleAssignConfirmed() {
    setConfirmOpen(false)

    if (!campusId) {
      toast.error('Debes seleccionar un campus')
      return
    }

    if (stock < 0) {
      toast.error('El stock no puede ser negativo')
      return
    }

    if (lowStockAlert < 0) {
      toast.error('La alerta no puede ser negativa')
      return
    }

    setLoading(true)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        toast.error('No autenticado')
        setLoading(false)
        return
      }

      const res = await fetch('/api/inventory/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          product_id: productId,
          campus_id: campusId,
          stock,
          low_stock_alert: lowStockAlert,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo asignar el producto al campus')
        setLoading(false)
        return
      }

      toast.success('Producto asignado correctamente al campus')
      window.location.reload()
    } catch (error: any) {
      toast.error(error?.message ?? 'Error inesperado al asignar producto')
    }

    setLoading(false)
  }

  return (
    <>
      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">
            Agregar producto a otro campus
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Asigna este producto a una nueva sede con stock inicial.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-400">Campus</label>
            <select
              value={campusId}
              onChange={(e) => setCampusId(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-black focus:outline-none focus:border-amber-500"
            >
              <option value="">Selecciona un campus</option>
              {campuses.map((campus) => (
                <option key={campus.id} value={campus.id}>
                  {campus.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-400">Stock inicial</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-black focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-400">Alerta stock bajo</label>
              <input
                type="number"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-black focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={loading}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-60"
            >
              {loading ? 'Asignando...' : 'Asignar a campus'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={confirmOpen}
        title="¿Asignar producto a otro campus?"
        description={`Se agregará "${productName}" a ${selectedCampusName} con el stock inicial definido.`}
        confirmText="Sí, asignar"
        cancelText="Cancelar"
        loading={loading}
        tone="info"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleAssignConfirmed}
      />
    </>
  )
}