import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AssignCampusForm from '@/components/products/assign-campus-form'

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      price,
      sku,
      active,
      image_url,
      category_id,
      category:categories(id, name),
      inventory(
        id,
        stock,
        low_stock_alert,
        campus_id,
        campus:campus(id, name)
      )
    `)
    .eq('id', params.id)
    .single()

  if (productError || !product) {
    notFound()
  }

  const { data: campuses } = await supabase
    .from('campus')
    .select('id, name')
    .eq('active', true)
    .order('name')

  const inventoryRows = Array.isArray((product as any).inventory)
    ? (product as any).inventory
    : []

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white">{(product as any).name}</h1>
            <p className="text-sm text-zinc-400">
              {(product as any).description || 'Sin descripción'}
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                SKU: {(product as any).sku || '—'}
              </span>
              <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                Precio: $
                {new Intl.NumberFormat('es-CL', {
                  maximumFractionDigits: 0,
                }).format(Number((product as any).price ?? 0))}
              </span>
              <span className="rounded-lg bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                Categoría:{' '}
                {Array.isArray((product as any).category)
                  ? (product as any).category[0]?.name ?? '—'
                  : (product as any).category?.name ?? '—'}
              </span>
              <span
                className={`rounded-lg px-3 py-1 text-xs ${
                  (product as any).active
                    ? 'bg-green-500/10 text-green-300'
                    : 'bg-red-500/10 text-red-300'
                }`}
              >
                {(product as any).active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          {(product as any).image_url ? (
            <img
              src={(product as any).image_url}
              alt={(product as any).name}
              className="h-24 w-24 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-zinc-800 text-xs text-zinc-500">
              Sin imagen
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-white">
            Inventario actual por campus
          </h2>

          {inventoryRows.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Este producto aún no está asignado a ningún campus.
            </p>
          ) : (
            <div className="space-y-3">
              {inventoryRows.map((row: any) => {
                const campusRaw = row.campus
                const campusName = Array.isArray(campusRaw)
                  ? campusRaw[0]?.name
                  : campusRaw?.name

                return (
                  <div
                    key={row.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {campusName || 'Campus sin nombre'}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Alerta stock bajo: {row.low_stock_alert ?? 5}
                      </p>
                    </div>

                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                        Number(row.stock ?? 0) === 0
                          ? 'bg-red-500/10 text-red-300'
                          : Number(row.stock ?? 0) <= Number(row.low_stock_alert ?? 5)
                            ? 'bg-orange-500/10 text-orange-300'
                            : 'bg-green-500/10 text-green-300'
                      }`}
                    >
                      Stock: {row.stock ?? 0}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <AssignCampusForm
          productId={(product as any).id}
          productName={(product as any).name}
          campuses={campuses ?? []}
        />
      </div>
    </div>
  )
}