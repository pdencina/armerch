async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setLoading(true)
  setError('')

  console.log('🔵 Intentando login...')

  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })

  console.log('🟡 Resultado login:', { data, error })

  if (error) {
    console.error('🔴 Error login:', error)
    setError(error.message)
    setLoading(false)
    return
  }

  if (!data.session) {
    console.error('🔴 No hay sesión')
    setError('No se pudo iniciar sesión')
    setLoading(false)
    return
  }

  console.log('🟢 Login OK, redirigiendo...')

  window.location.href = '/dashboard'
}