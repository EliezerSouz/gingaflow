import { API_BASE } from '../lib/api'

export type User = {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'PROFESSOR'
  relatedId?: string
}

export async function listUsers() {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/users`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Falha ao listar usuários')
  return res.json() as Promise<User[]>
}

export async function updateUser(id: string, data: Partial<User> & { password?: string }) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Falha ao atualizar usuário')
  return res.json()
}

export async function deleteUser(id: string) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) throw new Error('Falha ao remover usuário')
}
