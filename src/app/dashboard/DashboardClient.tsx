'use client'
import { useMemo, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Encuentro, Campus } from '@/types'

function KPICard({
  label, value, sub, accent = false, icon,
}: {
  label: string; value: string; sub?: string; accent?: boolean; icon: React.ReactNode
}) {
  return (
    <div className={`card p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-[0_4px_16px_-2px_rgb(0_0_0/0.08)] ${accent ? 'bg-brand-600 border-brand-600' : ''}`}>
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ? 'bg-white/20' : 'bg-ink-50'}`}>
          <span className={accent ? 'text-white' : 'text-ink-500'}>{icon}</span>
        </div>
      </div>
      <div>
        <p className={`text-[28px] font-bold tracking-tight leading-none mb-1 ${accent ? 'text-white' : 'text-ink-900'}`}>{value}</p>
        <p className={`text-xs font-semibold ${accent ? 'text-white/80' : 'text-ink-500'}`}>{label}</p>
        {sub && <p className={`text-[11px] mt-0.5 ${accent ? 'text-white/60' : 'text-ink-400'}`}>{sub}</p>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-ink-100 rounded-xl p-3 shadow-[0_4px_16px_-2px_rgb(0_0_0/0.1)] text-xs">
        <p className="font-bold text-ink-700 mb-1.5 capitalize">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-ink-500">{p.name}:</span>
            <span className="font-semibold text-ink-900">{Number(p.value).toLocaleString('es-CL')}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardClient({
  encuentros, campuses, profile
}: {
  encuentros: Encuentro[]
  campuses: Campus[]
  profile: any
}) {
  const [campusFilter, setCampusFilter] = useState('all')
  const isSuperAdmin = profile?.role === 'superadmin'

  const filtered = useMemo(() =>
    campusFilter === 'all' ? encuentros : encuentros.filter(e => e.campus_id === campusFilter)
  , [encuentros, campusFilter])

  const kpis = useMemo(() => ({
    asistencia: filtered.reduce((s, e) => s + (e.asistencia_auditorio || 0), 0),
    jesus: filtered.reduce((s, e) => s + (e.acepto_jesus_presencial || 0) + (e.acepto_jesus_online || 0), 0),
    eventos: filtered.length,
    espectadores: filtered.reduce((s, e) => s + (e.espectadores || 0), 0),
  }), [filtered])

  const byMonth = useMemo(() => {
    const map: Record<string, { mes: string; asistencia: number; jesus: number; eventos: number }> = {}
    filtered.forEach(e => {
      if (!e.fecha) return
      const key = format(parseISO(e.fecha), 'yyyy-MM')
      if (!map[key]) map[key] = { mes: format(parseISO(e.fecha), 'MMM yy', { locale: es }), asistencia: 0, jesus: 0, eventos: 0 }
      map[key].asistencia += e.asistencia_auditorio || 0
      map[key].jesus += (e.acepto_jesus_presencial || 0) + (e.acepto_jesus_online || 0)
      map[key].eventos += 1
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([, v]) => v)
  }, [filtered])

  const byCampus = useMemo(() => {
    const map: Record<string, { campus: string; asistencia: number; jesus: number }> = {}
    encuentros.forEach(e => {
      const c = campuses.find(c => c.id === e.campus_id)
      if (!c) return
      if (!map[c.id]) map[c.id] = { campus: c.name, asistencia: 0, jesus: 0 }
      map[c.id].asistencia += e.asistencia_auditorio || 0
      map[c.id].jesus += (e.acepto_jesus_presencial || 0) + (e.acepto_jesus_online || 0)
    })
    return Object.values(map).sort((a, b) => b.asistencia - a.asistencia)
  }, [encuentros, campuses])

  const volTotals = useMemo(() => {
    const keys = ['vol_servicio','vol_tecnica','vol_worship','vol_kids','vol_tweens','vol_rrss','vol_seguridad','vol_cocina','vol_oracion','vol_sala_bebes','vol_conexion','vol_merch','vol_amor_casa','vol_sala_sensorial','vol_punto_siembra']
    const labels: Record<string,string> = {
      vol_servicio:'Servicio',vol_tecnica:'Técnica',vol_worship:'Worship',vol_kids:'Kids',
      vol_tweens:'Tweens',vol_rrss:'RRSS',vol_seguridad:'Seguridad',vol_cocina:'Cocina',
      vol_oracion:'Oración',vol_sala_bebes:'Sala bebé',vol_conexion:'Conexión',vol_merch:'Merch',
      vol_amor_casa:'Amor casa',vol_sala_sensorial:'Sensorial',vol_punto_siembra:'P. Siembra'
    }
    return keys.map(k => ({
      area: labels[k],
      total: filtered.reduce((s, e) => s + ((e as any)[k] || 0), 0)
    })).sort((a,b) => b.total - a.total)
  }, [filtered])

  const totalVols = volTotals.reduce((s, v) => s + v.total, 0)
  const maxVol = volTotals[0]?.total || 1

  const modalidadBadge: Record<string, string> = {
    'Presencial': 'bg-blue-50 text-blue-700 border border-blue-100',
    'Online': 'bg-orange-50 text-orange-700 border border-orange-100',
    'Presencial+Online': 'bg-purple-50 text-purple-700 border border-purple-100',
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-ink-400 mt-0.5 font-medium">Estadísticas de encuentros en tiempo real</p>
        </div>
        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <select
              value={campusFilter}
              onChange={e => setCampusFilter(e.target.value)}
              className="input-field w-48"
            >
              <option value="all">Todos los campus</option>
              {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Asistencia total"
          value={kpis.asistencia.toLocaleString('es-CL')}
          sub="Auditorio presencial"
          accent={true}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <KPICard
          label="Aceptaron a Jesús"
          value={kpis.jesus.toLocaleString('es-CL')}
          sub="Presencial + online"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
        <KPICard
          label="Total encuentros"
          value={kpis.eventos.toLocaleString('es-CL')}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <KPICard
          label="Espectadores online"
          value={kpis.espectadores.toLocaleString('es-CL')}
          sub="Máximo simultáneo"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 10l4.553-2.069A1 1 0 0121 8.871v6.258a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-ink-800">Asistencia mensual</p>
            <span className="text-[10px] text-ink-400 font-semibold uppercase tracking-wider">Últimos 12 meses</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={byMonth} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="asistencia" stroke="#16A34A" fill="url(#ga)" strokeWidth={2.5} name="Asistencia" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-ink-800">Decisiones de fe por mes</p>
            <span className="text-[10px] text-ink-400 font-semibold uppercase tracking-wider">Aceptaron a Jesús</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byMonth} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="jesus" fill="#16A34A" radius={[5,5,0,0]} name="Aceptaron a Jesús" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      {isSuperAdmin && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-ink-800">Comparativa por campus</p>
            <span className="text-[10px] text-ink-400 font-semibold uppercase tracking-wider">Total acumulado</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCampus} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="campus" type="category" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} width={120} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              <Bar dataKey="asistencia" fill="#16A34A" radius={[0,5,5,0]} name="Asistencia" />
              <Bar dataKey="jesus" fill="#86EFAC" radius={[0,5,5,0]} name="Aceptaron a Jesús" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Voluntarios */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-bold text-ink-800">Voluntarios por área</p>
          <span className="text-[10px] text-ink-400 font-semibold uppercase tracking-wider">
            {totalVols.toLocaleString('es-CL')} total
          </span>
        </div>
        <p className="text-xs text-ink-400 mb-4">Distribución acumulada del servicio</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
          {volTotals.map((v, i) => (
            <div key={v.area} className="relative overflow-hidden rounded-xl bg-ink-50 border border-ink-100 p-3 text-center group hover:border-brand-200 hover:bg-brand-50 transition-all">
              <div
                className="absolute bottom-0 left-0 right-0 bg-brand-100 transition-all duration-500"
                style={{ height: `${Math.round((v.total / maxVol) * 40)}%`, opacity: 0.5 }}
              />
              <p className="relative text-[10px] text-ink-500 font-semibold mb-1">{v.area}</p>
              <p className="relative text-base font-bold text-ink-900">{v.total.toLocaleString('es-CL')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Últimos encuentros */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-ink-100">
          <p className="text-sm font-bold text-ink-800">Últimos encuentros</p>
          <span className="text-[10px] text-ink-400 font-semibold uppercase tracking-wider">{filtered.slice(0,15).length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>
                <th className="text-left py-3 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Fecha</th>
                <th className="text-left py-3 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Encuentro</th>
                {isSuperAdmin && <th className="text-left py-3 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Campus</th>}
                <th className="text-right py-3 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Asistencia</th>
                <th className="text-right py-3 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">A Jesús</th>
                <th className="text-left py-3 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Modalidad</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 15).map(e => {
                const campus = campuses.find(c => c.id === e.campus_id)
                const modalStyle = e.modalidad === 'Presencial'
                  ? 'bg-blue-50 text-blue-700 border border-blue-100'
                  : e.modalidad === 'Online'
                  ? 'bg-orange-50 text-orange-700 border border-orange-100'
                  : 'bg-purple-50 text-purple-700 border border-purple-100'
                return (
                  <tr key={e.id} className="border-b border-ink-50 hover:bg-ink-50 transition-colors">
                    <td className="py-3.5 px-4 text-ink-500 font-medium whitespace-nowrap">
                      {e.fecha ? format(parseISO(e.fecha), 'dd MMM yyyy', { locale: es }) : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-ink-900">{e.nombre_encuentro}</td>
                    {isSuperAdmin && <td className="py-3.5 px-4 text-ink-500">{campus?.name || '—'}</td>}
                    <td className="py-3.5 px-4 text-right font-bold text-ink-900">{(e.asistencia_auditorio || 0).toLocaleString('es-CL')}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-brand-600">{((e.acepto_jesus_presencial || 0) + (e.acepto_jesus_online || 0)).toLocaleString('es-CL')}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${modalStyle}`}>
                        {e.modalidad}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
