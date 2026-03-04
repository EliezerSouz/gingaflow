import React, { useState } from 'react'
import { Button, Input } from '@gingaflow/ui'
import { login } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('admin@gingaflow.local')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await login(email, password)
      localStorage.setItem('token', res.token)
      setAuth({ token: res.token, role: res.user.role, name: res.user.name, relatedId: res.user.relatedId, loading: false })
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-lg bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">Entrar</h1>
        <p className="mt-1 text-sm text-gray-600">Use o usuário inicial</p>
        <div className="mt-4 space-y-3">
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Senha" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
          <Button type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</Button>
        </div>
      </form>
    </div>
  )
}
