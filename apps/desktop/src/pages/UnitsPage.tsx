import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button, Card, Icon, Modal, FormField, Input, Select, Badge } from '@gingaflow/ui'
import { listUnits, createUnit, updateUnit, listUnitTurmas, createTurma, updateTurma, Unit, Turma } from '../services/units'
import { unitRepository } from '../repositories/unitRepository'
import { turmaRepository } from '../repositories/turmaRepository'
import { http } from '../services/http'
import { formatSchedule } from '../utils/schedule'
import { ScheduleInput } from '../components/ScheduleInput'
import { useAuth } from '../contexts/AuthContext'

const UNIT_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#64748B'
]

interface ActivityType { id: string; name: string }
interface Teacher { id: string; full_name: string }

export default function UnitsPage() {
  const { auth } = useAuth()
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null)
  const [unitTurmas, setUnitTurmas] = useState<Record<string, Turma[]>>({})

  // Unit Modal
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [unitForm, setUnitForm] = useState<Partial<Unit>>({})

  // Turma Modal
  const [showTurmaModal, setShowTurmaModal] = useState(false)
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null)
  const [targetUnitId, setTargetUnitId] = useState<string | null>(null)
  const [turmaForm, setTurmaForm] = useState<any>({})
  const [schedules, setSchedules] = useState<any[]>([{ dayOfWeek: 'SEG', startTime: '18:00' }])

  // Helpers
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [activities, setActivities] = useState<ActivityType[]>([])

  useEffect(() => {
    loadUnits()
    loadHelpers()
  }, [])

  async function loadUnits() {
    setLoading(true)
    try {
      const res = await unitRepository.getAll()
      setUnits(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadHelpers() {
    try {
      const [teachersRes, activitiesRes] = await Promise.all([
        http<any>('/teachers'),
        http<any>('/activity-types')
      ])
      setTeachers(teachersRes?.data || [])
      setActivities(Array.isArray(activitiesRes) ? activitiesRes : [])
    } catch (e) { console.error(e) }
  }

  async function loadUnitTurmas(unitId: string) {
    try {
      const res = await turmaRepository.getByUnit(unitId)
      setUnitTurmas(prev => ({ ...prev, [unitId]: res }))
    } catch (e) { console.error(e) }
  }

  function toggleUnit(unitId: string) {
    if (expandedUnit === unitId) {
      setExpandedUnit(null)
    } else {
      setExpandedUnit(unitId)
      loadUnitTurmas(unitId)
    }
  }

  // Unit CRUD
  function openUnitModal(unit: Unit | null = null) {
    setEditingUnit(unit)
    setUnitForm(unit ? { ...unit } : { name: '', status: 'ATIVA', color: '#6366F1' })
    setShowUnitModal(true)
  }

  async function handleSaveUnit() {
    if (!unitForm.name?.trim()) {
      toast.error('Nome da unidade é obrigatório')
      return
    }
    try {
      if (editingUnit) {
        await unitRepository.save({ ...editingUnit, ...unitForm } as Unit)
        toast.success('Unidade atualizada!')
      } else {
        await unitRepository.save({ id: crypto.randomUUID(), ...unitForm } as Unit)
        toast.success('Unidade criada!')
      }
      setShowUnitModal(false)
      loadUnits()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar unidade')
    }
  }

  async function handleDeleteUnit(unit: Unit) {
    if (!window.confirm(`Deseja excluir a unidade "${unit.name}"? Todas as turmas vinculadas também serão afetadas.`)) return
    try {
      await http(`/units/${unit.id}`, { method: 'DELETE' })
      toast.success('Unidade excluída!')
      loadUnits()
    } catch (e: any) {
      toast.error(e.message || 'Não foi possível excluir a unidade')
    }
  }

  // Turma CRUD
  function openTurmaModal(unitId: string, turma: Turma | null = null) {
    setTargetUnitId(unitId)
    setEditingTurma(turma)
    if (turma) {
      setTurmaForm({
        name: turma.name,
        unitId: turma.unitId,
        activityTypeId: (turma as any).activityTypeId || '',
        teacherId: (turma as any).teacherId || '',
        defaultMonthlyFeeCents: turma.defaultMonthlyFeeCents ? (turma.defaultMonthlyFeeCents / 100).toString() : '',
        capacity: (turma as any).capacity?.toString() || '20',
        durationMinutes: (turma as any).durationMinutes?.toString() || '60',
        status: turma.status
      })
      setSchedules((turma as any).schedules?.length > 0 
        ? (turma as any).schedules 
        : [{ dayOfWeek: 'SEG', startTime: '18:00' }]
      )
    } else {
      setTurmaForm({ name: '', unitId, activityTypeId: '', teacherId: '', defaultMonthlyFeeCents: '', capacity: '20', durationMinutes: '60', status: 'ATIVA' })
      setSchedules([{ dayOfWeek: 'SEG', startTime: '18:00' }])
    }
    setShowTurmaModal(true)
  }

  async function handleSaveTurma() {
    if (!turmaForm.name?.trim()) {
      toast.error('Nome da turma é obrigatório')
      return
    }
    if (!turmaForm.unitId) {
      toast.error('Selecione uma unidade')
      return
    }
    if (schedules.length === 0) {
      toast.error('Adicione pelo menos um horário')
      return
    }
    // Validate: no duplicate schedules (same day + time) — mirrors Mobile TurmaCreateScreen
    const hasDuplicateSchedules = schedules.some((s, i) =>
      schedules.findIndex(other => other.dayOfWeek === s.dayOfWeek && other.startTime === s.startTime) !== i
    )
    if (hasDuplicateSchedules) {
      toast.error('Existem horários duplicados (mesmo dia e hora). Verifique os horários.')
      return
    }
    // Validate: all schedules must have valid time
    const hasInvalidTime = schedules.some(s => !s.startTime || !/^\d{2}:\d{2}$/.test(s.startTime))
    if (hasInvalidTime) {
      toast.error('Todos os horários devem ter um horário válido (HH:MM)')
      return
    }
    try {
      const payload = {
        name: turmaForm.name.trim(),
        unitId: turmaForm.unitId,
        activityTypeId: turmaForm.activityTypeId || null,
        teacherId: turmaForm.teacherId || null,
        capacity: parseInt(turmaForm.capacity) || 20,
        durationMinutes: parseInt(turmaForm.durationMinutes) || 60,
        defaultMonthlyFeeCents: turmaForm.defaultMonthlyFeeCents 
          ? Math.round(parseFloat(turmaForm.defaultMonthlyFeeCents.replace(',', '.')) * 100)
          : null,
        schedules,
        status: turmaForm.status || 'ATIVA'
      }

      if (editingTurma) {
        await http(`/turmas/${editingTurma.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        toast.success('Turma atualizada!')
      } else {
        await http('/turmas', { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Turma criada!')
      }

      setShowTurmaModal(false)
      if (targetUnitId) loadUnitTurmas(targetUnitId)
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar turma')
    }
  }

  async function handleDeleteTurma(turma: Turma) {
    if (!window.confirm(`Deseja excluir a turma "${turma.name}"?`)) return
    try {
      await http(`/turmas/${turma.id}`, { method: 'DELETE' })
      toast.success('Turma excluída!')
      if (turma.unitId) loadUnitTurmas(turma.unitId)
    } catch (e: any) {
      toast.error(e.message || 'Não foi possível excluir a turma')
    }
  }

  const DAYS = [
    { key: 'DOM', label: 'Dom' }, { key: 'SEG', label: 'Seg' }, { key: 'TER', label: 'Ter' },
    { key: 'QUA', label: 'Qua' }, { key: 'QUI', label: 'Qui' }, { key: 'SEX', label: 'Sex' }, { key: 'SAB', label: 'Sáb' }
  ]

  if (auth.role !== 'ADMIN') {
    return <div className="p-8 text-center text-gray-500">Acesso restrito para administradores.</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Gerencie as unidades e suas turmas com horários</p>
        <Button onClick={() => openUnitModal()}>
          <Icon name="plus" className="mr-2 w-4 h-4" />
          Nova Unidade
        </Button>
      </div>

      {/* Units List */}
      {loading && units.length === 0 ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
        </div>
      ) : units.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Icon name="home" className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Nenhuma unidade cadastrada</p>
              <p className="text-sm text-gray-500 mt-1">A unidade "Matriz" é criada automaticamente. Clique abaixo para criar.</p>
            </div>
            <Button onClick={() => openUnitModal()}>
              <Icon name="plus" className="mr-2 w-4 h-4" />
              Criar Unidade Matriz
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {units.map(unit => {
            const turmas = unitTurmas[unit.id] || []
            const isExpanded = expandedUnit === unit.id

            return (
              <Card key={unit.id} className="overflow-hidden p-0">
                {/* Unit color bar */}
                {unit.color && (
                  <div className="h-1 w-full" style={{ backgroundColor: unit.color }} />
                )}

                {/* Unit Header */}
                <div className="p-4 flex items-center justify-between">
                  <button
                    onClick={() => toggleUnit(unit.id)}
                    className="flex items-center gap-3 flex-1 text-left group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: unit.color || '#6366F1' }}
                    >
                      {unit.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">
                        {unit.name}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        {unit.address && <span>{unit.address}</span>}
                        {unit.address && <span>·</span>}
                        <span>{isExpanded ? `${turmas.length} turma(s)` : 'Clique para ver turmas'}</span>
                        <Badge variant={unit.status === 'ATIVA' ? 'success' : 'neutral'}>{unit.status}</Badge>
                      </div>
                    </div>
                    <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} className="w-4 h-4 text-gray-400 ml-auto mr-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openUnitModal(unit)}
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                    >
                      <Icon name="edit" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUnit(unit)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Icon name="trash" className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Turmas Section */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-gray-700">
                    <div className="p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Turmas ({turmas.length})
                      </span>
                      <Button size="sm" onClick={() => openTurmaModal(unit.id)}>
                        <Icon name="plus" className="mr-1 w-3.5 h-3.5" />
                        Nova Turma
                      </Button>
                    </div>

                    {turmas.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 text-sm">
                        Nenhuma turma cadastrada nesta unidade. 
                        <button onClick={() => openTurmaModal(unit.id)} className="text-brand-600 hover:underline ml-1">
                          Criar turma
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {turmas.map(turma => (
                          <div key={turma.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                            <div>
                              <div className="font-semibold text-gray-800 dark:text-white">{turma.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                {turma.schedules && turma.schedules.length > 0 ? formatSchedule(turma.schedules as any) : (turma.schedule && formatSchedule(turma.schedule))}
                                
                                {turma.schedules && turma.schedules.length > 0 && (
                                  <span>{turma.schedules.map((s: any) => `${s.dayOfWeek} ${s.startTime}`).join(' · ')}</span>
                                )}
                                {turma.defaultMonthlyFeeCents && (
                                  <>
                                    <span>·</span>
                                    <span>R$ {(turma.defaultMonthlyFeeCents / 100).toFixed(2).replace('.', ',')}/mês</span>
                                  </>
                                )}
                                <Badge variant={turma.status === 'ATIVA' ? 'success' : 'neutral'}>{turma.status}</Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openTurmaModal(unit.id, turma)}
                                className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                              >
                                <Icon name="edit" className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTurma(turma)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Icon name="trash" className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Unit Modal */}
      {showUnitModal && (
        <Modal
          open={true}
          title={editingUnit ? 'Editar Unidade' : 'Nova Unidade'}
          onClose={() => setShowUnitModal(false)}
          primaryAction={{ label: editingUnit ? 'Salvar' : 'Criar', onClick: handleSaveUnit }}
          secondaryAction={{ label: 'Cancelar', onClick: () => setShowUnitModal(false) }}
        >
          <div className="space-y-4">
            <FormField label="Nome da Unidade *">
              <Input
                value={unitForm.name || ''}
                onChange={e => setUnitForm({ ...unitForm, name: e.target.value })}
                placeholder="Ex: Matriz, Filial Norte, Centro..."
                autoFocus
              />
            </FormField>

            <FormField label="Endereço">
              <Input
                value={unitForm.address || ''}
                onChange={e => setUnitForm({ ...unitForm, address: e.target.value })}
                placeholder="Rua, número, bairro..."
              />
            </FormField>

            <FormField label="Mensalidade Padrão (R$)">
              <Input
                type="number"
                value={unitForm.defaultMonthlyFeeCents ? (unitForm.defaultMonthlyFeeCents / 100).toString() : ''}
                onChange={e => setUnitForm({ ...unitForm, defaultMonthlyFeeCents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                placeholder="150,00"
              />
            </FormField>

            <FormField label="Cor da Unidade">
              <div className="flex flex-wrap gap-2 mt-1">
                {UNIT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setUnitForm({ ...unitForm, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      unitForm.color === color ? 'border-gray-900 dark:border-white scale-110 ring-2 ring-offset-1 ring-gray-400' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </FormField>

            <FormField label="Status">
              <Select value={unitForm.status || 'ATIVA'} onChange={e => setUnitForm({ ...unitForm, status: e.target.value as any })}>
                <option value="ATIVA">Ativa</option>
                <option value="INATIVA">Inativa</option>
              </Select>
            </FormField>
          </div>
        </Modal>
      )}

      {/* Turma Modal */}
      {showTurmaModal && (
        <Modal
          open={true}
          title={editingTurma ? 'Editar Turma' : 'Nova Turma'}
          onClose={() => setShowTurmaModal(false)}
          primaryAction={{ label: editingTurma ? 'Salvar' : 'Criar Turma', onClick: handleSaveTurma }}
          secondaryAction={{ label: 'Cancelar', onClick: () => setShowTurmaModal(false) }}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <FormField label="Nome da Turma *">
              <Input
                value={turmaForm.name || ''}
                onChange={e => setTurmaForm({ ...turmaForm, name: e.target.value })}
                placeholder="Ex: Infantil, Adulto Iniciante, Avançado..."
                autoFocus
              />
            </FormField>

            <FormField label="Atividade">
              <Select value={turmaForm.activityTypeId || ''} onChange={e => setTurmaForm({ ...turmaForm, activityTypeId: e.target.value })}>
                <option value="">Selecione uma atividade...</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </FormField>

            <FormField label="Professor Regente">
              <Select value={turmaForm.teacherId || ''} onChange={e => setTurmaForm({ ...turmaForm, teacherId: e.target.value })}>
                <option value="">Selecione um professor...</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Mensalidade (R$)">
                <Input
                  type="number"
                  value={turmaForm.defaultMonthlyFeeCents || ''}
                  onChange={e => setTurmaForm({ ...turmaForm, defaultMonthlyFeeCents: e.target.value })}
                  placeholder="150,00"
                />
              </FormField>
              <FormField label="Capacidade (alunos)">
                <Input
                  type="number"
                  value={turmaForm.capacity || '20'}
                  onChange={e => setTurmaForm({ ...turmaForm, capacity: e.target.value })}
                  placeholder="20"
                />
              </FormField>
            </div>

            <FormField label="Duração da Aula (min)">
              <Input
                type="number"
                value={turmaForm.durationMinutes || '60'}
                onChange={e => setTurmaForm({ ...turmaForm, durationMinutes: e.target.value })}
                placeholder="60"
              />
            </FormField>

            {/* Schedules */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Horários da Turma *
                </label>
                <button
                  type="button"
                  onClick={() => setSchedules([...schedules, { dayOfWeek: 'SEG', startTime: '18:00' }])}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                >
                  <Icon name="plus" className="w-4 h-4" />
                  Adicionar horário
                </button>
              </div>
              <div className="space-y-3">
                {schedules.map((sched, idx) => (
                  <div key={idx} className="p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {DAYS.map(day => (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => {
                            const newSchedules = [...schedules]
                            newSchedules[idx] = { ...newSchedules[idx], dayOfWeek: day.key }
                            setSchedules(newSchedules)
                          }}
                          className={`px-2.5 py-1 text-xs font-bold rounded-full border transition-all ${
                            sched.dayOfWeek === day.key
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-brand-400'
                          }`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        value={sched.startTime}
                        onChange={e => {
                          const newSchedules = [...schedules]
                          newSchedules[idx] = { ...newSchedules[idx], startTime: e.target.value }
                          setSchedules(newSchedules)
                        }}
                        placeholder="18:00"
                        className="flex-1"
                        maxLength={5}
                      />
                      <Select
                        value={sched.teacherId || ''}
                        onChange={e => {
                          const newSchedules = [...schedules]
                          newSchedules[idx] = { ...newSchedules[idx], teacherId: e.target.value || null }
                          setSchedules(newSchedules)
                        }}
                        className="flex-1"
                      >
                        <option value="">Professor padrão</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                      </Select>
                      {schedules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setSchedules(schedules.filter((_, i) => i !== idx))}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <FormField label="Status">
              <Select value={turmaForm.status || 'ATIVA'} onChange={e => setTurmaForm({ ...turmaForm, status: e.target.value })}>
                <option value="ATIVA">Ativa</option>
                <option value="INATIVA">Inativa</option>
              </Select>
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  )
}
