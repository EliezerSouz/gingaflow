import React, { useEffect, useState } from 'react'
import { Card, Icon } from '@gingaflow/ui'
import { getFinancialReport, getAcademicReport, FinancialReport, AcademicReport } from '../services/reports'
import { toast } from 'sonner'

export default function Reports() {
    const [financial, setFinancial] = useState<FinancialReport | null>(null)
    const [academic, setAcademic] = useState<AcademicReport | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        try {
            const [fin, aca] = await Promise.all([
                getFinancialReport(),
                getAcademicReport()
            ])
            setFinancial(fin)
            setAcademic(aca)
        } catch (e) {
            console.error(e)
            toast.error('Erro ao carregar relatórios')
        } finally {
            setLoading(false)
        }
    }

    function formatCurrency(val: number) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    }

    if (loading) return <div className="text-center py-8">Carregando indicadores...</div>

    return (
        <div className="space-y-8">
            {/* Seção Financeira */}
            <section>
                <h2 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
                    <Icon name="finance" className="text-brand-600" />
                    Financeiro
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <Card>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-muted">Receita Anual</span>
                                <Icon name="finance" className="text-green-500" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">
                                {formatCurrency(financial?.monthlyRevenue.reduce((a, b) => a + b, 0) || 0)}
                            </div>
                            <p className="text-xs text-muted mt-1">Total recebido em {new Date().getFullYear()}</p>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-muted">Inadimplência</span>
                                <Icon name="x" className="text-red-500" />
                            </div>
                            <div className="text-2xl font-bold text-red-600">
                                {formatCurrency(financial?.overdue.value || 0)}
                            </div>
                            <p className="text-xs text-muted mt-1">{financial?.overdue.count} pagamentos atrasados</p>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-muted">Previsão (Mês Atual)</span>
                                <Icon name="dashboard" className="text-blue-500" />
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(financial?.forecast.value || 0)}
                            </div>
                            <p className="text-xs text-muted mt-1">Potencial de receita este mês</p>
                        </div>
                    </Card>
                </div>

                {/* Gráfico de Barras CSS - Receita Mensal */}
                <Card>
                    <div className="p-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-6">Evolução da Receita Mensal</h3>
                        <div className="h-48 flex items-end justify-between gap-2">
                            {financial?.monthlyRevenue.map((val, idx) => {
                                const max = Math.max(...(financial?.monthlyRevenue || [1]))
                                const height = max > 0 ? (val / max) * 100 : 0
                                const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center group">
                                        <div className="relative w-full flex justify-center items-end h-full">
                                            <span className="absolute -top-8 text-xs font-bold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white border px-1 rounded shadow-sm z-10">
                                                {formatCurrency(val)}
                                            </span>
                                            <div
                                                className="w-full bg-brand-100 hover:bg-brand-500 transition-colors rounded-t-sm"
                                                style={{ height: `${height}%`, minHeight: val > 0 ? '4px' : '0' }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted mt-2 rotate-0 sm:rotate-0 text-[10px] sm:text-xs">{months[idx]}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </Card>
            </section>

            {/* Seção Acadêmica */}
            <section>
                <h2 className="text-lg font-medium text-primary mb-4 flex items-center gap-2">
                    <Icon name="graduations" className="text-brand-600" />
                    Acadêmico
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Distribuição por Status */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Alunos por Status</h3>
                            <div className="space-y-4">
                                {academic?.byStatus.map((item) => {
                                    const total = academic.byStatus.reduce((acc, curr) => acc + curr.count, 0)
                                    const percent = total > 0 ? (item.count / total) * 100 : 0
                                    const color = item.status === 'ATIVO' ? 'bg-green-500' : item.status === 'INATIVO' ? 'bg-red-500' : 'bg-gray-400'

                                    return (
                                        <div key={item.status}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-700">{item.status}</span>
                                                <span className="text-muted">{item.count} ({Math.round(percent)}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                                                <div className={`h-2.5 rounded-full ${color}`} style={{ width: `${percent}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                                {academic?.byStatus.length === 0 && <p className="text-sm text-muted">Sem dados acadêmicos.</p>}
                            </div>
                        </div>
                    </Card>

                    {/* Distribuição por Graduação (Top 5) */}
                    <Card>
                        <div className="p-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Graduações (Top Níveis)</h3>
                            <div className="space-y-3">
                                {academic?.byGraduation.slice(0, 5).map((item) => (
                                    <div key={item.name} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                                        <span className="text-sm text-gray-700">{item.name}</span>
                                        <span className="text-sm font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                                            {item.count}
                                        </span>
                                    </div>
                                ))}
                                {academic?.byGraduation.length === 0 && <p className="text-sm text-muted">Nenhuma graduação registrada.</p>}
                            </div>
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    )
}
