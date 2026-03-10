import React, { useState, useEffect } from 'react'
import { PageHeader, Button, Icon, Modal, FormField, Input, Select, Card, Badge } from '@gingaflow/ui'
import { listUnits, createUnit, updateUnit, listUnitTurmas, createTurma, updateTurma, Unit, Turma } from '../services/units'
import { unitRepository } from '../repositories/unitRepository'
import { turmaRepository } from '../repositories/turmaRepository'
import { useSettings } from '../contexts/SettingsContext'
import { Graduation, CordaType } from '../services/settings'
import { ScheduleInput } from '../components/ScheduleInput'
import { CordaPreview } from '../components/CordaPreview'
import { formatSchedule, parseSchedule } from '../utils/schedule'

const UNIT_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', 
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', 
  '#64748B'
]

const GRADUATION_COLORS = [
  { name: 'Cinza (Crua)', value: '#9CA3AF' },
  { name: 'Amarelo', value: '#FBBF24' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Roxo', value: '#8B5CF6' },
  { name: 'Marrom', value: '#78350F' },
  { name: 'Preto', value: '#000000' },
  { name: 'Branco', value: '#FFFFFF' }
]

const CATEGORIES = [
  'Infantil',
  'Juvenil',
  'Adulto',
  'Transformação',
  'Adaptado',
  'Avançado',
  'Graduado',
  'Instrutor',
  'Professor',
  'Contramestre',
  'Mestre'
]


export function AcademicSettings() {
  const { settings, updateSettings } = useSettings()
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null)
  
  // Modals state
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [showTurmaModal, setShowTurmaModal] = useState(false)
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null)
  const [targetUnitId, setTargetUnitId] = useState<string | null>(null)

  // Graduation State
  const [showGradModal, setShowGradModal] = useState(false)
  const [editingGrad, setEditingGrad] = useState<Graduation | null>(null)
  const [gradForm, setGradForm] = useState<Partial<Graduation>>({})

  useEffect(() => {
    loadUnits()
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

  function handleSaveGraduation() {
    const currentGrads = settings.graduations || []
    let newGrads = [...currentGrads]

    const sanitized: Graduation = {
      id: editingGrad?.id || crypto.randomUUID(),
      name: gradForm.name || 'Nova Graduação',
      category: gradForm.category,
      grau: gradForm.grau,
      cordaType: gradForm.cordaType || CordaType.UNICA,
      color: gradForm.color,
      colorLeft: gradForm.cordaType === CordaType.DUPLA ? gradForm.colorLeft : undefined,
      colorRight: gradForm.cordaType === CordaType.DUPLA ? gradForm.colorRight : undefined,
      pontaLeft: gradForm.cordaType === CordaType.COM_PONTAS ? gradForm.pontaLeft : undefined,
      pontaRight: gradForm.cordaType === CordaType.COM_PONTAS ? gradForm.pontaRight : undefined,
      order: editingGrad?.order ?? (currentGrads.length + 1),
      active: gradForm.active !== false
    }

    if (editingGrad) {
      newGrads = newGrads.map(g => g.id === editingGrad.id ? sanitized : g)
    } else {
      newGrads.push(sanitized)
    }

    // Sort by order
    newGrads.sort((a, b) => a.order - b.order)

    updateSettings({ graduations: newGrads })
    setShowGradModal(false)
  }

  function handleDeleteGraduation(id: string) {
    if (!confirm('Tem certeza que deseja remover esta graduação?')) return
    const newGrads = (settings.graduations || []).filter(g => g.id !== id)
    updateSettings({ graduations: newGrads })
  }

  function moveGraduation(index: number, direction: 'up' | 'down') {
    const newGrads = [...(settings.graduations || [])]
    if (direction === 'up' && index > 0) {
      [newGrads[index], newGrads[index - 1]] = [newGrads[index - 1], newGrads[index]]
    } else if (direction === 'down' && index < newGrads.length - 1) {
      [newGrads[index], newGrads[index + 1]] = [newGrads[index + 1], newGrads[index]]
    }
    // Update orders
    newGrads.forEach((g, i) => g.order = i + 1)
    updateSettings({ graduations: newGrads })
  }

  function handleCreateUnit() {
    setEditingUnit(null)
    setShowUnitModal(true)
  }

  function handleEditUnit(unit: Unit) {
    setEditingUnit(unit)
    setShowUnitModal(true)
  }

  function handleCreateTurma(unitId: string) {
    setTargetUnitId(unitId)
    setEditingTurma(null)
    setShowTurmaModal(true)
  }

  function handleEditTurma(turma: Turma, unitId: string) {
    setTargetUnitId(unitId)
    setEditingTurma(turma)
    setShowTurmaModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unidades & Turmas</h1>
          <p className="text-sm text-gray-500">Gerencie as unidades e turmas do seu grupo de capoeira.</p>
        </div>
        <Button onClick={handleCreateUnit} className="shadow-sm">
          <Icon name="plus" className="mr-2 h-4 w-4" />
          Nova Unidade
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-lg border border-dashed dark:border-gray-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-4"></div>
          <p className="text-gray-500">Carregando unidades...</p>
        </div>
      ) : units.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed dark:border-gray-200 dark:border-gray-700">
           <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
             <Icon name="dashboard" className="h-8 w-8 text-gray-400" />
           </div>
           <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhuma unidade cadastrada</h3>
           <p className="text-gray-500 mb-6">Comece criando sua primeira unidade de treino.</p>
           <Button variant="secondary" onClick={handleCreateUnit}>Criar Unidade</Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {units.map(unit => (
            <UnitCard 
              key={unit.id} 
              unit={unit} 
              onEdit={() => handleEditUnit(unit)}
              onCreateTurma={() => handleCreateTurma(unit.id)}
              onEditTurma={(t) => handleEditTurma(t, unit.id)}
            />
          ))}
        </div>
      )}

      {showUnitModal && (
        <UnitModal 
          unit={editingUnit} 
          onClose={() => setShowUnitModal(false)} 
          onSuccess={() => {
            setShowUnitModal(false)
            loadUnits()
          }} 
        />
      )}

      {showTurmaModal && targetUnitId && (
        <TurmaModal 
          unitId={targetUnitId}
          turma={editingTurma}
          onClose={() => setShowTurmaModal(false)}
          onSuccess={() => {
            setShowTurmaModal(false)
            loadUnits() 
            window.dispatchEvent(new CustomEvent('refresh-turmas-' + targetUnitId))
          }}
        />
      )}

      {false && (
      <div className="pt-6 border-t">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-primary">Graduações Padrão</h2>
            <p className="text-sm text-muted">Defina as graduações (cordas) disponíveis para os alunos.</p>
          </div>
          <Button onClick={() => { setEditingGrad(null); setGradForm({}); setShowGradModal(true) }}>
            <Icon name="plus" className="mr-2" />
            Nova Graduação
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm overflow-hidden">
          {(!settings?.graduations || settings?.graduations?.length === 0) ? (
            <div className="p-8 text-center text-muted">
              Nenhuma graduação cadastrada.
            </div>
          ) : (
            <div className="divide-y">
              {(settings.graduations || []).map((grad, index) => (
                <div key={grad.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center justify-center w-8">
                      <button 
                        onClick={() => moveGraduation(index, 'up')}
                        disabled={index === 0}
                        className="text-muted hover:text-secondary disabled:opacity-30"
                      >
                        <Icon name="chevron-up" className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => moveGraduation(index, 'down')}
                        disabled={index === (settings.graduations?.length || 0) - 1}
                        className="text-muted hover:text-secondary disabled:opacity-30"
                      >
                        <Icon name="chevron-down" className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="h-10 w-28 flex items-center justify-center">
                      <CordaPreview grad={grad} width={90} />
                    </div>
                    
                    <div>
                      <div className="font-medium text-primary">
                        {grad.name}
                        {typeof grad.grau === 'number' ? ` • Grau ${grad.grau}` : ''}
                        {grad.category ? ` • ${grad.category}` : ''}
                      </div>
                      {!grad.active && <span className="text-xs bg-gray-100 dark:bg-gray-700 text-secondary px-2 py-0.5 rounded">Inativa</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingGrad(grad); setGradForm(grad); setShowGradModal(true) }}>
                      <Icon name="edit" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteGraduation(grad.id)}>
                      <Icon name="trash" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      {false && showGradModal && (
        <Modal
          open={true}
          title={editingGrad ? 'Editar Graduação' : 'Nova Graduação'}
          onClose={() => setShowGradModal(false)}
          primaryAction={{ label: 'Salvar', onClick: handleSaveGraduation }}
          secondaryAction={{ label: 'Cancelar', onClick: () => setShowGradModal(false) }}
        >
          <div className="space-y-4">
            <FormField label="Nome da Graduação">
              <Input 
                value={gradForm.name || ''} 
                onChange={e => setGradForm({ ...gradForm, name: e.target.value })}
                placeholder="Ex: Corda Branca"
              />
            </FormField>

            <FormField label="Descrição curta">
              <Input 
                value={gradForm.description || ''} 
                onChange={e => setGradForm({ ...gradForm, description: e.target.value })}
                placeholder="Ex: Adulto • 1º Grau"
              />
            </FormField>

            <FormField label="Categoria">
              <Select value={gradForm.category || ''} onChange={e => setGradForm({ ...gradForm, category: e.target.value || undefined })}>
                <option value="">Selecione...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>

            <FormField label="Grau">
              <Input 
                type="number"
                value={typeof gradForm.grau === 'number' ? String(gradForm.grau) : ''}
                onChange={e => setGradForm({ ...gradForm, grau: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                placeholder="Ex: 1"
              />
            </FormField>

            <FormField label="Tipo de Corda">
              <Select
                value={gradForm.cordaType || CordaType.UNICA}
                onChange={e => {
                  const value = e.target.value as CordaType
                  setGradForm({
                    ...gradForm,
                    cordaType: value
                  })
                }}
              >
                {Object.values(CordaType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </FormField>

            {(!gradForm.cordaType || gradForm.cordaType === CordaType.UNICA) && (
              <FormField label="Cor base">
                <div className="flex flex-wrap gap-2">
                  {GRADUATION_COLORS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${gradForm.color === c.value ? 'border-gray-900 ring-2 ring-gray-300 scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setGradForm({ ...gradForm, color: c.value })}
                      title={c.name}
                    />
                  ))}
                </div>
              </FormField>
            )}

            {gradForm.cordaType === CordaType.DUPLA && (
              <>
                <FormField label="Cor do meio (esquerda)">
                  <div className="flex flex-wrap gap-2">
                    {GRADUATION_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${gradForm.colorLeft === c.value ? 'border-gray-900 ring-2 ring-gray-300 scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => setGradForm({ ...gradForm, colorLeft: c.value })}
                        title={c.name}
                      />
                    ))}
                  </div>
                </FormField>
                <FormField label="Cor do meio (direita)">
                  <div className="flex flex-wrap gap-2">
                    {GRADUATION_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${gradForm.colorRight === c.value ? 'border-gray-900 ring-2 ring-gray-300 scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => setGradForm({ ...gradForm, colorRight: c.value })}
                        title={c.name}
                      />
                    ))}
                  </div>
                </FormField>
              </>
            )}

            {gradForm.cordaType === CordaType.COM_PONTAS && (
              <>
                <FormField label="Cor base">
                  <div className="flex flex-wrap gap-2">
                    {GRADUATION_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${gradForm.color === c.value ? 'border-gray-900 ring-2 ring-gray-300 scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => setGradForm({ ...gradForm, color: c.value })}
                        title={c.name}
                      />
                    ))}
                  </div>
                </FormField>
                <FormField label="Ponta esquerda">
                  <div className="flex flex-wrap gap-2">
                    {GRADUATION_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${gradForm.pontaLeft === c.value ? 'border-gray-900 ring-2 ring-gray-300 scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => setGradForm({ ...gradForm, pontaLeft: c.value })}
                        title={c.name}
                      />
                    ))}
                  </div>
                </FormField>
                <FormField label="Ponta direita">
                  <div className="flex flex-wrap gap-2">
                    {GRADUATION_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${gradForm.pontaRight === c.value ? 'border-gray-900 ring-2 ring-gray-300 scale-110' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c.value }}
                        onClick={() => setGradForm({ ...gradForm, pontaRight: c.value })}
                        title={c.name}
                      />
                    ))}
                  </div>
                </FormField>
              </>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Preview da corda</div>
              <div className="flex flex-col items-center gap-1">
                <div className="font-medium text-center">{gradForm.name || 'Graduação'}</div>
                <CordaPreview grad={gradForm} />
              </div>
            </div>

            <FormField label="Status">
              <div className="flex items-center space-x-2 mt-2">
                <input 
                  type="checkbox" 
                  id="gradActive"
                  checked={gradForm.active !== false}
                  onChange={e => setGradForm({ ...gradForm, active: e.target.checked })}
                  className="rounded border-gray-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                />
                <label htmlFor="gradActive" className="text-sm text-gray-700 select-none cursor-pointer">
                  Graduação Ativa
                </label>
              </div>
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  )
}

function UnitCard({ unit, onEdit, onCreateTurma, onEditTurma }: { 
  unit: Unit, 
  onEdit: () => void, 
  onCreateTurma: () => void,
  onEditTurma: (t: Turma) => void
}) {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTurmas = async () => {
    setLoading(true)
    try {
      const res = await turmaRepository.getByUnit(unit.id)
      setTurmas(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTurmas()
    
    const handler = () => fetchTurmas()
    window.addEventListener('refresh-turmas-' + unit.id, handler)
    return () => window.removeEventListener('refresh-turmas-' + unit.id, handler)
  }, [unit.id])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {unit.color && <div className="h-1.5 w-full" style={{ backgroundColor: unit.color }} />}
      <div className="p-5 border-b flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div 
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border-2 p-1.5 shadow-sm"
            style={{ borderColor: unit.color || '#E5E7EB' }}
          >
            <div 
               className="flex h-full w-full items-center justify-center rounded-lg"
               style={{ backgroundColor: `${unit.color || '#4B5563'}15`, color: unit.color || '#4B5563' }}
            >
              <Icon name="dashboard" className="h-6 w-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{unit.name}</h3>
               {unit.status && (
                 <Badge variant={unit.status === 'ATIVA' ? 'success' : 'danger'}>
                   {unit.status}
                 </Badge>
               )}
            </div>
            {unit.address ? (
              <p className="text-sm text-gray-500 flex items-center gap-1.5">
                <Icon name="home" className="h-3.5 w-3.5" />
                {unit.address}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">Sem endereço cadastrado</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-9 w-9 p-0 rounded-full hover:bg-gray-100">
            <Icon name="edit" className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-5 bg-gray-50/50 dark:bg-gray-900/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Turmas</h4>
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
               {turmas.length}
            </span>
          </div>
          <button 
            onClick={onCreateTurma}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1 transition-colors"
          >
            <Icon name="plus" className="h-3 w-3" />
            ADICIONAR TURMA
          </button>
        </div>

        {loading ? (
          <div className="text-xs text-gray-400 animate-pulse">Carregando turmas...</div>
        ) : turmas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800/50 rounded-lg border border-dashed dark:border-gray-700 p-6 flex flex-col items-center justify-center text-center">
            <p className="text-sm text-gray-400 italic">Nenhuma turma cadastrada nesta unidade.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {turmas.map(turma => (
              <div 
                key={turma.id} 
                className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-brand-500/50 hover:shadow-sm transition-all group cursor-default"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                    <Icon name="calendar" className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm">{turma.name}</div>
                    <div className="text-[11px] text-gray-500 uppercase font-medium">{formatSchedule(turma.schedule)}</div>
                  </div>
                </div>
                <button 
                  onClick={() => onEditTurma(turma)}
                  className="p-1.5 text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-brand-50"
                  title="Editar turma"
                >
                  <Icon name="edit" className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function UnitModal({ unit, onClose, onSuccess }: { unit: Unit | null, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: unit?.name || '',
    address: unit?.address || '',
    color: unit?.color || undefined,
    status: unit?.status || 'ATIVA',
    defaultMonthlyFee: unit?.defaultMonthlyFeeCents ? Math.round(unit.defaultMonthlyFeeCents) / 100 : 0,
    defaultPaymentMethod: unit?.defaultPaymentMethod || 'PIX'
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      const payload = {
        name: formData.name,
        address: formData.address,
        color: formData.color,
        status: formData.status as 'ATIVA' | 'INATIVA',
        defaultMonthlyFeeCents: formData.defaultMonthlyFee ? Math.round(Number(formData.defaultMonthlyFee) * 100) : undefined,
        defaultPaymentMethod: formData.defaultPaymentMethod || undefined
      }
      if (unit) await unitRepository.save({ ...payload, id: unit.id } as any)
      else await unitRepository.save(payload as any)
      onSuccess()
    } catch (e) {
      console.error(e)
      alert('Erro ao salvar unidade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={true}
      title={unit ? 'Editar Unidade' : 'Nova Unidade'}
      onClose={onClose}
      primaryAction={{ label: 'Salvar', onClick: handleSubmit }}
      secondaryAction={{ label: 'Cancelar', onClick: onClose }}
    >
      <div className="space-y-4">
        <FormField label="Nome da Unidade">
          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </FormField>
        
        <FormField label="Cor de Identificação">
          <div className="flex flex-wrap gap-2">
            {UNIT_COLORS.map(c => (
              <button
                key={c}
                type="button"
                className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === c ? 'border-gray-900 ring-2 ring-gray-300 scale-110' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: c }}
                onClick={() => setFormData({ ...formData, color: c })}
              />
            ))}
            <button
              type="button"
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs text-gray-500 bg-gray-100 transition-all ${!formData.color ? 'border-gray-900 ring-2 ring-gray-300' : 'border-transparent hover:border-gray-300'}`}
              onClick={() => setFormData({ ...formData, color: undefined })}
              title="Sem cor"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Essa cor será usada em badges e listas para identificar a unidade.</p>
        </FormField>

        <FormField label="Endereço">
          <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
        </FormField>
        <FormField label="Status">
          <Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'ATIVA' | 'INATIVA'})}>
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
          </Select>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Mensalidade Padrão (R$)">
            <Input
              type="number"
              value={formData.defaultMonthlyFee}
              onChange={e => setFormData({ ...formData, defaultMonthlyFee: Number(e.target.value) })}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Forma de Pagamento Padrão">
            <Select
              value={formData.defaultPaymentMethod}
              onChange={e => setFormData({ ...formData, defaultPaymentMethod: e.target.value })}
            >
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO">Cartão</option>
              <option value="BOLETO">Boleto</option>
            </Select>
          </FormField>
        </div>
      </div>
    </Modal>
  )
}

function TurmaModal({ unitId, turma, onClose, onSuccess }: { unitId: string, turma: Turma | null, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: turma?.name || '',
    schedule: turma?.schedule || '',
    status: turma?.status || 'ATIVA',
    defaultMonthlyFee: turma?.defaultMonthlyFeeCents ? Math.round(turma.defaultMonthlyFeeCents) / 100 : 0,
    defaultPaymentMethod: turma?.defaultPaymentMethod || ''
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      const scheduleItems = parseSchedule(formData.schedule)
      
      // Validação robusta: não permitir salvar turma sem pelo menos um dia e horário válido
      if (scheduleItems.length === 0) {
        alert('Selecione pelo menos um dia e horário para a turma.')
        setLoading(false)
        return
      }
      
      if (scheduleItems.some(i => !i.time)) {
        alert('Defina o horário para todos os dias selecionados.')
        setLoading(false)
        return
      }

      const payload = {
        name: formData.name,
        schedule: formData.schedule,
        status: formData.status as 'ATIVA' | 'INATIVA',
        unitId,
        defaultMonthlyFeeCents: formData.defaultMonthlyFee ? Math.round(Number(formData.defaultMonthlyFee) * 100) : undefined,
        defaultPaymentMethod: formData.defaultPaymentMethod || undefined
      }
      if (turma) await turmaRepository.save({ ...payload, id: turma.id } as any)
      else await turmaRepository.save(payload as any)
      onSuccess()
    } catch (e: any) {
      console.error('Erro ao salvar turma:', e)
      // Se tiver detalhes de validação, mostra no alert
      const details = e.details ? JSON.stringify(e.details) : e.message
      alert('Erro ao salvar turma: ' + details)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={true}
      title={turma ? 'Editar Turma' : 'Nova Turma'}
      onClose={onClose}
      primaryAction={{ label: 'Salvar', onClick: handleSubmit }}
      secondaryAction={{ label: 'Cancelar', onClick: onClose }}
    >
      <div className="space-y-4">
        <FormField label="Nome da Turma">
          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Infantil, Adulto..." />
        </FormField>
        <FormField label="Horários">
          <ScheduleInput value={formData.schedule} onChange={val => setFormData({...formData, schedule: val})} />
        </FormField>
        <FormField label="Status">
          <Select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as 'ATIVA' | 'INATIVA'})}>
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
          </Select>
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Mensalidade Padrão (R$)">
            <Input
              type="number"
              value={formData.defaultMonthlyFee}
              onChange={e => setFormData({ ...formData, defaultMonthlyFee: Number(e.target.value) })}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Forma de Pagamento Padrão">
            <Select
              value={formData.defaultPaymentMethod}
              onChange={e => setFormData({ ...formData, defaultPaymentMethod: e.target.value })}
            >
              <option value="">(herdar da unidade)</option>
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">Dinheiro</option>
              <option value="CARTAO">Cartão</option>
              <option value="BOLETO">Boleto</option>
            </Select>
          </FormField>
        </div>
      </div>
    </Modal>
  )
}
