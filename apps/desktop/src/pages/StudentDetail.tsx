import React, { useState, useEffect } from 'react'
import { Card, Tabs, TabsList, TabsTrigger, TabsContent, EmptyState, FormField, Input, Badge, Button, Icon, Dropdown, type IconName } from '@gingaflow/ui'
import { useParams, useNavigate } from 'react-router-dom'
import { getStudent, parseStudentExtra, Student, getGraduations, updateStudent } from '../services/students'
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
      const [studentRes, historyRes] = await Promise.all([
        getStudent(studentId),
        getGraduations(studentId)
      ])
      
      const data = (studentRes as any).data || studentRes
      setStudent(data)
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/students')}>
          <Icon name="arrow-left" className="mr-2" />
          Voltar para lista
        </Button>
        <Button size="sm" onClick={() => setShowPromoteModal(true)}>
            <Icon name="medal" className="mr-2" />
            Graduar
        </Button>
      </div>

      <Tabs value={tab} onChange={value => setTab(value as any)}>
        <TabsList>
          <TabsTrigger value="dados" current={tab} onChange={v => setTab(v as any)}>
            Dados
          </TabsTrigger>
          <TabsTrigger value="pagamentos" current={tab} onChange={v => setTab(v as any)}>
            Pagamentos
          </TabsTrigger>
          <TabsTrigger value="graduacoes" current={tab} onChange={v => setTab(v as any)}>
            Graduações
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dados" current={tab}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              <Card className="space-y-3">
                <div className="text-sm font-medium">Dados do aluno</div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <FormField label="Nome completo">
                    <Input disabled value={student.full_name} />
                  </FormField>
                  <FormField label="CPF">
                    <Input disabled value={student.cpf} />
                  </FormField>
                  <FormField label="Data de Nascimento">
                    <Input disabled value={student.birth_date ? new Date(student.birth_date).toLocaleDateString('pt-BR') : '-'} />
                  </FormField>
                  <FormField label="Email">
                    <Input disabled value={student.email || '-'} />
                  </FormField>
                  <FormField label="Telefone">
                    <Input disabled value={student.phone || '-'} />
                  </FormField>
                </div>
              </Card>

              {extra.responsible && (
                <Card className="space-y-3">
                  <div className="text-sm font-medium flex items-center gap-2">
                    Dados do Responsável
                    <Badge variant="warning">Menor de Idade</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <FormField label="Nome">
                      <Input disabled value={extra.responsible.name} />
                    </FormField>
                    <FormField label="Parentesco">
                      <Input disabled value={extra.responsible.relationship} />
                    </FormField>
                    <FormField label="CPF">
                      <Input disabled value={extra.responsible.cpf} />
                    </FormField>
                    <FormField label="Telefone">
                      <Input disabled value={extra.responsible.phone} />
                    </FormField>
                  </div>
                </Card>
              )}
            </div>

            <Card className="space-y-4 h-fit">
              <div className="text-sm font-medium">Resumo</div>
              <div className="text-sm text-gray-600 flex items-center justify-between">
                <span>Status</span>
                <Badge variant={student.status === 'ATIVO' ? 'success' : 'neutral'}>{student.status}</Badge>
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-between">
                <span>Próximo vencimento</span>
                <span>
                  {extra.next_due_date 
                    ? new Date(extra.next_due_date).toLocaleDateString('pt-BR') 
                    : '-'}
                </span>
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-between">
                <span>Professor</span>
                <span>{extra.teacher || '-'}</span>
              </div>
              <div className="text-sm text-secondary flex items-center justify-between">
                <span>Turma</span>
                <span>{extra.group_class || '-'}</span>
              </div>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="pagamentos" current={tab}>
          <EmptyState
            title="Nenhum pagamento encontrado"
            description="Os pagamentos deste aluno aparecerão aqui assim que forem registrados."
          />
        </TabsContent>
        <TabsContent value="graduacoes" current={tab}>
          <div className="space-y-4">
            
            {extra.graduation && (
              <Card className="relative overflow-hidden p-8 flex flex-col items-center justify-center min-h-[200px] border-none shadow-none bg-transparent">
                {/* Background Corda */}
                <div className="absolute inset-0 flex items-center justify-center opacity-90 scale-150 transform">
                  {(() => {
                    const grad = settings.graduations?.find(g => g.name === extra.graduation)
                    return <CordaPreview grad={grad || { color: '#9CA3AF' }} width={800} height={100} />
                  })()}
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 text-center p-6 max-w-md w-full">
                  <div className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide drop-shadow-sm">Graduação Atual</div>
                  {(() => {
                    const grad = settings.graduations?.find(g => g.name === extra.graduation)
                    const desc = grad?.description 
                      || [grad?.category, (typeof grad?.grau === 'number' ? `Grau ${grad.grau}` : undefined)]
                        .filter(Boolean).join(' • ')
                    return (
                      <>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{grad?.name || extra.graduation}</div>
                        {desc && <div className="text-lg font-medium text-brand-600">{desc}</div>}
                      </>
                    )
                  })()}
                </div>
              </Card>
            )}
            
            {history.length > 0 ? (
              <Card>
                <div className="text-sm font-medium mb-4">Histórico de Graduações</div>
                <div className="space-y-4">
                  {history.map((h, i) => {
                    const gradConfig = settings.graduations?.find(g => g.name === h.newGraduationId)
                    return (
                        <div key={h.id} className="flex flex-col gap-2 p-3 rounded bg-gray-50 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-16 flex justify-center">
                                        <CordaPreview grad={gradConfig || { color: '#9CA3AF' }} width={60} height={15} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900 text-sm">{gradConfig?.name || h.newGraduationId}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1">
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
                                     <div className="text-sm font-medium text-gray-700">{new Date(h.date).toLocaleDateString('pt-BR')}</div>
                                </div>
                            </div>
                            {h.notes && (
                                <div className="text-xs text-gray-500 bg-white p-2 rounded border border-gray-100 mt-1 italic">
                                    "{h.notes}"
                                </div>
                            )}
                        </div>
                    )
                  })}
                </div>
              </Card>
            ) : extra.graduation_history && extra.graduation_history.length > 0 ? (
                // Fallback for legacy notes history
                <Card>
                    <div className="text-sm font-medium mb-4">Histórico de Graduações (Importado)</div>
                    <div className="space-y-2">
                        {extra.graduation_history.map((h, i) => {
                            const gradConfig = settings.graduations?.find(g => g.name === h.graduation)
                            return (
                                <div key={i} className="flex items-center justify-between p-2 rounded bg-gray-50">
                                    <div className="flex items-center">
                                        <div className="flex flex-col items-center">
                                            <div className="text-sm font-medium text-center">{gradConfig?.name || h.graduation}</div>
                                        </div>
                                    </div>
                                    <span className="text-sm text-muted">{h.date}</span>
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
