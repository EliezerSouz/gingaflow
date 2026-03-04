import { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma'
import { z } from 'zod'

export async function registerDashboardRoutes(app: FastifyInstance) {
    app.log.info('📦 Registering Dashboard Routes...')

    app.get('/dashboard/ping', async () => ({ status: 'dashboard-ok' }))

    app.route({
        method: 'GET',
        url: '/dashboard/overview',
        handler: async (req, reply) => {
            app.log.info({ url: req.url }, '🚀 Getting Dashboard Overview')
            const user = (req as any).currentUser
            if (!user) {
                return reply.status(401).send({ code: 'UNAUTHORIZED' })
            }

            const orgId = user.organizationId
            const rawUnitId = (req.query as any).unitId
            const unitId = (rawUnitId && rawUnitId !== '') ? z.string().uuid().parse(rawUnitId) : undefined

            const todayStr = new Date().toISOString().split('T')[0]
            const currentMonthStr = todayStr.slice(0, 7)

            try {
                // Contexto de filtro
                const unitFilter = unitId ? { unitId } : {}
                const studentUnitFilter = unitId ? { studentTurmas: { some: { turma: { unitId } } } } : {}
                const attendanceUnitFilter = unitId ? { turma: { unitId } } : {}

                // 0. Lista de Unidades para o Seletor
                const allUnits = await prisma.unit.findMany({
                    where: { organizationId: orgId, status: 'ATIVA' },
                    select: { id: true, name: true }
                });

                // 1. Resumo do Dia
                const [presencesToday, overdueCount, revenueTodayAggr, activeStudents, activeTeachers, turmasCount] = await Promise.all([
                    prisma.attendance.count({
                        where: { organizationId: orgId, date: todayStr, status: 'PRESENT', ...attendanceUnitFilter }
                    }),
                    prisma.payment.count({
                        where: { organizationId: orgId, status: 'ATRASADO', student: studentUnitFilter }
                    }),
                    prisma.payment.aggregate({
                        where: { organizationId: orgId, status: 'PAGO', paidAt: { gte: new Date(todayStr) }, student: studentUnitFilter },
                        _sum: { monthlyFeeCents: true }
                    }),
                    prisma.student.count({
                        where: { organizationId: orgId, status: 'ATIVO', ...studentUnitFilter }
                    }),
                    prisma.teacher.count({
                        where: {
                            organizationId: orgId,
                            status: 'ATIVO',
                            ...(unitId ? { teacherTurmas: { some: { turma: { unitId } } } } : {})
                        }
                    }),
                    prisma.turma.count({ where: { organizationId: orgId, status: 'ATIVA', ...unitFilter } })
                ])

                // 3. Aulas de Hoje
                const dayOfWeek = new Date().getDay()
                const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
                const weekDaysLong = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO']
                const todayShort = weekDays[dayOfWeek]
                const todayLong = weekDaysLong[dayOfWeek]

                const turmasQuery = await prisma.turma.findMany({
                    where: { organizationId: orgId, status: 'ATIVA', ...unitFilter },
                    include: {
                        teacher: true,
                        _count: { select: { studentLinks: true } }
                    }
                })

                const classesToday: any[] = []

                const allAttendancesToday = await prisma.attendance.findMany({
                    where: { organizationId: orgId, date: todayStr, status: 'PRESENT', ...attendanceUnitFilter }
                })

                turmasQuery.forEach(t => {
                    if (!t.schedule) return
                    const parts = t.schedule.split(',').map(p => p.trim().toUpperCase())
                    parts.forEach(part => {
                        if (part.includes(todayShort) || part.includes(todayLong)) {
                            const timeMatch = part.match(/\d{2}:\d{1,2}/)
                            const time = timeMatch ? timeMatch[0] : '--:--'
                            const sessionAttendances = allAttendancesToday.filter(
                                a => a.turmaId === t.id && (a.time === time || (!a.time && time === '--:--'))
                            ).length
                            const count = sessionAttendances
                            const enrolled = t._count.studentLinks
                            const status = (enrolled > 0 && count >= enrolled) ? 'Aula Cheia' : 'Vagas Disp.'

                            classesToday.push({
                                id: `${t.id}-${time}`,
                                turmaId: t.id,
                                name: t.name,
                                time,
                                teacher: t.teacher?.nickname || t.teacher?.full_name || 'Sem Prof.',
                                count,
                                enrolledCount: enrolled,
                                status
                            })
                        }
                    })
                })

                classesToday.sort((a, b) => a.time.localeCompare(b.time))

                // 5. Financeiro
                const [monthlyRevenueAggr, overdueValueAggr] = await Promise.all([
                    prisma.payment.aggregate({
                        where: { organizationId: orgId, status: 'PAGO', paidAt: { gte: new Date(currentMonthStr + '-01') }, student: studentUnitFilter },
                        _sum: { monthlyFeeCents: true }
                    }),
                    prisma.payment.aggregate({
                        where: { organizationId: orgId, status: 'ATRASADO', student: studentUnitFilter },
                        _sum: { monthlyFeeCents: true }
                    })
                ])

                const monthlyRevenue = (monthlyRevenueAggr._sum.monthlyFeeCents || 0) / 100
                const overdueValue = (overdueValueAggr._sum.monthlyFeeCents || 0) / 100
                const ticketAverage = activeStudents > 0 ? Math.round(monthlyRevenue / activeStudents) : 0

                // 6. Engajamento
                const [popularActivities, topTeachersRaw] = await Promise.all([
                    prisma.activityType.findMany({
                        where: { organizationId: orgId },
                        include: { _count: { select: { students: true } } },
                        take: 3,
                        orderBy: { students: { _count: 'desc' } }
                    }),
                    prisma.teacher.findMany({
                        where: { organizationId: orgId, status: 'ATIVO' },
                        include: {
                            _count: { select: { turmas: true } },
                            turmas: {
                                include: { _count: { select: { studentLinks: true } } }
                            }
                        },
                        take: 3
                    })
                ])

                const topTeachers = topTeachersRaw.map(teacher => {
                    const totalStudents = teacher.turmas.reduce((acc, t) => acc + t._count.studentLinks, 0)
                    return {
                        name: teacher.nickname || teacher.full_name,
                        count: totalStudents
                    }
                }).sort((a, b) => b.count - a.count)

                // 7. Alertas
                const alerts = []
                if (overdueCount > 0) {
                    alerts.push({ type: 'danger', message: `${overdueCount} alunos com mensalidade vencida`, icon: 'alert-circle' })
                }

                const birthdaysToday = await prisma.student.count({
                    where: {
                        organizationId: orgId,
                        birth_date: { contains: `-${todayStr.slice(5)}` }, // MM-DD
                        ...studentUnitFilter
                    }
                })
                if (birthdaysToday > 0) {
                    alerts.push({ type: 'info', message: `${birthdaysToday} alunos fazem aniversário hoje`, icon: 'gift' })
                }

                return {
                    selectedUnitId: unitId || null,
                    units: allUnits,
                    summary: {
                        presences: presencesToday,
                        classesCount: classesToday.length,
                        revenueToday: (revenueTodayAggr._sum.monthlyFeeCents || 0) / 100,
                        overdueCount
                    },
                    status: {
                        activeStudents,
                        activeTeachers,
                        unitsCount: allUnits.length,
                        turmasCount
                    },
                    classesToday,
                    finance: {
                        monthlyRevenue,
                        overdueValue,
                        ticketAverage
                    },
                    engagement: {
                        popularActivities: popularActivities.map(a => ({ name: a.name, count: a._count.students })),
                        topTeachers
                    },
                    alerts
                }

            } catch (error) {
                console.error('Erro ao processar dashboard:', error)
                return reply.status(500).send({ code: 'INTERNAL_ERROR' })
            }
        }
    })
}
