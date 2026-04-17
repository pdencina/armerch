'use client'

export default function SaleSuccessModal({
  open,
  orderId,
  orderNumber,
  total,
  clientName,
  clientEmail,
  emailSent,
  onNewSale,
}: any) {
  if (!open) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80">
      <div className="bg-zinc-900 p-6 rounded-xl text-white w-[400px]">
        <h2 className="text-xl font-bold mb-4">
          Venta realizada ✔
        </h2>

        <p>Orden: #{orderNumber}</p>
        <p>Total: ${total}</p>

        {clientEmail && (
          <div className="mt-3">
            <p>{clientEmail}</p>

            {emailSent ? (
              <p className="text-green-400">
                ✔ Voucher enviado
              </p>
            ) : (
              <p className="text-yellow-400">
                ⚠ No se pudo enviar correo
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <a
            href={`/orders/${orderId}/print`}
            target="_blank"
            className="bg-amber-500 text-black px-4 py-2 rounded"
          >
            Imprimir
          </a>

          <button
            onClick={onNewSale}
            className="bg-zinc-700 px-4 py-2 rounded"
          >
            Nueva venta
          </button>
        </div>
      </div>
    </div>
  )
}