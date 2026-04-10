'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, LogOut, Search, X, Sun, Moon } from 'lucide-react'

const CAMPUS_COLORS: Record<string, string> = {
  'ARM Santiago':    'bg-blue-500/10 text-blue-400',
  'ARM Puente Alto': 'bg-purple-500/10 text-purple-400',
  'ARM Punta Arenas':'bg-teal-500/10 text-teal-400',
  'ARM Montevideo':  'bg-amber-500/10 text-amber-400',
  'ARM Maracaibo':   'bg-red-500/10 text-red-400',
}

export default function Navbar({ user }: { user: any }) {
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]           = useState('')
  const [results, setResults]       = useState<any[]>([])
  const [dark, setDark]             = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('arm-theme')
    const isDark = saved ? saved === 'dark' : true
    setDark(isDark)
    document.documentElement.classList.toggle('light-mode', !isDark)
  }, [])

  // Cmd+K para abrir búsqueda
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); setSearchOpen(s => !s)
      }
      if (e.key === 'Escape') setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Búsqueda en tiempo real
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      const supabase = createClient()
      const q = query.toLowerCase()
      const [{ data: products }, { data: orders }] = await Promise.all([
        supabase.from('products_with_stock').select('id, name, sku, price, stock')
          .or(`name.ilike.%${q}%,sku.ilike.%${q}%`).limit(4),
        supabase.from('orders').select('id, order_number, total, status, notes')
          .or(`notes.ilike.%${q}%`).limit(3),
      ])
      const r: any[] = []
      ;(products ?? []).forEach(p => r.push({ type: 'product', id: p.id, label: p.name, sub: `SKU: ${p.sku ?? '—'} · Stock: ${p.stock}`, href: `/products/${p.id}` }))
      ;(orders ?? []).forEach(o => r.push({ type: 'order', id: o.id, label: `Orden #${o.order_number}`, sub: o.notes?.replace('Cliente: ', '') ?? '—', href: '/orders' }))
      setResults(r)
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    localStorage.setItem('arm-theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('light-mode', !next)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const initials = user?.full_name?.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() ?? '?'
  const campusName = user?.campus?.name ?? null
  const campusStyle = campusName ? (CAMPUS_COLORS[campusName] ?? 'bg-zinc-700/50 text-zinc-400') : null

  return (
    <>
      <header className="flex items-center justify-between px-5 py-3 bg-zinc-950 border-b border-zinc-800/60 shrink-0">
        <div className="flex items-center gap-3">
          {/* Búsqueda global */}
          <button onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60
                       rounded-xl px-3 py-2 text-xs text-zinc-500 transition w-48">
            <Search size={13} />
            <span>Buscar...</span>
            <span className="ml-auto bg-zinc-700 text-zinc-500 text-[9px] px-1.5 py-0.5 rounded font-mono">⌘K</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle tema */}
          <button onClick={toggleTheme}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition text-zinc-400 hover:text-white">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notificaciones */}
          <button className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition text-zinc-400 hover:text-white">
            <Bell size={15} />
          </button>

          {/* Usuario */}
          <div className="flex items-center gap-2.5">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-white leading-none">{user?.full_name ?? '—'}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                {campusName && (
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${campusStyle}`}>{campusName}</span>
                )}
                <p className="text-[10px] text-zinc-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-amber-400">{initials}</span>
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition text-zinc-500">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Modal búsqueda global */}
      {searchOpen && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:'80px' }}
          onClick={e => { if (e.target === e.currentTarget) setSearchOpen(false) }}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg mx-4 overflow-hidden shadow-2xl">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800">
              <Search size={16} className="text-zinc-500 shrink-0" />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Buscar productos, órdenes, clientes..."
                className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm outline-none" />
              <button onClick={() => setSearchOpen(false)} className="text-zinc-600 hover:text-zinc-400 transition">
                <X size={16} />
              </button>
            </div>

            {results.length > 0 ? (
              <div className="py-2 max-h-72 overflow-y-auto">
                {results.map(r => (
                  <button key={r.id} onClick={() => { router.push(r.href); setSearchOpen(false); setQuery('') }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800 transition text-left">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      r.type === 'product' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {r.type === 'product' ? '📦' : '🧾'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 font-medium truncate">{r.label}</p>
                      <p className="text-xs text-zinc-500 truncate">{r.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="py-8 text-center text-zinc-600 text-sm">Sin resultados para "{query}"</div>
            ) : (
              <div className="py-6 px-4">
                <p className="text-xs text-zinc-600 mb-3">Accesos rápidos</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Punto de Venta', href: '/pos' },
                    { label: 'Inventario', href: '/inventory' },
                    { label: 'Órdenes', href: '/orders' },
                    { label: 'Reportes', href: '/reports' },
                  ].map(l => (
                    <button key={l.href} onClick={() => { router.push(l.href); setSearchOpen(false) }}
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-3 py-1.5 rounded-lg transition">
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
