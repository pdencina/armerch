'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProductForm from '@/components/products/product-form'

export default function EditProductPage() {
  const { id } = useParams()
  const [product, setProduct]       = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('products_with_stock').select('*').eq('id', id as string).single(),
      supabase.from('categories').select('id, name').eq('active', true).order('name'),
    ]).then(([{ data: p }, { data: c }]) => {
      setProduct(p)
      setCategories(c ?? [])
    })
  }, [id])

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
