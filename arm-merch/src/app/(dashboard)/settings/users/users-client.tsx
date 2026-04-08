'use client'

import { useState } from 'react'
import { updateUserRole, toggleUserActive } from '@/lib/actions/users'
import { Search, ToggleLeft, ToggleRight, Shield } from 'lucide-react'

type Role = 'super_admin' | 'admin' | 'voluntario'
interface User { id: string; full_name: string; email: string; role: Role; active: boolean; created_at: string }

const ROLE_CONFIG: Record<Role, { label: string; color: string }> = {
  super_admin: { label: 'Super Admin', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  admin:       { label: 'Admin',       color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'       },
  voluntario:  { label: 'Voluntario',  color: 'text-green-400 bg-green-500/10 border-green-500/20'    },
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const filtered = users.filter(u =>
    !search ||
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleRoleChange(id: string, role: Role) {
    setUpdating(id)
    await updateUserRole(id, role)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    setUpdating(null)
  }

  async function handleToggleActive(id: string, active: boolean) {
    setUpdating(id)
    await toggleUserActive(id, !active)
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !active } : u))
    setUpdating(null)
  }

  const counts = {
    total:      users.length,
    active:     users.filter(u => u.active).length,
    admins:     users.filter(u => u.role === 'admin' || u.role === 'super_admin').length,
    volunteers: users.filter(u => u.role === 'voluntario').length,
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Usuarios y roles</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Gestión de acceso a la plataforma</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          <Shield size={14} className="text-amber-400" />
          <span className="text-xs text-amber-400 font-medium">Solo Super Admin</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total usuarios',  value: counts.total      },
          { label: 'Activos',         value: counts.active     },
          { label: 'Admins',          value: counts.admins     },
          { label: 'Voluntarios',     value: counts.volunteers },
        ].map(s => (
          <div key={s.label} className="bg-zinc-800/50 border border-zinc-700/40 rounded-xl p-4">
            <p className="text-xs text-zinc-500">{s.label}</p>
            <p className="text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Nota: invitación */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-400">
        Para agregar nuevos usuarios, ve a <strong>Supabase → Authentication → Users → Invite user</strong> e ingresa su email. El sistema les asignará el rol <em>voluntario</em> por defecto.
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600
                     rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition"
        />
      </div>

      {/* Tabla */}
      <div className="bg-zinc-800/30 rounded-xl border border-zinc-700/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700/60">
                {['Usuario', 'Email', 'Rol', 'Registro', 'Estado', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const roleCfg = ROLE_CONFIG[user.role]
                const isUpdating = updating === user.id
                return (
                  <tr key={user.id} className={`border-b border-zinc-700/30 hover:bg-zinc-700/20 transition ${!user.active ? 'opacity-50' : ''}`}>

                    {/* Avatar + Nombre */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-zinc-300">
                            {user.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                          </span>
                        </div>
                        <span className="text-zinc-200 text-sm font-medium">{user.full_name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs text-zinc-500">{user.email}</td>

                    {/* Selector de rol */}
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        disabled={isUpdating}
                        onChange={e => handleRoleChange(user.id, e.target.value as Role)}
                        className={`text-[10px] font-semibold px-2 py-1 rounded-full border cursor-pointer
                                   bg-transparent focus:outline-none transition ${roleCfg.color}
                                   disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value="voluntario">Voluntario</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>

                    <td className="px-4 py-3 text-xs text-zinc-600">{fmtDate(user.created_at)}</td>

                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border
                        ${user.active
                          ? 'text-green-400 bg-green-500/10 border-green-500/20'
                          : 'text-zinc-600 bg-zinc-700/30 border-zinc-600/20'}`}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleActive(user.id, user.active)}
                        disabled={isUpdating}
                        className={`transition p-1.5 rounded-lg hover:bg-zinc-700 disabled:opacity-40
                          ${user.active ? 'text-green-400 hover:text-red-400' : 'text-zinc-600 hover:text-green-400'}`}
                        title={user.active ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {user.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-zinc-600 text-sm">No se encontraron usuarios</div>
        )}
      </div>
    </div>
  )
}
