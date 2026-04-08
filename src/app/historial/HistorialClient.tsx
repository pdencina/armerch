'use client'
import { useState, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Encuentro, Campus } from '@/types'

export default function HistorialClient({ encuentros, campuses, profile }: {
  encuentros: Encuentro[]; campuses: Campus[]; profile: any
}) {
  const [search, setSearch] = useState('')
  const [campusFilter, setCampusFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [selected, setSelected] = useState<Encuentro | null>(null)

  const isSuperAdmin = profile?.role === 'superadmin'
  const years = useMemo(
    () =>
      Array.from(
        new Set(
          encuentros
            .map((e) => e.fecha?.slice(0, 4))
            .filter((year): year is string => Boolean(year))
        )
      )
        .sort()
        .reverse(),
    [encuentros]
  )

  const filtered = useMemo(() => encuentros.filter(e => {
    if (campusFilter !== 'all' && e.campus_id !== campusFilter) return false
    if (yearFilter !== 'all' && !e.fecha?.startsWith(yearFilter)) return false
    if (search) {
      const q = search.toLowerCase()
      return e.nombre_encuentro?.toLowerCase().includes(q) || e.predicador?.toLowerCase().includes(q) || e.nombre_mensaje?.toLowerCase().includes(q)
    }
    return true
  }), [encuentros, campusFilter, yearFilter, search])

  function exportCSV() {
    const headers = ['Fecha','Campus','Encuentro','Modalidad','Predicador','Mensaje','Asistencia Auditorio','Kids','Tweens','Sala bebé','Sensorial','Aceptaron Jesús Presencial','Total General','Vol. Servicio','Vol. Técnica','Vol. Worship','Vol. Kids','Vol. Tweens','Vol. RRSS','Vol. Seguridad','Vol. Cocina','Vol. Oración','Vol. Sala bebés','Vol. Conexión','Vol. Merch','Vol. Amor casa','Vol. Sensorial','Vol. P.Siembra','Aceptaron Jesús Online','Espectadores','Líderes Voluntarios','Adm. Campus']
    const rows = filtered.map(e => {
      const c = campuses.find(c => c.id === e.campus_id)
      return [e.fecha,c?.name||'',e.nombre_encuentro,e.modalidad,e.predicador,e.nombre_mensaje||'',
        e.asistencia_auditorio,e.asistencia_kids,e.asistencia_tweens,e.asistencia_sala_bebe,e.asistencia_sala_sensorial,
        e.acepto_jesus_presencial,e.total_general,
        e.vol_servicio,e.vol_tecnica,e.vol_worship,e.vol_kids,e.vol_tweens,e.vol_rrss,e.vol_seguridad,e.vol_cocina,e.vol_oracion,e.vol_sala_bebes,e.vol_conexion,e.vol_merch,e.vol_amor_casa,e.vol_sala_sensorial,e.vol_punto_siembra,
        e.acepto_jesus_online,e.espectadores,e.lideres_voluntarios||'',e.adm_campus||''].join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `encuentros_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const modalStyle = (m: string) =>
    m === 'Presencial' ? 'bg-blue-50 text-blue-700 border border-blue-100'
    : m === 'Online' ? 'bg-orange-50 text-orange-700 border border-orange-100'
    : 'bg-purple-50 text-purple-700 border border-purple-100'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Historial de encuentros</h1>
          <p className="text-sm text-ink-400 mt-0.5 font-medium">{filtered.length} registros encontrados</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por encuentro, predicador o mensaje..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        {isSuperAdmin && (
          <select value={campusFilter} onChange={e => setCampusFilter(e.target.value)} className="input-field w-44">
            <option value="all">Todos los campus</option>
            {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="input-field w-36">
          <option value="all">Todos los años</option>
          {years.map(y => <option key={y} value={y!}>{y}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>
                <th className="text-left py-3.5 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Fecha</th>
                {isSuperAdmin && <th className="text-left py-3.5 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Campus</th>}
                <th className="text-left py-3.5 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Encuentro</th>
                <th className="text-left py-3.5 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Predicador</th>
                <th className="text-right py-3.5 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Auditorio</th>
                <th className="text-right py-3.5 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">A Jesús</th>
                <th className="text-left py-3.5 px-4 text-[10px] font-bold text-ink-400 uppercase tracking-widest">Modalidad</th>
                <th className="py-3.5 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const campus = campuses.find(c => c.id === e.campus_id)
                const jesus = (e.acepto_jesus_presencial || 0) + (e.acepto_jesus_online || 0)
                return (
                  <tr
                    key={e.id}
                    className="border-b border-ink-50 hover:bg-ink-50 transition-colors cursor-pointer"
                    onClick={() => setSelected(e)}
                  >
                    <td className="py-3.5 px-4 text-ink-500 font-medium whitespace-nowrap">
                      {e.fecha ? format(parseISO(e.fecha), 'dd MMM yyyy', { locale: es }) : '—'}
                    </td>
                    {isSuperAdmin && <td className="py-3.5 px-4 text-ink-500">{campus?.name || '—'}</td>}
                    <td className="py-3.5 px-4 font-semibold text-ink-900">{e.nombre_encuentro}</td>
                    <td className="py-3.5 px-4 text-ink-600">{e.predicador}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-ink-900">{(e.asistencia_auditorio || 0).toLocaleString('es-CL')}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-brand-600">{jesus.toLocaleString('es-CL')}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${modalStyle(e.modalidad)}`}>
                        {e.modalidad}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-ink-300">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-ink-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-sm font-semibold text-ink-400">No se encontraron encuentros</p>
                      <p className="text-xs text-ink-300">Intenta con otros filtros</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-ink-950/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-[0_20px_60px_-10px_rgb(0_0_0/0.25)] max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-ink-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="font-bold text-ink-900 text-base">{selected.nombre_encuentro}</h2>
                <p className="text-sm text-ink-400 mt-0.5 capitalize">
                  {selected.fecha ? format(parseISO(selected.fecha), "EEEE dd 'de' MMMM yyyy", { locale: es }) : ''}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-ink-100 text-ink-400 transition-colors font-bold text-sm"
              >✕</button>
            </div>

            <div className="p-5 space-y-5">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Campus', campuses.find(c=>c.id===selected.campus_id)?.name || '—'],
                  ['Modalidad', selected.modalidad],
                  ['Predicador', selected.predicador],
                  ['Mensaje', selected.nombre_mensaje || '—'],
                ].map(([l,v]) => (
                  <div key={l} className="bg-ink-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest mb-1">{l}</p>
                    <p className="font-semibold text-ink-900 text-sm">{v}</p>
                  </div>
                ))}
              </div>

              {(selected.modalidad === 'Presencial' || selected.modalidad === 'Presencial+Online') && (
                <div>
                  <p className="section-title">Presencial</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {[
                      ['Aceptaron a Jesús', selected.acepto_jesus_presencial],
                      ['Total general', selected.total_general],
                      ['Auditorio', selected.asistencia_auditorio],
                      ['Kids', selected.asistencia_kids],
                      ['Tweens', selected.asistencia_tweens],
                      ['Sala bebé', selected.asistencia_sala_bebe],
                      ['Sala sensorial', selected.asistencia_sala_sensorial],
                    ].map(([l,v]) => (
                      <div key={l as string} className="bg-ink-50 rounded-xl p-3 border border-ink-100">
                        <p className="text-[10px] text-ink-400 font-semibold mb-0.5">{l}</p>
                        <p className="text-xl font-bold text-ink-900">{(v as number || 0).toLocaleString('es-CL')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="section-title">Voluntarios</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    ['Servicio', selected.vol_servicio],['Técnica', selected.vol_tecnica],
                    ['Worship', selected.vol_worship],['Kids', selected.vol_kids],
                    ['Tweens', selected.vol_tweens],['RRSS', selected.vol_rrss],
                    ['Seguridad', selected.vol_seguridad],['Cocina', selected.vol_cocina],
                    ['Oración', selected.vol_oracion],['Sala bebés', selected.vol_sala_bebes],
                    ['Conexión', selected.vol_conexion],['Merch', selected.vol_merch],
                    ['Amor casa', selected.vol_amor_casa],['Sensorial', selected.vol_sala_sensorial],
                    ['P. Siembra', selected.vol_punto_siembra],
                  ].map(([l,v]) => (
                    <div key={l as string} className="bg-ink-50 rounded-lg p-2.5 border border-ink-100">
                      <p className="text-[10px] text-ink-400 font-semibold">{l}</p>
                      <p className="font-bold text-ink-900">{v as number || 0}</p>
                    </div>
                  ))}
                </div>
              </div>

              {(selected.modalidad === 'Online' || selected.modalidad === 'Presencial+Online') && (
                <div>
                  <p className="section-title">Online</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-ink-50 rounded-xl p-3 border border-ink-100">
                      <p className="text-[10px] text-ink-400 font-semibold mb-0.5">Aceptaron a Jesús</p>
                      <p className="text-xl font-bold text-ink-900">{selected.acepto_jesus_online || 0}</p>
                    </div>
                    <div className="bg-ink-50 rounded-xl p-3 border border-ink-100">
                      <p className="text-[10px] text-ink-400 font-semibold mb-0.5">Espectadores a la vez</p>
                      <p className="text-xl font-bold text-ink-900">{selected.espectadores || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              {(selected.lideres_voluntarios || selected.adm_campus || selected.observaciones) && (
                <div>
                  <p className="section-title">Notas</p>
                  <div className="bg-ink-50 rounded-xl p-4 border border-ink-100 space-y-2 text-sm">
                    {selected.lideres_voluntarios && (
                      <p><span className="text-ink-400 font-semibold">Líderes:</span> <span className="font-medium text-ink-800">{selected.lideres_voluntarios}</span></p>
                    )}
                    {selected.adm_campus && (
                      <p><span className="text-ink-400 font-semibold">Admins:</span> <span className="font-medium text-ink-800">{selected.adm_campus}</span></p>
                    )}
                    {selected.observaciones && (
                      <p><span className="text-ink-400 font-semibold">Obs:</span> <span className="text-ink-700">{selected.observaciones}</span></p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
