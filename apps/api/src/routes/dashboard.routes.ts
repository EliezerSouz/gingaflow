import { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma'
import { z } from 'zod'

function calculateClassStatus(startTimeStr: string, durationMinutes: number) {
    if (!startTimeStr || startTimeStr === '--:--') return { status: 'AGENDADA', attendanceStatus: 'BLOQUEADA' };

    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const now = new Date();

    // Comparar apenas horas/minutos do dia atual
    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
    const attendanceStartTime = new Date(startTime.getTime() - 10 * 60000);

    let status: 'AGENDADA' | 'EM_ANDAMENTO' | 'FINALIZADA' = 'AGENDADA';
    if (now >= startTime && now <= endTime) {
        status = 'EM_ANDAMENTO';
    } else if (now > endTime) {
        status = 'FINALIZADA';
    }

    let attendanceStatus: 'BLOQUEADA' | 'DISPONÍVEL' | 'ENCERRADA' = 'BLOQUEADA';
    if (now >= attendanceStartTime && now <= endTime) {
        attendanceStatus = 'DISPONÍVEL';
    } else if (now > endTime) {
        attendanceStatus = 'ENCERRADA';
    }

    return { status, attendanceStatus };
}

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
                    prisma.receivable.count({
                        where: { organizationId: orgId, status: 'OVERDUE', student: studentUnitFilter }
                    }),
                    prisma.receivablePayment.aggregate({
                        where: { organizationId: orgId, paidAt: { contains: todayStr }, receivable: { student: studentUnitFilter } },
                        _sum: { amount: true }
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

                // 2. Níveis de Graduação para Mapeamento de Cores
                const graduationLevels = await prisma.graduationLevel.findMany({
                    where: { organizationId: orgId }
                });
                const gradsMap = graduationLevels.reduce((acc: any, g: any) => {
                    acc[g.id] = {
                        color: g.color,
                        colorLeft: g.colorLeft,
                        colorRight: g.colorRight,
                        pontaLeft: g.pontaLeft,
                        pontaRight: g.pontaRight
                    };
                    return acc;
                }, {});

                const turmasQuery = await prisma.turma.findMany({
                    where: { organizationId: orgId, status: 'ATIVA', ...unitFilter },
                    include: {
                        unit: true,
                        teacher: true,
                        activityType: true,
                        schedules: {
                            where: { dayOfWeek: todayShort },
                            include: {
                                teacher: true,
                                students: {
                                    select: {
                                        id: true,
                                        full_name: true,
                                        nickname: true,
                                        currentGraduationId: true
                                    }
                                },
                                _count: { select: { students: true } }
                            }
                        },
                        studentLinks: {
                            include: {
                                student: {
                                    select: {
                                        id: true,
                                        full_name: true,
                                        nickname: true,
                                        currentGraduationId: true
                                    }
                                }
                            }
                        },
                        _count: { select: { studentLinks: true } }
                    }
                })

                const classesToday: any[] = []

                const allAttendancesToday = await prisma.attendance.findMany({
                    where: { organizationId: orgId, date: todayStr, status: 'PRESENT', ...attendanceUnitFilter }
                })

                turmasQuery.forEach(t => {
                    // Usar novos horários
                    t.schedules.forEach(sched => {
                        const time = sched.startTime
                        const sessionAttendances = allAttendancesToday.filter(
                            a => a.turmaId === t.id && a.time === time
                        ).length

                        const count = sessionAttendances
                        const enrolled = sched._count.students
                        const capacityThreshold = (t as any).capacity || 0

                        let status = 'Vagas Disp.'
                        if (capacityThreshold > 0 && enrolled >= capacityThreshold) {
                            status = 'Aula Cheia'
                        }

                        const teacherData = sched.teacher || t.teacher;
                        const isCapoeira = t.activityType?.name?.toLowerCase().includes('capoeira');
                        const teacherName = (isCapoeira && teacherData?.nickname)
                            ? teacherData.nickname
                            : (teacherData?.full_name || 'Sem Prof.');

                        const { status: classStatus, attendanceStatus } = calculateClassStatus(time, (t as any).durationMinutes || 60);

                        classesToday.push({
                            id: `${t.id}-${time}`,
                            turmaId: t.id,
                            name: t.name,
                            time,
                            durationMinutes: (t as any).durationMinutes || 60,
                            teacher: teacherName,
                            count,
                            enrolledCount: enrolled,
                            status: classStatus, // Substituindo o status antigo (Vagas Disp) pelo novo status temporal
                            occupancyStatus: status, // Guardando o status de lotação
                            attendanceStatus,
                            attendanceAvailable: attendanceStatus === 'DISPONÍVEL',
                            unitName: t.unit.name,
                            unitColor: t.unit.color || '#4F46E5',
                            students: sched.students.map((s: any) => {
                                const grad = s.currentGraduationId ? gradsMap[s.currentGraduationId] : null;
                                return {
                                    id: s.id,
                                    name: (isCapoeira && s.nickname) ? s.nickname : s.full_name,
                                    cord: isCapoeira ? (grad || { color: '#D1D5DB' }) : null
                                };
                            })
                        })
                    })

                    // Removed legacy t.schedule fallback per Etapa 5
                })

                classesToday.sort((a, b) => a.time.localeCompare(b.time))

                // 5. Financeiro
                const [monthlyRevenueAggr, overdueValueAggr] = await Promise.all([
                    prisma.receivablePayment.aggregate({
                        where: { organizationId: orgId, paidAt: { contains: currentMonthStr }, receivable: { student: studentUnitFilter } },
                        _sum: { amount: true }
                    }),
                    prisma.receivable.aggregate({
                        where: { organizationId: orgId, status: 'OVERDUE', student: studentUnitFilter },
                        _sum: { balance: true }
                    })
                ])

                const monthlyRevenue = (monthlyRevenueAggr._sum.amount || 0) / 100
                const overdueValue = (overdueValueAggr._sum.balance || 0) / 100
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
                        revenueToday: (revenueTodayAggr._sum.amount || 0) / 100,
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
