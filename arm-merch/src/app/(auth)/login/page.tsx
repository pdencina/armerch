'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import './login.css'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      setError('No se pudo iniciar sesión')
      setLoading(false)
      return
    }

    // 🔥 CLAVE: refrescar router (SSR sync)
    router.refresh()

    // 🔥 CLAVE: navegación Next (no window.location)
    router.replace('/dashboard')
  }

  return (
    <div className="lr">
      <div className="lr-grid" />

      <div className="lc">
        <h1 className="lh1">ARM Merch</h1>

        <form onSubmit={handleSubmit} className="lform">
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="lfx"
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="lfx"
          />

          {error && <div className="ler">{error}</div>}

          <button type="submit" disabled={loading} className="lbtn">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}