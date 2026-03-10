import { http } from './http'

export enum CordaType {
  UNICA = 'UNICA',
  DUPLA = 'DUPLA',
  COM_PONTAS = 'COM_PONTAS'
}

export type Graduation = {
  id: string
  name: string
  description?: string
  category?: string
  grau?: number
  cordaType?: CordaType
  color?: string
  colorLeft?: string
  colorRight?: string
  pontaLeft?: string
  pontaRight?: string
  order: number
  active: boolean
}

export type SystemSettings = {
  organizationId?: string
  groupName: string
  logoUrl: string
  themeColor: string
  defaultMonthlyFee?: number
  defaultPaymentMethod?: string
  graduations?: Graduation[]
}

export async function getSettings() {
  return http<SystemSettings>('/settings')
}

export async function updateSettings(data: Partial<SystemSettings>) {
  return http<SystemSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}
