import React, { useState, useEffect } from 'react'
import { Card, Button, Icon, Table, Badge } from '@gingaflow/ui'
import { listUsers, deleteUser, User } from '../services/users'
import { CreateUserModal } from '../components/CreateUserModal'
import { toast } from 'sonner'

export default function SettingsUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const data = await listUsers()
      setUsers(data)
    } catch (e) {
      console.error('Failed to load users', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return
    try {
      await deleteUser(id)
      toast.success('Usuário removido com sucesso!')
      loadUsers()
    } catch (e) {
      toast.error('Erro ao remover usuário')
    }
  }

  const columns = [
    { key: 'name', header: 'Nome', width: '2fr' },
    { key: 'email', header: 'Email', width: '2fr' },
    { key: 'role', header: 'Perfil', width: '1fr' },
    { key: 'actions', header: 'Ações', width: '1fr' }
  ]

  const tableData = users.map(user => ({
    ...user,
    role: (
      <Badge variant={user.role === 'ADMIN' ? 'brand' : 'gray'}>
        {user.role}
      </Badge>
    ),
    actions: (
      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => { setEditingUser(user); setModalOpen(true) }}
        >
          Editar
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => handleDelete(user.id)}
        >
          Remover
        </Button>
      </div>
    )
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Button onClick={() => { setEditingUser(undefined); setModalOpen(true) }}>
          <Icon name="plus" className="mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</div>
        ) : (
          <Table columns={columns} data={tableData} />
        )}
      </Card>

      {modalOpen && (
        <CreateUserModal
          user={editingUser}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false)
            loadUsers()
          }}
        />
      )}
    </div>
  )
}
