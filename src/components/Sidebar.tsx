'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/types'
import { clsx } from 'clsx'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    roles: ['superadmin', 'admin_campus', 'voluntario', 'viewer'],
    iconPath: 'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z',
  },
  {
    href: '/ingresar',
    label: 'Ingresar datos',
    roles: ['superadmin', 'admin_campus', 'voluntario'],
    iconPath: 'M12 4v16m8-8H4',
  },
  {
    href: '/historial',
    label: 'Historial',
    roles: ['superadmin', 'admin_campus', 'voluntario', 'viewer'],
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
  {
    href: '/admin',
    label: 'Administración',
    roles: ['superadmin'],
    iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
]

const roleLabel: Record<string, string> = {
  superadmin: 'Super Admin',
  admin_campus: 'Admin Campus',
  voluntario: 'Voluntario',
  viewer: 'Viewer',
}

const roleColors: Record<string, string> = {
  superadmin: 'bg-purple-50 text-purple-700 border border-purple-100',
  admin_campus: 'bg-blue-50 text-blue-700 border border-blue-100',
  voluntario: 'bg-brand-50 text-brand-700 border border-brand-100',
  viewer: 'bg-ink-100 text-ink-600 border border-ink-200',
}

function getInitials(name: string | null | undefined, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export default function Sidebar({ profile }: { profile: UserProfile }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visible = navItems.filter(i => i.roles.includes(profile.role))

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-white border-r border-ink-100 min-h-screen">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-ink-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center" style={{boxShadow:'0 2px 8px rgb(22 163 74 / 0.35)'}}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-ink-900 text-sm leading-none block">Iglesia Stats</span>
            <span className="text-[10px] text-ink-400 font-medium">Estadísticas de encuentros</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visible.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900'
              )}
              style={active ? {boxShadow:'0 2px 8px rgb(22 163 74 / 0.28)'} : {}}
            >
              <svg
                className={clsx('w-[18px] h-[18px] shrink-0', active ? 'text-white' : 'text-ink-400')}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.iconPath} />
              </svg>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-ink-100">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-ink-50 mb-2">
          <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-brand-700">
              {getInitials(profile.full_name, profile.email)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate leading-tight">
              {profile.full_name || profile.email}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${roleColors[profile.role] || ''}`}>
                {roleLabel[profile.role]}
              </span>
              {profile.campus && (
                <span className="text-[10px] text-ink-400 truncate">{profile.campus.name}</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-ink-500 hover:bg-red-50 hover:text-red-600 transition-all font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
