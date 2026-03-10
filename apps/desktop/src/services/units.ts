import { http } from './http'

export type Unit = {
  id: string
  name: string
  address?: string
  color?: string
  defaultMonthlyFeeCents?: number
  defaultPaymentMethod?: string
  status: 'ATIVA' | 'INATIVA'
}

export type Turma = {
  id: string
  name: string
  unitId: string
  schedule?: string
  schedules?: any[]
  defaultMonthlyFeeCents?: number
  defaultPaymentMethod?: string
  status: 'ATIVA' | 'INATIVA'
}

export async function listUnits() {
  return http<{ data: Unit[] }>('/units')
}

export async function createUnit(data: Omit<Unit, 'id'>) {
  return http<Unit>('/units', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateUnit(id: string, data: Partial<Unit>) {
  return http<Unit>(`/units/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function listUnitTurmas(unitId: string) {
  return http<{ data: Turma[] }>(`/units/${unitId}/turmas`)
}

export async function createTurma(data: Omit<Turma, 'id'>) {
  return http<Turma>('/turmas', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateTurma(id: string, data: Partial<Turma>) {
  return http<Turma>(`/turmas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}
