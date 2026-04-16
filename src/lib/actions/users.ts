'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type UserRole = 'super_admin' | 'admin' | 'voluntario'

interface CreateUserInput {
  full_name: string
  email: string
  password: string
  role: UserRole
  campus_id?: string | null
}

interface UpdateUserInput {
  id: string
  full_name: string
  email: string
  role: UserRole
  campus_id?: string | null
  active?: boolean
}

export async function getUsers() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado', data: [] }

  const { data: callerRaw } = await supabase
    .from('profiles')
    .select('role, campus_id')
    .eq('id', user.id)
    .single()

  const caller = callerRaw as { role?: UserRole; campus_id?: string | null } | null

  if (!caller || !['super_admin', 'admin'].includes(caller.role ?? '')) {
    return { error: 'No autorizado', data: [] }
  }

  let query = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      role,
      active,
      campus_id,
      campus:campus(id, name)
    `)
    .order('full_name')

  if (caller.role !== 'super_admin' && caller.campus_id) {
    query = query.eq('campus_id', caller.campus_id)
  }

  const { data, error } = await query

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: (data ?? []) as any[] }
}

export async function createUser(input: CreateUserInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const { data: callerRaw } = await supabase
    .from('profiles')
    .select('role, campus_id')
    .eq('id', user.id)
    .single()

  const caller = callerRaw as { role?: UserRole; campus_id?: string | null } | null

  if (!caller || !['super_admin', 'admin'].includes(caller.role ?? '')) {
    return { error: 'No autorizado' }
  }

  if (caller.role !== 'super_admin') {
    if (!caller.campus_id || input.campus_id !== caller.campus_id) {
      return { error: 'Solo puedes crear usuarios para tu campus' }
    }
    if (input.role === 'super_admin') {
      return { error: 'No puedes crear un super admin' }
    }
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en variables de entorno' }
  }

  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const { createClient: createAdminClient } = await import('@supabase/supabase-js')

  const adminClient = createAdminClient(adminUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: createdAuth, error: authError } = await adminClient.auth.admin.createUser({
    email: input.email.trim(),
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.full_name,
    },
  })

  if (authError || !createdAuth.user) {
    return { error: authError?.message ?? 'No se pudo crear el usuario' }
  }

  const newUserId = createdAuth.user.id

  const campusIdToUse =
    caller.role === 'super_admin' ? (input.campus_id ?? null) : (caller.campus_id ?? null)

  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: newUserId,
      full_name: input.full_name,
      email: input.email.trim(),
      role: input.role,
      active: true,
      campus_id: campusIdToUse,
    })

  if (profileError) {
    await adminClient.auth.admin.deleteUser(newUserId)
    return { error: profileError.message }
  }

  revalidatePath('/users')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function updateUser(input: UpdateUserInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'No autenticado' }

  const { data: callerRaw } = await supabase
    .from('profiles')
    .select('role, campus_id')
    .eq('id', user.id)
    .single()

  const caller = callerRaw as { role?: UserRole; campus_id?: string | null } | null

  if (!caller || !['super_admin', 'admin'].includes(caller.role ?? '')) {
    return { error: 'No autorizado' }
  }

  const { data: targetRaw, error: targetError } = await supabase
    .from('profiles')
    .select('id, role, campus_id')
    .eq('id', input.id)
    .single()

  if (targetError || !targetRaw) {
    return { error: 'Usuario no encontrado' }
  }

  const target = targetRaw as { id: string; role?: UserRole; campus_id?: string | null }

  if (caller.role !== 'super_admin') {
    if (!caller.campus_id || target.campus_id !== caller.campus_id) {
      return { error: 'Solo puedes editar usuarios de tu campus' }
    }
    if (input.role === 'super_admin') {
      return { error: 'No puedes asignar rol super admin' }
    }
    if (input.campus_id !== caller.campus_id) {
      return { error: 'No puedes mover usuarios a otro campus' }
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: input.full_name,
      email: input.email.trim(),
      role: input.role,
      campus_id: input.campus_id ?? null,
      active: input.active ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/users')
  revalidatePath('/dashboard')

  return { success: true }
}