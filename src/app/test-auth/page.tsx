'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestAuth() {
  const [info, setInfo] = useState<any>(null)

  useEffect(() => {
    async function check() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      setInfo({
        hasSession: !!session,
        hasUser: !!user,
        email: user?.email ?? null,
        tokenPreview: session?.access_token?.slice(0,20) ?? null,
        cookieCount: document.cookie.split(';').length,
      })
    }
    check()
  }, [])

  async function doLogin() {
    const supabase = createClient()
    const email = (document.getElementById('te') as HTMLInputElement).value
    const password = (document.getElementById('tp') as HTMLInputElement).value
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    setInfo({
      step: 'after_login',
      error: error?.message ?? null,
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      email: data?.user?.email ?? null,
      tokenPreview: data?.session?.access_token?.slice(0,30) ?? null,
    })
  }

  return (
    <div style={{padding:32,fontFamily:'monospace',background:'#0a0a0a',color:'#e4e4e4',minHeight:'100vh'}}>
      <h2 style={{color:'#f59e0b',marginBottom:16}}>ARM Merch — Auth Diagnostic</h2>
      <pre style={{background:'#111',padding:16,borderRadius:8,marginBottom:24,fontSize:13,color:'#4ade80'}}>
        {info ? JSON.stringify(info, null, 2) : 'Cargando...'}
      </pre>
      <div style={{display:'flex',flexDirection:'column',gap:8,maxWidth:320}}>
        <input id="te" placeholder="email" defaultValue="superadmin@iglesia.cl"
          style={{padding:'10px 12px',background:'#1a1a1a',color:'#fff',border:'1px solid #333',borderRadius:4}} />
        <input id="tp" type="password" placeholder="contraseña"
          style={{padding:'10px 12px',background:'#1a1a1a',color:'#fff',border:'1px solid #333',borderRadius:4}} />
        <button onClick={doLogin}
          style={{padding:'10px 12px',background:'#f59e0b',color:'#000',fontWeight:'bold',cursor:'pointer',borderRadius:4,border:'none'}}>
          Test Login directo
        </button>
        <a href="/dashboard"
          style={{padding:'10px 12px',background:'#333',color:'#fff',textAlign:'center',borderRadius:4,textDecoration:'none',marginTop:8}}>
          Ir a /dashboard directo
        </a>
      </div>
    </div>
  )
}
