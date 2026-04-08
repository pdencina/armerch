'use client'

import { LogOut, Bell } from 'lucide-react'
import { logout } from '@/lib/actions/auth'

export default function Navbar({ user }: { user: any }) {
  const initials = (user?.full_name ?? 'U')
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="h-14 flex items-center justify-between px-5 bg-zinc-950 border-b border-zinc-800/60 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        <button className="text-zinc-500 hover:text-white transition p-1.5 rounded-lg hover:bg-zinc-800">
          <Bell size={16} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-amber-400">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-white leading-none">{user?.full_name}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5 capitalize">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-zinc-500 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-zinc-800"
            title="Cerrar sesión"
          >
            <LogOut size={16} />
          </button>
        </form>
      </div>
    </header>
  )
}
