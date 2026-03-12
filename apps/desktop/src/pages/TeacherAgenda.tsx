import React, { useState, useEffect } from 'react'
import { Card, Button, Icon, Badge, EmptyState } from '@gingaflow/ui'
import { useAuth } from '../contexts/AuthContext'
import { getTeacher, Teacher } from '../services/teachers'
import { formatSchedule, parseSchedule } from '../utils/schedule'

export default function TeacherAgenda() {
  const { auth } = useAuth()
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (auth.role === 'PROFESSOR' && auth.relatedId) {
      loadTeacherData()
    } else {
      setLoading(false)
    }
  }, [auth])

  async function loadTeacherData() {
    try {
      setLoading(true)
      const foundTeacher = await getTeacher(auth.relatedId!)
      if (foundTeacher) {
        setTeacher(foundTeacher)
      } else {
        setError('Professor não encontrado')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados do professor')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Carregando agenda...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState 
        title="Erro ao carregar agenda" 
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

  // Organizar turmas por dia da semana
  const scheduleByDay: Record<string, Array<{unit: string, unitColor?: string, turma: any}>> = {}
  const daysMap = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  teacher.units.forEach(unit => {
    unit.turmas.forEach(turma => {
      if (turma.schedules && turma.schedules.length > 0) {
        turma.schedules.forEach((sched: any) => {
          const dayNameMapping: Record<string, string> = {
            'DOM': 'Domingo', 'SEG': 'Segunda', 'TER': 'Terça',
            'QUA': 'Quarta', 'QUI': 'Quinta', 'SEX': 'Sexta', 'SAB': 'Sábado'
          }
          const dayName = dayNameMapping[sched.dayOfWeek] || sched.dayOfWeek
          if (!scheduleByDay[dayName]) {
            scheduleByDay[dayName] = []
          }
          scheduleByDay[dayName].push({
            unit: unit.name,
            unitColor: (unit as any).color,
            turma: {
              ...turma,
              time: sched.startTime
            }
          })
        })
      }
    })
  })

  // Ordenar por horário dentro de cada dia
  Object.keys(scheduleByDay).forEach(day => {
    scheduleByDay[day].sort((a, b) => a.turma.time.localeCompare(b.turma.time))
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Minha Agenda</h2>
          <p className="text-sm text-gray-500">
            Turmas e horários atribuídos a você
          </p>
        </div>
        <Button variant="secondary" onClick={loadTeacherData}>
          <Icon name="refresh" className="mr-2" />
          Atualizar
        </Button>
      </div>

      {Object.keys(scheduleByDay).length === 0 ? (
        <EmptyState 
          title="Nenhum horário definido" 
          description="Suas turmas não possuem horários cadastrados."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(scheduleByDay).map(([day, classes]) => (
            <Card key={day} className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">{day}</h3>
              <div className="space-y-2">
                {classes.map((classInfo, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span 
                        className="inline-block w-2 h-6 rounded-sm border border-gray-100"
                        style={{ backgroundColor: classInfo.unitColor || '#64748B' }}
                        title={`Cor da unidade: ${classInfo.unitColor || '#64748B'}`}
                      />
                      <div>
                        <div className="font-medium text-sm">{classInfo.turma.name}</div>
                        <div className="text-xs text-gray-500">{classInfo.unit}</div>
                      </div>
                    </div>
                    <Badge variant="neutral">
                      {classInfo.turma.time}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
