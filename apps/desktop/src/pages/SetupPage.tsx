import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Icon } from '@gingaflow/ui'
import { http } from '../services/http'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'

interface SetupStep {
  id: string
  num: number
  title: string
  description: string
  icon: string
  path: string
  check: () => Promise<boolean>
}

export default function SetupPage() {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { settings } = useSettings()
  const [stepStatus, setStepStatus] = useState<Record<string, boolean | null>>({})
  const [loading, setLoading] = useState(true)
  const [allDone, setAllDone] = useState(false)

  const steps: SetupStep[] = [
    {
      id: 'settings',
      num: 1,
      title: 'Configurações do Sistema',
      description: 'Defina o nome do seu grupo, logotipo e tema de cores.',
      icon: 'settings',
      path: '/settings/general',
      check: async () => !!(settings.groupName && settings.groupName !== 'Grupo de Capoeira')
    },
    {
      id: 'activities',
      num: 2,
      title: 'Tipos de Atividade',
      description: 'Cadastre as modalidades oferecidas (Capoeira, Spinning, Funcional, etc.).',
      icon: 'graduations',
      path: '/activities',
      check: async () => {
        try {
          const data = await http<any[]>('/activity-types')
          return Array.isArray(data) && data.length > 0
        } catch { return false }
      }
    },
    {
      id: 'units',
      num: 3,
      title: 'Unidades',
      description: 'A unidade "Matriz" é criada automaticamente. Você pode adicionar filiais.',
      icon: 'home',
      path: '/units',
      check: async () => {
        try {
          const data = await http<any>('/units')
          return (data?.data || data || []).length > 0
        } catch { return false }
      }
    },
    {
      id: 'teachers',
      num: 4,
      title: 'Professores',
      description: 'Cadastre os professores que darão aulas.',
      icon: 'user',
      path: '/teachers',
      check: async () => {
        try {
          const data = await http<any>('/teachers')
          return (data?.data || []).length > 0
        } catch { return false }
      }
    },
    {
      id: 'graduations',
      num: 5,
      title: 'Níveis de Graduação',
      description: 'Defina os níveis/cordas utilizados na sua modalidade principal.',
      icon: 'medal',
      path: '/graduations',
      check: async () => !!(settings.graduations && settings.graduations.length > 0)
    },
    {
      id: 'turmas',
      num: 6,
      title: 'Turmas e Horários',
      description: 'Crie as turmas vinculando atividade, unidade e professor. Defina os dias e horários.',
      icon: 'check-square',
      path: '/units',
      check: async () => {
        try {
          const unitsData = await http<any>('/units')
          const units = unitsData?.data || unitsData || []
          for (const unit of units) {
            const turmasData = await http<any>(`/units/${unit.id}/turmas`)
            if ((turmasData?.data || turmasData || []).length > 0) return true
          }
          return false
        } catch { return false }
      }
    },
    {
      id: 'students',
      num: 7,
      title: 'Alunos e Matrículas',
      description: 'Comece a cadastrar seus alunos e matriculá-los nas turmas.',
      icon: 'students',
      path: '/students',
      check: async () => {
        try {
          const data = await http<any>('/students?per_page=1')
          return (data?.meta?.total || 0) > 0
        } catch { return false }
      }
    }
  ]

  useEffect(() => {
    checkAllSteps()
  }, [settings])

  async function checkAllSteps() {
    setLoading(true)
    const statuses: Record<string, boolean> = {}
    await Promise.all(steps.map(async step => {
      try {
        statuses[step.id] = await step.check()
      } catch {
        statuses[step.id] = false
      }
    }))
    setStepStatus(statuses)
    setAllDone(Object.values(statuses).every(Boolean))
    setLoading(false)
  }

  const completedCount = Object.values(stepStatus).filter(Boolean).length
  const progress = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-100 dark:bg-brand-900/30 text-brand-600 mb-2">
          <Icon name="check-circle" className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuração Inicial do GingaFlow</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Siga o fluxo abaixo para configurar seu sistema e começar a gerenciar sua academia.
        </p>
      </div>

      {/* Progress Bar */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progresso da Configuração</p>
            <p className="text-xs text-gray-500">{completedCount} de {steps.length} etapas concluídas</p>
          </div>
          <div className="text-2xl font-black text-brand-600">{progress}%</div>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        {allDone && (
          <div className="mt-4 p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-xl flex items-center gap-3">
            <Icon name="check-circle" className="w-5 h-5 text-success-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-success-700 dark:text-success-400">Sistema configurado!</p>
              <p className="text-xs text-success-600 dark:text-success-500">Seu GingaFlow está pronto para uso.</p>
            </div>
            <Button className="ml-auto" onClick={() => navigate('/dashboard')}>
              Ir ao Dashboard
            </Button>
          </div>
        )}
      </Card>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isDone = stepStatus[step.id] === true
          const isLoading = loading && stepStatus[step.id] === undefined
          const prevDone = index === 0 || stepStatus[steps[index - 1].id] === true
          const isActive = prevDone && !isDone

          return (
            <div
              key={step.id}
              className={`rounded-xl border transition-all ${
                isDone
                  ? 'border-success-200 dark:border-success-800 bg-success-50/50 dark:bg-success-900/10'
                  : isActive
                  ? 'border-brand-300 dark:border-brand-700 bg-brand-50/50 dark:bg-brand-900/10 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 opacity-60'
              }`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Step Number / Status */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  isDone
                    ? 'bg-success-500 text-white'
                    : isActive
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                }`}>
                  {isDone ? (
                    <Icon name="check" className="w-5 h-5" />
                  ) : (
                    step.num
                  )}
                </div>

                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                  isDone
                    ? 'bg-success-100 dark:bg-success-900/30 text-success-600'
                    : isActive
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  <Icon name={step.icon as any} className="w-5 h-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${isDone ? 'text-success-700 dark:text-success-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {step.title}
                    </p>
                    {isDone && (
                      <span className="text-xs font-medium text-success-600 bg-success-100 dark:bg-success-900/30 px-2 py-0.5 rounded-full">
                        Concluído
                      </span>
                    )}
                    {isActive && (
                      <span className="text-xs font-medium text-brand-600 bg-brand-100 dark:bg-brand-900/30 px-2 py-0.5 rounded-full animate-pulse">
                        Próximo passo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{step.description}</p>
                </div>

                {/* Action */}
                <Button
                  variant={isDone ? 'secondary' : isActive ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(step.path)}
                  disabled={!isActive && !isDone}
                >
                  {isDone ? 'Revisar' : 'Configurar'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center pb-4">
        <button
          onClick={checkAllSteps}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <Icon name="refresh" className="w-4 h-4" />
          Atualizar status
        </button>
      </div>
    </div>
  )
}
