import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { me } from '../lib/api'

export type Role = 'ADMIN' | 'PROFESSOR'

export type AuthState = {
  token: string | null
  role: Role | null
  name: string | null
  organizationId: string | null
  relatedId: string | null
  loading: boolean
}

const AuthContext = createContext<{
  auth: AuthState
  setAuth: React.Dispatch<React.SetStateAction<AuthState>>
}>({
  auth: { token: null, role: null, name: null, organizationId: null, relatedId: null, loading: false },
  setAuth: () => {}
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem('token')
    return { token, role: null, name: null, organizationId: null, relatedId: null, loading: !!token }
  })

  useEffect(() => {
    if (!auth.token) {
      if (auth.loading) setAuth(a => ({ ...a, loading: false }))
      return
    }
    let cancelled = false
    me(auth.token)
      .then(user => {
        if (cancelled) return
        setAuth(a => ({ 
          ...a, 
          role: user.role, 
          name: user.name, 
          organizationId: user.organizationId,
          relatedId: user.relatedId, 
          loading: false 
        }))
      })
      .catch(() => {
        if (cancelled) return
        setAuth({ token: null, role: null, name: null, organizationId: null, relatedId: null, loading: false })
        localStorage.removeItem('token')
      })
    return () => {
      cancelled = true
    }
  }, [auth.token])

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
