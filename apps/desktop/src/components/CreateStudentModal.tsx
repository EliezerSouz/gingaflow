import React, { useState, useEffect } from 'react'
import {
  Modal,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  FormField,
  Input,
  Select,
  Button,
  Icon,
  Tooltip,
  Badge
} from '@gingaflow/ui'
import { CordaPreview } from './CordaPreview'
import { createStudent, getStudent, updateStudent } from '../services/students'
import { listTeachers, Teacher } from '../services/teachers'
import { CreateTeacherModal } from './CreateTeacherModal'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { CordaType } from '../services/settings'
import { formatSchedule } from '../utils/schedule'
import { maskCPF, maskPhone, maskDate, unmask } from '../utils/masks'
import { validateCPF, validateDate, validatePhone } from '../utils/validators'
import { http } from '../services/http'

type CreateStudentModalProps = {
  studentId?: string
  onClose: () => void
  onSuccess: () => void
}

function calculateAge(birthDate: string): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return 0
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function CreateStudentModal({ studentId, onClose, onSuccess }: CreateStudentModalProps) {
  const { auth } = useAuth()
  const { settings } = useSettings()
  const isProfessor = auth.role === 'PROFESSOR'
  const isAdmin = auth.role === 'ADMIN'

  function PreviewGrad({ name }: { name: string }) {
    const g = (settings.graduations || []).find(x => x.name === name)
    const type = g?.cordaType || CordaType.UNICA
    const base = g?.color || '#9CA3AF'
    const left = g?.colorLeft || base
    const right = g?.colorRight || base
    const pontaL = g?.pontaLeft || base
    const pontaR = g?.pontaRight || base
    if (!g) return null
    return (
      <div className="flex items-center gap-3 mt-2">
        {type === CordaType.DUPLA ? (
          <div className="flex items-center">
            <div className="h-3 w-12 rounded-l-full" style={{ backgroundColor: left }} />
            <div className="h-3 w-12 rounded-r-full" style={{ backgroundColor: right }} />
          </div>
        ) : type === CordaType.COM_PONTAS ? (
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-l-full" style={{ backgroundColor: pontaL }} />
            <div className="h-3 w-16" style={{ backgroundColor: base }} />
            <div className="h-3 w-3 rounded-r-full" style={{ backgroundColor: pontaR }} />
          </div>
        ) : (
          <div className="h-3 w-20 rounded-full" style={{ backgroundColor: base }} />
        )}
        <Badge variant="gray">
          {g.name}{typeof g.grau === 'number' ? ` • Grau ${g.grau}` : ''}{g.category ? ` • ${g.category}` : ''}
        </Badge>
      </div>
    )
  }

  const [activeTab, setActiveTab] = useState('pessoal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // External data
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [showCreateTeacher, setShowCreateTeacher] = useState(false)
  const [allUnits, setAllUnits] = useState<any[]>([])
  const [activityTypes, setActivityTypes] = useState<any[]>([])

  // Form States
  const [pessoal, setPessoal] = useState({
    full_name: '',
    nickname: '',
    cpf: '',
    birth_date: '',
    status: 'ATIVO',
    activityTypeIds: [] as string[]
  })

  const [contato, setContato] = useState({
    phone: '',
    whatsapp: '',
    email: '',
    address_street: '',
    address_number: '',
    address_district: '',
    address_city: '',
    address_state: '',
    address_zip: ''
  })

  const [responsavel, setResponsavel] = useState({
    full_name: '',
    cpf: '',
    relationship: '',
    phone: '',
    whatsapp: '',
    email: '',
    is_financial_responsible: false,
    same_address: true,
    address_street: '',
    address_number: '',
    address_district: '',
    address_city: '',
    address_state: '',
    address_zip: ''
  })

  const [capoeira, setCapoeira] = useState({
    graduation: '',
    graduation_date: '',
    turmaIds: [] as string[],
    scheduleIds: [] as string[],
    enrollment_date: new Date().toISOString().split('T')[0]
  })

  // Derived: units filtered by selected activity types
  const filteredUnits = React.useMemo(() => {
    if (pessoal.activityTypeIds.length === 0) return []
    return allUnits.filter(u =>
      u.turmas?.some((t: any) => pessoal.activityTypeIds.includes(t.activityTypeId))
    )
  }, [pessoal.activityTypeIds, allUnits])

  // Derived: whether any selected activity uses graduation
  const selectedActivityObjects = activityTypes.filter(a => pessoal.activityTypeIds.includes(a.id))
  const usaGraduacao = selectedActivityObjects.some(a => a.usaGraduacao)

  // Derived: teachers from selected turmas (display only)
  const teachersDisplay = React.useMemo(() => {
    const names = new Set<string>()
    capoeira.turmaIds.forEach(tid => {
      for (const u of allUnits) {
        const t = u.turmas?.find((t: any) => t.id === tid)
        if (t?.teacher?.full_name) names.add(t.teacher.full_name)
      }
    })
    return Array.from(names).join(', ')
  }, [capoeira.turmaIds, allUnits])

  const [financeiro, setFinanceiro] = useState({
    monthly_fee: '',
    due_day: '',
    next_due_date: '',
    payment_method: '',
    financial_status: 'EM_DIA'
  })

  const [obs, setObs] = useState('')
  const [history, setHistory] = useState('')
  const [originalGraduation, setOriginalGraduation] = useState('')

  // Legacy: keep selectedTeacherId for backward compat with auto-select logic
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const activeTeachers = teachers.filter(t => t.status === 'ATIVO')

  const age = calculateAge(pessoal.birth_date)
  const isMinor = age > 0 && age < 18

  function computeNextDueDateFromDay(dueDayStr: string): string {
    const dueDay = parseInt(dueDayStr, 10)
    if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) return ''
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const daysInThisMonth = new Date(year, month + 1, 0).getDate()
    const targetDayThisMonth = Math.min(dueDay, daysInThisMonth)
    const candidate = new Date(year, month, targetDayThisMonth)
    let targetYear = year
    let targetMonth = month
    let targetDay = targetDayThisMonth
    if (candidate <= today) {
      targetMonth = month + 1
      if (targetMonth > 11) {
        targetMonth = 0
        targetYear = year + 1
      }
      const dim = new Date(targetYear, targetMonth + 1, 0).getDate()
      targetDay = Math.min(dueDay, dim)
    }
    const m = String(targetMonth + 1).padStart(2, '0')
    const d = String(targetDay).padStart(2, '0')
    return `${targetYear}-${m}-${d}`
  }

  // Validation Helper
  const validateField = (field: string, value: string) => {
    let error = ''
    switch (field) {
      case 'cpf':
        if (value && !validateCPF(value)) error = 'CPF inválido'
        break
      case 'phone':
      case 'whatsapp':
        if (value && !validatePhone(value)) error = 'Telefone inválido'
        break
      case 'birth_date':
        // Date input is yyyy-mm-dd
        if (value) {
          const [y, m, d] = value.split('-').map(Number)
          // simple check, maybe use validateDate if we had dd/mm/yyyy
          const date = new Date(value)
          if (date > new Date()) error = 'Data não pode ser futura'
        }
        break
    }
    setFieldErrors(prev => ({ ...prev, [field]: error }))
    return !error
  }

  // Load Initial Data
  useEffect(() => {
    loadTeachers()
    loadPickerData()
    if (studentId) {
      loadStudent()
    } else {
      setPessoal({ full_name: '', nickname: '', cpf: '', birth_date: '', status: 'ATIVO', activityTypeIds: [] })
      setCapoeira({ graduation: '', graduation_date: '', turmaIds: [], scheduleIds: [], enrollment_date: new Date().toISOString().split('T')[0] })
      setFinanceiro({ monthly_fee: '', due_day: '', next_due_date: '', payment_method: '', financial_status: 'EM_DIA' })
      if (settings.defaultMonthlyFee) {
        setFinanceiro(prev => ({ ...prev, monthly_fee: String(settings.defaultMonthlyFee) }))
      }
      if (settings.defaultPaymentMethod) {
        setFinanceiro(prev => ({ ...prev, payment_method: settings.defaultPaymentMethod || '' }))
      }
    }
  }, [studentId, isProfessor, settings])

  // Auto-select logged-in professor (kept for legacy backward compat)
  useEffect(() => {
    if (teachers.length > 0 && !studentId && isProfessor && auth.relatedId && !selectedTeacherId) {
      const t = teachers.find(t => t.id === auth.relatedId)
      if (t) setSelectedTeacherId(t.id)
    }
  }, [teachers, isProfessor, auth.relatedId, studentId, selectedTeacherId])

  useEffect(() => {
    if (financeiro.financial_status === 'EM_DIA' && financeiro.due_day) {
      const nextDate = computeNextDueDateFromDay(financeiro.due_day)
      if (nextDate && nextDate !== financeiro.next_due_date) {
        setFinanceiro(prev => ({ ...prev, next_due_date: nextDate }))
      }
    }
  }, [financeiro.financial_status, financeiro.due_day])

  // If student is no longer a minor, go back to Pessoal tab (Responsável tab is hidden)
  useEffect(() => {
    if (!isMinor && activeTab === 'responsavel') {
      setActiveTab('pessoal')
    }
  }, [isMinor])

  // Auto-fill monthly fee from selected turmas
  useEffect(() => {
    if (capoeira.turmaIds.length > 0) {
      let totalCents = 0
      capoeira.turmaIds.forEach(tid => {
        for (const u of allUnits) {
          const t = u.turmas?.find((t: any) => t.id === tid)
          if (t?.defaultMonthlyFeeCents) { totalCents += t.defaultMonthlyFeeCents; break }
        }
      })
      if (totalCents > 0) {
        const newFee = (totalCents / 100).toFixed(2).replace('.', ',')
        setFinanceiro(prev => ({ ...prev, monthly_fee: newFee }))
      }
    }
  }, [capoeira.turmaIds, allUnits])

  async function loadPickerData() {
    try {
      const [unitsRes, activityRes] = await Promise.all([
        http<any>('/units'),
        http<any>('/activity-types').catch(() => [])
      ])
      // GET /units already returns nested turmas with activityTypeId (scalar field)
      const uData: any[] = unitsRes?.data || unitsRes || []
      const aData = Array.isArray(activityRes) ? activityRes : (activityRes?.data || [])
      setAllUnits(uData)
      setActivityTypes(aData)
    } catch (e) {
      console.error('Erro ao carregar dados dos seletores:', e)
    }
  }

  async function loadStudent() {
    try {
      setLoading(true)
      const res = await getStudent(studentId!)
      const s = (res as any).data || res

      if (!s) throw new Error('Dados do aluno não encontrados')

      const notes = s.notes || ''

      // Helper to safely extract regex match
      const extract = (regex: RegExp) => {
        const match = notes.match(regex)
        return match ? match[1].trim() : ''
      }

      setPessoal({
        full_name: s.full_name,
        nickname: s.nickname || '',
        cpf: maskCPF(s.cpf || ''),
        birth_date: s.birth_date || '',
        status: s.status,
        activityTypeIds: s.activities?.map((a: any) => a.activityTypeId) || []
      })

      // Parse Address from [CONTATO EXTRA]
      const addressMatch = notes.match(/Endereço: (.*), (.*) - (.*)\nCidade: (.*)\/(.*) - CEP: (.*)/)

      setContato({
        phone: maskPhone(s.phone || ''),
        whatsapp: maskPhone(extract(/WhatsApp: (.*)/)),
        email: s.email || '',
        address_street: addressMatch ? addressMatch[1] : '',
        address_number: addressMatch ? addressMatch[2] : '',
        address_district: addressMatch ? addressMatch[3] : '',
        address_city: addressMatch ? addressMatch[4] : '',
        address_state: addressMatch ? addressMatch[5] : '',
        address_zip: addressMatch ? addressMatch[6] : ''
      })

      // Parse Responsavel
      const respPhoneMatch = notes.match(/Telefone: (.*) \/ WhatsApp: (.*)/)
      const guardianAddressLine = extract(/\[RESPONSÁVEL\][\s\S]*?Endereço: (.*)/)

      let guardianAddr = {
        same_address: true,
        address_street: '',
        address_number: '',
        address_district: '',
        address_city: '',
        address_state: '',
        address_zip: ''
      }

      if (guardianAddressLine && guardianAddressLine !== 'Mesmo endereço do aluno') {
        const gAddrMatch = guardianAddressLine.match(/(.*), (.*) - (.*), (.*)\/(.*) - CEP: (.*)/)
        if (gAddrMatch) {
          guardianAddr = {
            same_address: false,
            address_street: gAddrMatch[1],
            address_number: gAddrMatch[2],
            address_district: gAddrMatch[3],
            address_city: gAddrMatch[4],
            address_state: gAddrMatch[5],
            address_zip: gAddrMatch[6]
          }
        }
      }

      setResponsavel({
        full_name: extract(/\[RESPONSÁVEL\][\s\S]*?Nome: (.*)/),
        cpf: maskCPF(extract(/\[RESPONSÁVEL\][\s\S]*?CPF: (.*)/)),
        relationship: extract(/\[RESPONSÁVEL\][\s\S]*?Parentesco: (.*)/),
        phone: respPhoneMatch ? maskPhone(respPhoneMatch[1]) : '',
        whatsapp: respPhoneMatch ? maskPhone(respPhoneMatch[2]) : '',
        email: extract(/\[RESPONSÁVEL\][\s\S]*?Email: (.*)/),
        is_financial_responsible: extract(/\[RESPONSÁVEL\][\s\S]*?Financeiro: (.*)/) === 'SIM',
        ...guardianAddr
      })

      // Resolve graduation name: prefer relational data, then notes text
      const currentGradId = s.currentGraduationId
      const currentGradByUUID = currentGradId
        ? (settings.graduations || []).find((g: any) => g.id === currentGradId)
        : null
      const graduationName = currentGradByUUID?.name
        || s.graduations?.[0]?.graduation?.name
        || s.graduations?.[0]?.newGraduationLevel?.name
        || extract(/Graduação Inicial: (.*)/)
        || ''

      setCapoeira({
        graduation: graduationName,
        graduation_date: s.graduations?.[0]?.date || extract(/Data Graduação: (.*)/),
        turmaIds: s.studentTurmas?.map((st: any) => st.turmaId) || [],
        scheduleIds: s.schedules?.map((sc: any) => sc.id) || [],
        enrollment_date: s.enrollment_date || new Date().toISOString().split('T')[0]
      })

      setFinanceiro({
        monthly_fee: extract(/Mensalidade: (.*)/),
        due_day: extract(/Vencimento: Dia (.*)/),
        next_due_date: extract(/Próximo Vencimento: (.*)/),
        payment_method: extract(/Forma Pagamento: (.*)/),
        financial_status: extract(/Situação: (.*)/)
      })

      const obsBlock = notes.split('[OBSERVAÇÕES]')[1]
      setObs(obsBlock ? obsBlock.trim() : '')

    } catch (e: any) {
      console.error(e)
      setError('Erro ao carregar dados do aluno')
    } finally {
      setLoading(false)
    }
  }

  async function loadTeachers() {
    try {
      const res = await listTeachers()
      setTeachers(res.data)
    } catch (e) {
      console.error('Erro ao carregar professores', e)
    }
  }

  async function handleSubmit() {
    setError(null)
    setFieldErrors({})

    // Validation
    let hasError = false
    const newErrors: Record<string, string> = {}

    if (!pessoal.full_name) {
      newErrors['full_name'] = 'Nome é obrigatório'
      hasError = true
      setActiveTab('pessoal')
    }
    if (!pessoal.cpf) {
      newErrors['cpf'] = 'CPF é obrigatório'
      hasError = true
      setActiveTab('pessoal')
    } else if (!validateCPF(pessoal.cpf)) {
      newErrors['cpf'] = 'CPF inválido'
      hasError = true
      setActiveTab('pessoal')
    }

    if (pessoal.birth_date && new Date(pessoal.birth_date) > new Date()) {
      newErrors['birth_date'] = 'Data inválida'
      hasError = true
      setActiveTab('pessoal')
    }

    if (contato.phone && !validatePhone(contato.phone)) {
      newErrors['phone'] = 'Telefone inválido'
      hasError = true
      setActiveTab('contato')
    }

    if (isMinor) {
      if (!responsavel.full_name) {
        newErrors['resp_name'] = 'Nome do responsável é obrigatório'
        hasError = true
        setActiveTab('responsavel')
      }
      if (!responsavel.relationship) {
        newErrors['resp_rel'] = 'Parentesco é obrigatório'
        hasError = true
        setActiveTab('responsavel')
      }
      if (!responsavel.phone) {
        newErrors['resp_phone'] = 'Telefone do responsável é obrigatório'
        hasError = true
        setActiveTab('responsavel')
      }
    }

    if (responsavel.cpf && !validateCPF(responsavel.cpf)) {
      newErrors['resp_cpf'] = 'CPF inválido'
      hasError = true
      setActiveTab('responsavel')
    }
    if (responsavel.phone && !validatePhone(responsavel.phone)) {
      newErrors['resp_phone'] = 'Telefone inválido'
      hasError = true
      setActiveTab('responsavel')
    }

    if (hasError) {
      setFieldErrors(newErrors)
      setError('Verifique os erros no formulário')
      return
    }

    setLoading(true)

    try {
      const guardianAddress = responsavel.same_address
        ? 'Mesmo endereço do aluno'
        : `${responsavel.address_street}, ${responsavel.address_number} - ${responsavel.address_district}, ${responsavel.address_city}/${responsavel.address_state} - CEP: ${responsavel.address_zip}`

      const guardianInfo = responsavel.full_name
        ? `
[RESPONSÁVEL]
Nome: ${responsavel.full_name}
CPF: ${responsavel.cpf}
Parentesco: ${responsavel.relationship}
Telefone: ${responsavel.phone} / WhatsApp: ${responsavel.whatsapp}
Email: ${responsavel.email}
Financeiro: ${responsavel.is_financial_responsible ? 'SIM' : 'NÃO'}
Endereço: ${guardianAddress}
`
        : ''

      let finalHistory = history
      if (originalGraduation && originalGraduation !== capoeira.graduation) {
        const today = new Date().toISOString().split('T')[0]
        finalHistory = (finalHistory + `\n${today} - ${originalGraduation}`).trim()
      }

      const extraInfo = `
[CONTATO EXTRA]
WhatsApp: ${contato.whatsapp}
Endereço: ${contato.address_street}, ${contato.address_number} - ${contato.address_district}
Cidade: ${contato.address_city}/${contato.address_state} - CEP: ${contato.address_zip}

${guardianInfo}

[ATIVIDADE]
Graduação Inicial: ${capoeira.graduation}
Data Graduação: ${capoeira.graduation_date}

[HISTORICO_GRADUACAO]
${finalHistory}

[FINANCEIRO]
Mensalidade: ${financeiro.monthly_fee}
Vencimento: Dia ${financeiro.due_day}
Forma Pagamento: ${financeiro.payment_method}
Situação: ${financeiro.financial_status}
Próximo Vencimento: ${financeiro.next_due_date}

[OBSERVAÇÕES]
${obs}
`.trim()

      // Resolve currentGraduationId: find the UUID of the selected graduation name
      const selectedGradConfig = (settings.graduations || []).find((g: any) => g.name === capoeira.graduation)
      const currentGraduationId = (selectedGradConfig as any)?.id || undefined

      const payload = {
        full_name: pessoal.full_name,
        nickname: pessoal.nickname || undefined,
        cpf: unmask(pessoal.cpf),
        birth_date: pessoal.birth_date || undefined,
        email: contato.email || undefined,
        phone: unmask(contato.phone) || undefined,
        status: pessoal.status,
        enrollment_date: capoeira.enrollment_date,
        activityTypeIds: pessoal.activityTypeIds,
        turmaIds: capoeira.turmaIds,
        scheduleIds: capoeira.scheduleIds,
        currentGraduationId: currentGraduationId || null,
        notes: extraInfo
      }

      if (studentId) {
        await updateStudent(studentId, payload)
      } else {
        await createStudent(payload)
      }

      onSuccess()
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar aluno')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Modal
        open={true}
        title={studentId ? "Editar Aluno" : "Novo Aluno"}
        onClose={onClose}
        primaryAction={{ label: loading ? 'Salvando...' : (studentId ? 'Salvar Alterações' : 'Salvar Cadastro'), onClick: handleSubmit }}
        secondaryAction={{ label: 'Cancelar', onClick: onClose }}
      >
        <div className="min-h-[400px]">
          {error && <div className="mb-4 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

          <Tabs value={activeTab} onChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pessoal" current={activeTab} onChange={setActiveTab}>
                Pessoal
                {(fieldErrors.full_name || fieldErrors.cpf || fieldErrors.birth_date) && <span className="ml-1 text-red-500">*</span>}
              </TabsTrigger>
              <TabsTrigger value="contato" current={activeTab} onChange={setActiveTab}>
                Contato
                {fieldErrors.phone && <span className="ml-1 text-red-500">*</span>}
              </TabsTrigger>
              {/* Only show Responsável tab when student IS a minor */}
              {isMinor && (
                <TabsTrigger value="responsavel" current={activeTab} onChange={setActiveTab}>
                  Responsável
                  {(fieldErrors.resp_name || fieldErrors.resp_rel || fieldErrors.resp_phone || fieldErrors.resp_cpf) && (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500" />
                  )}
                  {isMinor && !Object.keys(fieldErrors).some(k => k.startsWith('resp_')) && (
                    <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="atividade" current={activeTab} onChange={setActiveTab}>Atividade</TabsTrigger>
              <TabsTrigger value="financeiro" current={activeTab} onChange={setActiveTab}>Financeiro</TabsTrigger>
              <TabsTrigger value="obs" current={activeTab} onChange={setActiveTab}>Obs</TabsTrigger>
            </TabsList>

            <TabsContent value="pessoal" current={activeTab}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Nome Completo" error={fieldErrors.full_name}>
                    <Input
                      value={pessoal.full_name}
                      onChange={e => {
                        setPessoal({ ...pessoal, full_name: e.target.value })
                        if (fieldErrors.full_name) setFieldErrors({ ...fieldErrors, full_name: '' })
                      }}
                      placeholder="Ex: João da Silva"
                    />
                  </FormField>
                  <FormField label="Apelido">
                    <Input
                      value={pessoal.nickname}
                      onChange={e => setPessoal({ ...pessoal, nickname: e.target.value })}
                      placeholder="Ex: Guerreiro, Leão..."
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="CPF" error={fieldErrors.cpf}>
                    <Input
                      value={pessoal.cpf}
                      onChange={e => {
                        setPessoal({ ...pessoal, cpf: maskCPF(e.target.value) })
                        if (fieldErrors.cpf) setFieldErrors({ ...fieldErrors, cpf: '' })
                      }}
                      onBlur={e => validateField('cpf', e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </FormField>
                  <FormField label="Data de Nascimento" error={fieldErrors.birth_date}>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={pessoal.birth_date}
                        onChange={e => {
                          setPessoal({ ...pessoal, birth_date: e.target.value })
                          validateField('birth_date', e.target.value)
                        }}
                      />
                      {age > 0 && (
                        <div className={`flex items-center justify-center rounded px-3 text-sm font-medium ${isMinor ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
                          {age} anos
                        </div>
                      )}
                    </div>
                  </FormField>
                </div>
                {isMinor && <div className="mt-1 text-xs text-amber-600 font-medium">Aluno menor de idade — responsável obrigatório</div>}

                <FormField label="Status">
                  <Select
                    value={pessoal.status}
                    onChange={e => setPessoal({ ...pessoal, status: e.target.value })}
                    disabled={isProfessor}
                  >
                    <option value="ATIVO">Ativo</option>
                    <option value="PENDENTE">Pendente</option>
                    <option value="INATIVO">Inativo</option>
                  </Select>
                  {isProfessor && <div className="mt-1 text-xs text-gray-500">Status gerenciado pela administração</div>}
                </FormField>

                {/* Activity Types — chips, just like mobile */}
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tipos de Atividade {isAdmin && <span className="text-gray-400">(selecione ao menos uma)</span>}
                  </div>
                  {activityTypes.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Nenhuma atividade cadastrada</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {activityTypes.map(a => {
                        const isSelected = pessoal.activityTypeIds.includes(a.id)
                        return (
                          <button
                            key={a.id}
                            type="button"
                            disabled={!isAdmin}
                            onClick={() => {
                              if (!isAdmin) return
                              setPessoal(prev => ({
                                ...prev,
                                activityTypeIds: isSelected
                                  ? prev.activityTypeIds.filter(id => id !== a.id)
                                  : [...prev.activityTypeIds, a.id]
                              }))
                            }}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-full border transition-all ${
                              isSelected
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                            } ${!isAdmin ? 'opacity-60 cursor-default' : 'cursor-pointer hover:border-brand-400'}`}
                          >
                            {a.name}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {!isAdmin && pessoal.activityTypeIds.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">Tipo de atividade definido pelo administrador</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contato" current={activeTab}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Telefone Principal" error={fieldErrors.phone}>
                    <Input
                      value={contato.phone}
                      onChange={e => {
                        setContato({ ...contato, phone: maskPhone(e.target.value) })
                        if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' })
                      }}
                      onBlur={e => validateField('phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </FormField>
                  <FormField label="WhatsApp">
                    <Input
                      value={contato.whatsapp}
                      onChange={e => setContato({ ...contato, whatsapp: maskPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                    />
                  </FormField>
                </div>

                <FormField label="Email">
                  <Input
                    type="email"
                    value={contato.email}
                    onChange={e => setContato({ ...contato, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </FormField>

                <div className="border-t pt-4">
                  <div className="mb-2 text-sm font-medium text-gray-700">Endereço</div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <FormField label="Rua">
                        <Input
                          value={contato.address_street}
                          onChange={e => setContato({ ...contato, address_street: e.target.value })}
                        />
                      </FormField>
                    </div>
                    <FormField label="Número">
                      <Input
                        value={contato.address_number}
                        onChange={e => setContato({ ...contato, address_number: e.target.value })}
                      />
                    </FormField>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <FormField label="Bairro">
                      <Input
                        value={contato.address_district}
                        onChange={e => setContato({ ...contato, address_district: e.target.value })}
                      />
                    </FormField>
                    <FormField label="CEP">
                      <Input
                        value={contato.address_zip}
                        onChange={e => setContato({ ...contato, address_zip: e.target.value })}
                      />
                    </FormField>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <FormField label="Cidade">
                      <Input
                        value={contato.address_city}
                        onChange={e => setContato({ ...contato, address_city: e.target.value })}
                      />
                    </FormField>
                    <FormField label="Estado">
                      <Input
                        value={contato.address_state}
                        onChange={e => setContato({ ...contato, address_state: e.target.value })}
                        maxLength={2}
                        placeholder="UF"
                      />
                    </FormField>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="responsavel" current={activeTab}>
              <div className="space-y-4">
                {isMinor && (
                  <div className="rounded bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
                    <span className="font-bold">Atenção:</span> Aluno menor de idade. O preenchimento dos dados do responsável é obrigatório.
                  </div>
                )}

                <FormField label="Nome do Responsável" error={fieldErrors.resp_name}>
                  <Input
                    value={responsavel.full_name}
                    onChange={e => {
                      setResponsavel({ ...responsavel, full_name: e.target.value })
                      if (fieldErrors.resp_name) setFieldErrors({ ...fieldErrors, resp_name: '' })
                    }}
                    placeholder="Nome completo"
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="CPF" error={fieldErrors.resp_cpf}>
                    <Input
                      value={responsavel.cpf}
                      onChange={e => {
                        setResponsavel({ ...responsavel, cpf: maskCPF(e.target.value) })
                        if (fieldErrors.resp_cpf) setFieldErrors({ ...fieldErrors, resp_cpf: '' })
                      }}
                      onBlur={e => {
                        if (e.target.value && !validateCPF(e.target.value)) {
                          setFieldErrors(prev => ({ ...prev, resp_cpf: 'CPF inválido' }))
                        }
                      }}
                      placeholder="000.000.000-00"
                    />
                  </FormField>
                  <FormField label="Grau de Parentesco" error={fieldErrors.resp_rel}>
                    <Select
                      value={responsavel.relationship}
                      onChange={e => {
                        setResponsavel({ ...responsavel, relationship: e.target.value })
                        if (fieldErrors.resp_rel) setFieldErrors({ ...fieldErrors, resp_rel: '' })
                      }}
                    >
                      <option value="">Selecione...</option>
                      <option value="PAI">Pai</option>
                      <option value="MAE">Mãe</option>
                      <option value="AVO">Avô/Avó</option>
                      <option value="TIO">Tio/Tia</option>
                      <option value="OUTRO">Outro</option>
                    </Select>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Telefone" error={fieldErrors.resp_phone}>
                    <Input
                      value={responsavel.phone}
                      onChange={e => {
                        setResponsavel({ ...responsavel, phone: maskPhone(e.target.value) })
                        if (fieldErrors.resp_phone) setFieldErrors({ ...fieldErrors, resp_phone: '' })
                      }}
                      onBlur={e => {
                        if (e.target.value && !validatePhone(e.target.value)) {
                          setFieldErrors(prev => ({ ...prev, resp_phone: 'Telefone inválido' }))
                        }
                      }}
                      placeholder="(00) 00000-0000"
                    />
                  </FormField>
                  <FormField label="WhatsApp">
                    <Input
                      value={responsavel.whatsapp}
                      onChange={e => setResponsavel({ ...responsavel, whatsapp: maskPhone(e.target.value) })}
                      placeholder="(00) 00000-0000"
                    />
                  </FormField>
                </div>

                <FormField label="Email">
                  <Input
                    type="email"
                    value={responsavel.email}
                    onChange={e => setResponsavel({ ...responsavel, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </FormField>

                <div className="flex flex-col gap-3 rounded bg-gray-50 p-3 border border-gray-200">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={responsavel.is_financial_responsible}
                      onChange={e => setResponsavel({ ...responsavel, is_financial_responsible: e.target.checked })}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    Responsável Financeiro
                  </label>

                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={responsavel.same_address}
                      onChange={e => setResponsavel({ ...responsavel, same_address: e.target.checked })}
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    Mora no mesmo endereço do aluno
                  </label>
                </div>

                {!responsavel.same_address && (
                  <div className="border-t pt-4">
                    <div className="mb-2 text-sm font-medium text-gray-700">Endereço do Responsável</div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <FormField label="Rua">
                          <Input
                            value={responsavel.address_street}
                            onChange={e => setResponsavel({ ...responsavel, address_street: e.target.value })}
                          />
                        </FormField>
                      </div>
                      <FormField label="Número">
                        <Input
                          value={responsavel.address_number}
                          onChange={e => setResponsavel({ ...responsavel, address_number: e.target.value })}
                        />
                      </FormField>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <FormField label="Bairro">
                        <Input
                          value={responsavel.address_district}
                          onChange={e => setResponsavel({ ...responsavel, address_district: e.target.value })}
                        />
                      </FormField>
                      <FormField label="CEP">
                        <Input
                          value={responsavel.address_zip}
                          onChange={e => setResponsavel({ ...responsavel, address_zip: e.target.value })}
                        />
                      </FormField>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <FormField label="Cidade">
                        <Input
                          value={responsavel.address_city}
                          onChange={e => setResponsavel({ ...responsavel, address_city: e.target.value })}
                        />
                      </FormField>
                      <FormField label="Estado">
                        <Input
                          value={responsavel.address_state}
                          onChange={e => setResponsavel({ ...responsavel, address_state: e.target.value })}
                          maxLength={2}
                          placeholder="UF"
                        />
                      </FormField>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="atividade" current={activeTab}>
              <div className="space-y-5">

                {/* Graduation — only if activity uses graduation */}
                {usaGraduacao && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Graduação Atual">
                      <div className="relative">
                        <Select
                          value={capoeira.graduation}
                          onChange={e => setCapoeira({ ...capoeira, graduation: e.target.value })}
                          style={
                            settings.graduations?.find(g => g.name === capoeira.graduation)?.color
                              ? { borderLeft: `4px solid ${settings.graduations.find(g => g.name === capoeira.graduation)?.color}` }
                              : {}
                          }
                        >
                          <option value="">Selecione...</option>
                          {(settings.graduations || [])
                            .filter(g => g.active)
                            .sort((a, b) => a.order - b.order)
                            .map(g => (
                              <option key={g.id} value={g.name}>{g.name}</option>
                            ))}
                        </Select>
                        {capoeira.graduation && (() => {
                          const g = (settings.graduations || []).find(x => x.name === capoeira.graduation)
                          if (!g) return null
                          return (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                              <CordaPreview grad={g} width={80} />
                              <div className="text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">{g.name}</div>
                                <div className="text-xs text-gray-500">
                                  {[g.category, typeof g.grau === 'number' ? `Grau ${g.grau}` : null].filter(Boolean).join(' • ')}
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </FormField>
                    <FormField label="Data da Graduação">
                      <Input
                        type="date"
                        value={capoeira.graduation_date}
                        onChange={e => setCapoeira({ ...capoeira, graduation_date: e.target.value })}
                      />
                    </FormField>
                  </div>
                )}

                {/* Turma enrollment — filtered by activity type, same as mobile */}
                <div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Matrícula em Turmas</div>
                  <p className="text-xs text-gray-500 mb-3">
                    {pessoal.activityTypeIds.length === 0
                      ? 'Selecione um tipo de atividade na aba Pessoal para filtrar as turmas disponíveis.'
                      : 'Selecione as turmas. Você pode se matricular em turmas de unidades diferentes.'}
                  </p>

                  {filteredUnits.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 italic text-sm">
                      {pessoal.activityTypeIds.length === 0
                        ? 'Nenhuma atividade selecionada'
                        : 'Nenhuma turma encontrada para as atividades selecionadas'}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredUnits.map(unit => {
                        const unitTurmas = unit.turmas?.filter((t: any) =>
                          pessoal.activityTypeIds.includes(t.activityTypeId)
                        ) || []
                        if (unitTurmas.length === 0) return null
                        return (
                          <div key={unit.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                            {/* Unit header */}
                            <div
                              className="px-4 py-2 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/60"
                              style={{ borderLeft: `3px solid ${unit.color || '#6366F1'}` }}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: unit.color || '#6366F1' }} />
                              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{unit.name}</span>
                            </div>
                            {/* Turmas */}
                            <div className="p-3 flex flex-wrap gap-2">
                              {unitTurmas.map((t: any) => {
                                const isSelected = capoeira.turmaIds.includes(t.id)
                                const schedules = t.schedules || []
                                const schedStr = schedules
                                  .slice()
                                  .sort((a: any, b: any) => {
                                    const days = ['SEG','TER','QUA','QUI','SEX','SAB','DOM']
                                    return days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek)
                                  })
                                  .map((s: any) => `${s.dayOfWeek} ${s.startTime}`)
                                  .join(' · ')

                                return (
                                  <div key={t.id} className="flex flex-col gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          setCapoeira(prev => ({
                                            ...prev,
                                            turmaIds: prev.turmaIds.filter(id => id !== t.id),
                                            scheduleIds: prev.scheduleIds.filter(id =>
                                              !(schedules.some((s: any) => s.id === id))
                                            )
                                          }))
                                        } else {
                                          setCapoeira(prev => ({
                                            ...prev,
                                            turmaIds: [...prev.turmaIds, t.id]
                                          }))
                                        }
                                      }}
                                      className={`px-3 py-2 text-sm font-semibold rounded-lg border transition-all text-left ${
                                        isSelected
                                          ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-400 text-brand-700 dark:text-brand-300'
                                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-brand-300'
                                      }`}
                                    >
                                      <div>{t.name}</div>
                                      {schedStr && <div className="text-xs font-normal opacity-70 mt-0.5">{schedStr}</div>}
                                    </button>

                                    {/* Schedule chips when turma is selected */}
                                    {isSelected && schedules.length > 1 && (
                                      <div className="flex flex-wrap gap-1 pl-1">
                                        <span className="text-xs text-gray-400 self-center">Horários:</span>
                                        {schedules
                                          .slice()
                                          .sort((a: any, b: any) => {
                                            const days = ['SEG','TER','QUA','QUI','SEX','SAB','DOM']
                                            return days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek)
                                          })
                                          .map((s: any) => {
                                            const isSchSelected = capoeira.scheduleIds.includes(s.id)
                                            return (
                                              <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => {
                                                  setCapoeira(prev => ({
                                                    ...prev,
                                                    scheduleIds: isSchSelected
                                                      ? prev.scheduleIds.filter(id => id !== s.id)
                                                      : [...prev.scheduleIds, s.id]
                                                  }))
                                                }}
                                                className={`px-2 py-0.5 text-xs rounded-full border transition-all ${
                                                  isSchSelected
                                                    ? 'bg-brand-600 text-white border-brand-600'
                                                    : 'border-gray-300 text-gray-500 hover:border-brand-400'
                                                }`}
                                              >
                                                {s.dayOfWeek} {s.startTime}
                                              </button>
                                            )
                                          })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Teachers display */}
                  {teachersDisplay && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-0.5">Professores das Turmas Selecionadas</p>
                      <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">{teachersDisplay}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Data de Matrícula">
                    <Input
                      type="date"
                      value={capoeira.enrollment_date}
                      onChange={e => setCapoeira({ ...capoeira, enrollment_date: e.target.value })}
                    />
                  </FormField>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financeiro" current={activeTab}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Valor da Mensalidade">
                    <Input
                      value={financeiro.monthly_fee}
                      onChange={e => setFinanceiro({ ...financeiro, monthly_fee: e.target.value })}
                      placeholder="R$ 0,00"
                      readOnly={isProfessor} // Professor cannot edit monthly fee
                      className={isProfessor ? "bg-gray-100" : ""}
                    />
                  </FormField>
                  <FormField label="Dia do Vencimento">
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={financeiro.due_day}
                      onChange={e => setFinanceiro({ ...financeiro, due_day: e.target.value })}
                      placeholder="Ex: 10"
                      disabled={isProfessor}
                    />
                  </FormField>
                  <FormField label="Próximo Vencimento">
                    <Input
                      type="date"
                      value={financeiro.next_due_date}
                      onChange={e => setFinanceiro({ ...financeiro, next_due_date: e.target.value })}
                    />
                    {isProfessor && <div className="mt-1 text-xs text-green-600 font-medium">Campo liberado para professor</div>}
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Forma de Pagamento">
                    <Select
                      value={financeiro.payment_method}
                      onChange={e => setFinanceiro({ ...financeiro, payment_method: e.target.value })}
                      disabled={isProfessor} // Professor cannot edit payment method
                    >
                      <option value="">Selecione...</option>
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="PIX">PIX</option>
                      <option value="CARTAO">Cartão</option>
                      <option value="BOLETO">Boleto</option>
                    </Select>
                  </FormField>
                  <FormField label="Situação Financeira">
                    <Select
                      value={financeiro.financial_status}
                      onChange={e => setFinanceiro({ ...financeiro, financial_status: e.target.value })}
                      disabled={isProfessor} // Professor cannot edit status
                    >
                      <option value="EM_DIA">Em dia</option>
                      <option value="PENDENTE">Pendente</option>
                      <option value="ISENTO">Isento</option>
                    </Select>
                  </FormField>
                </div>
                {isProfessor && (
                  <div className="mt-2 text-xs text-gray-500">
                    * Alguns campos financeiros são gerenciados apenas pela administração.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="obs" current={activeTab}>
              <div className="space-y-4">
                <FormField label="Observações Gerais">
                  <textarea
                    className="h-32 w-full rounded border border-gray-300 p-2 text-sm focus:border-brand-500 focus:outline-none"
                    value={obs}
                    onChange={e => setObs(e.target.value)}
                    placeholder="Informações adicionais sobre o aluno..."
                  />
                </FormField>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Modal>

      {showCreateTeacher && (
        <CreateTeacherModal
          onClose={() => setShowCreateTeacher(false)}
          onSuccess={() => {
            setShowCreateTeacher(false)
            loadTeachers()
          }}
        />
      )}
    </>
  )
}
