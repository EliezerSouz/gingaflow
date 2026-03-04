import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Role = 'ADMIN' | 'PROFESSOR'

export function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element, allowedRoles: Role[] }) {
  const { auth } = useAuth()

  if (auth.loading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>
  }

  if (!auth.token) {
    return <Navigate to="/login" />
  }

  if (auth.role && !allowedRoles.includes(auth.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
