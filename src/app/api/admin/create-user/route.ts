import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Variables de entorno no configuradas' }, { status: 500 })
    }

    const { email, password, full_name, role, campus_id } = await req.json()

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Email, contraseña y nombre son obligatorios' }, { status: 400 })
    }

    // Intentar con service role primero (plan Pro)
    if (serviceKey) {
      const adminClient = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })

      const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      })

      if (!error && data?.user) {
        await adminClient.from('profiles').upsert({
          id: data.user.id,
          full_name,
          email,
          role: role ?? 'voluntario',
          campus_id: campus_id || null,
          active: true,
        })
        return NextResponse.json({ success: true, user_id: data.user.id, method: 'admin' })
      }
    }

    // Fallback: signUp normal (funciona en plan Free)
    // Usamos el cliente anon para crear el usuario
    const anonClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
        emailRedirectTo: undefined,
      }
    })

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 })
    }

    if (!signUpData?.user) {
      return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 })
    }

    // Actualizar perfil con rol y campus usando service role si está disponible
    const profileClient = serviceKey
      ? createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
      : anonClient

    await profileClient.from('profiles').upsert({
      id: signUpData.user.id,
      full_name,
      email,
      role: role ?? 'voluntario',
      campus_id: campus_id || null,
      active: true,
    })

    // Si el email no está confirmado automáticamente, confirmarlo con service role
    if (serviceKey && !signUpData.user.email_confirmed_at) {
      const adminClient = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      })
      await adminClient.auth.admin.updateUserById(signUpData.user.id, {
        email_confirm: true,
      })
    }

    return NextResponse.json({ success: true, user_id: signUpData.user.id, method: 'signup' })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
