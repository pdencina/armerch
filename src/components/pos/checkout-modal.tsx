'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/hooks/use-cart'
import SaleSuccessModal from './sale-success-modal'

export default function CheckoutModal({
  clientName,
  clientEmail,
  onClose,
  onNewSale,
}: any) {
  const supabase = createClient()
  const { items, total, clearCart } = useCart()

  const [successOpen, setSuccessOpen] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [orderTotal, setOrderTotal] = useState(0)
  const [emailSent, setEmailSent] = useState<boolean | null>(null)

  async function handleSale() {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        client_name: clientName,
        client_email: clientEmail,
        items: items.map((i: any) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.product.price,
        })),
      }),
    })

    const data = await res.json()

    setOrderId(data.order_id)
    setOrderTotal(total())
    setEmailSent(data.email_sent)

    clearCart()
    onClose()
    setSuccessOpen(true)
  }

  return (
    <>
      <button onClick={handleSale}>Finalizar venta</button>

      <SaleSuccessModal
        open={successOpen}
        orderId={orderId}
        orderNumber={orderId}
        total={orderTotal}
        clientName={clientName}
        clientEmail={clientEmail}
        emailSent={emailSent}
        onNewSale={onNewSale}
      />
    </>
  )
}