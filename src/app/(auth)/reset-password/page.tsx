'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const router  = useRouter()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [checking, setChecking]   = useState(true)
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Supabase envía el token en el hash de la URL: #access_token=...&type=recovery
    // El cliente de Supabase lo procesa automáticamente con onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Token de recuperación válido
          setValidSession(true)
          setChecking(false)
        } else if (event === 'SIGNED_IN' && session) {
          // También válido si ya hay sesión
          setValidSession(true)
          setChecking(false)
        }
      }
    )

    // Timeout — si en 3 segundos no hay evento, verificar sesión directamente
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setValidSession(true)
      }
      setChecking(false)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleReset() {
    if (!password) { setError('Ingresa una contraseña'); return }
    if (password.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (err) { setError(err.message); return }

    setSuccess(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  if (checking) {
    return (
      <div className="lr">
        <div className="lc">
          <div className="lb" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{
              width: 32, height: 32,
              border: '2px solid #f59e0b',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#71717a', fontSize: '14px' }}>Verificando link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!validSession) {
    return (
      <div className="lr">
        <div className="lr-grid" />
        <div className="lr-g1" />
        <div className="lr-g2" />
        <div className="lc">
          <div className="lb">
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <p style={{ color: '#f87171', fontWeight: 600, fontSize: '16px', marginBottom: '8px' }}>
                Link inválido o expirado
              </p>
              <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
                Este link de recuperación ya fue usado o expiró.<br/>
                Los links son válidos por 1 hora.
              </p>
              <a href="/forgot-password" style={{
                display: 'inline-block',
                background: '#f59e0b', color: '#000', fontWeight: 700,
                padding: '12px 28px', borderRadius: '12px',
                textDecoration: 'none', fontSize: '14px'
              }}>
                Solicitar nuevo link
              </a>
              <div style={{ marginTop: '16px' }}>
                <a href="/login" style={{ fontSize: '13px', color: '#71717a', textDecoration: 'none' }}>
                  ← Volver al login
                </a>
              </div>
            </div>
          </div>
        </div>
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

      <div className="lc">
        <div className="lb">
          <div className="lbt">
            <div className="lbd" />
            <span className="lbla">ARM Global · Sistema de Merch</span>
          </div>

          <div className="lh">
            <h1 className="lt">Nueva contraseña</h1>
            <p className="ls">Elige una contraseña segura para tu cuenta</p>
          </div>

          {success ? (
            <div className="lf">
              <div style={{
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: '16px', padding: '28px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                <p style={{ color: '#86efac', fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
                  ¡Contraseña actualizada!
                </p>
                <p style={{ color: '#71717a', fontSize: '13px' }}>
                  Redirigiendo al inicio de sesión...
                </p>
              </div>
            </div>
          ) : (
            <div className="lf">
              <div className="lg">
                <label className="ll">Nueva contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="lfx"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    style={{
                      position: 'absolute', right: '14px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer', color: '#71717a',
                      display: 'flex', alignItems: 'center'
                    }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="lg">
                <label className="ll">Confirmar contraseña</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="lfx"
                  style={{
                    borderColor: confirm && password !== confirm
                      ? 'rgba(248,113,113,0.5)' : undefined
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleReset() }}
                />
                {confirm && password !== confirm && (
                  <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>

              <div className="ldv" />
              {error && <div className="ler">{error}</div>}

              <button
                type="button"
                onClick={handleReset}
                disabled={loading || !password || password !== confirm}
                className="lbtn"
              >
                {loading && <span className="lsp" />}
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
