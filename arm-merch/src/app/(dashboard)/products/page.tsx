'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ProductsTable from '@/components/products/products-table'

export default function ProductsPage() {
  const [products, setProducts]     = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('products_with_stock').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name').eq('active', true).order('name'),
      ])
      setProducts(p ?? [])
      setCategories(c ?? [])
    }
    load()
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Productos</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{products.length} productos registrados</p>
        </div>
        <Link href="/products/new"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950
                     font-bold rounded-xl px-4 py-2.5 text-sm transition active:scale-[0.98]">
          <Plus size={14} />Nuevo producto
        </Link>
      </div>
      <ProductsTable products={products} categories={categories} />
    </div>
  )
}
