'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Credenciales incorrectas')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <style>{`
        @keyframes fadein { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pdot   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes spin   { to { transform:rotate(360deg) } }
        @keyframes shine  { from{transform:translateX(-100%)} to{transform:translateX(100%)} }

        .lr { min-height:100vh; background:#080808; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; font-family:var(--font-dm-sans,system-ui,sans-serif); }

        .lr-grid { position:fixed; inset:0; background-image: linear-gradient(rgba(245,158,11,.03) 1px,transparent 1px), linear-gradient(90deg,rgba(245,158,11,.03) 1px,transparent 1px); background-size:60px 60px; pointer-events:none; }
        .lr-g1   { position:fixed; width:600px; height:600px; border-radius:50%; background:radial-gradient(circle,rgba(245,158,11,.07) 0%,transparent 70%); top:-150px; right:-150px; pointer-events:none; }
        .lr-g2   { position:fixed; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle,rgba(245,158,11,.04) 0%,transparent 70%); bottom:-100px; left:-100px; pointer-events:none; }
        .lr-vl   { position:fixed; left:60px; top:0; bottom:0; width:1px; background:linear-gradient(to bottom,transparent,rgba(245,158,11,.12) 30%,rgba(245,158,11,.12) 70%,transparent); }
        .lr-vr   { position:fixed; right:60px; top:0; bottom:0; width:1px; background:linear-gradient(to bottom,transparent,rgba(245,158,11,.06) 30%,rgba(245,158,11,.06) 70%,transparent); }
        .lr-ctL  { position:fixed; top:24px; left:24px;   width:20px; height:20px; border-top:1px solid rgba(245,158,11,.3); border-left:1px solid rgba(245,158,11,.3); }
        .lr-ctR  { position:fixed; top:24px; right:24px;  width:20px; height:20px; border-top:1px solid rgba(245,158,11,.3); border-right:1px solid rgba(245,158,11,.3); }
        .lr-cbL  { position:fixed; bottom:24px; left:24px; width:20px; height:20px; border-bottom:1px solid rgba(245,158,11,.3); border-left:1px solid rgba(245,158,11,.3); }
        .lr-cbR  { position:fixed; bottom:24px; right:24px; width:20px; height:20px; border-bottom:1px solid rgba(245,158,11,.3); border-right:1px solid rgba(245,158,11,.3); }
        .lr-yr   { position:fixed; bottom:28px; right:28px; font-size:10px; color:rgba(255,255,255,.1); letter-spacing:.1em; }

        .lc { position:relative; width:100%; max-width:420px; padding:0 24px; animation:fadein .6s ease both; }

        .lb  { margin-bottom:52px; }
        .lbt { display:inline-flex; align-items:center; gap:8px; margin-bottom:20px; }
        .lbd { width:6px; height:6px; background:#f59e0b; border-radius:50%; animation:pdot 2s ease-in-out infinite; }
        .lbl { font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:rgba(245,158,11,.7); font-weight:500; }
        .lh1 { font-family:var(--font-dm-serif,Georgia,serif); font-size:52px; line-height:1; color:#fff; letter-spacing:-.02em; margin:0 0 8px; }
        .lh1 em { font-style:italic; color:#f59e0b; }
        .lhs { font-size:13px; color:rgba(255,255,255,.3); font-weight:300; letter-spacing:.02em; }

        .lf  { display:flex; flex-direction:column; gap:20px; }
        .lfi { display:flex; flex-direction:column; gap:8px; }
        .lfl { font-size:10px; letter-spacing:.15em; text-transform:uppercase; color:rgba(255,255,255,.35); font-weight:500; }
        .lfx { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.08); border-radius:2px; padding:14px 16px; color:#fff; font-size:14px; font-family:inherit; font-weight:300; outline:none; transition:border-color .2s,background .2s; width:100%; }
        .lfx::placeholder { color:rgba(255,255,255,.15); }
        .lfx:focus { border-color:rgba(245,158,11,.4); background:rgba(245,158,11,.03); }
        .ldv { height:1px; background:linear-gradient(to right,transparent,rgba(255,255,255,.06),transparent); margin:4px 0; }
        .ler { font-size:12px; color:#f87171; background:rgba(248,113,113,.05); border:1px solid rgba(248,113,113,.15); border-radius:2px; padding:10px 14px; }

        .lbtn { position:relative; background:#f59e0b; color:#080808; border:none; border-radius:2px; padding:16px 24px; font-size:12px; font-family:inherit; font-weight:500; letter-spacing:.15em; text-transform:uppercase; cursor:pointer; width:100%; margin-top:8px; display:flex; align-items:center; justify-content:center; gap:8px; overflow:hidden; transition:background .2s; }
        .lbtn:hover:not(:disabled) { background:#fbbf24; }
        .lbtn:active:not(:disabled) { transform:scale(.99); }
        .lbtn:disabled { opacity:.6; cursor:not-allowed; }
        .lbtn::after { content:''; position:absolute; inset:0; background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.18) 50%,transparent 60%); transform:translateX(-100%); transition:transform .5s ease; }
        .lbtn:hover:not(:disabled)::after { transform:translateX(100%); }
        .lsp { width:13px; height:13px; border:1.5px solid rgba(0,0,0,.25); border-top-color:#080808; border-radius:50%; animation:spin .6s linear infinite; flex-shrink:0; }

        .lft { margin-top:40px; display:flex; align-items:center; gap:12px; }
        .lfl2 { flex:1; height:1px; background:rgba(255,255,255,.06); }
        .lft2 { font-size:11px; color:rgba(255,255,255,.2); letter-spacing:.05em; white-space:nowrap; }
      `}</style>

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
              <span className="lbl">Iglesia ARM · Sistema de Merch</span>
            </div>
            <h1 className="lh1">ARM <em>Merch</em></h1>
            <p className="lhs">Acceso a la plataforma de merchandising</p>
          </div>

          <form onSubmit={handleSubmit} className="lf">
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

          <div className="lft">
            <div className="lfl2" />
            <span className="lft2">Acceso restringido al equipo autorizado</span>
            <div className="lfl2" />
          </div>
        </div>

        <div className="lr-yr">ARM © 2025</div>
      </div>
    </>
  )
}
