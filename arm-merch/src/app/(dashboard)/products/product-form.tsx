'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { upsertProductWithInventory } from '@/lib/actions/products'

type Category = {
  id: string
  name: string
}

type Campus = {
  id: string
  name: string
}

export default function ProductForm() {
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const [categories, setCategories] = useState<Category[]>([])
  const [campuses, setCampuses] = useState<Campus[]>([])

  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [sku, setSku] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const [campusStocks, setCampusStocks] = useState<
    {
      campus_id: string
      enabled: boolean
      stock: number
      low_stock_alert: number
    }[]
  >([])

  const fieldClassName =
    'w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm text-black placeholder-zinc-500 focus:outline-none focus:border-amber-500'

  useEffect(() => {
    async function loadFormData() {
      setLoadingData(true)

      const [
        { data: categoryData, error: categoryError },
        { data: campusData, error: campusError },
      ] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name')
          .eq('active', true)
          .order('name'),
        supabase
          .from('campus')
          .select('id, name')
          .eq('active', true)
          .order('name'),
      ])

      if (categoryError) {
        alert(categoryError.message)
      }

      if (campusError) {
        alert(campusError.message)
      }

      const safeCategories = (categoryData ?? []) as Category[]
      const safeCampuses = (campusData ?? []) as Campus[]

      setCategories(safeCategories)
      setCampuses(safeCampuses)

      setCampusStocks(
        safeCampuses.map((c) => ({
          campus_id: c.id,
          enabled: false,
          stock: 0,
          low_stock_alert: 5,
        }))
      )

      setLoadingData(false)
    }

    loadFormData()
  }, [supabase])

  const handleSubmit = async () => {
    setLoading(true)

    const payload = {
      product: {
        name,
        price: Number(price),
        sku,
        category_id: categoryId,
        active: true,
      },
      campusStocks: campusStocks
        .filter((c) => c.enabled)
        .map((c) => ({
          campus_id: c.campus_id,
          stock: Number(c.stock),
          low_stock_alert: Number(c.low_stock_alert),
        })),
    }

    const result = await upsertProductWithInventory(payload)

    setLoading(false)

    if ('error' in result) {
      alert(result.error)
      return
    }

    alert('Producto creado correctamente')
    window.location.href = '/products'
  }

  if (loadingData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Nuevo Producto</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Crea un producto y define en qué campus estará disponible.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-400">Nombre del producto</label>
          <input
            placeholder="Ej: Agenda ARM 2025"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClassName}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-400">Precio</label>
          <input
            type="number"
            placeholder="0"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className={fieldClassName}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-400">SKU</label>
          <input
            placeholder="Ej: ARM-AGE-2025-001"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className={fieldClassName}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-400">Categoría</label>
          <select
            value={categoryId ?? ''}
            onChange={(e) => setCategoryId(e.target.value || null)}
            className={fieldClassName}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Stock por campus</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Activa solo los campus donde este producto estará disponible.
          </p>
        </div>

        <div className="space-y-4">
          {campusStocks.map((item, index) => {
            const campus = campuses.find((c) => c.id === item.campus_id)

            return (
              <div
                key={item.campus_id}
                className="space-y-4 rounded-2xl border border-zinc-700 bg-zinc-900/40 p-4"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setCampusStocks((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, enabled: checked } : row
                        )
                      )
                    }}
                    className="mt-1 h-4 w-4"
                  />

                  <div>
                    <label className="text-base font-medium text-white">
                      {campus?.name}
                    </label>
                    <p className="mt-1 text-xs text-zinc-500">
                      Marca este campus si quieres crear inventario inicial para esta sede.
                    </p>
                  </div>
                </div>

                {item.enabled && (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-zinc-400">
                        Stock inicial
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={item.stock}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setCampusStocks((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, stock: val } : row
                            )
                          )
                        }}
                        className={fieldClassName}
                      />
                      <p className="text-[11px] text-zinc-500">
                        Cantidad con la que comenzará este campus.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-medium text-zinc-400">
                        Alerta stock bajo
                      </label>
                      <input
                        type="number"
                        placeholder="5"
                        value={item.low_stock_alert}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setCampusStocks((prev) =>
                            prev.map((row, i) =>
                              i === index
                                ? { ...row, low_stock_alert: val }
                                : row
                            )
                          )
                        }}
                        className={fieldClassName}
                      />
                      <p className="text-[11px] text-zinc-500">
                        Se usará para marcar visualmente el stock bajo.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
        >
          {loading ? 'Guardando...' : 'Crear producto'}
        </button>
      </div>
    </div>
  )
}