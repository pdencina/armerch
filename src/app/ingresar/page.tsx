import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import IngresarForm from './IngresarForm'

export default async function IngresarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, campus:campus_id(id,name)')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'viewer') redirect('/dashboard')

  const { data: campuses } = await supabase.from('campus').select('*').eq('active', true).order('name')

  return <IngresarForm profile={profile} campuses={campuses ?? []} />
}
