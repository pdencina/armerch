'use client'

import { useState } from 'react'
import { login } from '@/lib/actions/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(email, password)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 mb-4">
            <span className="text-2xl font-black text-zinc-950">A</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ARM Merch</h1>
          <p className="text-zinc-400 text-sm mt-1">Sistema de Merchandising · Iglesia ARM</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-widest">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="tu@iglesia.cl"
              className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600
                         rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500
                         focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-widest">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600
                         rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500
                         focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed
                       text-zinc-950 font-bold rounded-xl px-4 py-3 text-sm transition-all
                       active:scale-[0.98]"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-zinc-600 text-xs mt-8">
          ¿Sin acceso? Contacta al administrador de tu iglesia.
        </p>
      </div>
    </main>
  )
}
