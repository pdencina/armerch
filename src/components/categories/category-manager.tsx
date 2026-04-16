'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

type Category = {
  id: string
  name: string
  description: string | null
  active: boolean
  created_at: string
}

export default function CategoryManager() {
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function loadCategories() {
    setLoading(true)

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, active, created_at')
      .order('name')

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setCategories((data ?? []) as Category[])
    setLoading(false)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setSaving(true)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        toast.error('No autenticado')
        setSaving(false)
        return
      }

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo crear la categoría')
        setSaving(false)
        return
      }

      toast.success('Categoría creada correctamente')
      setName('')
      setDescription('')
      await loadCategories()
    } catch {
      toast.error('Error inesperado al crear la categoría')
    }

    setSaving(false)
  }

  async function handleToggleCategory(category: Category) {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        toast.error('No autenticado')
        return
      }

      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id: category.id,
          active: !category.active,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'No se pudo actualizar la categoría')
        return
      }

      toast.success(category.active ? 'Categoría desactivada' : 'Categoría activada')
      await loadCategories()
    } catch {
      toast.error('Error inesperado al actualizar la categoría')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Categorías</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Administración de categorías de productos
          </p>
        </div>

        <button
          type="button"
          onClick={loadCategories}
          className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white transition hover:bg-zinc-700"
        >
          <RefreshCw size={14} />
          Recargar
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Nueva categoría</h2>

        <form onSubmit={handleCreateCategory} className="grid gap-4 md:grid-cols-2">
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />

          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-black placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
            >
              <Plus size={14} />
              {saving ? 'Guardando...' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/50 p-5">
        <h2 className="mb-4 text-sm font-semibold text-white">Listado</h2>

        {loading ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay categorías registradas.</p>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-white">{category.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {category.description || 'Sin descripción'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                      category.active
                        ? 'bg-green-500/10 text-green-300'
                        : 'bg-red-500/10 text-red-300'
                    }`}
                  >
                    {category.active ? 'Activa' : 'Inactiva'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleCategory(category)}
                    className="rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white transition hover:bg-zinc-700"
                  >
                    {category.active ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}