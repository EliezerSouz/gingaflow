import React, { useState, useEffect } from 'react'
import { Card, Button, Icon, Badge, EmptyState } from '@gingaflow/ui'
import { useAuth } from '../contexts/AuthContext'
import { getTeacher, Teacher } from '../services/teachers'
import { listStudents, Student } from '../services/students'
import { formatSchedule, parseSchedule } from '../utils/schedule'
import AttendanceList from '../components/AttendanceList'

export default function AttendancePage() {
  const { auth } = useAuth()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [selectedTurma, setSelectedTurma] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (auth.role === 'PROFESSOR' && auth.relatedId) {
      loadTeacherData()
    } else {
      setLoading(false)
    }
  }, [auth])

  useEffect(() => {
    if (selectedTurma) {
      loadTurmaStudents()
    }
  }, [selectedTurma])

  async function loadTeacherData() {
    try {
      setLoading(true)
      setError(null)
      const foundTeacher = await getTeacher(auth.relatedId!)
      if (foundTeacher) {
        setTeacher(foundTeacher)
      } else {
        setError('Professor não encontrado')
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do professor:', err)
      setError(err.message || 'Erro ao carregar dados do professor')
    } finally {
      setLoading(false)
    }
  }

  async function loadTurmaStudents() {
    try {
      setLoading(true)
      setError(null)
      
      const response = await listStudents({
        turma: selectedTurma.id,
        status: 'ATIVO'
      })
      
      setStudents(response.data)
    } catch (err: any) {
      console.error('Erro ao carregar alunos da turma:', err)
      setError(err.message || 'Erro ao carregar alunos da turma')
    } finally {
      setLoading(false)
    }
  }

  function handleTurmaSelect(turma: any) {
    setSelectedTurma(turma)
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedDate(e.target.value)
  }

  if (loading && !teacher) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState 
        title="Erro ao carregar dados" 
        description={error}
        action={
          <Button onClick={loadTeacherData}>
            Tentar novamente
          </Button>
        }
      />
    )
  }

  if (!teacher || !teacher.units || teacher.units.length === 0) {
    return (
      <EmptyState 
        title="Nenhuma turma atribuída" 
        description="Você não está vinculado a nenhuma turma no momento."
      />
    )
  }

  // Agrupar turmas por unidade com cor
  const turmasByUnit: Array<{ unitName: string; unitColor?: string; turmas: any[] }> = (teacher.units || []).map(u => ({
    unitName: u.name,
    unitColor: (u as any).color,
    turmas: u.turmas
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-primary">Lista de Chamada</h2>
          <p className="text-sm text-muted">
            Controle de presença dos alunos
          </p>
        </div>
        <Button variant="secondary" onClick={loadTeacherData}>
          <Icon name="refresh" className="mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Seletor de Turma por Unidade */}
      <Card className="p-4">
        <h3 className="font-medium text-primary mb-3">Selecionar Turma</h3>
        <div className="space-y-4">
          {turmasByUnit.map(group => (
            <div key={group.unitName}>
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className="inline-block w-2 h-6 rounded-sm border border-gray-100"
                  style={{ backgroundColor: group.unitColor || '#64748B' }}
                  title={`Cor da unidade: ${group.unitColor || '#64748B'}`}
                />
                <span className="text-sm font-medium text-secondary">{group.unitName}</span>
              </div>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {group.turmas.map(turma => (
                  <Button
                    key={turma.id}
                    variant={selectedTurma?.id === turma.id ? 'primary' : 'secondary'}
                    onClick={() => handleTurmaSelect({ ...turma, unitName: group.unitName, unitColor: group.unitColor })}
                    className={
                      'justify-start transition-all ' + 
                      (selectedTurma?.id === turma.id ? 'ring-2 ring-brand-500 shadow-sm' : '')
                    }
                  >
                    <div className="text-left">
                      <div className="font-medium">{turma.name}</div>
                      {turma.schedule && (
                        <div className="text-xs text-muted">
                          {formatSchedule(turma.schedule)}
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {selectedTurma && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span 
                className="inline-block w-2 h-6 rounded-sm border border-gray-100"
                style={{ backgroundColor: selectedTurma.unitColor || '#64748B' }}
              />
              <div>
                <h3 className="font-medium text-primary">{selectedTurma.name}</h3>
                <p className="text-sm text-muted">{selectedTurma.unitName}</p>
                {selectedTurma.schedule && (
                  <div className="text-xs text-secondary">{formatSchedule(selectedTurma.schedule)}</div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-secondary">Data:</div>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split('T')[0]}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          <AttendanceList
            turmaId={selectedTurma.id}
            students={students}
            date={selectedDate}
            onAttendanceChange={loadTurmaStudents}
          />
        </Card>
      )}

      {!selectedTurma && (
        <EmptyState 
          title="Selecione uma turma" 
          description="Escolha uma turma para ver a lista de chamada."
        />
      )}
    </div>
  )
}
