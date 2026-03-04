// URL pública tunelada para acesso externo (copie do terminal do ngrok da API)
// Copie aqui o mesmo link que você colocou no App Mobile
export const EXTERNAL_API_URL = '';

export const API_BASE = EXTERNAL_API_URL || 'http://localhost:5175';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
};

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Falha ao entrar')
  }
  return res.json()
}

export async function me(token: string) {
  const res = await fetch(`${API_BASE}/me`, {
    headers: {
      ...defaultHeaders,
      Authorization: `Bearer ${token}`
    }
  })
  if (!res.ok) throw new Error('Não autenticado')
  return res.json()
}

export async function createUser(data: { name: string; email: string; password: string; role: 'ADMIN' | 'PROFESSOR'; relatedId?: string }) {
  const token = localStorage.getItem('token') || ''
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: {
      ...defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'Falha ao criar usuário')
  }
  return res.json()
}
