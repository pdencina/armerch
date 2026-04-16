'use client'

import { useState } from 'react'
import { Trash2, ShoppingCart, Tag, X } from 'lucide-react'
import { useCart } from '@/lib/hooks/use-cart'
import CheckoutModal from './checkout-modal'
import { toast } from 'sonner'

const PAYMENT_METHODS = [
  { value: 'efectivo',      label: 'Efectivo'  },
  { value: 'transferencia', label: 'Transfer.' },
  { value: 'debito',        label: 'Débito'    },
  { value: 'credito',       label: 'Crédito'   },
] as const

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

export default function Cart() {
  const { items, updateQuantity, setPaymentMethod, paymentMethod,
          clearCart, subtotal, total, itemCount, discount, setDiscount } = useCart()
  const [showCheckout, setShowCheckout]   = useState(false)
  const [clientName, setClientName]       = useState('')
  const [clientEmail, setClientEmail]     = useState('')
  const [discountInput, setDiscountInput] = useState('')
  const [discountType, setDiscountType]   = useState<'pct' | 'fixed'>('pct')
  const [showDiscount, setShowDiscount]   = useState(false)

  const canCheckout = items.length > 0 && clientName.trim().length > 0

  function applyDiscount() {
    const val = parseFloat(discountInput)
    if (!val || val <= 0) { toast.error('Ingresa un descuento válido'); return }
    const sub = subtotal()
    if (discountType === 'pct') {
      if (val > 100) { toast.error('El porcentaje no puede superar 100%'); return }
      setDiscount(Math.round(sub * val / 100))
      toast.success(`Descuento ${val}% aplicado`)
    } else {
      if (val >= sub) { toast.error('El descuento no puede ser mayor al total'); return }
      setDiscount(val)
      toast.success(`Descuento ${fmt(val)} aplicado`)
    }
    setShowDiscount(false)
    setDiscountInput('')
  }

  function removeDiscount() {
    setDiscount(0)
    toast.success('Descuento eliminado')
  }

  return (
    <>
      <div className="w-72 xl:w-80 flex flex-col bg-zinc-900 border-l border-zinc-800 shrink-0">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} className="text-zinc-400" />
            <span className="text-sm font-semibold text-white">Carrito</span>
          </div>
          <div className="flex items-center gap-2">
            {itemCount() > 0 && (
              <span className="bg-amber-500 text-zinc-950 text-[10px] font-bold px-2 py-0.5 rounded-full">{itemCount()}</span>
            )}
            {itemCount() > 0 && (
              <button onClick={() => { clearCart(); setDiscount(0) }} className="text-zinc-600 hover:text-red-400 transition">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 gap-3 py-10">
              <ShoppingCart size={32} />
              <p className="text-xs text-center leading-relaxed">Selecciona productos<br />del catálogo</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.product.id} className="flex items-center gap-2 bg-zinc-800/60 rounded-xl p-2.5 border border-zinc-700/50">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-zinc-200 truncate">{item.product.name}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">{fmt(item.product.price)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 rounded-md bg-zinc-700 text-zinc-300 hover:bg-zinc-600 text-sm flex items-center justify-center transition">−</button>
                  <span className="text-xs text-white font-medium w-5 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="w-6 h-6 rounded-md bg-zinc-700 text-zinc-300 hover:bg-zinc-600 disabled:opacity-30 text-sm flex items-center justify-center transition">+</button>
                </div>
                <p className="text-xs font-bold text-amber-400 min-w-[52px] text-right">{fmt(item.product.price * item.quantity)}</p>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-4 border-t border-zinc-800 flex flex-col gap-3">
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
              Nombre del cliente <span className="text-red-400">*</span>
            </label>
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600
                         rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition" />
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">
              Email <span className="text-zinc-600">(voucher por correo)</span>
            </label>
            <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
              placeholder="juan@ejemplo.com"
              className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600
                         rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition" />
          </div>

          {/* Descuento */}
          {items.length > 0 && (
            <div>
              {discount > 0 ? (
                <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Tag size={12} className="text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Descuento: −{fmt(discount)}</span>
                  </div>
                  <button onClick={removeDiscount} className="text-zinc-500 hover:text-red-400 transition"><X size={12} /></button>
                </div>
              ) : (
                <>
                  {!showDiscount ? (
                    <button onClick={() => setShowDiscount(true)}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-amber-400 transition">
                      <Tag size={12} /><span>Aplicar descuento</span>
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <select value={discountType} onChange={e => setDiscountType(e.target.value as any)}
                        className="bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl px-2 py-1.5 text-xs focus:outline-none focus:border-amber-500">
                        <option value="pct">%</option>
                        <option value="fixed">$</option>
                      </select>
                      <input type="number" min="1" value={discountInput} onChange={e => setDiscountInput(e.target.value)}
                        placeholder={discountType === 'pct' ? '10' : '5000'}
                        className="flex-1 bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600
                                   rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 transition" />
                      <button onClick={applyDiscount}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl px-3 py-1.5 text-xs transition">
                        OK
                      </button>
                      <button onClick={() => { setShowDiscount(false); setDiscountInput('') }}
                        className="text-zinc-500 hover:text-zinc-300 transition px-1">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-4 gap-1">
            {PAYMENT_METHODS.map(m => (
              <button key={m.value} onClick={() => setPaymentMethod(m.value)}
                className={`py-1.5 rounded-lg text-[10px] font-medium transition ${
                  paymentMethod === m.value
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700 hover:text-zinc-300'
                }`}>
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            {discount > 0 && (
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-zinc-500">Subtotal</span>
                <span className="text-sm text-zinc-400">{fmt(subtotal())}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-green-400">Descuento</span>
                <span className="text-sm text-green-400">−{fmt(discount)}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-zinc-500">Total a cobrar</span>
              <span className="text-xl font-bold text-white">{fmt(total())}</span>
            </div>
          </div>

          {items.length > 0 && !clientName.trim() && (
            <p className="text-[10px] text-amber-500/80 text-center">Ingresa el nombre del cliente para continuar</p>
          )}

          <button onClick={() => setShowCheckout(true)} disabled={!canCheckout}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed
                       text-zinc-950 font-bold rounded-xl py-3 text-sm transition-all active:scale-[0.98]">
            Confirmar venta
          </button>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          clientName={clientName.trim()}
          clientEmail={clientEmail.trim()}
          onClose={() => setShowCheckout(false)}
          onNewSale={() => { setShowCheckout(false); setClientName(''); setClientEmail(''); setDiscount(0) }}
        />
      )}
    </>
  )
}
