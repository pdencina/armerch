'use client'

import { useState } from 'react'
import { assignProductToCampus } from '@/lib/actions/products'

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
  const [campusId, setCampusId] = useState('')
  const [stock, setStock] = useState(0)
  const [lowStockAlert, setLowStockAlert] = useState(5)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleAssign() {
    setLoading(true)
    setMessage('')
    setIsError(false)

    const result = await assignProductToCampus({
      product_id: productId,
      campus_id: campusId,
      stock: Number(stock),
      low_stock_alert: Number(lowStockAlert),
    })

    setLoading(false)

    if ('error' in result) {
      setIsError(true)
      setMessage(result.error)
      return
    }

    setIsError(false)
    setMessage('Producto asignado correctamente al campus')
    setCampusId('')
    setStock(0)
    setLowStockAlert(5)
  }

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-700/60 bg-zinc-900/60 p-5">
      <div>
        <h3 className="text-sm font-semibold text-white">
          Agregar producto a otro campus
        </h3>
        <p className="mt-1 text-xs text-zinc-400">{productName}</p>
      </div>

      <select
        value={campusId}
        onChange={(e) => setCampusId(e.target.value)}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white"
      >
        <option value="">Selecciona un campus</option>
        {campuses.map((campus) => (
          <option key={campus.id} value={campus.id}>
            {campus.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          min={0}
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          placeholder="Stock inicial"
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white"
        />

        <input
          type="number"
          min={0}
          value={lowStockAlert}
          onChange={(e) => setLowStockAlert(Number(e.target.value))}
          placeholder="Alerta stock"
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white"
        />
      </div>

      {message && (
        <div
          className={`rounded-xl px-3 py-2 text-xs ${
            isError
              ? 'bg-red-500/10 text-red-300'
              : 'bg-green-500/10 text-green-300'
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={handleAssign}
        disabled={loading || !campusId}
        className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-40"
      >
        {loading ? 'Guardando...' : 'Asignar a campus'}
      </button>
    </div>
  )
}