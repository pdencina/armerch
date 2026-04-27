import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  try {
    const supabase = getAdminClient()
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, active, campus_id, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const { data: campus } = await supabase
      .from('campus').select('id, name').eq('active', true).order('name')

    return NextResponse.json({ profiles: profiles ?? [], campus: campus ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, password, ...profileUpdates } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    const supabase = getAdminClient()

    // ── Cambiar contraseña en Supabase Auth ────────────────────
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Contraseña mínimo 6 caracteres' }, { status: 400 })
      }
      const { error: pwError } = await supabase.auth.admin.updateUserById(id, { password })
      if (pwError) return NextResponse.json({ error: pwError.message }, { status: 500 })

      // Si solo viene password sin otros campos, retornar aquí
      if (Object.keys(profileUpdates).length === 0) {
        return NextResponse.json({ success: true })
      }
    }

    // ── Actualizar perfil ──────────────────────────────────────
    if (Object.keys(profileUpdates).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
