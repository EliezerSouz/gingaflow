import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button, Card, Icon, Modal, FormField, Input, Badge } from '@gingaflow/ui'
import { http } from '../services/http'
import { useAuth } from '../contexts/AuthContext'

interface ActivityType {
  id: string
  name: string
  usaGraduacao: boolean
}

export default function ActivitiesPage() {
  const { auth } = useAuth()
  const [activities, setActivities] = useState<ActivityType[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ActivityType | null>(null)
  const [form, setForm] = useState({ name: '', usaGraduacao: true })

  useEffect(() => {
    loadActivities()
  }, [])

  async function loadActivities() {
    try {
      setLoading(true)
      const data = await http<ActivityType[]>('/activity-types')
      setActivities(Array.isArray(data) ? data : [])
    } catch (e: any) {
      toast.error('Erro ao carregar atividades')
    } finally {
      setLoading(false)
    }
  }

  function openModal(activity: ActivityType | null = null) {
    setEditing(activity)
    setForm(activity ? { name: activity.name, usaGraduacao: activity.usaGraduacao } : { name: '', usaGraduacao: true })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('O nome da atividade é obrigatório')
      return
    }
    try {
      setLoading(true)
      if (editing) {
        await http(`/activity-types/${editing.id}`, { method: 'PUT', body: JSON.stringify(form) })
        toast.success('Atividade atualizada!')
      } else {
        await http('/activity-types', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Atividade criada!')
      }
      setShowModal(false)
      loadActivities()
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar atividade')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Deseja realmente excluir esta atividade? Isso pode afetar turmas e alunos vinculados.')) return
    try {
      await http(`/activity-types/${id}`, { method: 'DELETE' })
      toast.success('Atividade excluída!')
      loadActivities()
    } catch (e: any) {
      toast.error('Não foi possível excluir a atividade')
    }
  }

  if (auth.role !== 'ADMIN') {
    return (
      <div className="p-8 text-center text-gray-500">
        Acesso restrito para administradores.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Gerencie os tipos de atividades oferecidos pela sua academia
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <Icon name="plus" className="mr-2 w-4 h-4" />
          Nova Atividade
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl p-4 flex items-start gap-3">
        <Icon name="check-square" className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-brand-900 dark:text-brand-200">Como funciona</p>
          <p className="text-sm text-brand-700 dark:text-brand-400 mt-1">
            Atividades são os tipos de aula oferecidos (ex: Capoeira, Spinning). Elas são vinculadas às turmas e determinam se o aluno pode ter graduação/níveis.
          </p>
        </div>
      </div>

      {/* Activities Grid */}
      {loading && activities.length === 0 ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
        </div>
      ) : activities.length === 0 ? (
        <Card className="py-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Icon name="graduations" className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Nenhuma atividade cadastrada</p>
              <p className="text-sm text-gray-500 mt-1">Comece cadastrando as modalidades da sua academia</p>
            </div>
            <Button onClick={() => openModal()} variant="primary">
              <Icon name="plus" className="mr-2 w-4 h-4" />
              Cadastrar primeira atividade
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map(activity => (
            <Card key={activity.id} className="group hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activity.usaGraduacao 
                      ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  }`}>
                    <Icon name={activity.usaGraduacao ? 'medal' : 'check-square'} className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{activity.name}</h3>
                    <Badge variant={activity.usaGraduacao ? 'success' : 'neutral'}>
                      {activity.usaGraduacao ? 'Com Graduação' : 'Sem Graduação'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openModal(activity)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                  >
                    <Icon name="edit" className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Default Activities Suggestions */}
      {activities.length === 0 && (
        <div>
          <p className="text-sm font-medium text-gray-500 mb-3">Sugestões rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {['Capoeira', 'Spinning', 'Funcional', 'Personal', 'Yoga', 'Pilates', 'Musculação'].map(name => (
              <button
                key={name}
                onClick={async () => {
                  try {
                    await http('/activity-types', { 
                      method: 'POST', 
                      body: JSON.stringify({ name, usaGraduacao: name === 'Capoeira' }) 
                    })
                    loadActivities()
                    toast.success(`${name} adicionada!`)
                  } catch (e) {
                    toast.error('Erro ao adicionar atividade')
                  }
                }}
                className="px-3 py-1.5 text-sm rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all"
              >
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          open={true}
          title={editing ? 'Editar Atividade' : 'Nova Atividade'}
          onClose={() => setShowModal(false)}
          primaryAction={{ label: editing ? 'Salvar' : 'Criar', onClick: handleSave }}
          secondaryAction={{ label: 'Cancelar', onClick: () => setShowModal(false) }}
        >
          <div className="space-y-5">
            <FormField label="Nome da Atividade *">
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Capoeira, Spinning, CrossFit..."
                autoFocus
              />
            </FormField>

            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Utiliza Graduação / Níveis?
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Se ativado, permite selecionar cordas/níveis para os alunos desta atividade.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.usaGraduacao}
                  onClick={() => setForm({ ...form, usaGraduacao: !form.usaGraduacao })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    form.usaGraduacao ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      form.usaGraduacao ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {form.usaGraduacao && (
                <div className="mt-3 flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400">
                  <Icon name="check-circle" className="w-4 h-4" />
                  <span>Alunos desta atividade poderão ser graduados em cordas/níveis</span>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
