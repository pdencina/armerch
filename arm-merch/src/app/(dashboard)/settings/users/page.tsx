'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import UsersClient from './users-client'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setUsers(data ?? []))
  }, [])

  return <UsersClient initialUsers={users} />
}
