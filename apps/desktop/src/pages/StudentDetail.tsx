import React, { useState, useEffect } from 'react'
import { Card, Tabs, TabsList, TabsTrigger, TabsContent, EmptyState, FormField, Input, Badge, Button, Icon, Dropdown, type IconName } from '@gingaflow/ui'
import { useParams, useNavigate } from 'react-router-dom'
import { getStudent, parseStudentExtra, Student, getGraduations, updateStudent } from '../services/students'
import { studentRepository } from '../repositories/studentRepository'
import { useSettings } from '../contexts/SettingsContext'
import { useAuth } from '../contexts/AuthContext'
import { CordaType, Graduation as GradConfig } from '../services/settings'
import { CordaPreview } from '../components/CordaPreview'
import { PromoteStudentModal } from '../components/PromoteStudentModal'
import { toast } from 'sonner'

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { settings } = useSettings()
  const { auth } = useAuth()
  const [tab, setTab] = useState<'dados' | 'pagamentos' | 'graduacoes'>('dados')
  const [student, setStudent] = useState<Student | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPromoteModal, setShowPromoteModal] = useState(false)

  useEffect(() => {
    if (id) {
      loadStudent(id)
    }
  }, [id])

  async function loadStudent(studentId: string) {
    try {
      setLoading(true)
      const [studentData, historyRes] = await Promise.all([
        studentRepository.getById(studentId),
        getGraduations(studentId)
      ])
      
      setStudent(studentData)
      setHistory(historyRes.data || [])
    } catch (e) {
      console.error('Erro ao carregar aluno', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!student) {
    return <div>Aluno não encontrado</div>
  }

  const extra = parseStudentExtra(student)

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/60 dark:backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-2xl">
            {student.full_name[0]}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{student.full_name}</h2>
              <Badge variant={student.status === 'ATIVO' ? 'success' : 'neutral'}>{student.status}</Badge>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">{student.email || student.nickname || 'Capoeirista'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/students')} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Icon name="arrow-left" className="mr-2" />
            Voltar
          </Button>
          <Button onClick={() => setShowPromoteModal(true)} className="bg-brand-600 hover:bg-brand-700 text-white shadow">
            <Icon name="medal" className="mr-2" />
            Graduar
          </Button>
        </div>
      </div>

      {/* Grid of 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Dados Pessoais */}
        <div className="flex flex-col bg-white dark:bg-gray-800/60 dark:backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-sm">
          <h3 className="text-md font-semibold mb-5 text-gray-900 dark:text-white">Dados Pessoais</h3>
          <div className="space-y-4 flex-1">
            <div className="border-b border-gray-100 dark:border-gray-700/50 pb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nome Completo</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{student.full_name}</div>
            </div>
            <div className="border-b border-gray-100 dark:border-gray-700/50 pb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">CPF</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{student.cpf}</div>
            </div>
            <div className="border-b border-gray-100 dark:border-gray-700/50 pb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Telefone</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{student.phone || '-'}</div>
            </div>
            <div className="pb-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">E-mail</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate" title={student.email || ''}>{student.email || '-'}</div>
            </div>
          </div>
        </div>

        {/* Card 2: Graduação Atual */}
        <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800/60 dark:backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 p-6 text-center relative overflow-hidden shadow-sm">
          <h3 className="text-md font-semibold mb-6 text-gray-900 dark:text-white self-start w-full text-left">Graduação Atual</h3>
          {(() => {
            const currentGradId = (student as any).currentGraduationId
            const gradByName = extra.graduation ? settings.graduations?.find(g => g.name === extra.graduation) : undefined
            const gradById = currentGradId ? settings.graduations?.find(g => (g as any).id === currentGradId) : undefined
            const grad = gradById || gradByName

            if (!grad) return <EmptyState title="Sem Graduação" description="O aluno ainda não foi graduado." />

            return (
              <div className="flex flex-col items-center justify-center flex-1 w-full h-full">
                <div className="mb-2 transition-transform hover:scale-105 duration-300">
                  <CordaPreview grad={grad} width={180} tied={true} />
                </div>
                <div className="mt-4 text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                  Corda {grad.name}
                </div>
              </div>
            )
          })()}
        </div>

        {/* Card 3: Resumo Acadêmico */}
        <div className="flex flex-col bg-white dark:bg-gray-800/60 dark:backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 p-6 shadow-sm">
          <h3 className="text-md font-semibold mb-5 text-gray-900 dark:text-white">Resumo Acadêmico</h3>
          <div className="space-y-4 flex-1">
            <div className="border-b border-gray-100 dark:border-gray-700/50 pb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Professor</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{extra.teacher || '-'}</div>
            </div>
            <div className="border-b border-gray-100 dark:border-gray-700/50 pb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Turma</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{extra.group_class || '-'}</div>
            </div>
            <div className="border-b border-gray-100 dark:border-gray-700/50 pb-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data de Nascimento</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{student.birth_date ? new Date(student.birth_date).toLocaleDateString('pt-BR') : '-'}</div>
            </div>
            <div className="pb-1">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Próximo Vencimento</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-200 flex items-center justify-between">
                {extra.next_due_date ? new Date(extra.next_due_date).toLocaleDateString('pt-BR') : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6">
        <Tabs value={tab} onChange={value => setTab(value as any)}>
          <div className="bg-transparent space-x-2">
            <TabsList>
            <TabsTrigger 
              value="dados" 
              current={tab} 
              onChange={v => setTab(v as any)}
            >
              Dados Adicionais
            </TabsTrigger>
            <TabsTrigger 
              value="pagamentos" 
              current={tab} 
              onChange={v => setTab(v as any)}
            >
              Pagamentos
            </TabsTrigger>
            <TabsTrigger 
              value="graduacoes" 
              current={tab} 
              onChange={v => setTab(v as any)}
            >
              Histórico de Graduações
            </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dados" current={tab}>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {extra.responsible && (
                <Card className="bg-white dark:bg-gray-800/60 dark:backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
                  <div className="mb-4 text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                    Dados do Responsável
                    <Badge variant="warning">Menor de Idade</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Nome</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{extra.responsible.name}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Parentesco</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{extra.responsible.relationship}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400">CPF</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{extra.responsible.cpf}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Telefone</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{extra.responsible.phone}</div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pagamentos" current={tab}>
            <div className="mt-6">
              <EmptyState
                title="Nenhum pagamento encontrado"
                description="Os pagamentos deste aluno aparecerão aqui assim que forem registrados."
              />
            </div>
          </TabsContent>

          <TabsContent value="graduacoes" current={tab}>
            <div className="mt-6 space-y-4">
              {history.length > 0 ? (
                <Card className="bg-white dark:bg-gray-800/60 dark:backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
                  <div className="text-sm font-medium mb-4 text-gray-900 dark:text-white">Histórico de Graduações</div>
                  <div className="space-y-4">
                    {history.map((h, i) => {
                      const gradName = h.newGraduationLevel?.name || h.newGraduationId || ''
                      const gradConfig = settings.graduations?.find(g =>
                        g.name === gradName || (g as any).id === h.newGraduationId
                      )
                      return (
                          <div key={h.id} className="flex flex-col gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                      <div className="w-20 flex justify-center">
                                          <CordaPreview grad={gradConfig || { color: '#9CA3AF' }} width={80} height={20} />
                                      </div>
                                      <div>
                                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{gradConfig?.name || gradName}</div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                              <span>{h.type === 'PROMOTION' ? 'Promoção' : h.type === 'ADJUSTMENT' ? 'Ajuste' : 'Correção'}</span>
                                              {h.teacher && (
                                                  <>
                                                      <span>•</span>
                                                      <span>Prof. {h.teacher.full_name}</span>
                                                  </>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                       <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{new Date(h.date).toLocaleDateString('pt-BR')}</div>
                                  </div>
                              </div>
                              {h.notes && (
                                  <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700 mt-2 italic">
                                      "{h.notes}"
                                  </div>
                              )}
                          </div>
                      )
                    })}
                  </div>
                </Card>
              ) : extra.graduation_history && extra.graduation_history.length > 0 ? (
                  <Card className="bg-white dark:bg-gray-800/60 dark:backdrop-blur-md rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
                      <div className="text-sm font-medium mb-4 text-gray-900 dark:text-white">Histórico de Graduações (Importado)</div>
                      <div className="space-y-2">
                          {extra.graduation_history.map((h, i) => {
                              const gradConfig = settings.graduations?.find(g => g.name === h.graduation)
                              return (
                                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50">
                                      <div className="flex items-center">
                                          <div className="flex flex-col items-start">
                                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{gradConfig?.name || h.graduation}</div>
                                          </div>
                                      </div>
                                      <span className="text-sm text-gray-500 dark:text-gray-400">{h.date}</span>
                                  </div>
                              )
                          })}
                      </div>
                  </Card>
              ) : (
                <EmptyState
                  title="Sem histórico"
                  description="Nenhum histórico de graduações anteriores registrado."
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showPromoteModal && student && (
        <PromoteStudentModal
          student={student}
          onClose={() => setShowPromoteModal(false)}
          onSuccess={() => {
            setShowPromoteModal(false)
            loadStudent(student.id)
          }}
        />
      )}
    </div>
  )
}
