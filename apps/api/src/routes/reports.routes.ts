import { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma'
import { z } from 'zod'

export async function registerReportsRoutes(app: FastifyInstance) {
    // Relatório Financeiro
    app.get('/reports/financial', async (req, reply) => {
        const user = (req as any).currentUser
        if (!user || user.role !== 'ADMIN') {
            return reply.status(403).send({ code: 'FORBIDDEN' })
        }

        const year = new Date().getFullYear()
        const startOfYear = new Date(`${year}-01-01`)
        const endOfYear = new Date(`${year}-12-31`)

        // Receita por mês
        const riskPayments = await prisma.receivablePayment.findMany({
            where: {
                organizationId: user.organizationId,
                paidAt: {
                    gte: startOfYear.toISOString(),
                    lte: endOfYear.toISOString()
                }
            },
            select: {
                amount: true,
                paidAt: true
            }
        })

        const monthlyRevenue = Array(12).fill(0)
        riskPayments.forEach(p => {
            if (p.paidAt) {
                const month = new Date(p.paidAt).getMonth()
                monthlyRevenue[month] += p.amount
            }
        })

        // KPI: Inadimplência atual (Receivables OVERDUE)
        const overdueCount = await prisma.receivable.count({
            where: {
                status: 'OVERDUE',
                organizationId: user.organizationId
            }
        })

        const overdueValueAggr = await prisma.receivable.aggregate({
            where: {
                status: 'OVERDUE',
                organizationId: user.organizationId
            },
            _sum: { balance: true }
        })

        // KPI: Previsão de receita mês atual (status != PAGO mas período = mês atual)
        const currentPeriod = new Date().toISOString().slice(0, 7) // YYYY-MM
        const forecastAggr = await prisma.receivable.aggregate({
            where: {
                period: currentPeriod,
                organizationId: user.organizationId
            },
            _sum: { finalValue: true }
        })

        return {
            monthlyRevenue: monthlyRevenue.map(cents => Math.round(cents / 100)), // Retornar em reais para gráfico
            overdue: {
                count: overdueCount,
                value: Math.round((overdueValueAggr._sum.balance || 0) / 100)
            },
            forecast: {
                value: Math.round((forecastAggr._sum.finalValue || 0) / 100)
            }
        }
    })

    // Relatório Acadêmico
    app.get('/reports/academic', async (req, reply) => {
        const user = (req as any).currentUser
        if (!user || user.role !== 'ADMIN') {
            return reply.status(403).send({ code: 'FORBIDDEN' })
        }

        // Alunos por Status
        const statusGroups = await prisma.student.groupBy({
            where: { organizationId: user.organizationId },
            by: ['status'],
            _count: { id: true }
        })

        // Alunos por Graduação (Agrupamento em memória)
        // Buscamos todos os alunos e suas graduações para determinar a atual
        const students = await prisma.student.findMany({
            where: {
                status: 'ATIVO',
                organizationId: user.organizationId
            },
            include: {
                graduations: {
                    orderBy: { date: 'desc' },
                    take: 1
                }
            }
        })

        // Resolver nomes de graduação via GraduationLevel (padrão do projeto)
        const graduationLevels = await prisma.graduationLevel.findMany({
            where: { organizationId: user.organizationId }
        })
        const graduationsMap: Record<string, any> = graduationLevels.reduce((acc: any, g: any) => {
            acc[g.id] = g
            return acc
        }, {})

        const gradCounts: Record<string, number> = {}

        students.forEach(s => {
            const currentGrad = (s as any).graduations[0]
            // Se tiver graduação, resolve o nome via map, senão 'Iniciante'
            const level = currentGrad
                ? (graduationsMap[currentGrad.newGraduationId]?.name ?? 'Desconhecida')
                : 'Iniciante'
            gradCounts[level] = (gradCounts[level] || 0) + 1
        })

        const byGraduation = Object.entries(gradCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)

        return {
            byStatus: statusGroups.map(g => ({ status: g.status, count: g._count.id })),
            byGraduation
        }
    })
}
