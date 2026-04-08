'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Pencil, ToggleLeft, ToggleRight, Search } from 'lucide-react'
import { toggleProductActive } from '@/lib/actions/products'
import StockBadge from '@/components/inventory/stock-badge'

interface Props {
  products: any[]
  categories: { id: string; name: string }[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

export default function ProductsTable({ products, categories }: Props) {
  const [items, setItems]         = useState(products)
  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('')

  const filtered = items.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCat || p.category_id === filterCat
    return matchSearch && matchCat
  })

  async function handleToggle(id: string, active: boolean) {
    await toggleProductActive(id, !active)
    setItems(prev => prev.map(p => p.id === id ? { ...p, active: !active } : p))
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto o SKU..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600
                       rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition"
          />
        </div>
        <select
          value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl px-3 py-2.5 text-sm
                     focus:outline-none focus:border-amber-500 transition"
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700/60">
                {['Producto', 'Categoría', 'SKU', 'Precio', 'Stock', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className={`border-b border-zinc-700/30 hover:bg-zinc-700/20 transition ${!p.active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                        {p.image_url
                          ? <Image src={p.image_url} alt={p.name} width={36} height={36} className="object-cover w-full h-full" />
                          : <span className="text-base">📦</span>
                        }
                      </div>
                      <span className="text-zinc-200 font-medium text-sm">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-500 bg-zinc-700/50 px-2 py-1 rounded-lg">
                      {p.category_name ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-zinc-600 font-mono">{p.sku ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-amber-400">{fmt(p.price)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-white">{p.stock ?? 0}</span>
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge stock={p.stock ?? 0} alert={p.low_stock_alert ?? 5} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/products/${p.id}`}
                        className="text-zinc-500 hover:text-amber-400 transition p-1.5 rounded-lg hover:bg-zinc-700"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => handleToggle(p.id, p.active)}
                        className={`transition p-1.5 rounded-lg hover:bg-zinc-700 ${p.active ? 'text-green-400 hover:text-red-400' : 'text-zinc-600 hover:text-green-400'}`}
                        title={p.active ? 'Desactivar' : 'Activar'}
                      >
                        {p.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-14 text-center">
            <p className="text-zinc-600 text-sm">No hay productos que coincidan</p>
          </div>
        )}
      </div>
    </div>
  )
}
