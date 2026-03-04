const API_BASE = 'http://localhost:5175'

function getToken() {
  return localStorage.getItem('token') || ''
}

export async function http<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined)
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const error = new Error(err.message || `Erro HTTP ${res.status}`)
    Object.assign(error, err) // Attach extra fields like 'details'
    throw error
  }
  
  if (res.status === 204) {
    return {} as T
  }
  
  const text = await res.text()
  try {
    return text ? (JSON.parse(text) as T) : ({} as T)
  } catch (e) {
    console.warn('Failed to parse JSON response', text)
    return {} as T
  }
}

