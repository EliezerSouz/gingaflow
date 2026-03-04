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

  // Teachers State
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [showCreateTeacher, setShowCreateTeacher] = useState(false)

  // Form States
  const [pessoal, setPessoal] = useState({
    full_name: '',
    cpf: '',
    birth_date: '',
    status: 'ATIVO'
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
    teacher: '', // Stores the teacher's name
    unit: '',
    group_class: '', // Stores the turma name
    enrollment_date: new Date().toISOString().split('T')[0]
  })

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

  // Selection States for Cascading Dropdowns
  const [selectedTeacherId, setSelectedTeacherId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [selectedTurmaId, setSelectedTurmaId] = useState('')

  const activeTeachers = teachers.filter(t => t.status === 'ATIVO')
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId)
  const availableUnits = selectedTeacher?.units || []
  const selectedUnit = availableUnits.find(u => u.id === selectedUnitId)
  const availableTurmas = selectedUnit?.turmas || []

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
    if (studentId) {
      loadStudent()
    } else {
      // Defaults for new student
      if (settings.defaultMonthlyFee) {
        setFinanceiro(prev => ({ ...prev, monthly_fee: String(settings.defaultMonthlyFee) }))
      }
      if (settings.defaultPaymentMethod) {
        setFinanceiro(prev => ({ ...prev, payment_method: settings.defaultPaymentMethod || '' }))
      }
    }
  }, [studentId, isProfessor, settings])

  // Auto-select logged-in professor
  useEffect(() => {
    if (teachers.length > 0 && !studentId && isProfessor && auth.relatedId && !selectedTeacherId) {
      const t = teachers.find(t => t.id === auth.relatedId)
      if (t) {
        setSelectedTeacherId(t.id)
        setCapoeira(prev => ({ ...prev, teacher: t.full_name }))
      }
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

  // Apply hierarchical defaults when unit/turma selection changes
  useEffect(() => {
    const unit = selectedUnit
    if (selectedUnitId && !selectedTurmaId && unit) {
      const feeCents = unit.defaultMonthlyFeeCents
      const method = unit.defaultPaymentMethod || settings.defaultPaymentMethod
      setFinanceiro(prev => ({
        ...prev,
        monthly_fee: prev.monthly_fee || (feeCents ? String(Math.round(feeCents) / 100) : (settings.defaultMonthlyFee ? String(settings.defaultMonthlyFee) : '')),
        payment_method: prev.payment_method || (method || '')
      }))
    }
  }, [selectedUnitId, selectedTurmaId, selectedUnit, settings.defaultMonthlyFee, settings.defaultPaymentMethod])

  useEffect(() => {
    if (selectedTurmaId) {
      const turma = availableTurmas.find(t => t.id === selectedTurmaId)
      const feeCents = turma?.defaultMonthlyFeeCents ?? selectedUnit?.defaultMonthlyFeeCents
      const method = turma?.defaultPaymentMethod || selectedUnit?.defaultPaymentMethod || settings.defaultPaymentMethod
      setFinanceiro(prev => ({
        ...prev,
        monthly_fee: (isProfessor || !prev.monthly_fee)
          ? (feeCents ? String(Math.round(feeCents) / 100) : (settings.defaultMonthlyFee ? String(settings.defaultMonthlyFee) : ''))
          : prev.monthly_fee,
        payment_method: (isProfessor || !prev.payment_method) ? (method || '') : prev.payment_method
      }))
    }
  }, [selectedTurmaId, availableTurmas, selectedUnit, settings.defaultMonthlyFee, settings.defaultPaymentMethod, isProfessor])
  // Auto-select IDs when editing if names match
  useEffect(() => {
    if (teachers.length > 0 && capoeira.teacher && !selectedTeacherId) {
      const t = teachers.find(t => t.full_name === capoeira.teacher)
      if (t) {
        setSelectedTeacherId(t.id)
        if (capoeira.group_class) {
          for (const u of t.units || []) {
            const tm = u.turmas.find(tm => tm.name === capoeira.group_class)
            if (tm) {
              setSelectedUnitId(u.id)
              setSelectedTurmaId(tm.id)
              if (!capoeira.unit) {
                setCapoeira(prev => ({ ...prev, unit: u.name }))
              }
              break
            }
          }
        }
      }
    }
  }, [teachers, capoeira.teacher, capoeira.group_class])

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
        cpf: maskCPF(s.cpf || ''),
        birth_date: s.birth_date || '',
        status: s.status
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

      setCapoeira({
        graduation: extract(/Graduação Inicial: (.*)/),
        graduation_date: extract(/Data Graduação: (.*)/),
        teacher: extract(/Professor: (.*)/),
        unit: extract(/Unidade: (.*)/),
        group_class: extract(/Turma: (.*)/),
        enrollment_date: s.enrollment_date
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

[CAPOEIRA]
Graduação Inicial: ${capoeira.graduation}
Data Graduação: ${capoeira.graduation_date}
Professor: ${capoeira.teacher}
Unidade: ${capoeira.unit}
Turma: ${capoeira.group_class}

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

      const payload = {
        full_name: pessoal.full_name,
        cpf: unmask(pessoal.cpf),
        birth_date: pessoal.birth_date || undefined,
        email: contato.email || undefined,
        phone: unmask(contato.phone) || undefined,
        status: pessoal.status,
        enrollment_date: capoeira.enrollment_date,
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
              <TabsTrigger value="responsavel" current={activeTab} onChange={setActiveTab}>
                Responsável
                {(isMinor || fieldErrors.resp_name || fieldErrors.resp_rel || fieldErrors.resp_phone || fieldErrors.resp_cpf) && (
                  <span className={`ml-2 inline-block h-2 w-2 rounded-full ${Object.keys(fieldErrors).some(k => k.startsWith('resp_')) ? 'bg-red-500' : 'bg-amber-500'}`} />
                )}
              </TabsTrigger>
              <TabsTrigger value="capoeira" current={activeTab} onChange={setActiveTab}>Capoeira</TabsTrigger>
              <TabsTrigger value="financeiro" current={activeTab} onChange={setActiveTab}>Financeiro</TabsTrigger>
              <TabsTrigger value="obs" current={activeTab} onChange={setActiveTab}>Obs</TabsTrigger>
            </TabsList>

            <TabsContent value="pessoal" current={activeTab}>
              <div className="space-y-4">
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

                <div className="rounded border border-dashed p-4 text-center text-sm text-gray-500">
                  Foto do aluno (Em breve)
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

            <TabsContent value="capoeira" current={activeTab}>
              <div className="space-y-4">
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
                            <option key={g.id} value={g.name}>
                              {g.name}
                            </option>
                          ))}
                      </Select>
                      {capoeira.graduation && (() => {
                        const g = (settings.graduations || []).find(x => x.name === capoeira.graduation)
                        if (!g) return null
                        return (
                          <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-100 flex items-center gap-3">
                            <CordaPreview grad={g} width={80} />
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{g.name}</div>
                              <div className="text-xs text-gray-500">
                                {[
                                  g.category,
                                  typeof g.grau === 'number' ? `Grau ${g.grau}` : null
                                ].filter(Boolean).join(' • ')}
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

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <FormField label="Professor Responsável">
                      <Select
                        value={selectedTeacherId}
                        onChange={e => {
                          const tid = e.target.value
                          setSelectedTeacherId(tid)
                          const t = teachers.find(x => x.id === tid)
                          setCapoeira(prev => ({
                            ...prev,
                            teacher: t ? t.full_name : '',
                            unit: '',
                            group_class: ''
                          }))
                          setSelectedUnitId('')
                          setSelectedTurmaId('')
                        }}
                        disabled={isProfessor} // Professor cannot change teacher
                      >
                        <option value="">Selecione um professor</option>
                        {activeTeachers.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.full_name} {t.capoeira_name ? `(${t.capoeira_name})` : ''}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>
                  <div className="pb-1">
                    {/* Only show add teacher if admin */}
                    {isAdmin && (
                      <Button variant="secondary" onClick={() => setShowCreateTeacher(true)}>
                        <Icon name="plus" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Unidade">
                    <div className="relative">
                      <Select
                        value={selectedUnitId}
                        onChange={e => {
                          const uid = e.target.value
                          setSelectedUnitId(uid)
                          const u = availableUnits.find(x => x.id === uid)
                          setCapoeira(prev => ({
                            ...prev,
                            unit: u ? u.name : '',
                            group_class: ''
                          }))
                          setSelectedTurmaId('')
                        }}
                        disabled={!selectedTeacherId}
                        style={selectedUnit?.color ? { borderLeft: `4px solid ${selectedUnit.color}` } : {}}
                      >
                        <option value="">Selecione a unidade</option>
                        {availableUnits.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </Select>
                      {selectedUnit?.color && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <span
                            className="block w-3 h-3 rounded-full border border-gray-200"
                            style={{ backgroundColor: selectedUnit.color }}
                            title={`Cor da unidade: ${selectedUnit.color}`}
                          />
                        </div>
                      )}
                    </div>
                  </FormField>

                  <FormField label="Turma">
                    <Select
                      value={selectedTurmaId}
                      onChange={e => {
                        const tid = e.target.value
                        setSelectedTurmaId(tid)
                        const t = availableTurmas.find(x => x.id === tid)
                        setCapoeira(prev => ({ ...prev, group_class: t ? t.name : '' }))
                      }}
                      disabled={!selectedUnitId}
                    >
                      <option value="">Selecione a turma</option>
                      {availableTurmas.map(t => (
                        <option key={t.id} value={t.id}>{t.name} {t.schedule ? `(${formatSchedule(t.schedule)})` : ''}</option>
                      ))}
                    </Select>
                  </FormField>
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
