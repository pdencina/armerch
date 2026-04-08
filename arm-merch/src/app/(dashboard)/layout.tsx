import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import Sidebar from '@/components/layout/sidebar'
import Navbar from '@/components/layout/navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar role={user.role} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar user={user} />
        <main className="flex-1 overflow-auto bg-zinc-900 rounded-tl-2xl p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
