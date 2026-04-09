'use client'

import { useState, useRef } from 'react'
import { CheckCircle, X, Loader2, User, Printer } from 'lucide-react'
import { useCart } from '@/lib/hooks/use-cart'
import { createClient } from '@/lib/supabase/client'

interface Props {
  clientName: string
  onClose: () => void
  onSuccess: () => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(n)

const fmtDate = (d: Date) =>
  d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
  ' ' + d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })

type Step = 'confirm' | 'loading' | 'success'

interface OrderSnapshot {
  total: number
  subtotal: number
  discount: number
  method: string
  orderNumber: number
  date: Date
  items: { name: string; quantity: number; price: number }[]
}

export default function CheckoutModal({ clientName, onClose, onSuccess }: Props) {
  const { items, paymentMethod, subtotal, total, discount, clearCart } = useCart()
  const [step, setStep]           = useState<Step>('confirm')
  const [error, setError]         = useState('')
  const [snapshot, setSnapshot]   = useState<OrderSnapshot | null>(null)
  const voucherRef                = useRef<HTMLDivElement>(null)

  async function handleConfirm() {
    const snap: Omit<OrderSnapshot, 'orderNumber'> = {
      total:    total(),
      subtotal: subtotal(),
      discount: discount,
      method:   paymentMethod,
      date:     new Date(),
      items:    items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price })),
    }

    setStep('loading')
    setError('')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setError('Sesión expirada. Recarga la página.'); setStep('confirm'); return }

    const { data: order, error: orderError } = await supabase.from('orders').insert({
      seller_id:      session.user.id,
      payment_method: snap.method,
      subtotal:       snap.subtotal,
      discount:       snap.discount,
      total:          snap.total,
      notes:          `Cliente: ${clientName}`,
      status:         'pendiente',
    }).select().single()

    if (orderError) { setError('Error: ' + orderError.message); setStep('confirm'); return }

    const { error: itemsError } = await supabase.from('order_items').insert(
      items.map(i => ({ order_id: order.id, product_id: i.product.id, quantity: i.quantity, unit_price: i.product.price }))
    )
    if (itemsError) { setError('Error items: ' + itemsError.message); setStep('confirm'); return }

    const { error: completeError } = await supabase.from('orders').update({ status: 'completada' }).eq('id', order.id)
    if (completeError) { setError('Error al completar: ' + completeError.message); setStep('confirm'); return }

    setSnapshot({ ...snap, orderNumber: order.order_number })
    clearCart()
    setStep('success')
  }

  function handlePrint() {
    if (!snapshot) return
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Voucher ARM Merch #${snapshot.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            padding: 4mm;
            color: #000;
            background: #fff;
          }
          .center  { text-align: center; }
          .right   { text-align: right; }
          .bold    { font-weight: bold; }
          .lg      { font-size: 16px; }
          .xl      { font-size: 20px; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .row     { display: flex; justify-content: space-between; margin: 2px 0; }
          .muted   { color: #555; font-size: 11px; }
          .total   { font-size: 16px; font-weight: bold; }
          .footer  { font-size: 10px; color: #555; text-align: center; margin-top: 8px; }
          @media print {
            body { width: 80mm; }
            @page { margin: 0; size: 80mm auto; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="bold xl">ARM MERCH</div>
          <div class="muted">ARM Global</div>
          <div class="muted">armerch-poud.vercel.app</div>
        </div>

        <div class="divider"></div>

        <div class="row"><span class="muted">Orden</span><span class="bold">#${snapshot.orderNumber}</span></div>
        <div class="row"><span class="muted">Fecha</span><span>${fmtDate(snapshot.date)}</span></div>
        <div class="row"><span class="muted">Cliente</span><span class="bold">${clientName}</span></div>
        <div class="row"><span class="muted">Pago</span><span style="text-transform:capitalize">${snapshot.method}</span></div>

        <div class="divider"></div>

        <div class="bold" style="margin-bottom:4px">DETALLE DE COMPRA</div>
        ${snapshot.items.map(item => `
          <div style="margin-bottom:3px">
            <div class="bold">${item.name}</div>
            <div class="row muted">
              <span>${item.quantity} ud${item.quantity > 1 ? 's' : ''} × ${fmt(item.price)}</span>
              <span class="bold" style="color:#000">${fmt(item.price * item.quantity)}</span>
            </div>
          </div>
        `).join('')}

        <div class="divider"></div>

        ${snapshot.subtotal !== snapshot.total ? `
          <div class="row muted"><span>Subtotal</span><span>${fmt(snapshot.subtotal)}</span></div>
          <div class="row muted"><span>Descuento</span><span>−${fmt(snapshot.discount)}</span></div>
        ` : ''}

        <div class="row">
          <span class="total">TOTAL</span>
          <span class="total">${fmt(snapshot.total)}</span>
        </div>

        <div class="divider"></div>

        <div class="footer">
          <div>¡Gracias por tu compra!</div>
          <div>Que Dios bendiga tu vida</div>
          <div style="margin-top:4px">— ARM Global —</div>
        </div>
      </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 }}
      onClick={e => { if (e.target === e.currentTarget && step !== 'loading') onClose() }}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-white">
            {step === 'success' ? 'Venta completada' : 'Confirmar venta'}
          </h2>
          {step !== 'loading' && (
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition"><X size={16} /></button>
          )}
        </div>

        {/* CONFIRM */}
        {step === 'confirm' && (
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-zinc-800/60 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <User size={14} className="text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Cliente</p>
                <p className="text-sm font-semibold text-white">{clientName}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 max-h-44 overflow-y-auto">
              {items.map(item => (
                <div key={item.product.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{item.product.name}<span className="text-zinc-600 ml-1">×{item.quantity}</span></span>
                  <span className="text-zinc-300 font-medium">{fmt(item.product.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-zinc-800 pt-3 flex flex-col gap-1.5">
              <div className="flex justify-between text-xs text-zinc-500"><span>Subtotal</span><span>{fmt(subtotal())}</span></div>
              {discount > 0 && <div className="flex justify-between text-xs text-green-400"><span>Descuento</span><span>−{fmt(discount)}</span></div>}
              <div className="flex justify-between text-base font-bold text-white mt-1"><span>Total</span><span>{fmt(total())}</span></div>
            </div>

            <div className="bg-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-zinc-500">Método de pago</span>
              <span className="text-xs font-semibold text-amber-400 capitalize">{paymentMethod}</span>
            </div>

            {error && <p className="text-red-400 text-xs bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl py-2.5 text-sm transition">Cancelar</button>
              <button onClick={handleConfirm} className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl py-2.5 text-sm transition active:scale-[0.98]">
                Cobrar {fmt(total())}
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {step === 'loading' && (
          <div className="p-10 flex flex-col items-center gap-4">
            <Loader2 size={32} className="text-amber-500 animate-spin" />
            <p className="text-sm text-zinc-400">Procesando venta...</p>
          </div>
        )}

        {/* SUCCESS */}
        {step === 'success' && snapshot && (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <div>
              <p className="text-white font-semibold text-base">¡Venta registrada!</p>
              <p className="text-zinc-400 text-xs mt-1">Cliente: {clientName}</p>
              <p className="text-zinc-600 text-xs">Orden #{snapshot.orderNumber}</p>
            </div>

            {/* Resumen items */}
            <div className="bg-zinc-800 rounded-xl px-4 py-3 w-full text-left flex flex-col gap-1.5">
              {snapshot.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-zinc-400">{item.name} ×{item.quantity}</span>
                  <span className="text-zinc-300">{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t border-zinc-700 mt-1 pt-2 flex justify-between">
                <span className="text-xs text-zinc-500 capitalize">{snapshot.method}</span>
                <span className="text-sm font-bold text-amber-400">{fmt(snapshot.total)}</span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-2 w-full">
              <button onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700
                           border border-zinc-600 text-zinc-200 font-medium rounded-xl py-2.5 text-sm transition">
                <Printer size={14} />
                Imprimir voucher
              </button>
              <button onClick={onSuccess}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl py-2.5 text-sm transition active:scale-[0.98]">
                Nueva venta
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
