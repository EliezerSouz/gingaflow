import { http } from './http'

export type Student = {
  id: string
  full_name: string
  nickname?: string
  cpf: string
  birth_date?: string
  email?: string
  phone?: string
  enrollment_date: string
  status: string
  notes?: string
  currentGraduationId?: string
  activities?: any[]
  studentTurmas?: any[]
  graduations?: any[]
  receivables?: any[]
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

  // ── Priority 1: Relational data (new system) ──────────────────────────────
  const turmaLinks: any[] = (student as any).studentTurmas || []
  const turmaNames   = turmaLinks.map((st: any) => st.turma?.name   || '').filter(Boolean)
  const unitNames    = [...new Set(turmaLinks.map((st: any) => st.turma?.unit?.name  || '').filter(Boolean))]
  const teacherNames = [...new Set(turmaLinks.map((st: any) =>
    st.turma?.teacher?.full_name || st.turma?.teacher?.nickname || ''
  ).filter(Boolean))]

  // Graduation resolution (most reliable → least reliable):
  //  1. currentGraduation (Prisma include object) → name
  //  2. level field (API-enriched on graduations[0])
  //  3. newGraduationLevel.name (from our manual batch lookup)
  //  4. graduations[0].graduation?.name (if deep relation somehow present)
  //  5. Legacy notes text
  const currentGraduationObj: any = (student as any).currentGraduation
  const graduationArr: any[] = (student as any).graduations || []
  const latestGrad = graduationArr.length > 0 ? graduationArr[0] : null
  const graduationRelational =
    (student as any).level ||          // API enriches this: currentGraduation?.name (most reliable)
    currentGraduationObj?.name ||
    latestGrad?.level ||
    latestGrad?.newGraduationLevel?.name ||
    latestGrad?.graduation?.name ||
    ''

  // ── Priority 2: Notes-based legacy parsing (old records) ─────────────────
  const teacherMatch        = notes.match(/Professor\s*:\s*(.*)/i)
  const classMatch          = notes.match(/Turma\s*:\s*(.*)/i)
  const unitMatch           = notes.match(/Unidade\s*:\s*(.*)/i)
  const respMatchMobile     = notes.match(/\[RESPONSÁVEL\]\r?\nNome: (.*)\r?\nCPF: (.*)\r?\nParentesco: (.*)\r?\nTelefone: (.*)/)
  const gradMatchMobile     = notes.match(/\[(?:CAPOEIRA|ATIVIDADE)\]\r?\nGraduação Inicial: (.*)/)
  const graduationLegacy    = notes.match(/Graduação Inicial: (.*)/)
  const finMatchMobile      = notes.match(/\[FINANCEIRO\]\r?\nMensalidade: (.*)\r?\nVencimento: Dia (.*)\r?\nForma Pagamento: (.*)/)
  const dueDayMatch         = notes.match(/Vencimento: Dia (\d{1,2})/)
  const financialStatusMatch = notes.match(/Situação: (.*)/)
  const nextDueDateMatch    = notes.match(/Próximo Vencimento: (.*)/)

  const historyBlockMatch = notes.match(/\[HISTORICO_GRADUACAO\]([\s\S]*?)(\[|$)/)
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
      if (targetMonth > 11) { targetMonth = 0; targetYear++ }
      const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
      targetDay = Math.min(dueDay, daysInTargetMonth)
    }
    return new Date(targetYear, targetMonth, targetDay).toISOString().split('T')[0]
  }

  const storedNextDueDate  = nextDueDateMatch?.[1]?.trim() || ''
  const computedNextDueDate = computeNextDueDateFromDay(finMatchMobile?.[2] || dueDayMatch?.[1])

  // ── Merge: relational data wins over legacy notes ─────────────────────────
  const resolvedUnit    = unitNames.join(', ')    || unitMatch?.[1]    || ''
  const resolvedTurma   = turmaNames.join(', ')   || classMatch?.[1]   || ''
  const resolvedTeacher = teacherNames.join(', ') || teacherMatch?.[1] || ''
  const resolvedGrad    = graduationRelational    || gradMatchMobile?.[1] || graduationLegacy?.[1] || ''

  return {
    teacher:      resolvedTeacher,
    turma:        resolvedTurma,
    group_class:  resolvedTurma,
    unit:         resolvedUnit,
    graduation:   resolvedGrad,
    responsible: respMatchMobile ? {
      name:         respMatchMobile[1],
      cpf:          respMatchMobile[2],
      relationship: respMatchMobile[3],
      phone:        respMatchMobile[4]?.trim() || ''
    } : null,
    financeiro: finMatchMobile ? {
      mensalidade:   finMatchMobile[1],
      vencimentoDia: finMatchMobile[2]?.trim(),
      metodo:        finMatchMobile[3]
    } : null,
    nextDueDate:     storedNextDueDate || computedNextDueDate,
    next_due_date:   storedNextDueDate || computedNextDueDate,
    dueDay:          finMatchMobile?.[2] || dueDayMatch?.[1] || '',
    financialStatus: financialStatusMatch?.[1] || '',
    graduation_history
  }
}

