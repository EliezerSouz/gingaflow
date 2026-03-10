import React, { useState, useEffect } from 'react'
import { Card, Button, Icon, Badge, EmptyState } from '@gingaflow/ui'
import { useAuth } from '../contexts/AuthContext'
import { getTeacher } from '../services/teachers'
import { listStudents, Student } from '../services/students'
import { formatSchedule } from '../utils/schedule'
import AttendanceList from '../components/AttendanceList'
import { http } from '../services/http'

interface TurmaGroup {
  unitName: string
  unitColor?: string
  turmas: any[]
}

export default function AttendancePage() {
  const { auth } = useAuth()
  const [turmaGroups, setTurmaGroups] = useState<TurmaGroup[]>([])
  const [selectedTurma, setSelectedTurma] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [auth])

  useEffect(() => {
    if (selectedTurma) {
      loadTurmaStudents()
    }
  }, [selectedTurma])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)

      if (auth.role === 'ADMIN') {
        // Admin: carrega todas as unidades e suas turmas
        const res = await http<any>('/units')
        const units = res?.data || res || []
        const groups: TurmaGroup[] = units
          .filter((u: any) => u.turmas?.length > 0)
          .map((u: any) => ({
            unitName: u.name,
            unitColor: u.color,
            turmas: u.turmas || []
          }))
        setTurmaGroups(groups)
      } else if (auth.role === 'PROFESSOR' && auth.relatedId) {
        // Professor: carrega apenas as suas turmas
        const teacher = await getTeacher(auth.relatedId)
        if (teacher && teacher.units) {
          const groups: TurmaGroup[] = teacher.units.map((u: any) => ({
            unitName: u.name,
            unitColor: (u as any).color,
            turmas: u.turmas || []
          }))
          setTurmaGroups(groups)
        } else {
          setError('Professor não encontrado ou sem turmas atribuídas')
        }
      } else {
        setLoading(false)
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function loadTurmaStudents() {
    try {
      setStudentsLoading(true)
      const response = await listStudents({ turma: selectedTurma.id, status: 'ATIVO' })
      setStudents(response.data)
    } catch (err: any) {
      console.error('Erro ao carregar alunos:', err)
    } finally {
      setStudentsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Carregando turmas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        title="Erro ao carregar dados"
        description={error}
        action={<Button onClick={loadData}>Tentar novamente</Button>}
      />
    )
  }

  if (turmaGroups.length === 0) {
    return (
      <EmptyState
        title="Nenhuma turma encontrada"
        description={
          auth.role === 'PROFESSOR'
            ? 'Você não está vinculado a nenhuma turma no momento.'
            : 'Nenhuma unidade com turmas cadastradas.'
        }
      />
    )
  }

  const allTurmasCount = turmaGroups.reduce((sum, g) => sum + g.turmas.length, 0)

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <Icon name="check-square" className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">
              {allTurmasCount} turma(s) disponível(is)
              {selectedTurma && ` · Turma selecionada: ${selectedTurma.name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Data:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-white"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={loadData}>
            <Icon name="refresh" className="mr-1.5 w-3.5 h-3.5" />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Turma selector — left panel */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Selecionar Turma
          </h3>
          {turmaGroups.map(group => (
            <Card key={group.unitName} className="p-0 overflow-hidden">
              {/* Unit header */}
              <div
                className="px-4 py-2.5 flex items-center gap-2"
                style={{ borderLeft: `3px solid ${group.unitColor || '#6366F1'}` }}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: group.unitColor || '#6366F1' }}
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {group.unitName}
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  {group.turmas.length} turma(s)
                </span>
              </div>

              {/* Turmas list */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {group.turmas.map(turma => {
                  const isSelected = selectedTurma?.id === turma.id
                  const scheduleStr = turma.schedules?.length > 0
                    ? turma.schedules.map((s: any) => `${s.dayOfWeek} ${s.startTime}`).join(', ')
                    : turma.schedule ? formatSchedule(turma.schedule) : ''

                  return (
                    <button
                      key={turma.id}
                      onClick={() => setSelectedTurma({ ...turma, unitName: group.unitName, unitColor: group.unitColor })}
                      className={`w-full text-left px-4 py-3 transition-all ${
                        isSelected
                          ? 'bg-brand-50 dark:bg-brand-900/20 border-r-2 border-brand-600'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className={`font-medium text-sm ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-gray-800 dark:text-gray-200'}`}>
                        {turma.name}
                      </div>
                      {scheduleStr && (
                        <div className="text-xs text-gray-500 mt-0.5">{scheduleStr}</div>
                      )}
                      {turma.status === 'INATIVA' && (
                        <span className="inline-block mt-1 text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">
                          Inativa
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* Attendance area — right panel */}
        <div className="lg:col-span-2">
          {selectedTurma ? (
            <div className="space-y-4">
              {/* Turma header */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: selectedTurma.unitColor || '#6366F1' }}
                    >
                      {selectedTurma.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{selectedTurma.name}</h3>
                      <p className="text-sm text-gray-500">{selectedTurma.unitName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Data da chamada</p>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                          weekday: 'long', day: '2-digit', month: 'long'
                        })}
                      </p>
                    </div>
                    {studentsLoading && (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-600" />
                    )}
                  </div>
                </div>
              </Card>

              {/* Stats summary */}
              {students.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <Card className="p-3 text-center">
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{students.length}</p>
                    <p className="text-xs text-gray-500">Total de Alunos</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <p className="text-2xl font-black text-success-600">—</p>
                    <p className="text-xs text-gray-500">Presentes</p>
                  </Card>
                  <Card className="p-3 text-center">
                    <p className="text-2xl font-black text-red-600">—</p>
                    <p className="text-xs text-gray-500">Ausentes</p>
                  </Card>
                </div>
              )}

              {/* Attendance list */}
              <AttendanceList
                turmaId={selectedTurma.id}
                students={students}
                date={selectedDate}
                onAttendanceChange={loadTurmaStudents}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Icon name="check-square" className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="font-semibold text-gray-500 dark:text-gray-400">
                Selecione uma turma ao lado
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Escolha a turma para registrar a presença dos alunos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
