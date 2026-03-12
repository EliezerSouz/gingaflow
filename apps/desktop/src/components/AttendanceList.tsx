import React, { useState } from 'react'
import { Card, Button, Icon, Badge, EmptyState } from '@gingaflow/ui'
import { Student, parseStudentExtra } from '../services/students'
import { attendanceRepository } from '../repositories/attendanceRepository'
import { useAuth } from '../contexts/AuthContext'

export type AttendanceRecord = {
  id?: string
  studentId: string
  turmaId: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED'
  notes?: string
}

interface AttendanceListProps {
  turmaId: string
  students: Student[]
  date: string
  onAttendanceChange?: () => void
}

export default function AttendanceList({ turmaId, students, date, onAttendanceChange }: AttendanceListProps) {
  const { auth } = useAuth()
  const [attendance, setAttendance] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'JUSTIFIED'>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  React.useEffect(() => {
    loadAttendance()
  }, [turmaId, date])

  async function loadAttendance() {
    try {
      setLoading(true)
      setError(null)
      
      const data = await attendanceRepository.getByTurmaAndDate(turmaId, date)
      
      const attendanceMap: Record<string, 'PRESENT' | 'ABSENT' | 'JUSTIFIED'> = {}
      data.forEach(record => {
        attendanceMap[record.student_id] = record.status
      })
      
      setAttendance(attendanceMap)
    } catch (err: any) {
      console.error('Erro ao carregar presenças:', err)
      // Se não houver registros, não é um erro
      if (err.response?.status !== 404) {
        setError('Erro ao carregar lista de presença')
      }
    } finally {
      setLoading(false)
    }
  }

  async function saveAttendance(studentId: string, status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED') {
    if (!auth.organizationId) return

    try {
      setSaving(true)
      setError(null)
      
      await attendanceRepository.save({
        organization_id: auth.organizationId,
        student_id: studentId,
        turma_id: turmaId,
        date,
        status
      })
      
      setAttendance(prev => ({
        ...prev,
        [studentId]: status
      }))
      
      onAttendanceChange?.()
    } catch (err: any) {
      console.error('Erro ao salvar presença:', err)
      setError('Erro ao salvar presença')
    } finally {
      setSaving(false)
    }
  }

  function handleAttendanceChange(studentId: string, status: 'PRESENT' | 'ABSENT' | 'JUSTIFIED') {
    saveAttendance(studentId, status)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-2 text-sm text-muted">Carregando lista de chamada...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState 
        title="Erro ao carregar lista" 
        description={error}
        action={
          <Button onClick={loadAttendance}>
            Tentar novamente
          </Button>
        }
      />
    )
  }

  if (students.length === 0) {
    return (
      <EmptyState 
        title="Nenhum aluno na turma" 
        description="Esta turma não possui alunos matriculados."
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-primary">
          Lista de Chamada - {new Date(date).toLocaleDateString('pt-BR')}
        </h3>
        <div className="flex items-center space-x-2">
          <Badge variant="neutral">
            {Object.values(attendance).filter(s => s === 'PRESENT').length} presentes
          </Badge>
          <Badge variant="neutral">
            {Object.values(attendance).filter(s => s === 'ABSENT').length} ausentes
          </Badge>
          <Badge variant="warning">
            {Object.values(attendance).filter(s => s === 'JUSTIFIED').length} justificados
          </Badge>
        </div>
      </div>

      {saving && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-800">Salvando...</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {students.map(student => (
          <Card key={student.id} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-primary flex items-center gap-2">
                   {student.full_name}
                   {student.status === 'DELINQUENT' && <Badge variant="danger">INADIMPLENTE</Badge>}
                </div>
                <div className="text-xs text-secondary">{parseStudentExtra(student).graduation || 'Sem graduação'}</div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant={attendance[student.id] === 'PRESENT' ? 'primary' : 'secondary'}
                  onClick={() => handleAttendanceChange(student.id, 'PRESENT')}
                  disabled={saving}
                >
                  <Icon name="check" className="mr-1" />
                  Presente
                </Button>
                
                <Button
                  size="sm"
                  variant={attendance[student.id] === 'ABSENT' ? 'danger' : 'secondary'}
                  onClick={() => handleAttendanceChange(student.id, 'ABSENT')}
                  disabled={saving}
                >
                  <Icon name="x" className="mr-1" />
                  Ausente
                </Button>
                
                <Button
                  size="sm"
                  variant={attendance[student.id] === 'JUSTIFIED' ? 'secondary' : 'ghost'}
                  onClick={() => handleAttendanceChange(student.id, 'JUSTIFIED')}
                  disabled={saving}
                >
                  <Icon name="minus" className="mr-1" />
                  Justificado
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
