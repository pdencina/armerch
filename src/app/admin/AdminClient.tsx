'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Campus, Role, UserProfile } from '@/types'

const ROLES: { value: Role; label: string }[] = [
  { value: 'superadmin', label: 'Super Admin' },
  { value: 'admin_campus', label: 'Admin Campus' },
  { value: 'voluntario', label: 'Voluntario' },
  { value: 'viewer', label: 'Viewer' },
]

const roleBadge: Record<string, string> = {
  superadmin: 'bg-purple-50 text-purple-700 border border-purple-100',
  admin_campus: 'bg-blue-50 text-blue-700 border border-blue-100',
  voluntario: 'bg-brand-50 text-brand-700 border border-brand-100',
  viewer: 'bg-ink-100 text-ink-600 border border-ink-200',
}

type AdminUser = UserProfile & { campus?: Campus | null }

function getInitials(name: string | null | undefined, email: string) {
  if (name) return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

export default function AdminClient({ users, campuses }: { users: AdminUser[]; campuses: Campus[] }) {
  const [list, setList] = useState<AdminUser[]>(users)
  const [saving, setSaving] = useState<string | null>(null)
  const supabase = createClient()

  async function updateUser(id: string, field: 'role' | 'campus_id', value: string) {
    setSaving(id)
    await supabase.from('profiles').update({ [field]: value || null }).eq('id', id)
    setList((current) => current.map((user) => (user.id === id ? { ...user, [field]: value || null } : user)))
    setSaving(null)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Administración</h1>
        <p className="text-sm text-ink-400 mt-0.5 font-medium">{list.length} usuarios registrados</p>
      </div>

      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-ink-100 bg-ink-50 flex items-center gap-2">
          <svg className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-xs font-bold text-ink-500 uppercase tracking-widest">Usuarios</p>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100">
            <tr>
              <th className="text-left py-3 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Usuario</th>
              <th className="text-left py-3 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Rol</th>
              <th className="text-left py-3 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Campus</th>
              <th className="text-left py-3 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Estado</th>
            </tr>
          </thead>
          <tbody>
            {list.map((user) => (
              <tr key={user.id} className="border-b border-ink-50 hover:bg-ink-50 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-ink-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-ink-500">{getInitials(user.full_name, user.email)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-ink-900">{user.full_name || '—'}</p>
                      <p className="text-xs text-ink-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <select
                    value={user.role}
                    onChange={(e) => updateUser(user.id, 'role', e.target.value)}
                    className="text-xs border border-ink-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-ink-700"
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3.5 px-4">
                  <select
                    value={user.campus_id || ''}
                    onChange={(e) => updateUser(user.id, 'campus_id', e.target.value)}
                    className="text-xs border border-ink-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-medium text-ink-700"
                  >
                    <option value="">Sin campus</option>
                    {campuses.map((campus) => (
                      <option key={campus.id} value={campus.id}>{campus.name}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3.5 px-4">
                  {saving === user.id ? (
                    <span className="text-xs text-ink-400 flex items-center gap-1.5">
                      <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Guardando
                    </span>
                  ) : (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${roleBadge[user.role] || 'bg-ink-100 text-ink-600'}`}>
                      {ROLES.find((role) => role.value === user.role)?.label || user.role}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">Campus activos</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {campuses.map((campus) => (
            <div key={campus.id} className="bg-ink-50 border border-ink-100 rounded-xl p-3.5 hover:border-brand-200 hover:bg-brand-50 transition-all">
              <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center mb-2">
                <svg className="w-3.5 h-3.5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="font-bold text-ink-900 text-sm">{campus.name}</p>
              <p className="text-xs text-ink-400 mt-0.5">{campus.city}, {campus.country}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
