'use client'

import { useState } from 'react'
import { CheckCircle, X, Loader2 } from 'lucide-react'
import { useCart } from '@/lib/hooks/use-cart'
import { createOrder } from '@/lib/actions/orders'

interface Props {
  onClose: () => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

type Step = 'confirm' | 'loading' | 'success'

export default function CheckoutModal({ onClose }: Props) {
  const { items, paymentMethod, subtotal, total, discount, clearCart } = useCart()
  const [step, setStep] = useState<Step>('confirm')
  const [orderNumber, setOrderNumber] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setStep('loading')
    setError('')

    const result = await createOrder({
      items: items.map(i => ({
        product_id: i.product.id,
        quantity: i.quantity,
        unit_price: i.product.price,
      })),
      payment_method: paymentMethod,
      discount: discount,
    })

    if (result.error) {
      setError(result.error)
      setStep('confirm')
      return
    }

    setOrderNumber(result.orderNumber ?? null)
    setStep('success')
    clearCart()
  }

  function handleClose() {
    onClose()
  }

  return (
    <div
      style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
               alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">
            {step === 'success' ? 'Venta completada' : 'Confirmar venta'}
          </h2>
          <button onClick={handleClose} className="text-zinc-500 hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        {/* STEP: confirm */}
        {step === 'confirm' && (
          <div className="p-5 flex flex-col gap-4">

            {/* Resumen de items */}
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {items.map(item => (
                <div key={item.product.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">
                    {item.product.name}
                    <span className="text-zinc-600 ml-1">×{item.quantity}</span>
                  </span>
                  <span className="text-zinc-300 font-medium">
                    {fmt(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 pt-3 flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Subtotal</span>
                <span>{fmt(subtotal())}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs text-green-400">
                  <span>Descuento</span>
                  <span>−{fmt(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-white mt-1">
                <span>Total</span>
                <span>{fmt(total())}</span>
              </div>
            </div>

            {/* Método de pago */}
            <div className="bg-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Método de pago</span>
              <span className="text-xs font-semibold text-amber-400 capitalize">{paymentMethod}</span>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 mt-1">
              <button
                onClick={handleClose}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium
                           rounded-xl py-2.5 text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold
                           rounded-xl py-2.5 text-sm transition active:scale-[0.98]"
              >
                Cobrar {fmt(total())}
              </button>
            </div>
          </div>
        )}

        {/* STEP: loading */}
        {step === 'loading' && (
          <div className="p-10 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-amber-500 animate-spin" />
            <p className="text-sm text-zinc-400">Procesando venta...</p>
          </div>
        )}

        {/* STEP: success */}
        {step === 'success' && (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-base">¡Venta registrada!</p>
              {orderNumber && (
                <p className="text-zinc-500 text-xs mt-1">Orden #{orderNumber}</p>
              )}
            </div>
            <div className="bg-zinc-800 rounded-xl px-5 py-3 w-full">
              <p className="text-xs text-zinc-500 mb-1">Total cobrado</p>
              <p className="text-xl font-bold text-amber-400">{fmt(total())}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold
                         rounded-xl py-2.5 text-sm transition active:scale-[0.98]"
            >
              Nueva venta
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
