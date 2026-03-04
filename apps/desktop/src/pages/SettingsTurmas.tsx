import React, { useState, useEffect } from 'react'
import { PageHeader, Button, Icon, Modal, FormField, Input, Select, Card, Badge } from '@gingaflow/ui'
import { listUnits, listUnitTurmas, createTurma, updateTurma, Unit, Turma } from '../services/units'
import { ScheduleInput } from '../components/ScheduleInput'
import { formatSchedule, parseSchedule } from '../utils/schedule'
import { toast } from 'sonner'

export default function SettingsTurmas() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(false)

  // Modals state
  const [showTurmaModal, setShowTurmaModal] = useState(false)
  const [editingTurma, setEditingTurma] = useState<Turma | null>(null)
  const [targetUnitId, setTargetUnitId] = useState<string | null>(null)

  useEffect(() => {
    loadUnits()
  }, [])

  async function loadUnits() {
    setLoading(true)
    try {
      const res = await listUnits()
      setUnits(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-primary">Turmas</h2>
          <p className="text-sm text-muted">Gerencie as turmas por unidade.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : units.length === 0 ? (
        <div className="text-center py-8 text-muted border-2 border-dashed rounded-lg">
          Nenhuma unidade encontrada. Cadastre unidades primeiro.
        </div>
      ) : (
        <div className="grid gap-6">
          {units.map(unit => (
            <UnitTurmasCard
              key={unit.id}
              unit={unit}
              onCreateTurma={() => handleCreateTurma(unit.id)}
              onEditTurma={(t) => handleEditTurma(t, unit.id)}
            />
          ))}
        </div>
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
    </div>
  )
}

function UnitTurmasCard({ unit, onCreateTurma, onEditTurma }: {
  unit: Unit,
  onCreateTurma: () => void,
  onEditTurma: (t: Turma) => void
}) {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTurmas = async () => {
    setLoading(true)
    try {
      const res = await listUnitTurmas(unit.id)
      setTurmas(res.data)
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
    <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-sm overflow-hidden">
      {unit.color && <div className="h-1.5 w-full" style={{ backgroundColor: unit.color }} />}
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-full border bg-white">
            <span style={{ color: unit.color || '#4B5563' }}>
              <Icon name="dashboard" />
            </span>
          </div>
          <div>
            <h3 className="font-medium text-primary">{unit.name}</h3>
            {unit.address && <p className="text-sm text-muted">{unit.address}</p>}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={onCreateTurma}>
          <Icon name="plus" className="w-3 h-3 mr-1" />
          Adicionar Turma
        </Button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-sm text-muted">Carregando turmas...</div>
        ) : turmas.length === 0 ? (
          <p className="text-sm text-muted italic">Nenhuma turma cadastrada nesta unidade.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {turmas.map(turma => (
              <div key={turma.id} className="flex items-center justify-between p-3 rounded border hover:border-brand-300 transition-colors group">
                <div>
                  <div className="font-medium text-primary text-sm">{turma.name}</div>
                  <div className="text-xs text-muted">{formatSchedule(turma.schedule)}</div>
                </div>
                <div className="flex items-center gap-2">
                  {turma.status === 'INATIVA' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Inativa</span>}
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => onEditTurma(turma)}>
                    <Icon name="edit" className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TurmaModal({ unitId, turma, onClose, onSuccess }: { unitId: string, turma: Turma | null, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: turma?.name || '',
    schedule: turma?.schedule || '',
    status: turma?.status || 'ATIVA'
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      const scheduleItems = parseSchedule(formData.schedule)

      const isLegacy = formData.schedule && parseSchedule(formData.schedule).length === 0;

      if (!isLegacy) {
        if (scheduleItems.length === 0) {
          toast.error('Selecione pelo menos um dia e horário para a turma.')
          setLoading(false)
          return
        }
        if (scheduleItems.some(i => !i.time)) {
          toast.error('Defina o horário para todos os dias selecionados.')
          setLoading(false)
          return
        }
      }

      if (turma) {
        await updateTurma(turma.id, formData as any)
        toast.success('Turma atualizada com sucesso!')
      } else {
        await createTurma({ ...formData, unitId } as any)
        toast.success('Turma criada com sucesso!')
      }
      onSuccess()
    } catch (e: any) {
      console.error('Erro ao salvar turma:', e)
      const details = e.details ? JSON.stringify(e.details) : e.message
      toast.error('Erro ao salvar turma: ' + details)
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
          <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Infantil, Adulto..." />
        </FormField>
        <FormField label="Horários">
          <ScheduleInput value={formData.schedule} onChange={val => setFormData({ ...formData, schedule: val })} />
        </FormField>
        <FormField label="Status">
          <Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as 'ATIVA' | 'INATIVA' })}>
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
          </Select>
        </FormField>
      </div>
    </Modal>
  )
}
