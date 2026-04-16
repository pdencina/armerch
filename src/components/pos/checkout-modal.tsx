'use client'

import { useState } from 'react'
import { X, Loader2, Receipt, Mail, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/hooks/use-cart'
import { toast } from 'sonner'
import ConfirmActionModal from '@/components/ui/confirm-action-modal'

interface Props {
  clientName: string
  clientEmail?: string
  onClose: () => void
  onNewSale: () => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)

export default function CheckoutModal({
  clientName,
  clientEmail,
  onClose,
  onNewSale,
}: Props) {
  const supabase = createClient()

  const {
    items,
    paymentMethod,
    clearCart,
    subtotal,
    total,
    discount,
  } = useCart()

  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const canConfirm =
    items.length > 0 &&
    clientName.trim().length > 0 &&
    paymentMethod

  async function handleConfirmSale() {
    setConfirmOpen(false)
    setLoading(true)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        toast.error('No autenticado')
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('campus_id')
        .eq('id', session.user.id)
        .single()

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          campus_id: profile?.campus_id ?? null,
          client_name: clientName.trim(),
          client_email: clientEmail?.trim() || null,
          payment_method: paymentMethod,
          discount: Number(discount ?? 0),
          notes: null,
          items: items.map((item: any) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.product.price,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo registrar la venta')
        setLoading(false)
        return
      }

      toast.success(`Venta registrada correctamente (${data.order_number})`)
      clearCart()
      onNewSale()
      setLoading(false)

      setTimeout(() => {
        window.location.reload()
      }, 700)
    } catch (error: any) {
      toast.error(error?.message ?? 'Error inesperado al registrar la venta')
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
            <div className="flex items-center gap-2">
              <Receipt size={16} className="text-amber-400" />
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Confirmar venta
                </h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Revisa el resumen antes de finalizar
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 transition hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-zinc-400">
                <User size={14} />
                <span className="text-xs uppercase tracking-wide">
                  Cliente
                </span>
              </div>

              <p className="text-sm font-medium text-white">{clientName}</p>

              {clientEmail ? (
                <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
                  <Mail size={13} />
                  <span>{clientEmail}</span>
                </div>
              ) : (
                <p className="mt-2 text-sm text-zinc-600">
                  Sin correo registrado
                </p>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="mb-3 text-xs uppercase tracking-wide text-zinc-400">
                Resumen de productos
              </p>

              <div className="space-y-2">
                {items.map((item: any) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-white">{item.product.name}</p>
                      <p className="text-xs text-zinc-500">
                        {item.quantity} × {fmt(item.product.price)}
                      </p>
                    </div>
                    <div className="shrink-0 font-medium text-amber-400">
                      {fmt(item.quantity * item.product.price)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-1 border-t border-zinc-800 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Subtotal</span>
                  <span className="text-zinc-300">{fmt(subtotal())}</span>
                </div>

                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-400">Descuento</span>
                    <span className="text-green-400">−{fmt(discount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-medium text-white">Total</span>
                  <span className="text-xl font-bold text-white">
                    {fmt(total())}
                  </span>
                </div>

                <div className="pt-2 text-xs text-zinc-500">
                  Método de pago:{' '}
                  <span className="capitalize text-zinc-300">
                    {paymentMethod || 'No definido'}
                  </span>
                </div>
              </div>
            </div>

            {!canConfirm && (
              <p className="text-center text-xs text-amber-500/90">
                Debes completar cliente, productos y método de pago.
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-60"
              >
                Volver
              </button>

              <button
                type="button"
                disabled={!canConfirm || loading}
                onClick={() => setConfirmOpen(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-40"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Procesando...' : 'Finalizar venta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={confirmOpen}
        title="¿Confirmar esta venta?"
        description="Se creará la orden, se descontará el stock del campus y se registrará el movimiento de salida."
        confirmText="Sí, confirmar venta"
        cancelText="Revisar otra vez"
        loading={loading}
        tone="warning"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSale}
      />
    </>
  )
}