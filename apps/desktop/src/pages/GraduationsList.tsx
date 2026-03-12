import React, { useState } from 'react'
import { toast } from 'sonner'
import { Button, Icon, Modal, FormField, Input, Card, Select, Badge } from '@gingaflow/ui'
import { useSettings } from '../contexts/SettingsContext'
import { Graduation, CordaType } from '../services/settings'
import { CordaPreview } from '../components/CordaPreview'

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

export default function GraduationsList() {

  const { settings, updateSettings } = useSettings()

  // Graduation State
  const [showGradModal, setShowGradModal] = useState(false)
  const [editingGrad, setEditingGrad] = useState<Graduation | null>(null)
  const [gradForm, setGradForm] = useState<Partial<Graduation>>({})

  function handleSaveGraduation() {
    const currentGrads = settings.graduations || []
    let newGrads = [...currentGrads]

    if (editingGrad) {
      newGrads = newGrads.map(g => g.id === editingGrad.id ? { ...g, ...gradForm } as Graduation : g)
    } else {
      newGrads.push({
        id: crypto.randomUUID(),
        name: gradForm.name || 'Nova Graduação',
        color: gradForm.color || '#9CA3AF',
        category: gradForm.category || '',
        grau: gradForm.grau ?? 0,
        cordaType: gradForm.cordaType || CordaType.UNICA,
        colorLeft: gradForm.colorLeft,
        colorRight: gradForm.colorRight,
        pontaLeft: gradForm.pontaLeft,
        pontaRight: gradForm.pontaRight,
        order: (currentGrads.length + 1),
        active: true,
        ...gradForm
      } as Graduation)
    }

    // Sort by order
    newGrads.sort((a, b) => a.order - b.order)

    updateSettings({ graduations: newGrads })
    setShowGradModal(false)
    toast.success('Graduação salva com sucesso!')
  }

  function handleDeleteGraduation(id: string) {
    if (!confirm('Tem certeza que deseja remover esta graduação?')) return
    const newGrads = (settings.graduations || []).filter(g => g.id !== id)
    updateSettings({ graduations: newGrads })
    toast.success('Graduação removida!')
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
    toast.success('Ordem atualizada')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {/* Header is handled by Shell */}
        </div>
        <Button onClick={() => { setEditingGrad(null); setGradForm({}); setShowGradModal(true) }}>
          <Icon name="plus" className="mr-2" />
          Nova Graduação
        </Button>
      </div>

      <Card>
        {(!settings.graduations || settings.graduations.length === 0) ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma graduação cadastrada.
          </div>
        ) : (
          <div className="divide-y">
            {settings.graduations.map((grad, index) => (
              <div key={grad.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-center justify-center w-8">
                    <button
                      onClick={() => moveGraduation(index, 'up')}
                      disabled={index === 0}
                      className="text-gray-400 hover:text-gray-600 disabled:opacity-30 p-1"
                    >
                      <Icon name="chevron-up" className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveGraduation(index, 'down')}
                      disabled={index === (settings.graduations?.length || 0) - 1}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 p-1"
                    >
                      <Icon name="chevron-down" className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <CordaPreview grad={grad} width={90} />
                  </div>

                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {grad.name}{typeof grad.grau === 'number' ? ` • Grau ${grad.grau}` : ''}
                    </div>
                    {grad.category && <div className="text-xs text-gray-600 dark:text-gray-400">{grad.category}</div>}
                    {!grad.active && <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded border dark:border-gray-700">Inativa</span>}
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
      </Card>

      {showGradModal && (
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

            <FormField label="Categoria">
              <Select value={gradForm.category || ''} onChange={e => setGradForm({ ...gradForm, category: e.target.value })}>
                <option value="">Selecione...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </FormField>

            <FormField label="Grau">
              <Input
                type="number"
                min={0}
                value={typeof gradForm.grau === 'number' ? String(gradForm.grau) : ''}
                onChange={e => setGradForm({ ...gradForm, grau: Number(e.target.value) })}
                placeholder="Ex: 1"
              />
            </FormField>

            <FormField label="Tipo de Corda">
              <Select
                value={gradForm.cordaType || CordaType.UNICA}
                onChange={e => setGradForm({ ...gradForm, cordaType: e.target.value as CordaType })}
              >
                <option value={CordaType.UNICA}>Única</option>
                <option value={CordaType.DUPLA}>Dupla (meio + meio)</option>
                <option value={CordaType.COM_PONTAS}>Com pontas</option>
              </Select>
            </FormField>

            {(!gradForm.cordaType || gradForm.cordaType === CordaType.UNICA || gradForm.cordaType === CordaType.COM_PONTAS) && (
              <FormField label={gradForm.cordaType === CordaType.COM_PONTAS ? 'Cor base' : 'Cor da Corda'}>
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
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Cor esquerda">
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
                <FormField label="Cor direita">
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
              </div>
            )}

            {gradForm.cordaType === CordaType.COM_PONTAS && (
              <div className="grid grid-cols-2 gap-4">
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
              </div>
            )}

            <div className="space-y-2">
              <div className="text-sm font-medium">Preview</div>
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
