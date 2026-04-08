import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HistorialClient from './HistorialClient'

export default async function HistorialPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, campus:campus_id(id,name)')
    .eq('id', user.id)
    .single()

  let query = supabase
    .from('encuentros')
    .select('*, campus:campus_id(id,name)')
    .order('fecha', { ascending: false })

  if (profile?.role !== 'superadmin') {
    query = query.eq('campus_id', profile?.campus_id)
  }

  const { data: encuentros } = await query
  const { data: campuses } = await supabase
    .from('campus')
    .select('*')
    .eq('active', true)
    .order('name')

  return <HistorialClient encuentros={encuentros ?? []} campuses={campuses ?? []} profile={profile} />
}
