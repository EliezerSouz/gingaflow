import React, { useEffect, useState } from 'react'
import { Button, Icon, Table, Modal, FormField, Input, Select, Badge } from '@gingaflow/ui'
import { listUsers, updateUser, deleteUser, User } from '../services/users'
import { createUser } from '../lib/api'
import { listTeachers, Teacher } from '../services/teachers'

export function UsersSettings() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const data = await listUsers()
      setUsers(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleCreate() {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  function handleEdit(user: User) {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return
    try {
      await deleteUser(id)
      loadUsers()
    } catch (e) {
      alert('Erro ao remover usuário')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Usuários do Sistema</h2>
          <p className="text-sm text-gray-500">Gerencie quem tem acesso ao sistema e seus níveis de permissão.</p>
        </div>
        <Button onClick={handleCreate}>
          <Icon name="plus" className="mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <Table
          data={users}
          columns={[
            { key: 'name', header: 'Nome', width: '2fr' },
            { key: 'email', header: 'Email', width: '2fr' },
            { 
              key: 'role', 
              header: 'Permissão', 
              width: '1fr',
              render: (v) => <Badge variant={v === 'ADMIN' ? 'brand' : 'gray'}>{v}</Badge>
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '100px',
              render: (_, row) => (
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
                    <Icon name="edit" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(row.id)}>
                    <Icon name="trash" />
                  </Button>
                </div>
              )
            }
          ]}
        />
      </div>

      {isModalOpen && (
        <UserModal 
          user={editingUser} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false)
            loadUsers()
          }} 
        />
      )}
    </div>
  )
}

function UserModal({ user, onClose, onSuccess }: { user: User | null, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'PROFESSOR',
    password: ''
  })
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [relatedId, setRelatedId] = useState<string>(user?.relatedId || '')
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (formData.role === 'PROFESSOR') {
      loadTeachers()
    }
  }, [formData.role])
  
  async function loadTeachers() {
    try {
      const res = await listTeachers()
      const active = res.data.filter(t => t.status === 'ATIVO')
      setTeachers(active)
      // Keep current selection if in edit mode
      if (user?.relatedId) setRelatedId(user.relatedId)
    } catch (e) {
      console.error(e)
    }
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      if (user) {
        const payload: any = { ...formData }
        if (formData.role === 'PROFESSOR') {
          payload.relatedId = relatedId || undefined
        } else {
          payload.relatedId = undefined
        }
        await updateUser(user.id, payload)
      } else {
        if (!formData.password) return alert('Senha é obrigatória para novos usuários')
        const payload: any = { ...formData }
        if (formData.role === 'PROFESSOR') {
          payload.relatedId = relatedId || undefined
        }
        await createUser(payload)
      }
      onSuccess()
    } catch (e: any) {
      alert(e.message || 'Erro ao salvar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={true}
      title={user ? 'Editar Usuário' : 'Novo Usuário'}
      onClose={onClose}
      primaryAction={{ label: 'Salvar', onClick: handleSubmit }}
      secondaryAction={{ label: 'Cancelar', onClick: onClose }}
    >
      <div className="space-y-4">
        <FormField label="Nome">
          <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </FormField>
        <FormField label="Email">
          <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </FormField>
        <FormField label="Permissão">
          <Select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
            <option value="ADMIN">Administrador</option>
            <option value="PROFESSOR">Professor</option>
          </Select>
        </FormField>
        
        {formData.role === 'PROFESSOR' && (
          <FormField label="Professor vinculado (opcional)">
            <Select 
              value={relatedId} 
              onChange={e => {
                const newId = e.target.value
                setRelatedId(newId)
                if (newId) {
                  const teacher = teachers.find(t => t.id === newId)
                  if (teacher) {
                    setFormData(prev => ({
                      ...prev,
                      name: teacher.full_name,
                      email: teacher.email || prev.email
                    }))
                  }
                }
              }}
            >
              <option value="">Selecione um professor</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.full_name} {t.capoeira_name ? `(${t.capoeira_name})` : ''}
                </option>
              ))}
            </Select>
          </FormField>
        )}
        <FormField label={user ? "Nova Senha (deixe em branco para manter)" : "Senha"}>
          <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
        </FormField>
      </div>
    </Modal>
  )
}
