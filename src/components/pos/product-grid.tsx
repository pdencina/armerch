'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Search, Package2 } from 'lucide-react'
import { useCart } from '@/lib/hooks/use-cart'
import { useBarcode } from '@/lib/hooks/use-barcode'

interface Product {
  id: string
  name: string
  price: number
  image_url: string | null
  stock: number | null
  low_stock_alert: number | null
  category_id: string | null
  sku: string | null
}

interface Props {
  products: Product[]
  categories: { id: string; name: string }[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)

function playAddSound() {
  const audio = new Audio('/sounds/beep.mp3')
  audio.volume = 0.4
  audio.play().catch(() => {})
}

export default function ProductGrid({ products, categories }: Props) {
  const { addItem, items } = useCart()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.sku ?? '').toLowerCase().includes(search.toLowerCase())

      const matchCat = !category || p.category_id === category
      return matchSearch && matchCat
    })
  }, [products, search, category])

  function addProduct(product: Product) {
    if ((product.stock ?? 0) <= 0) return

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      stock: product.stock ?? 0,
    })

    playAddSound()
  }

  // 🔥 SCANNER DE CÓDIGO DE BARRAS
  useBarcode((code) => {
    const product = products.find(
      (p) =>
        p.sku?.toLowerCase() === code.toLowerCase() ||
        p.id === code
    )

    if (product) {
      addProduct(product)
    }
  })

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex h-full flex-col overflow-hidden">

      {/* BUSCADOR */}
      <div className="border-b border-zinc-800 px-4 py-3">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar o escanear..."
            className="h-11 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-3 text-sm text-white outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* GRID */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => addProduct(product)}
              className="rounded-xl bg-zinc-900 p-2 hover:bg-zinc-800"
            >
              <div className="aspect-square bg-zinc-800 rounded mb-2 flex items-center justify-center">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    width={100}
                    height={100}
                  />
                ) : (
                  '📦'
                )}
              </div>

              <p className="text-xs text-white">{product.name}</p>
              <p className="text-sm font-bold text-slate-300">
                {fmt(product.price)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}