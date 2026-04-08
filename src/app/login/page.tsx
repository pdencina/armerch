'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function signInWithGoogle() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-brand-200 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-200 rounded-full opacity-15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-100 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm px-4">
        {/* Card */}
        <div className="card-elevated p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div
              className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mb-4"
              style={{boxShadow:'0 4px 20px rgb(22 163 74 / 0.4)'}}
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Iglesia Stats</h1>
            <p className="text-sm text-ink-400 mt-1 font-medium text-center">
              Plataforma de estadísticas de encuentros
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-3.5 text-sm text-red-700 flex items-center gap-2.5">
              <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-ink-50 active:bg-ink-100 text-ink-800 font-semibold py-3 px-5 rounded-xl border border-ink-200 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_1px_3px_0_rgb(0_0_0/0.08)]"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4 text-ink-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>

          <div className="mt-6 pt-5 border-t border-ink-100 text-center">
            <p className="text-xs text-ink-400 leading-relaxed">
              Solo usuarios autorizados por el equipo de administración pueden acceder a esta plataforma.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-ink-400 mt-5 font-medium">
          Iglesia Stats · Plataforma privada
        </p>
      </div>
    </div>
  )
}
