'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'
import { useCart } from '@/lib/hooks/use-cart'

interface Product {
  id: string; name: string; price: number
  image_url: string | null; stock: number | null
  low_stock_alert: number | null; category_id: string | null
  sku: string | null; active: boolean; [key: string]: any
}

interface Props {
  products: Product[]
  categories: { id: string; name: string }[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

export default function ProductGrid({ products, categories }: Props) {
  const { addItem, items } = useCart()
  const [search, setSearch]   = useState('')
  const [category, setCategory] = useState('')

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
    const matchCat = !category || p.category_id === category
    return matchSearch && matchCat
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filtros */}
      <div className="px-4 pt-4 pb-3 flex flex-col gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600
                       rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={() => setCategory('')}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition border ${
              !category ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
            }`}>
            Todos
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition border ${
                category === c.id ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300'
              }`}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-zinc-600 text-sm">
            No se encontraron productos
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filtered.map(product => {
              const inCart     = items.find(i => i.product.id === product.id)
              const outOfStock = (product.stock ?? 0) <= 0
              const lowStock   = !outOfStock && (product.stock ?? 0) <= (product.low_stock_alert ?? 5)

              return (
                <button key={product.id}
                  onClick={() => { if (!outOfStock) addItem({ id: product.id, name: product.name, price: product.price, image_url: product.image_url, stock: product.stock ?? 0 }) }}
                  disabled={outOfStock}
                  className={`relative flex flex-col bg-zinc-900 rounded-xl p-3 text-left transition-all border hover:scale-[1.02] active:scale-[0.98]
                    ${outOfStock ? 'opacity-40 cursor-not-allowed border-zinc-800'
                      : inCart ? 'border-amber-500/60 bg-zinc-800'
                      : 'border-zinc-800 hover:border-amber-500/50 cursor-pointer'}`}>

                  <div className="w-full aspect-square bg-zinc-800 rounded-lg mb-2.5 overflow-hidden flex items-center justify-center">
                    {product.image_url
                      ? <Image src={product.image_url} alt={product.name} width={120} height={120} className="object-cover w-full h-full" />
                      : <span className="text-3xl text-zinc-700">📦</span>}
                  </div>

                  <p className="text-xs font-medium text-zinc-200 leading-tight mb-1 line-clamp-2">{product.name}</p>
                  <p className="text-sm font-bold text-amber-400">{fmt(product.price)}</p>

                  <div className="mt-1.5 flex items-center justify-between">
                    <span className={`text-[10px] font-medium ${outOfStock ? 'text-red-400' : lowStock ? 'text-orange-400' : 'text-zinc-500'}`}>
                      {outOfStock ? 'Sin stock' : `Stock: ${product.stock}`}
                    </span>
                    {inCart && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-medium">×{inCart.quantity}</span>}
                  </div>
                  {lowStock && <div className="absolute top-2 right-2 w-2 h-2 bg-orange-400 rounded-full" />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
