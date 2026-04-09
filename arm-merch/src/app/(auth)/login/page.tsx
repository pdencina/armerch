'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import './login.css'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [ok, setOk]             = useState(false)

  // Cuando ok=true, redirigir con múltiples métodos
  useEffect(() => {
    if (!ok) return
    const t1 = setTimeout(() => { window.location.href = '/dashboard' }, 100)
    const t2 = setTimeout(() => { window.location.replace('/dashboard') }, 600)
    const t3 = setTimeout(() => { document.location.href = '/dashboard' }, 1200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [ok])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      setOk(true)
      return
    }

    setError('No se obtuvo sesión.')
    setLoading(false)
  }

  if (ok) {
    return (
      <div style={{ minHeight:'100vh', background:'#080808', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
        <div style={{ width:40, height:40, border:'3px solid #f59e0b', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
        <p style={{ color:'#f59e0b', fontFamily:'sans-serif', fontSize:14 }}>Cargando plataforma...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <a href="/dashboard" style={{ color:'rgba(255,255,255,0.3)', fontSize:12, fontFamily:'sans-serif', marginTop:8 }}>
          Si no redirige, click aquí
        </a>
      </div>
    )
  }

  return (
    <div className="lr">
      <div className="lr-grid" />
      <div className="lr-g1" />
      <div className="lr-g2" />
      <div className="lr-vl" />
      <div className="lr-vr" />
      <div className="lr-ctL" />
      <div className="lr-ctR" />
      <div className="lr-cbL" />
      <div className="lr-cbR" />

      <div className="lc">
        <div className="lb">
          <div className="lbt">
            <div className="lbd" />
            <span className="lbla">Iglesia ARM · Sistema de Merch</span>
          </div>
          <h1 className="lh1">ARM <em>Merch</em></h1>
          <p className="lhs">Acceso a la plataforma de merchandising</p>
        </div>

        <form onSubmit={handleSubmit} className="lform">
          <div className="lfi">
            <label className="lfl">Correo electrónico</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@iglesia.cl" required autoComplete="email" className="lfx" />
          </div>
          <div className="lfi">
            <label className="lfl">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password" className="lfx" />
          </div>
          <div className="ldv" />
          {error && <div className="ler">{error}</div>}
          <button type="submit" disabled={loading} className="lbtn">
            {loading && <span className="lsp" />}
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <div className="lfooter">
          <div className="lfline" />
          <span className="lftxt">Acceso restringido al equipo autorizado</span>
          <div className="lfline" />
        </div>
      </div>
      <div className="lr-yr">ARM © 2025</div>
    </div>
  )
}
