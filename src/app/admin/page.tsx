import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*, campus:campus_id(id, name)')
    .order('created_at', { ascending: false })

  const { data: campuses } = await supabase
    .from('campus')
    .select('*')
    .eq('active', true)
    .order('name')

  return <AdminClient users={users ?? []} campuses={campuses ?? []} />
}
