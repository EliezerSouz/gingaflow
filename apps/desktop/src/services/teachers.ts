import { http } from './http'
import { Unit, Turma } from './units'
import { Student, createStudent, updateStudent, listStudents } from './students'
import { generateValidCpf } from '../utils/cpf'

export type Teacher = {
  id: string
  full_name: string
  cpf?: string
  capoeira_name?: string
  graduation: string
  phone?: string
  email?: string
  status: string
  units?: {
    id: string
    name: string
    color?: string
    defaultMonthlyFeeCents?: number
    defaultPaymentMethod?: string
    turmas: Turma[]
  }[]
}

const TEACHER_TAG = '[TIPO] PROFESSOR'

export function isTeacher(student: Student): boolean {
  return (student.notes || '').includes(TEACHER_TAG)
}

function parseTeacher(student: Student): Teacher {
  const notes = student.notes || ''
  const graduationMatch = notes.match(/Graduação(?: Inicial)?: (.*)/)
  const nicknameMatch = notes.match(/Apelido: (.*)/)
  
  return {
    id: student.id,
    full_name: student.full_name,
    cpf: student.cpf,
    capoeira_name: nicknameMatch ? nicknameMatch[1].trim() : undefined,
    graduation: graduationMatch ? graduationMatch[1].trim() : '',
    phone: student.phone,
    email: student.email,
    status: student.status
  }
}

export async function listTeachers() {
  const res = await http<{ data: any[] }>('/teachers')
  const teachers = res.data.map((t: any) => {
    const notes = t.notes || ''
    const graduationMatch = notes.match(/Graduação(?: Inicial)?: (.*)/)
    const nicknameMatch = notes.match(/Apelido: (.*)/)
    
    return {
      id: t.id,
      full_name: t.full_name,
      cpf: t.cpf,
      capoeira_name: nicknameMatch ? nicknameMatch[1].trim() : undefined,
      graduation: graduationMatch ? graduationMatch[1].trim() : '',
      phone: t.phone,
      email: t.email,
      status: t.status,
      units: t.units
    }
  })
  
  return {
    data: teachers,
    meta: {
      total: teachers.length
    }
  }
}

export async function getTeacher(id: string): Promise<Teacher> {
  const res = await http<any>(`/teachers/${id}`)
  
  const notes = res.notes || ''
  const graduationMatch = notes.match(/Graduação(?: Inicial)?: (.*)/)
  const nicknameMatch = notes.match(/Apelido: (.*)/)

  return {
    id: res.id,
    full_name: res.full_name,
    cpf: res.cpf,
    email: res.email,
    phone: res.phone,
    status: res.status,
    units: res.units,
    capoeira_name: nicknameMatch ? nicknameMatch[1].trim() : undefined,
    graduation: graduationMatch ? graduationMatch[1].trim() : ''
  }
}

export async function createTeacher(data: Omit<Teacher, 'id'>) {
  const extraInfo = `
${TEACHER_TAG}
[CAPOEIRA]
Apelido: ${data.capoeira_name || ''}
Graduação: ${data.graduation}

[CONTATO]
Email: ${data.email || ''}
Telefone: ${data.phone || ''}
`.trim()

  // Use provided CPF or generate one if missing (though it should be mandatory)
  // Strip non-digits to match student format
  const validCpf = (data.cpf || generateValidCpf()).replace(/\D/g, '')

  return createStudent({
    full_name: data.full_name,
    cpf: validCpf,
    birth_date: undefined,
    email: data.email,
    phone: data.phone,
    status: data.status,
    enrollment_date: new Date().toISOString().split('T')[0],
    notes: extraInfo
  })
}

export async function updateTeacher(id: string, data: Partial<Omit<Teacher, 'id'>>) {
  // First get current student data to preserve other fields if needed
  // But for now we just update the fields we manage
  
  const extraInfo = `
${TEACHER_TAG}
[CAPOEIRA]
Apelido: ${data.capoeira_name || ''}
Graduação: ${data.graduation || ''}

[CONTATO]
Email: ${data.email || ''}
Telefone: ${data.phone || ''}
`.trim()

  const updateData: any = {
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    status: data.status,
    notes: extraInfo
  }
  
  if (data.cpf) {
    updateData.cpf = data.cpf.replace(/\D/g, '')
  }

  // We need to import updateStudent from students service
  // But circular dependency might be an issue if students.ts imports teachers.ts
  // students.ts imports listTeachers? No, CreateStudentModal imports listTeachers.
  // services/students.ts usually doesn't import teachers.ts.
  
  // Let's use updateStudent from ./students
  return updateStudent(id, updateData)
}

export async function updateTeacherAssignments(teacherId: string, turmaIds: string[]) {
  return http(`/teachers/${teacherId}/assignments`, {
    method: 'PUT',
    body: JSON.stringify({ turma_ids: turmaIds })
  })
}
