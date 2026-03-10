import React, { useEffect, useState, useCallback } from 'react'
import { MetricCard, Card, Icon, Button, Badge, type IconName } from '@gingaflow/ui'
import { dashboardRepository } from '../repositories/dashboardRepository'
import { DashboardData } from '../services/dashboard'
import { listUnits, type Unit } from '../services/units'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>()

  const loadData = useCallback(async (unitId?: string) => {
    try {
      setLoading(true)
      const [overview, unitsData] = await Promise.all([
        dashboardRepository.getOverview(unitId),
        listUnits()
      ])
      setData(overview)
      setUnits(unitsData.data)
    } catch (err: any) {
      toast.error('Erro ao carregar dados do dashboard')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(selectedUnitId)
  }, [selectedUnitId, loadData])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    )
  }

  const activeClass = data?.classesToday.find(c => c.status === 'EM_ANDAMENTO')
  const nextClasses = data?.classesToday.filter(c => c.status === 'AGENDADA')

  return (
    <div className="space-y-6">
      {/* Unit Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        <button
          onClick={() => setSelectedUnitId(undefined)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
            !selectedUnitId 
              ? 'bg-brand-600 text-white shadow-sm' 
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
          }`}
        >
          Todas Unidades
        </button>
        {units.map(unit => (
          <button
            key={unit.id}
            onClick={() => setSelectedUnitId(unit.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
              selectedUnitId === unit.id 
                ? 'bg-brand-600 text-white shadow-sm' 
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}
          >
            {unit.name}
          </button>
        ))}
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          icon="students" 
          title="Alunos Ativos" 
          value={data?.status.activeStudents || 0} 
          subtitle="Matrículas ativas"
        />
        <MetricCard 
          icon="finance" 
          title="Pendências" 
          value={data?.summary.overdueCount || 0}
          subtitle="Pagamentos em atraso"
        />
        <MetricCard 
          icon="medal" 
          title="Aulas Hoje" 
          value={data?.summary.classesCount || 0}
          subtitle="Total programado"
        />
        <MetricCard 
          icon="check-square" 
          title="Presenças" 
          value={data?.summary.presences || 0}
          subtitle="Confirmadas hoje"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                <Icon name="home" className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium">Unidades</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.status.unitsCount || 0}</p>
            </div>
         </div>
         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
                <Icon name="user" className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium">Turmas</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.status.turmasCount || 0}</p>
            </div>
         </div>
         <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600">
                <Icon name="graduations" className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium">Professores</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{data?.status.activeTeachers || 0}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left/Middle Column: Schedule and Active Class */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Class Highlight */}
          {activeClass && (
            <Card className="border-l-4 border-success-500 bg-success-50/50 dark:bg-success-900/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center text-success-600 animate-pulse">
                        <Icon name="check-square" className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                             <Badge variant="success">AO VIVO</Badge>
                             <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{activeClass.time}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{activeClass.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{activeClass.teacher} • {activeClass.unitName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{activeClass.count}</div>
                        <div className="text-xs text-gray-500">Presentes</div>
                    </div>
                    <Button onClick={() => navigate(`/attendance?turmaId=${activeClass.turmaId}`)}>
                        Fazer Chamada
                    </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Today's Schedule */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Agenda de Hoje</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/agenda')}>Ver completa</Button>
            </div>
            
            <div className="space-y-4">
              {data?.classesToday.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma aula programada para hoje.</div>
              ) : (
                data?.classesToday.map(item => (
                  <div key={item.id} className="flex items-center gap-4 group p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors">
                    <div className="text-sm font-bold text-gray-500 w-12">{item.time}</div>
                    <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: item.unitColor }}></div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.teacher} • {item.unitName}</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                             <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.count}/{item.enrolledCount}</div>
                             <div className="text-[10px] text-gray-500 uppercase">Presenças</div>
                        </div>
                        {item.status === 'AGENDADA' && (
                           <button 
                            className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"
                            onClick={() => navigate(`/attendance?turmaId=${item.turmaId}`)}
                           >
                             <Icon name="check-square" className="w-5 h-5" />
                           </button>
                        )}
                        {item.status === 'FINALIZADA' && (
                             <Icon name="check-circle" className="w-5 h-5 text-success-500" />
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Alerts and Quick Actions */}
        <div className="space-y-6">
          {/* Active/Critical Alerts */}
          <Card className="border-t-4 border-warning-500">
             <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                <Icon name="alert-triangle" className="w-4 h-4 text-warning-500" />
                Alertas do Sistema
             </h3>
             <div className="space-y-3">
                {data?.alerts.length === 0 ? (
                  <div className="flex items-center gap-3 p-3 bg-success-50 dark:bg-success-900/10 text-success-700 dark:text-success-400 rounded-lg text-sm border border-success-100 dark:border-success-900/20">
                    <Icon name="check-circle" className="w-4 h-4" />
                    Tudo certo por aqui!
                  </div>
                ) : (
                  data?.alerts.map((alert, i) => (
                    <div key={i} className={`p-3 rounded-lg text-sm border flex gap-3 ${
                      alert.type === 'danger' 
                        ? 'bg-danger-50 text-danger-700 border-danger-100 dark:bg-danger-900/10 dark:text-danger-400 dark:border-danger-900/20' 
                        : 'bg-warning-50 text-warning-700 border-warning-100 dark:bg-warning-900/10 dark:text-warning-400 dark:border-warning-900/20'
                    }`}>
                      <Icon name={alert.icon as IconName} className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{alert.message}</span>
                    </div>
                  ))
                )}
             </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-2">
               <button 
                onClick={() => navigate('/students?action=new')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group"
               >
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
                      <Icon name="plus" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Novo Aluno</span>
               </button>
               <button 
                 onClick={() => navigate('/finance')}
                 className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group"
               >
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
                      <Icon name="finance" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Mensalidades</span>
               </button>
               <button 
                 onClick={() => navigate('/graduations')}
                 className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group"
               >
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
                      <Icon name="graduations" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Graduações</span>
               </button>
               <button 
                 onClick={() => navigate('/reports')}
                 className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group"
               >
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform">
                      <Icon name="reports" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Relatórios</span>
               </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
