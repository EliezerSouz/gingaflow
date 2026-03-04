import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, Icon, Table, Badge, Input, Tooltip, Dropdown } from '@gingaflow/ui'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listTeachers, Teacher, updateTeacher } from '../services/teachers'
import { CreateTeacherModal } from '../components/CreateTeacherModal'
import { formatSchedule } from '../utils/schedule'
import { useSettings } from '../contexts/SettingsContext'
import { Graduation } from '../services/settings'
import { CordaPreview } from '../components/CordaPreview'

const UNIT_PALETTE = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#64748B'
]

function getHashColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return UNIT_PALETTE[Math.abs(hash) % UNIT_PALETTE.length]
}

function TeacherUnitsCell({ units }: { units: any[] }) {
  const [expanded, setExpanded] = useState(false)

  if (!units || units.length === 0) return <span className="text-gray-400">-</span>

  const totalClasses = units.reduce((acc, u) => acc + (u.turmas?.length || 0), 0)

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-brand-600 transition-colors"
      >
        <Icon name="chevron-right" className="w-4 h-4" />
        <span className="font-medium">{units.length} Unidades</span>
        <span className="text-gray-400">•</span>
        <span>{totalClasses} Turmas</span>
      </button>
    )
  }

  return (
    <div className="text-sm">
      <button
        onClick={() => setExpanded(false)}
        className="flex items-center gap-1.5 text-brand-600 hover:text-brand-800 font-medium mb-2"
      >
        <Icon name="chevron-down" className="w-4 h-4" />
        <span>Ocultar detalhes</span>
      </button>

      <div className="flex flex-col gap-3 pl-2">
        {units.map(u => (
          <div key={u.id} className="group">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="block w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: getHashColor(u.name) }}
              />
              <span className="font-medium text-gray-700">{u.name}</span>
            </div>
            <div className="pl-4 flex flex-col gap-1 border-l border-gray-100 ml-1">
              {u.turmas && u.turmas.length > 0 ? (
                u.turmas.map((t: any) => (
                  <div key={t.id} className="text-gray-600 flex items-center gap-2 text-xs sm:text-sm">
                    <span>{t.name}</span>
                    <span className="text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 whitespace-nowrap">
                      {formatSchedule(t.schedule)}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-gray-400 text-xs">Sem turmas</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


export default function TeachersList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [rows, setRows] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const { settings } = useSettings()

  const action = searchParams.get('action')
  const isModalOpen = action === 'new' || action === 'edit'
  const editId = searchParams.get('id') || undefined

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const res = await listTeachers()
      setRows(res.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleToggleStatus(teacher: Teacher) {
    if (!window.confirm(`Deseja ${teacher.status === 'ATIVO' ? 'inativar' : 'ativar'} este professor?`)) return

    try {
      await updateTeacher(teacher.id, {
        status: teacher.status === 'ATIVO' ? 'INATIVO' : 'ATIVO',
        // Preserve other fields
        full_name: teacher.full_name,
        email: teacher.email,
        phone: teacher.phone,
        capoeira_name: teacher.capoeira_name,
        graduation: teacher.graduation,
        cpf: teacher.cpf
      })
      fetchData()
      toast.success(`Professor ${teacher.status === 'ATIVO' ? 'inativado' : 'ativado'} com sucesso!`)
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || 'Erro ao atualizar status')
    }
  }

  const filteredRows = rows.filter(r =>
    q === '' ||
    r.full_name.toLowerCase().includes(q.toLowerCase()) ||
    (r.capoeira_name && r.capoeira_name.toLowerCase().includes(q.toLowerCase()))
  )

  const columns = [
    { key: 'name', header: 'Nome / Apelido', width: '1.5fr' },
    { key: 'units', header: 'Unidades / Turmas', width: '2.5fr' },
    { key: 'graduation', header: 'Graduação', width: '1.2fr' },
    { key: 'status', header: 'Status', width: '0.6fr' },
    { key: 'actions', header: 'Ações', width: '0.4fr' }
  ]

  return (
    <>
      <Card>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">Lista de Professores</div>
          <div className="flex items-center gap-2">
            <Input placeholder="Buscar..." className="w-64" value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>
        {error && <div className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <div className="mt-3">
          <Table
            columns={columns}
            data={filteredRows.map(row => ({
              ...row,
              name: (
                <div>
                  <div className="font-medium cursor-pointer text-brand-600 hover:text-brand-800" onClick={() => navigate(`/teachers/${row.id}`)}>{row.full_name}</div>
                  {row.capoeira_name && <div className="text-xs text-gray-500">{row.capoeira_name}</div>}
                </div>
              ),
              units: <TeacherUnitsCell units={row.units || []} />,
              graduation: (
                <div className="text-sm">
                  {row.graduation ? (
                    <div className="flex flex-col items-start">
                      {(() => {
                        const g = (settings.graduations || []).find(x => x.name === row.graduation)
                        if (!g) {
                          return <div className="font-medium text-primary leading-tight">{row.graduation}</div>
                        }
                        const main = g.description || [g.category, (typeof g.grau === 'number' ? `Grau ${g.grau}` : undefined)].filter(Boolean).join(' • ') || g.name
                        const alt = [g.category, (typeof g.grau === 'number' ? `Grau ${g.grau}` : undefined)].filter(Boolean).join(' • ')
                        const secondary = g.description ? alt : (g.description ? g.description : '')
                        return (
                          <>
                            <div className="font-medium text-primary leading-tight">{main}</div>

                            {secondary && secondary !== main && (
                              <div className="text-xs text-secondary leading-snug">{secondary}</div>
                            )}
                            <div className="mt-0.5">
                              <CordaPreview grad={g} width={100} />
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </div>
              ),
              status: <Badge variant={row.status === 'ATIVO' ? 'success' : 'warning'}>{row.status}</Badge>,
              actions: (
                <div className="flex items-center justify-end gap-2">
                  <Tooltip content="Ver detalhes">
                    <button
                      onClick={() => navigate(`/teachers/${row.id}`)}
                      className="p-1 text-gray-400 hover:text-brand-600"
                    >
                      <Icon name="eye" />
                    </button>
                  </Tooltip>

                  <Dropdown
                    trigger={
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Icon name="more-vertical" />
                      </button>
                    }
                    items={[
                      {
                        label: 'Editar cadastro',
                        icon: 'edit',
                        onClick: () => navigate(`/teachers?action=edit&id=${row.id}`)
                      },
                      {
                        label: row.status === 'ATIVO' ? 'Inativar cadastro' : 'Ativar cadastro',
                        icon: row.status === 'ATIVO' ? 'x-circle' : 'check-circle',
                        variant: row.status === 'ATIVO' ? 'danger' : 'default',
                        onClick: () => handleToggleStatus(row)
                      }
                    ]}
                  />
                </div>
              )
            }))}
          />
        </div>
        {loading && <div className="mt-2 text-sm text-gray-600">Carregando...</div>}
        {rows.length === 0 && !loading && (
          <div className="mt-8 text-center text-gray-500">
            Nenhum professor cadastrado.
          </div>
        )}
      </Card>
      {isModalOpen && (
        <CreateTeacherModal
          teacherId={editId}
          onClose={() => navigate('/teachers')}
          onSuccess={() => {
            navigate('/teachers')
            fetchData()
            toast.success(editId ? 'Professor atualizado!' : 'Professor cadastrado!')
          }}
        />
      )}
    </>
  )
}
