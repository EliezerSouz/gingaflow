import React, { useState, useEffect } from 'react'
import { Modal, FormField, Input, Select, Tabs, TabsList, TabsTrigger, TabsContent } from '@gingaflow/ui'
import { formatSchedule } from '../utils/schedule'
import { createTeacher, updateTeacher, getTeacher, Teacher, updateTeacherAssignments } from '../services/teachers'
import { createUser } from '../lib/api'
import { listUnits, listUnitTurmas, Unit, Turma } from '../services/units'
import { useSettings } from '../contexts/SettingsContext'

type Props = {
  teacherId?: string
  onClose: () => void
  onSuccess: () => void
}

export function CreateTeacherModal({ teacherId, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dados')
  const [access, setAccess] = useState({ 
    createAccount: false, 
    role: 'PROFESSOR',
    password: '', 
    confirmPassword: '' 
  })
  const [hasUser, setHasUser] = useState(false)
  const { settings } = useSettings()
  
  const [formData, setFormData] = useState<Omit<Teacher, 'id'>>({
    full_name: '',
    cpf: '',
    capoeira_name: '',
    graduation: '',
    phone: '',
    email: '',
    status: 'ATIVO',
    notes: ''
  })

  // Units and Turmas management
  const [units, setUnits] = useState<Unit[]>([])
  const [unitTurmas, setUnitTurmas] = useState<Record<string, Turma[]>>({})
  const [selectedTurmas, setSelectedTurmas] = useState<string[]>([])
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([])
  const [loadingUnits, setLoadingUnits] = useState(false)

  // Load teacher data if editing
  useEffect(() => {
    if (teacherId) {
      loadTeacher()
    }
  }, [teacherId])

  async function loadTeacher() {
    if (!teacherId) return
    setLoading(true)
    try {
      const teacherData = await getTeacher(teacherId)
      setFormData({
        full_name: teacherData.full_name,
        cpf: teacherData.cpf || '',
        capoeira_name: teacherData.nickname || teacherData.capoeira_name || '',
        graduation: teacherData.graduation,
        phone: teacherData.phone || '',
        email: teacherData.email || '',
        status: teacherData.status,
        notes: teacherData.notes || ''
      })

      setHasUser(!!teacherData.userId)
      if (teacherData.userId) {
        setAccess(prev => ({ ...prev, createAccount: true }))
      }

      // Load assignments
      const currentTurmas: string[] = []
      const currentSchedules: string[] = []
      teacherData.units?.forEach(u => {
        u.turmas.forEach(t => {
          currentTurmas.push(t.id)
          t.schedules?.forEach((s: any) => {
            if (s.teacherId === teacherId || (s.teacher && (s.teacher.id === teacherId))) {
              currentSchedules.push(s.id)
            }
          })
        })
      })
      setSelectedTurmas(currentTurmas)
      setSelectedSchedules(currentSchedules)
    } catch (e) {
      console.error('Erro ao carregar professor', e)
      setError('Erro ao carregar dados do professor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function fetchMetadata() {
      setLoadingUnits(true)
      try {
        const unitsRes = await listUnits()
        setUnits(unitsRes.data)
        
        const turmasMap: Record<string, Turma[]> = {}
        await Promise.all(unitsRes.data.map(async (u) => {
          try {
            const turmasRes = await listUnitTurmas(u.id)
            turmasMap[u.id] = turmasRes.data
          } catch (e) {
            console.error(`Failed to fetch turmas for unit ${u.id}`, e)
            turmasMap[u.id] = []
          }
        }))
        setUnitTurmas(turmasMap)
      } catch (e) {
        console.error('Failed to fetch metadata', e)
      } finally {
        setLoadingUnits(false)
      }
    }
    fetchMetadata()
  }, [])

  function toggleTurma(turmaId: string) {
    setSelectedTurmas(prev => 
      prev.includes(turmaId) 
        ? prev.filter(id => id !== turmaId)
        : [...prev, turmaId]
    )
  }

  function toggleSchedule(scheduleId: string) {
    setSelectedSchedules(prev => 
      prev.includes(scheduleId) 
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    )
  }

  async function handleSubmit() {
    if (!formData.full_name) {
      setError('Nome é obrigatório')
      setActiveTab('dados')
      return
    }

    // CPF Mandatory Check
    if (!formData.cpf && !teacherId) { // Only mandatory on create if not present? Actually always mandatory
       // But if editing and CPF is masked/hidden?
       // For now let's keep it mandatory
    }
    if (!formData.cpf) {
      setError('CPF é obrigatório')
      setActiveTab('dados')
      return
    }

    if (access.createAccount) {
      if (!formData.email) {
        setError('Email é obrigatório para criar conta de acesso')
        setActiveTab('dados')
        return
      }
      if (!hasUser && (!access.password || access.password.length < 6)) {
        setError('Senha deve ter no mínimo 6 caracteres')
        setActiveTab('acesso')
        return
      }
      if (access.password && access.password !== access.confirmPassword) {
        setError('Senhas não conferem')
        setActiveTab('acesso')
        return
      }
    }

    setLoading(true)
    setError(null)
    try {
      const payload = {
        ...formData,
        nickname: formData.capoeira_name,
        turmaIds: selectedTurmas,
        scheduleIds: selectedSchedules,
        createAccount: access.createAccount && !hasUser,
        role: access.role,
        password: access.password || undefined
      }

      if (teacherId) {
        await updateTeacher(teacherId, payload)
      } else {
        await createTeacher(payload)
      }

      onSuccess()
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar professor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={true}
      title={teacherId ? "Editar Professor" : "Novo Professor"}
      onClose={onClose}
      primaryAction={{ label: loading ? 'Salvando...' : 'Salvar', onClick: handleSubmit }}
      secondaryAction={{ label: 'Cancelar', onClick: onClose }}
    >
      <div className="min-h-[400px]">
        {error && <div className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dados" current={activeTab} onChange={setActiveTab}>Dados Pessoais</TabsTrigger>
            <TabsTrigger value="acesso" current={activeTab} onChange={setActiveTab}>Acesso ao Sistema</TabsTrigger>
            <TabsTrigger value="turmas" current={activeTab} onChange={setActiveTab}>Turmas Atendidas</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" current={activeTab}>
            <div className="space-y-4">
              <FormField label="Nome Completo">
                <Input 
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome completo do professor"
                />
              </FormField>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField label="CPF">
                  <Input 
                    value={formData.cpf || ''}
                    onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </FormField>
                <FormField label="Nome de Capoeira (Apelido)">
                  <Input 
                    value={formData.capoeira_name || ''}
                    onChange={e => setFormData({ ...formData, capoeira_name: e.target.value })}
                    placeholder="Ex: Mestre Bimba"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Graduação">
                  <Select
                    value={formData.graduation}
                    onChange={e => setFormData({ ...formData, graduation: e.target.value })}
                    style={
                      settings.graduations?.find(g => g.name === formData.graduation)?.color
                        ? { borderLeft: `4px solid ${settings.graduations.find(g => g.name === formData.graduation)?.color}` }
                        : {}
                    }
                  >
                    <option value="">Selecione...</option>
                    {(settings.graduations || [])
                      .filter(g => g.active)
                      .sort((a, b) => a.order - b.order)
                      .map(g => (
                        <option key={g.id} value={g.name}>
                          {g.name}
                        </option>
                      ))}
                  </Select>
                </FormField>
                <FormField label="Status">
                  <Select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                  </Select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Email">
                  <Input 
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </FormField>
                <FormField label="Telefone">
                  <Input 
                    value={formData.phone || ''}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </FormField>
              </div>

              <FormField label="Observações">
                <textarea
                  className="w-full rounded border border-gray-300 p-2 text-sm focus:ring-brand-500 focus:border-brand-500"
                  rows={3}
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais..."
                />
              </FormField>
            </div>
          </TabsContent>

          <TabsContent value="acesso" current={activeTab}>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  id="createAccount"
                  checked={access.createAccount}
                  onChange={e => setAccess({ ...access, createAccount: e.target.checked })}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="createAccount" className="text-sm font-medium text-gray-700">
                  {hasUser ? 'Este professor já possui acesso habilitado' : 'Habilitar acesso ao aplicativo'}
                </label>
              </div>

              {(access.createAccount || hasUser) && (
                <div className="space-y-4 pt-4 border-t">
                  <FormField label="Nível de Acesso">
                    <Select
                      value={access.role}
                      onChange={e => setAccess({ ...access, role: e.target.value })}
                    >
                      <option value="PROFESSOR">Professor (acesso limitado)</option>
                      <option value="ADMIN">Administrador (acesso total)</option>
                    </Select>
                  </FormField>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label={hasUser ? "Redefinir Senha" : "Senha Temporária"}>
                      <Input 
                        type="password"
                        value={access.password}
                        onChange={e => setAccess({ ...access, password: e.target.value })}
                        placeholder={hasUser ? "Deixe em branco para não alterar" : "Mínimo 6 caracteres"}
                      />
                    </FormField>
                    <FormField label="Confirmar Senha">
                      <Input 
                        type="password"
                        value={access.confirmPassword}
                        onChange={e => setAccess({ ...access, confirmPassword: e.target.value })}
                        placeholder="Repita a senha"
                      />
                    </FormField>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    O professor usará o email ({formData.email || 'não cadastrado'}) como login.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="turmas" current={activeTab}>
            <div className="space-y-6">
              <p className="text-sm text-gray-500">
                Selecione as turmas que este professor irá atender em cada unidade.
              </p>
              
              {loadingUnits ? (
                <div className="text-center py-4">Carregando unidades...</div>
              ) : units.filter(u => u.status === 'ATIVA').length === 0 ? (
                <div className="text-center py-4 text-gray-500">Nenhuma unidade ativa cadastrada.</div>
              ) : (
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                  {units.filter(u => u.status === 'ATIVA').map(unit => {
                    const activeTurmas = (unitTurmas[unit.id] || []).filter(t => t.status === 'ATIVA')
                    
                    // Skip unit if no active turmas? The requirement says "Inactive units and inactive classes should NOT appear". 
                    // It doesn't explicitly say "Hide unit if no active classes", but it's good UX.
                    // However, let's stick to showing the unit if it is active, even if no classes, 
                    // so the user knows the unit exists but maybe needs classes created.
                    
                    return (
                    <div key={unit.id} className="rounded-lg border p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{unit.name}</h4>
                      {activeTurmas.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">Nenhuma turma ativa nesta unidade.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {activeTurmas.map(turma => (
                            <div key={turma.id} className="space-y-2 rounded border bg-gray-50 p-2">
                              <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                                <input 
                                  type="checkbox"
                                  checked={selectedTurmas.includes(turma.id)}
                                  onChange={() => toggleTurma(turma.id)}
                                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                />
                                <span>{turma.name}</span>
                              </label>
                              
                              <div className="pl-6 space-y-1">
                                {turma.schedules?.map((s: any) => {
                                  // A schedule belongs to another teacher → block selection (mirrors mobile)
                                  const takenByOther = s.teacher && s.teacher.id !== teacherId
                                  const otherName = takenByOther
                                    ? (s.teacher.nickname || s.teacher.capoeira_name || s.teacher.full_name)
                                    : null
                                  return (
                                    <label
                                      key={s.id}
                                      className={`flex items-center space-x-2 text-xs ${
                                        takenByOther
                                          ? 'text-gray-400 cursor-not-allowed opacity-60'
                                          : 'text-gray-600 cursor-pointer hover:text-brand-600'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={takenByOther ? false : selectedSchedules.includes(s.id)}
                                        onChange={() => { if (!takenByOther) toggleSchedule(s.id) }}
                                        disabled={!!takenByOther}
                                        className="rounded-full border-gray-300 text-brand-500 focus:ring-brand-400 disabled:opacity-40"
                                      />
                                      <span className="font-bold w-8">{s.dayOfWeek}</span>
                                      <span>{s.startTime}</span>
                                      {takenByOther && (
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                          🔒 {otherName}
                                        </span>
                                      )}
                                    </label>
                                  )
                                })}
                                {!turma.schedules?.length && (
                                  <span className="text-[10px] text-gray-400 italic">
                                    {formatSchedule(turma.schedule)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )})}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Modal>
  )
}
