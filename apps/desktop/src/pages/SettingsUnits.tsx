import React, { useState, useEffect } from 'react'
import { PageHeader, Button, Icon, Modal, FormField, Input, Select, Card, Badge } from '@gingaflow/ui'
import { listUnits, createUnit, updateUnit, Unit } from '../services/units'
import { toast } from 'sonner'

const UNIT_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#64748B'
]

export default function SettingsUnits() {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(false)
  const [showUnitModal, setShowUnitModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

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

  function handleCreateUnit() {
    setEditingUnit(null)
    setShowUnitModal(true)
  }

  function handleEditUnit(unit: Unit) {
    setEditingUnit(unit)
    setShowUnitModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-primary">Unidades</h2>
          <p className="text-sm text-muted">Gerencie as unidades da escola.</p>
        </div>
        <Button onClick={handleCreateUnit}>
          <Icon name="plus" className="mr-2" />
          Nova Unidade
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : units.length === 0 ? (
        <div className="text-center py-8 text-muted border-2 border-dashed rounded-lg">
          Nenhuma unidade cadastrada. Comece criando uma!
        </div>
      ) : (
        <div className="grid gap-6">
          {units.map(unit => (
            <Card key={unit.id}>
              {unit.color && <div className="h-1.5 w-full" style={{ backgroundColor: unit.color }} />}
              <div className="p-4 flex items-center justify-between">
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
                  {unit.status === 'INATIVA' && (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Inativa</span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEditUnit(unit)}>
                  <Icon name="edit" />
                </Button>
              </div>
            </Card>
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
    </div>
  )
}

function UnitModal({ unit, onClose, onSuccess }: { unit: Unit | null, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: unit?.name || '',
    address: unit?.address || '',
    color: unit?.color || undefined,
    status: unit?.status || 'ATIVA'
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    try {
      // Remover campos undefined para evitar erro 422
      const cleanData: any = {
        name: formData.name,
        status: formData.status as 'ATIVA' | 'INATIVA'
      }

      if (formData.address) cleanData.address = formData.address
      if (formData.color) cleanData.color = formData.color

      if (unit) {
        await updateUnit(unit.id, cleanData)
        toast.success('Unidade atualizada com sucesso!')
      } else {
        await createUnit(cleanData)
        toast.success('Unidade criada com sucesso!')
      }
      onSuccess()
    } catch (e: any) {
      console.error(e)
      const message = e.message || 'Erro ao salvar unidade'
      toast.error(message)
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
          <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
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
          <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
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
