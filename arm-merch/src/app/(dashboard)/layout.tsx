import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/sidebar'
import Navbar from '@/components/layout/navbar'

type UserRole = 'super_admin' | 'admin' | 'voluntario'
interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  active: boolean
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profileRaw) redirect('/login')

  const profile = profileRaw as unknown as Profile

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar role={profile.role} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar user={profile} />
        <main className="flex-1 overflow-auto bg-zinc-900 rounded-tl-2xl p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
