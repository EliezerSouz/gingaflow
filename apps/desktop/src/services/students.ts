import { http } from './http'

export type Student = {
  id: string
  full_name: string
  cpf: string
  birth_date?: string
  email?: string
  phone?: string
  enrollment_date: string
  status: string
  notes?: string
  currentGraduationId?: string
}

export async function listStudents(params: { 
  page?: number; 
  per_page?: number; 
  q?: string; 
  teacher_name?: string; 
  status?: string;
  unit?: string;
  turma?: string;
}) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.per_page) query.set('per_page', String(params.per_page))
  if (params.q) query.set('q', params.q)
  if (params.teacher_name) query.set('teacher_name', params.teacher_name)
  if (params.status) query.set('status', params.status)
  if (params.unit) query.set('unit', params.unit)
  if (params.turma) query.set('turma', params.turma)
  return http<{ data: Student[]; meta: { page: number; per_page: number; total: number; page_count: number } }>(
    `/students?${query.toString()}`
  )
}

export async function getStudent(id: string) {
  return http<Student>(`/students/${id}`)
}

export async function createStudent(data: Omit<Student, 'id'>) {
  return http<Student>('/students', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateStudent(id: string, data: Partial<Student>) {
  return http<Student>(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function getTeachers() {
  return http<{ data: Pick<Student, 'id' | 'full_name' | 'notes'>[] }>('/teachers')
}

export async function promoteStudent(id: string, data: {
    newGraduationId: string
    date: string
    teacherId: string
    type: 'PROMOTION' | 'ADJUSTMENT' | 'CORRECTION'
    notes?: string
}) {
    return http(`/students/${id}/promote`, {
        method: 'POST',
        body: JSON.stringify(data)
    })
}

export async function getGraduations(id: string) {
    return http<{ data: any[] }>(`/students/${id}/graduations`)
}

export function parseStudentExtra(student: Student) {
  const notes = student.notes || ''
  
  // Capoeira
  const teacherMatch = notes.match(/Professor\s*:\s*(.*)/i)
  const classMatch = notes.match(/Turma\s*:\s*(.*)/i)
  const unitMatch = notes.match(/Unidade\s*:\s*(.*)/i)
  const graduationMatch = notes.match(/Graduação Inicial: (.*)/)
  
  // Responsável
  const respNameMatch = notes.match(/\[RESPONSÁVEL\][\s\S]*?Nome: (.*)/)
  const respCpfMatch = notes.match(/\[RESPONSÁVEL\][\s\S]*?CPF: (.*)/)
  const respRelMatch = notes.match(/\[RESPONSÁVEL\][\s\S]*?Parentesco: (.*)/)
  const respPhoneMatch = notes.match(/\[RESPONSÁVEL\][\s\S]*?Telefone: (.*)/)

  // Financeiro
  const nextDueDateMatch = notes.match(/Próximo Vencimento: (.*)/)
  const dueDayMatch = notes.match(/Vencimento: Dia (\d{1,2})/)
  const financialStatusMatch = notes.match(/Situação: (.*)/)

  // Histórico de Graduação
  const historyBlockMatch = notes.match(/\[HISTÓRICO_GRADUAÇÃO\]([\s\S]*?)(\[|$)/)
  const graduation_history = historyBlockMatch 
    ? historyBlockMatch[1].trim().split('\n').map(line => {
        const [date, graduation] = line.split('|')
        return { date: date?.trim(), graduation: graduation?.trim() }
      }).filter(h => h.date && h.graduation)
    : []

  function computeNextDueDateFromDay(dueDayStr: string | undefined): string {
    if (!dueDayStr) return ''
    const dueDay = parseInt(dueDayStr, 10)
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) return ''
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const daysInThisMonth = new Date(year, month + 1, 0).getDate()
    const targetDayThisMonth = Math.min(dueDay, daysInThisMonth)
    const candidate = new Date(year, month, targetDayThisMonth)
    let targetYear = year
    let targetMonth = month
    let targetDay = targetDayThisMonth
    if (candidate <= today) {
      targetMonth = month + 1
      if (targetMonth > 11) {
        targetMonth = 0
        targetYear++
      }
      const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
      targetDay = Math.min(dueDay, daysInTargetMonth)
    }
    const d = new Date(targetYear, targetMonth, targetDay)
    return d.toISOString().split('T')[0]
  }

  const computedNextDueDate = computeNextDueDateFromDay(dueDayMatch?.[1])

  return {
    teacher: teacherMatch?.[1] || '',
    turma: classMatch?.[1] || '',
    unit: unitMatch?.[1] || '',
    graduation: student.currentGraduationId || graduationMatch?.[1] || '',
    respName: respNameMatch?.[1] || '',
    respCpf: respCpfMatch?.[1] || '',
    respRel: respRelMatch?.[1] || '',
    respPhone: respPhoneMatch?.[1] || '',
    nextDueDate: nextDueDateMatch?.[1] || computedNextDueDate || '',
    dueDay: dueDayMatch?.[1] || '',
    financialStatus: financialStatusMatch?.[1] || '',
    graduation_history
  }
}
