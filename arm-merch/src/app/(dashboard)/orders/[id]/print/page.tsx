import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-CL')
}

function buildQrUrl(orderNumber: string | number) {
  const text = encodeURIComponent(`ORDEN:${orderNumber}`)
  return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${text}`
}

export default async function PrintOrderPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, campus_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      campus_id,
      payment_method,
      total,
      discount,
      created_at,
      status,
      notes
    `)
    .eq('id', params.id)
    .single()

  if (!order) notFound()

  if (profile.role !== 'super_admin' && profile.campus_id !== order.campus_id) {
    notFound()
  }

  const [{ data: items }, { data: campuses }] = await Promise.all([
    supabase
      .from('order_items')
      .select(`
        id,
        quantity,
        unit_price,
        products (
          name,
          sku
        )
      `)
      .eq('order_id', order.id),
    supabase.from('campus').select('id, name'),
  ])

  const campusMap = new Map((campuses ?? []).map((c: any) => [c.id, c.name]))
  const campusName = order.campus_id ? campusMap.get(order.campus_id) ?? 'Sin campus' : 'Sin campus'

  const safeItems = (items ?? []).map((item: any) => {
    const product = Array.isArray(item.products) ? item.products[0] : item.products
    return {
      id: item.id,
      quantity: Number(item.quantity ?? 0),
      unit_price: Number(item.unit_price ?? 0),
      name: product?.name ?? 'Producto',
      sku: product?.sku ?? '—',
      lineTotal: Number(item.quantity ?? 0) * Number(item.unit_price ?? 0),
    }
  })

  const subtotal = safeItems.reduce((sum: number, item: any) => sum + item.lineTotal, 0)
  const discount = Number(order.discount ?? 0)
  const total = Number(order.total ?? 0)

  const qrUrl = buildQrUrl(order.order_number)

  return (
    <html lang="es">
      <head>
        <title>Ticket #{order.order_number}</title>
        <style>{`
          @media print {
            @page {
              size: auto;
              margin: 8mm;
            }
          }
          body {
            margin: 0;
            background: #ffffff;
            color: #000000;
            font-family: Arial, Helvetica, sans-serif;
          }
        `}</style>
      </head>

      <body>
        <div className="min-h-screen bg-white px-4 py-6 print:px-0 print:py-2">
          <div className="mx-auto w-full max-w-[380px] text-black">
            <div className="rounded-none border border-black/10 bg-white p-5 print:border-none print:p-0">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-black bg-black text-lg font-black text-white">
                  A
                </div>
                <h1 className="text-xl font-bold tracking-wide">ARM MERCH</h1>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-black/60">
                  Comprobante de venta
                </p>
              </div>

              <div className="my-4 border-t border-dashed border-black/30" />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-black/60">Orden</span>
                  <span className="font-semibold">#{order.order_number}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-black/60">Fecha</span>
                  <span className="text-right">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-black/60">Campus</span>
                  <span className="text-right">{campusName}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-black/60">Pago</span>
                  <span className="capitalize">{order.payment_method ?? 'Sin definir'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-black/60">Estado</span>
                  <span>{order.status ?? '—'}</span>
                </div>
              </div>

              <div className="my-4 border-t border-dashed border-black/30" />

              <div className="space-y-3">
                {safeItems.map((item) => (
                  <div key={item.id} className="text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight">{item.name}</p>
                        <p className="mt-0.5 text-xs text-black/55">SKU: {item.sku}</p>
                        <p className="mt-0.5 text-xs text-black/70">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right font-semibold">
                        {formatCurrency(item.lineTotal)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="my-4 border-t border-dashed border-black/30" />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-black/60">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-black/60">Descuento</span>
                  <span>{formatCurrency(discount)}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3 text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {order.notes && (
                <>
                  <div className="my-4 border-t border-dashed border-black/30" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-black/60">
                      Nota
                    </p>
                    <p className="mt-1 text-sm">{order.notes}</p>
                  </div>
                </>
              )}

              <div className="my-4 border-t border-dashed border-black/30" />

              <div className="flex flex-col items-center">
                <img
                  src={qrUrl}
                  alt={`QR orden ${order.order_number}`}
                  className="h-28 w-28"
                />
                <p className="mt-2 text-[11px] text-black/60">
                  Escanea para referencia interna
                </p>
              </div>

              <div className="mt-5 text-center">
                <p className="text-xs text-black/70">Gracias por tu compra</p>
                <p className="mt-1 text-[11px] text-black/50">
                  ARM Merch · {campusName}
                </p>
              </div>

              <div className="mt-6 text-center print:hidden">
                <button
                  onClick={() => window.print()}
                  className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/80"
                >
                  Imprimir ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}