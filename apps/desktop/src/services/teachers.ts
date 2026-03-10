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
  nickname?: string
  notes?: string
  userId?: string
  units?: {
    id: string
    name: string
    color?: string
    defaultMonthlyFeeCents?: number
    defaultPaymentMethod?: string
    turmas: (Turma & { schedules?: any[] })[]
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
    capoeira_name: student.nickname || (nicknameMatch ? nicknameMatch[1].trim() : undefined),
    graduation: (student as any).graduation || (graduationMatch ? graduationMatch[1].trim() : ''),
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
      capoeira_name: t.nickname || (nicknameMatch ? nicknameMatch[1].trim() : undefined),
      nickname: t.nickname || (nicknameMatch ? nicknameMatch[1].trim() : undefined),
      graduation: t.graduation || (graduationMatch ? graduationMatch[1].trim() : ''),
      phone: t.phone,
      email: t.email,
      status: t.status,
      units: t.units,
      notes: t.notes
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
    capoeira_name: res.nickname || (nicknameMatch ? nicknameMatch[1].trim() : undefined),
    nickname: res.nickname || (nicknameMatch ? nicknameMatch[1].trim() : undefined),
    graduation: res.graduation || (graduationMatch ? graduationMatch[1].trim() : ''),
    notes: res.notes
  }
}

export async function createTeacher(data: any) {
  return http<Teacher>('/teachers', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

export async function updateTeacher(id: string, data: any) {
  return http<Teacher>(`/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  })
}

export async function updateTeacherAssignments(teacherId: string, turmaIds: string[]) {
  return http(`/teachers/${teacherId}/assignments`, {
    method: 'PUT',
    body: JSON.stringify({ turma_ids: turmaIds })
  })
}
