'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ProductForm from '@/components/products/product-form'

export default function NewProductPage() {
  const [categories, setCategories] = useState<any[]>([])
  useEffect(() => {
    createClient().from('categories').select('id, name').eq('active', true).order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [])
  return (
    <div className="max-w-xl flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-white">Nuevo producto</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Completa los datos para agregar un producto</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  )
}
