'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import UsersClient from './users-client'

export default function UsersPage() {
  const [users, setUsers]   = useState<any[]>([])
  const [campus, setCampus] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('profiles').select('*, campus:campus(id, name)').order('created_at', { ascending: false }),
      supabase.from('campus').select('id, name').eq('active', true).order('name'),
    ]).then(([{ data: u }, { data: c }]) => {
      setUsers(u ?? [])
      setCampus(c ?? [])
    })
  }, [])

  return <UsersClient initialUsers={users} initialCampus={campus} />
}
