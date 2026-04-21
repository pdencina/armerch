'use client'

import { useState } from 'react'
import { useCart } from '@/lib/hooks/use-cart'
import FeedbackModal from '@/components/ui/feedback-modal'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(n)

export default function Cart() {
  const {
    items,
    subtotal,
    total,
    paymentMethod,
    setPaymentMethod,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart()

  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<'success' | 'error' | 'loading'>('loading')
  const [modalTitle, setModalTitle] = useState('')
  const [modalDesc, setModalDesc] = useState('')

  const handleConfirmSale = async () => {
    if (items.length === 0) return

    try {
      setModalType('loading')
      setModalTitle('Procesando venta...')
      setModalDesc('Esperando confirmación del POS...')
      setModalOpen(true)

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          client_name: clientName,
          client_email: clientEmail,
          payment_method: paymentMethod,
        }),
      })

      if (!res.ok) throw new Error()

      setModalType('success')
      setModalTitle('Venta completada')
      setModalDesc('Voucher enviado correctamente')

      clearCart()
      setClientName('')
      setClientEmail('')
    } catch {
      setModalType('error')
      setModalTitle('Error en la venta')
      setModalDesc('Intenta nuevamente')
    }
  }

  return (
    <div className="w-[360px] bg-zinc-950 border-l border-zinc-800 flex flex-col">

      {/* HEADER */}
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-white font-semibold text-lg">Carrito</h2>
        <p className="text-xs text-zinc-500">{items.length} productos</p>
      </div>

      {/* ITEMS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 && (
          <p className="text-zinc-600 text-sm text-center mt-10">
            No hay productos en el carrito
          </p>
        )}

        {items.map((item) => (
          <div
            key={item.product.id}
            className="bg-zinc-900 rounded-xl p-3 border border-zinc-800"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-white text-sm">{item.product.name}</p>
                <p className="text-amber-400 text-xs">
                  {fmt(item.product.price)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity - 1)
                  }
                  className="px-2 bg-zinc-800 rounded"
                >
                  -
                </button>

                <span className="text-white text-sm">
                  {item.quantity}
                </span>

                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity + 1)
                  }
                  className="px-2 bg-zinc-800 rounded"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t border-zinc-800 space-y-3">

        {/* CLIENTE */}
        <input
          placeholder="Nombre cliente"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full bg-zinc-800 p-2 rounded text-white"
        />

        <input
          placeholder="Email"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
          className="w-full bg-zinc-800 p-2 rounded text-white"
        />

        {/* PAGOS 🔥 */}
        <div className="flex gap-2">
          {['efectivo', 'transferencia', 'debito', 'credito'].map((m) => (
            <button
              key={m}
              onClick={() => setPaymentMethod(m)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium border transition
                ${
                  paymentMethod === m
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-white'
                }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* TOTAL */}
        <div className="flex justify-between text-white font-semibold text-lg">
          <span>Total</span>
          <span>{fmt(total())}</span>
        </div>

        {/* BOTÓN */}
        <button
          onClick={handleConfirmSale}
          className="w-full bg-amber-500 py-3 rounded-xl text-black font-bold hover:bg-amber-400 active:scale-95 transition"
        >
          Confirmar venta
        </button>
      </div>

      {/* MODAL */}
      <FeedbackModal
        open={modalOpen}
        type={modalType}
        title={modalTitle}
        description={modalDesc}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}