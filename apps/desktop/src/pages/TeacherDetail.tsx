import React, { useState, useEffect } from 'react'
import { Card, Tabs, TabsList, TabsTrigger, TabsContent, EmptyState, FormField, Input, Badge, Button, Icon, Table } from '@gingaflow/ui'
import { formatSchedule } from '../utils/schedule'
import { useParams, useNavigate } from 'react-router-dom'
import { getTeacher, Teacher } from '../services/teachers'
import { listStudents, parseStudentExtra } from '../services/students'
import { useSettings } from '../contexts/SettingsContext'
import { Graduation } from '../services/settings'
import { CordaPreview } from '../components/CordaPreview'

export default function TeacherDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'dados' | 'turmas' | 'alunos'>('dados')
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<any[]>([])
  const [debugInfo, setDebugInfo] = useState<string>('')
  const { settings } = useSettings()

  useEffect(() => {
    if (id) {
      loadTeacher(id)
      loadStudents(id)
    }
  }, [id])

  async function loadTeacher(teacherId: string) {
    try {
      const t = await getTeacher(teacherId)
      setTeacher(t)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadStudents(teacherId: string) {
    try {
      const t = await getTeacher(teacherId)
      // Fetch all students to client-side filter (handling pagination to avoid API limits)
      let allStudents: any[] = []
      let page = 1
      let hasMore = true
      while (hasMore) {
        const res = await listStudents({ per_page: 100, page })
        allStudents = [...allStudents, ...res.data]
        
        // Fix: backend returns total_pages, not page_count
        const totalPages = (res.meta as any).total_pages || res.meta.page_count || 1;
        if (res.meta.page >= totalPages || res.data.length === 0) {
          hasMore = false
        } else {
          page++
        }
      }

      const raw = allStudents

      const normalize = (s: string) => s ? s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : ""

      const tNameNorm = normalize(t.full_name)
      const tCapoeiraNorm = normalize(t.capoeira_name || '')

      const filtered = raw.filter(s => {
        // Direct relational match (modern approach)
        const isMatchedRelationally = s.studentTurmas?.some((st: any) => 
          st.turma?.teacherId === t.id || st.turma?.teacher?.id === t.id
        )
        if (isMatchedRelationally) return true

        // Fallback: Legacy notes matching via parseStudentExtra
        const extra = parseStudentExtra(s)
        if (!extra.teacher) return false

        const sTeacherRef = normalize(extra.teacher)

        // Check for direct inclusion
        const matchName = (tNameNorm && sTeacherRef.includes(tNameNorm)) || (sTeacherRef && tNameNorm.includes(sTeacherRef))
        const matchCapoeira = tCapoeiraNorm ? ((sTeacherRef.includes(tCapoeiraNorm)) || (tCapoeiraNorm.includes(sTeacherRef))) : false

        if (matchName || matchCapoeira) return true

        // Fallback: Token matching (if any word matches with length > 3)
        // e.g. "Tais Silva" vs "Prof Tais"
        const tokens = sTeacherRef.split(/\s+/).filter(w => w.length > 3)
        const tTokens = tNameNorm.split(/\s+/).filter(w => w.length > 3)

        const tokenMatch = tokens.some(token => tTokens.includes(token))
        // Also check capoeira tokens
        const capTokens = tCapoeiraNorm.split(/\s+/).filter(w => w.length > 3)
        const capTokenMatch = capTokens.some(token => tokens.includes(token))

        return tokenMatch || capTokenMatch
      })

      if (filtered.length === 0 && raw.length > 0) {
        const candidate = raw.find(s => normalize(parseStudentExtra(s).teacher || '').includes(tNameNorm.split(' ')[0]))
        if (candidate) {
          const ex = parseStudentExtra(candidate)
          setDebugInfo(`Debug: Encontrado aluno '${candidate.full_name}' com professor '${ex.teacher}'. Esperado: '${t.full_name}' ou '${t.capoeira_name}'`)
        } else {
          setDebugInfo('')
        }
      } else {
        setDebugInfo('')
      }

      setStudents(filtered)
    } catch (e: any) {
      console.error(e)
      setDebugInfo(`Erro ao carregar alunos: ${e.message}`)
    }
  }

  if (loading) return <div>Carregando...</div>
  if (!teacher) return <EmptyState title="Professor não encontrado" description="O professor solicitado não existe ou foi removido." />

  const associatedStudents = students // Already filtered by API

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/teachers')}>
          <Icon name="arrow-left" className="mr-2" />
          Voltar para lista
        </Button>
      </div>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{teacher.full_name}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <Badge variant={teacher.status === 'ATIVO' ? 'success' : 'neutral'}>{teacher.status}</Badge>
              <span>•</span>
              <span>{teacher.capoeira_name || 'Sem apelido'}</span>
              <span>•</span>
              <span>{teacher.graduation}</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            {(() => {
              const g = (settings.graduations || []).find(x => x.name === teacher.graduation)
              if (!g) return null
              const desc = g.description || [g.category, (typeof g.grau === 'number' ? `Grau ${g.grau}` : undefined)].filter(Boolean).join(' • ')
              return (
                <>
                  <div className="text-sm font-medium text-center">{g.name}</div>
                  <div className="mt-1">
                    <CordaPreview grad={g} width={100} />
                  </div>
                  {desc && <div className="text-xs text-secondary mt-1">{desc}</div>}
                </>
              )
            })()}
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <Tabs value={tab} onChange={setTab as any}>
          <TabsList>
            <TabsTrigger value="dados" current={tab} onChange={setTab as any}>Dados Pessoais</TabsTrigger>
            <TabsTrigger value="turmas" current={tab} onChange={setTab as any}>Unidades e Turmas</TabsTrigger>
            <TabsTrigger value="alunos" current={tab} onChange={setTab as any}>Alunos ({associatedStudents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" current={tab}>
            <Card>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">Email</div>
                  <div>{teacher.email || '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">Telefone</div>
                  <div>{teacher.phone || '-'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">Graduação</div>
                  <div>{teacher.graduation}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-500">Apelido</div>
                  <div>{teacher.capoeira_name || '-'}</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="turmas" current={tab}>
            {(!teacher.units || teacher.units.length === 0) ? (
              <EmptyState title="Nenhuma turma vinculada" description="Este professor não está vinculado a nenhuma unidade ou turma." />
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {teacher.units.map(unit => (
                  <Card key={unit.id}>
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                        <Icon name="home" className="h-4 w-4" />
                      </div>
                      <div className="font-medium">{unit.name}</div>
                    </div>
                    <div className="space-y-2">
                      {unit.turmas.map(turma => (
                        <div key={turma.id} className="flex items-center justify-between rounded bg-gray-50 p-2 text-sm">
                          <span>{turma.name}</span>
                          <Badge variant="neutral">{formatSchedule(turma.schedule)}</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="alunos" current={tab}>
            <Card>
              {debugInfo && <div className="p-2 mb-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200">{debugInfo}</div>}
              {associatedStudents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">Nenhum aluno associado a este professor.</div>
              ) : (
                <Table
                  columns={[
                    { key: 'name', header: 'Nome', width: '2fr' },
                    { key: 'graduation', header: 'Graduação', width: '1fr' },
                    { key: 'status', header: 'Status', width: '1fr' }
                  ]}
                  data={associatedStudents.map(s => {
                    const extra = parseStudentExtra(s)
                    return {
                      name: (
                        <div className="flex flex-col">
                          <span className="font-medium text-brand-600 cursor-pointer" onClick={() => navigate(`/students/${s.id}`)}>{s.full_name}</span>
                        </div>
                      ),
                      graduation: extra.graduation || '-',
                      status: <Badge variant={s.status === 'ATIVO' ? 'success' : 'neutral'}>{s.status}</Badge>
                    }
                  })}
                />
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
