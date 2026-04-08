import { createClient } from '@/lib/supabase/server'
import InventoryClient from './inventory-client'

export default async function InventoryPage() {
  const supabase = await createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products_with_stock')
      .select('*')
      .order('name'),
    supabase
      .from('categories')
      .select('id, name')
      .eq('active', true)
      .order('name'),
  ])

  return (
    <InventoryClient
      initialProducts={products ?? []}
      categories={categories ?? []}
    />
  )
}
