import { unmask } from './masks'

export function validateCPF(cpf: string): boolean {
  const cleanCPF = unmask(cpf)
  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false

  let sum = 0
  let remainder

  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i)
  }
  remainder = (sum * 10) % 11

  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false

  sum = 0
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i)
  }
  remainder = (sum * 10) % 11

  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false

  return true
}

export function validateDate(date: string): boolean {
  if (date.length !== 10) return false
  const [day, month, year] = date.split('/').map(Number)
  
  if (year < 1900 || year > new Date().getFullYear()) return false
  if (month < 1 || month > 12) return false
  
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return false
  
  // Future date check
  const inputDate = new Date(year, month - 1, day)
  if (inputDate > new Date()) return false

  return true
}

export function validatePhone(phone: string): boolean {
  const cleanPhone = unmask(phone)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11
}
