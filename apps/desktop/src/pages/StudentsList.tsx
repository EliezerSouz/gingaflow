import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, Icon, Table, Pagination, Input, Badge, Tooltip, Dropdown, type IconName } from '@gingaflow/ui'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listStudents, updateStudent, parseStudentExtra } from '../services/students'
import { studentRepository } from '../repositories/studentRepository'
import { isTeacher, getTeacher, listTeachers } from '../services/teachers'
import { listUnits, listUnitTurmas } from '../services/units'
import { CreateStudentModal } from '../components/CreateStudentModal'
import { PromoteStudentModal } from '../components/PromoteStudentModal'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { CordaType, Graduation } from '../services/settings'
import { CordaPreview } from '../components/CordaPreview'

function calculateAge(birthDate: string): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  if (isNaN(birth.getTime())) return 0
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

function getInitials(name: string) {
  if (!name) return '??'
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

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

export default function StudentsList() {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const { settings } = useSettings()
  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const pageCount = 5
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [unitFilter, setUnitFilter] = useState('')
  const [turmaFilter, setTurmaFilter] = useState('')
  const [teacherFilter, setTeacherFilter] = useState('')
  const [units, setUnits] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [rows, setRows] = useState<any[]>([])
  const [meta, setMeta] = useState<{ page_count: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [promoteStudentId, setPromoteStudentId] = useState<string | null>(null)

  const action = searchParams.get('action')
  const isModalOpen = action === 'new' || action === 'edit'
  const editId = searchParams.get('id') || undefined


  const columns = [
    { key: 'full_name', header: 'Nome', width: '2fr' },
    { key: 'group_info', header: 'Unidade / Turma / Professor', width: '2fr' },
    { key: 'graduation', header: 'Graduação', width: '1fr' },
    { key: 'status', header: 'Status', width: '0.8fr' },
    { key: 'next_due_date', header: 'Próximo Vencimento', width: '0.8fr' },
    { key: 'actions', header: 'Ações', width: '0.5fr' }
  ]

  async function fetchData(p = page) {
    setLoading(true)
    setError(null)
    try {
      // Use the API directly (not the local SQLite cache) so we get
      // currentGraduation, studentTurmas, and other enriched relations
      const res = await listStudents({ q, status: statusFilter || undefined })
      const studentsOnly = (res.data || []).filter((s: any) => !isTeacher(s))
      setRows(studentsOnly)
      setMeta({ page_count: 1 })
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Auto-search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchData(1)
      } else {
        setPage(1)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [q, statusFilter, unitFilter, turmaFilter, teacherFilter])

  // Load metadata
  useEffect(() => {
    async function loadMeta() {
      try {
        const [uRes, tRes] = await Promise.all([listUnits(), listTeachers()])
        setUnits(uRes.data)
        setTeachers(tRes.data)
      } catch (e) {
        console.error(e)
      }
    }
    loadMeta()
  }, [])

  // Load turmas when unit changes
  useEffect(() => {
    async function loadTurmas() {
      if (!unitFilter) {
        setTurmas([])
        setTurmaFilter('')
        return
      }
      const unitId = units.find(u => u.name === unitFilter)?.id
      if (unitId) {
        try {
          const res = await listUnitTurmas(unitId)
          setTurmas(res.data)
        } catch (e) { console.error(e) }
      }
    }
    loadTurmas()
  }, [unitFilter, units])

  // Set teacher filter for professor role
  useEffect(() => {
    if (auth.role === 'PROFESSOR' && auth.name) {
      setTeacherFilter(auth.name)
    }
  }, [auth])

  // Pagination effect
  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  async function handleToggleStatus(student: any) {
    if (!window.confirm(`Deseja ${student.status === 'ATIVO' ? 'inativar' : 'ativar'} este aluno?`)) return

    try {
      const studentToUpdate = { ...student, status: student.status === 'ATIVO' ? 'INATIVO' : 'ATIVO' }
      await studentRepository.save(studentToUpdate)
      fetchData()
      toast.success(`Aluno ${student.status === 'ATIVO' ? 'inativado' : 'ativado'} com sucesso!`)
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || 'Erro ao atualizar status')
    }
  }

  const studentToPromote = rows.find(s => s.id === promoteStudentId)

  return (
    <>
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Lista de alunos</div>
            <div className="flex items-center gap-2">
              <Input placeholder="Buscar por nome ou CPF" className="w-64" value={q} onChange={e => setQ(e.target.value)} />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded px-3 py-2 text-secondary shadow hover:bg-gray-100 ${showFilters ? 'bg-gray-100 ring-2 ring-gray-200' : 'bg-white dark:bg-gray-800 dark:border dark:border-gray-700'}`}
              >
                <Icon name="export" /> {/* TODO: Change icon to filter if available */}
                Filtros
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Status</label>
                <select
                  className="block w-full rounded border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 sm:text-sm p-2"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="ATIVO">Ativos</option>
                  <option value="INATIVO">Inativos</option>
                </select>
              </div>

              {/* Add other filters if needed */}
            </div>
          )}

        </div>

        {error && <div className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <div className="mt-3">
          <Table
            columns={columns}
            data={rows.map(row => {
              const extra = parseStudentExtra(row)
              const statusColor =
                row.status === 'ATIVO' ? 'success' :
                  row.status === 'DELINQUENT' ? 'danger' :
                  row.status === 'INATIVO' ? 'neutral' :
                    'warning'

              return {
                ...row,
                full_name: (
                  <div className="flex items-center gap-3">
                    {/* Avatar similar to mobile */}
                    {(() => {
                      const gradName = extra.graduation
                      const gradConfig = (settings.graduations || []).find(x => x.name === gradName)
                      const gradColor = gradConfig?.color || gradConfig?.colorLeft || '#E5E7EB'
                      
                      return (
                        <div 
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 p-0.5 shadow-sm"
                          style={{ borderColor: gradColor }}
                        >
                          <div 
                             className="flex h-full w-full items-center justify-center rounded-full font-bold text-xs"
                             style={{ backgroundColor: `${gradColor}15`, color: gradColor === '#FFFFFF' || gradColor === '#fff' ? '#4F46E5' : gradColor }}
                          >
                            {getInitials(row.full_name)}
                          </div>
                        </div>
                      )
                    })()}
                    
                    <div className="flex flex-col">
                      <span
                        className="font-medium text-gray-900 dark:text-white hover:text-brand-600 cursor-pointer transition-colors"
                        onClick={() => navigate(`/students/${row.id}`)}
                      >
                        {row.full_name}
                      </span>
                      <span className="text-xs text-muted flex items-center gap-1">
                        {row.cpf}
                        {row.birth_date && (
                          <> <span className="text-gray-300 dark:text-gray-600">•</span> {calculateAge(row.birth_date)} anos</>
                        )}
                      </span>
                    </div>
                  </div>
                ),
                group_info: (
                  <div className="text-sm">
                    {extra.unit && (
                      <div className="flex items-center gap-1.5 font-medium text-primary">
                        <span
                          className="block w-2.5 h-2.5 rounded-full border border-gray-100 shadow-sm"
                          style={{ backgroundColor: getHashColor(extra.unit) }}
                          title={`Cor da unidade: ${getHashColor(extra.unit)}`}
                        />
                        {extra.unit}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-1 text-xs text-secondary">
                      {extra.group_class && <span>{extra.group_class}</span>}
                      {extra.group_class && extra.teacher && <span>•</span>}
                      {extra.teacher && <span>{extra.teacher}</span>}
                    </div>
                    {!extra.unit && !extra.group_class && !extra.teacher && <span className="text-muted">-</span>}
                  </div>
                ),
                graduation: (
                  <div className="text-sm">
                    {extra.graduation ? (
                      <div className="flex flex-col items-start">
                        {(() => {
                          const g = (settings.graduations || []).find(x => x.name === extra.graduation)
                          if (!g) {
                            return <div className="font-medium text-primary leading-tight">{extra.graduation}</div>
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
                      <span className="text-muted">-</span>
                    )}
                  </div>
                ),
                status: <Badge variant={statusColor}>{row.status === 'DELINQUENT' ? 'INADIMPLENTE' : row.status}</Badge>,
                next_due_date: (
                  <div className="text-sm text-secondary">
                    {extra.next_due_date ? extra.next_due_date.split('-').reverse().join('/') : '-'}
                  </div>
                ),
                actions: (
                  <div className="flex items-center justify-end gap-2">
                    <Tooltip content="Ver detalhes">
                      <button
                        onClick={() => navigate(`/students/${row.id}`)}
                        className="p-1 text-muted hover:text-brand-600"
                      >
                        <Icon name="eye" />
                      </button>
                    </Tooltip>

                    <Dropdown
                      trigger={
                        <button className="p-1 text-muted hover:text-secondary">
                          <Icon name="more-vertical" />
                        </button>
                      }
                      items={[
                        ...(row.activities?.some((a: any) => a.activityType?.usaGraduacao) ? [{
                          label: 'Graduar',
                          icon: 'medal' as IconName,
                          onClick: () => setPromoteStudentId(row.id)
                        }] : []),
                        {
                          label: 'Editar cadastro',
                          icon: 'edit' as IconName,
                          onClick: () => navigate(`/students?action=edit&id=${row.id}`)
                        },
                        {
                          label: 'Financeiro',
                          icon: 'credit-card' as IconName,
                          onClick: () => navigate(`/finance?student_id=${row.id}`)
                        },
                        ...(auth.role !== 'PROFESSOR' ? [{
                          label: row.status === 'ATIVO' ? 'Inativar matrícula' : 'Ativar matrícula',
                          icon: (row.status === 'ATIVO' ? 'x-circle' : 'check-circle') as IconName,
                          variant: (row.status === 'ATIVO' ? 'danger' : 'default') as 'danger' | 'default',
                          onClick: () => handleToggleStatus(row)
                        }] : [])
                      ]}
                    />
                  </div>
                )
              }
            })}
          />
          <Pagination page={page} pageCount={meta?.page_count ?? pageCount} onChange={setPage} />
        </div>
        {loading && <div className="mt-2 text-sm text-gray-600">Carregando...</div>}
      </Card>
      {isModalOpen && (
        <CreateStudentModal
          studentId={editId}
          onClose={() => navigate('/students')}
          onSuccess={() => {
            navigate('/students')
            fetchData(1)
            toast.success(editId ? 'Aluno atualizado!' : 'Aluno cadastrado!')
          }}
        />
      )}
      {promoteStudentId && studentToPromote && (
        <PromoteStudentModal 
          student={studentToPromote}
          onClose={() => setPromoteStudentId(null)}
          onSuccess={() => {
            setPromoteStudentId(null)
            fetchData()
          }}
        />
      )}
    </>
  )
}
