'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export default function ResendVoucherButton({
  orderId,
}: {
  orderId: string
}) {
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
        toast.error(data.error ?? 'No se pudo reenviar el voucher')
        setLoading(false)
        return
      }

      toast.success('Voucher reenviado correctamente')
      setLoading(false)
    } catch (error: any) {
      toast.error(error?.message ?? 'Error inesperado al reenviar voucher')
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
    >
      {loading ? 'Reenviando...' : 'Reenviar voucher'}
    </button>
  )
}