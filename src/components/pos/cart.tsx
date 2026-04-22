'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/hooks/use-cart'
import FeedbackModal from '@/components/ui/feedback-modal'
import {
  ShoppingCart,
  Trash2,
  User,
  Mail,
  Wallet,
  CreditCard,
  Landmark,
  Banknote,
  Keyboard,
} from 'lucide-react'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(n)

export default function Cart() {
  const supabase = createClient()

  const {
    items,
    subtotal,
    total,
    paymentMethod,
    setPaymentMethod,
    updateQuantity,
    removeItem,
    clearCart,
    itemCount,
  } = useCart()

  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'success' | 'error' | 'loading'>('loading')
  const [modalTitle, setModalTitle] = useState('')
  const [modalDesc, setModalDesc] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = useMemo(() => {
    return items.length > 0 && clientName.trim().length > 0 && !submitting
  }, [items.length, clientName, submitting])

  async function handleConfirmSale() {
    if (!canSubmit) return
    setModalType('success')
    setModalTitle('Venta simulada')
    setModalDesc('Todo funcionando OK')
    setModalOpen(true)
  }

  return (
    <aside className="flex h-full flex-col bg-zinc-950">

      {/* HEADER */}
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200/10">
            <ShoppingCart size={18} className="text-slate-300" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Carrito</h2>
            <p className="text-xs text-zinc-500">
              {itemCount()} productos
            </p>
          </div>
        </div>
      </div>

      {/* TOTAL */}
      <div className="px-4 py-4 border-b border-zinc-800">
        <div className="rounded-xl bg-zinc-900 p-4 space-y-2">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>TOTAL ACTUAL</span>
            <span className="flex items-center gap-1">
              <Keyboard size={12} /> Enter
            </span>
          </div>

          <div className="flex justify-between items-end">
            <span className="text-3xl font-black text-white">
              {fmt(total())}
            </span>
            <span className="text-xs text-zinc-500">
              {itemCount()} ítems
            </span>
          </div>
        </div>
      </div>

      {/* ITEMS */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-center text-zinc-500 text-sm">
            Carrito vacío
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.product.id}
              className="rounded-xl bg-zinc-900 p-3 space-y-2"
            >
              <div className="flex justify-between">
                <p className="text-sm text-white font-semibold">
                  {item.product.name}
                </p>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-zinc-500 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                </div>

                <span className="font-bold text-white">
                  {fmt(item.product.price * item.quantity)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FORM + PAGO */}
      <div className="border-t border-zinc-800 px-4 py-4 space-y-4">

        {/* CLIENTE */}
        <div className="space-y-3">
          <input
            placeholder="Nombre cliente"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white"
          />

          <input
            placeholder="Email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white"
          />
        </div>

        {/* PAGO */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'efectivo', label: 'Efectivo' },
            { key: 'transferencia', label: 'Transfer.' },
            { key: 'debito', label: 'Débito' },
            { key: 'credito', label: 'Crédito' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPaymentMethod(p.key)}
              className={`p-2 rounded text-sm ${
                paymentMethod === p.key
                  ? 'bg-slate-200 text-black'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* RESUMEN */}
        <div className="bg-zinc-900 p-3 rounded-xl space-y-1">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Subtotal</span>
            <span>{fmt(subtotal())}</span>
          </div>

          <div className="flex justify-between text-white font-bold">
            <span>Total</span>
            <span>{fmt(total())}</span>
          </div>
        </div>

        {/* BOTÓN */}
        <button
          onClick={handleConfirmSale}
          disabled={!canSubmit}
          className="w-full bg-slate-200 text-black py-3 rounded-xl font-bold"
        >
          Confirmar venta
        </button>
      </div>

      <FeedbackModal
        open={modalOpen}
        type={modalType}
        title={modalTitle}
        description={modalDesc}
        onClose={() => setModalOpen(false)}
      />
    </aside>
  )
}