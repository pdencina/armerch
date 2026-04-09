'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import InventoryClient from './inventory-client'

export default function InventoryPage() {
  const [products, setProducts]     = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loaded, setLoaded]         = useState(false)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const [{ data: p }, { data: c }] = await Promise.all([
        supabase.from('products_with_stock').select('*').order('name'),
        supabase.from('categories').select('id, name').eq('active', true).order('name'),
      ])
      setProducts(p ?? [])
      setCategories(c ?? [])
      setLoaded(true)
    }
    load()
  }, [])

  if (!loaded) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return <InventoryClient initialProducts={products} categories={categories} />
}
