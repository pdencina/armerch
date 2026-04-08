'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { upsertProduct } from '@/lib/actions/products'

interface Props {
  categories: { id: string; name: string }[]
  product?: any
}

export default function ProductForm({ categories, product }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const isEdit = !!product

  const [form, setForm] = useState({
    name:        product?.name ?? '',
    description: product?.description ?? '',
    price:       product?.price?.toString() ?? '',
    sku:         product?.sku ?? '',
    category_id: product?.category_id ?? '',
    stock:       product?.stock?.toString() ?? '0',
    low_stock_alert: product?.low_stock_alert?.toString() ?? '5',
  })
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [imagePreview, setPreview]  = useState<string>(product?.image_url ?? '')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (imageFile) fd.append('image', imageFile)
    if (isEdit) fd.append('id', product.id)

    const result = await upsertProduct(fd)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/products')
    router.refresh()
  }

  const Field = ({ label, name, type = 'text', placeholder = '', required = false, min = '' }: any) => (
    <div>
      <label className="block text-xs text-zinc-500 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input
        type={type} name={name} value={(form as any)[name]}
        onChange={handleChange} placeholder={placeholder}
        required={required} min={min}
        className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600
                   rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition"
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">

      {/* Imagen */}
      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">Imagen del producto</label>
        <div
          onClick={() => fileRef.current?.click()}
          className="relative w-full h-40 bg-zinc-800 border border-zinc-700 border-dashed rounded-xl
                     flex items-center justify-center cursor-pointer hover:border-amber-500/60 transition overflow-hidden"
        >
          {imagePreview ? (
            <>
              <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setPreview(''); setImageFile(null) }}
                className="absolute top-2 right-2 bg-zinc-900/80 text-white rounded-full p-1 hover:bg-red-500/80 transition"
              >
                <X size={12} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-600">
              <Upload size={20} />
              <span className="text-xs">Click para subir imagen</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
      </div>

      <Field label="Nombre" name="name" placeholder="Ej: Polera ARM negra" required />

      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">Descripción</label>
        <textarea
          name="description" value={form.description} onChange={handleChange} rows={2}
          placeholder="Descripción opcional del producto..."
          className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600
                     rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Precio (CLP)" name="price" type="number" placeholder="9990" required min="0" />
        <Field label="SKU" name="sku" placeholder="ARM-001" />
      </div>

      <div>
        <label className="block text-xs text-zinc-500 mb-1.5">Categoría</label>
        <select
          name="category_id" value={form.category_id} onChange={handleChange}
          className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl px-4 py-2.5
                     text-sm focus:outline-none focus:border-amber-500 transition"
        >
          <option value="">Sin categoría</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={isEdit ? 'Stock inicial' : 'Stock inicial'} name="stock" type="number" placeholder="0" min="0" />
        <Field label="Alerta de stock bajo" name="low_stock_alert" type="number" placeholder="5" min="0" />
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button" onClick={() => router.back()}
          className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl py-2.5 text-sm transition"
        >
          Cancelar
        </button>
        <button
          type="submit" disabled={loading}
          className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950
                     font-bold rounded-xl py-2.5 text-sm transition flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}
