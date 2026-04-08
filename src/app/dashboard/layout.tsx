import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import type { UserProfile } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, campus:campus_id(id, name, city)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile as UserProfile} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
