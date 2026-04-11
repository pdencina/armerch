'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProductForm from '@/components/products/product-form'

export default function EditProductPage() {
  const { id } = useParams()
  const [product, setProduct]       = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [error, setError]           = useState('')

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('products').select(`
        id, name, description, price, sku, active, image_url, category_id,
        inventory(stock, low_stock_alert, campus_id)
      `).eq('id', id as string).single(),
      supabase.from('categories').select('id, name').eq('active', true).order('name'),
    ]).then(([{ data: p, error: pErr }, { data: c }]) => {
      if (pErr) { setError(pErr.message); return }
      const withStock = p ? {
        ...p,
        stock: (p as any).inventory?.[0]?.stock ?? 0,
        low_stock_alert: (p as any).inventory?.[0]?.low_stock_alert ?? 5,
      } : null
      setProduct(withStock)
      setCategories(c ?? [])
    })
  }, [id])

  if (error) return (
    <div className="bg-red-950/40 border border-red-900 rounded-xl p-4 text-red-400 text-sm">{error}</div>
  )

  if (!product) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-xl flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-white">Editar producto</h1>
        <p className="text-xs text-zinc-500 mt-0.5">{product.name}</p>
      </div>
      <ProductForm categories={categories} product={product} />
    </div>
  )
}
