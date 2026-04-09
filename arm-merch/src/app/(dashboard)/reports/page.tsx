'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ReportsClient from './reports-client'

export default function ReportsPage() {
  const [orders, setOrders]     = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [sellers, setSellers]   = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const [{ data: o }, { data: p }, { data: s }] = await Promise.all([
        supabase.from('orders').select(`id, order_number, total, status, payment_method, created_at, seller_id, seller:profiles(full_name), order_items(quantity, unit_price, product:products(name))`).eq('status', 'completada').order('created_at', { ascending: false }),
        supabase.from('products_with_stock').select('*').order('name'),
        supabase.from('profiles').select('id, full_name').eq('active', true),
      ])
      setOrders(o ?? [])
      setProducts(p ?? [])
      setSellers(s ?? [])
    }
    load()
  }, [])

  return <ReportsClient orders={orders} products={products} sellers={sellers} />
}
