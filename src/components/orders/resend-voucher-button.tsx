'use client'

import { useState } from 'react'

export default function ResendVoucherButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleResend() {
    try {
      setLoading(true)

      const res = await fetch('/api/orders/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: orderId }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Error reenviando correo')
        setLoading(false)
        return
      }

      alert('Voucher reenviado correctamente')
      setLoading(false)
    } catch (error: any) {
      alert('Error inesperado')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleResend}
      disabled={loading}
      style={{
        background: '#2563eb',
        color: 'white',
        padding: '10px 16px',
        borderRadius: '10px',
        fontWeight: 600,
      }}
    >
      {loading ? 'Reenviando...' : 'Reenviar voucher'}
    </button>
  )
}