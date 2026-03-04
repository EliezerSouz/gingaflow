import React, { useState, useEffect } from 'react'
import { Modal, FormField, Input, Select } from '@gingaflow/ui'
import { createUser } from '../lib/api'
import { updateUser } from '../services/users'
import { listTeachers, Teacher } from '../services/teachers'
import { User } from '../services/users'

type Props = {
  user?: User
  onClose: () => void
  onSuccess: () => void
}

export function CreateUserModal({ user, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'PROFESSOR' as 'ADMIN' | 'PROFESSOR',
    relatedId: '',
    password: '',
    confirmPassword: ''
  })

  const [teachers, setTeachers] = useState<Teacher[]>([])

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        role: user.role,
        relatedId: user.relatedId || ''
      }))
    }
  }, [user])

  useEffect(() => {
    async function loadTeachers() {
      try {
        const res = await listTeachers()
        setTeachers(res.data)
      } catch (e) {
        console.error('Failed to load teachers', e)
      }
    }
    loadTeachers()
  }, [])

  async function handleSubmit() {
    if (!formData.name) return setError('Nome é obrigatório')
    if (!formData.email) return setError('Email é obrigatório')
    
    if (!user && !formData.password) return setError('Senha é obrigatória para novos usuários')
    if (formData.password && formData.password.length < 6) return setError('Senha deve ter no mínimo 6 caracteres')
    if (formData.password !== formData.confirmPassword) return setError('Senhas não conferem')

    setLoading(true)
    setError(null)

    try {
      const data = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        relatedId: formData.role === 'PROFESSOR' ? formData.relatedId : undefined
      }

      if (user) {
        await updateUser(user.id, {
          ...data,
          ...(formData.password ? { password: formData.password } : {})
        })
      } else {
        await createUser({
          ...data,
          password: formData.password
        })
      }

      onSuccess()
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={true}
      title={user ? "Editar Usuário" : "Novo Usuário"}
      onClose={onClose}
      primaryAction={{ label: loading ? 'Salvando...' : 'Salvar', onClick: handleSubmit }}
      secondaryAction={{ label: 'Cancelar', onClick: onClose }}
    >
      <div className="space-y-4 min-h-[300px]">
        {error && <div className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}

        <FormField label="Nome">
          <Input 
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome do usuário"
          />
        </FormField>

        <FormField label="Email">
          <Input 
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Perfil">
            <Select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'PROFESSOR' })}
            >
              <option value="ADMIN">Administrador</option>
              <option value="PROFESSOR">Professor</option>
            </Select>
          </FormField>

          {formData.role === 'PROFESSOR' && (
            <FormField label="Vincular a Professor">
              <Select
                value={formData.relatedId}
                onChange={e => setFormData({ ...formData, relatedId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.full_name} ({t.capoeira_name || '-'})</option>
                ))}
              </Select>
            </FormField>
          )}
        </div>

        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Senha de Acesso</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={user ? "Nova Senha (opcional)" : "Senha"}>
              <Input 
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                placeholder="******"
              />
            </FormField>
            <FormField label="Confirmar Senha">
              <Input 
                type="password"
                value={formData.confirmPassword}
                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="******"
              />
            </FormField>
          </div>
        </div>
      </div>
    </Modal>
  )
}
