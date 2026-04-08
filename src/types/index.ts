export type Role = 'superadmin' | 'admin_campus' | 'voluntario' | 'viewer'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: Role
  campus_id: string | null
  campus?: Campus
}

export interface Campus {
  id: string
  name: string
  city: string
  country: string
  active: boolean
}

export interface Encuentro {
  id: string
  campus_id: string
  fecha: string
  nombre_encuentro: string
  modalidad: 'Presencial' | 'Online' | 'Presencial+Online'
  predicador: string
  nombre_mensaje: string | null

  // Presencial
  acepto_jesus_presencial: number
  total_general: number
  asistencia_auditorio: number
  asistencia_kids: number
  asistencia_tweens: number
  asistencia_sala_bebe: number
  asistencia_sala_sensorial: number

  // Voluntarios
  vol_servicio: number
  vol_tecnica: number
  vol_kids: number
  vol_tweens: number
  vol_worship: number
  vol_cocina: number
  vol_rrss: number
  vol_seguridad: number
  vol_sala_bebes: number
  vol_conexion: number
  vol_oracion: number
  vol_merch: number
  vol_amor_casa: number
  vol_sala_sensorial: number
  vol_punto_siembra: number

  // Online
  acepto_jesus_online: number
  espectadores: number

  // Líderes
  lideres_voluntarios: string | null
  adm_campus: string | null

  observaciones: string | null
  created_by: string
  created_at: string
  campus?: Campus
}

export interface DashboardStats {
  total_asistencia: number
  total_jesus: number
  total_eventos: number
  avg_asistencia: number
}
