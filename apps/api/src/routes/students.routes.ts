import { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma'
import { StudentSchema } from '@gingaflow/shared'
import { z } from 'zod'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().optional(),
  teacher_name: z.string().optional(),
  status: z.string().optional(),
  unit: z.string().optional(),
  turma: z.string().optional()
})

const UpdateSchema = StudentSchema.partial()

export async function registerStudentRoutes(app: FastifyInstance) {
  app.get('/students', async (req) => {
    const user = (req as any).currentUser
    if (!user) {
      throw new Error('UNAUTHORIZED')
    }
    const query = ListQuery.parse((req as any).query)

    // If user is a teacher, force filter by their name
    if (user.role === 'PROFESSOR') {
      // Use user.name or if relatedId exists we could fetch teacher, but name is likely consistent
      query.teacher_name = user.name
    }

    // Build filter
    const where: any = { organizationId: user.organizationId }

    // RBAC: If user is PROFESSOR, only show their students
    if (user.role === 'PROFESSOR') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
      if (teacher) {
        where.studentTurmas = {
          some: {
            turma: {
              teacherLinks: { some: { teacherId: teacher.id } }
            }
          }
        }
      }
    }

    if (query.q) {
      where.OR = [
        { full_name: { contains: query.q } },
        { cpf: { contains: query.q } }
      ]
    }
    if (query.status) {
      where.status = query.status
    }
    if (query.turma) {
      where.studentTurmas = {
        ...where.studentTurmas,
        some: {
          ...where.studentTurmas?.some,
          turmaId: query.turma
        }
      }
    }
    if (query.unit) {
      where.studentTurmas = {
        ...where.studentTurmas,
        some: {
          ...where.studentTurmas?.some,
          turma: { unitId: query.unit }
        }
      }
    }

    const [items, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: { full_name: 'asc' },
        skip: (query.page - 1) * query.per_page,
        take: query.per_page,
        include: {
          activities: {
            include: { activityType: true }
          },
          studentTurmas: {
            include: {
              turma: {
                include: { teacher: true, unit: true }
              }
            }
          },
          schedules: true,
          graduations: {
            take: 1,
            orderBy: { date: 'desc' }
          },
          currentGraduation: true
        }
      }),
      prisma.student.count({ where })
    ])

    const graduationLevels = await prisma.graduationLevel.findMany()
    const graduationsMap = graduationLevels.reduce((acc: any, g: any) => {
      acc[g.id] = g
      return acc
    }, {})

    const enrichedItems = items.map((student: any) => {
      const enrichedGraduations = student.graduations.map((g: any) => {
        const gradData = graduationsMap[g.newGraduationId]
        return {
          ...g,
          level: gradData?.name || 'Desconhecida',
          color: gradData?.color,
          colorLeft: gradData?.colorLeft,
          colorRight: gradData?.colorRight,
          pontaLeft: gradData?.pontaLeft,
          pontaRight: gradData?.pontaRight,
          cordaType: gradData?.cordaType
        }
      })
      return { 
        ...student, 
        graduations: enrichedGraduations,
        level: student.currentGraduation?.name || (enrichedGraduations[0]?.level !== 'Desconhecida' ? enrichedGraduations[0]?.level : null)
      }
    })

    return {
      data: enrichedItems,
      meta: {
        page: query.page,
        per_page: query.per_page,
        total,
        total_pages: Math.ceil(total / query.per_page)
      }
    }
  })

  app.get('/students/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) {
      return reply.status(401).send({ code: 'UNAUTHORIZED' })
    }
    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const student = await prisma.student.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId
      },
      include: {
        activities: {
          include: { activityType: true }
        },
        studentTurmas: {
          include: {
            turma: {
              include: {
                teacher: true,
                unit: true,
                schedules: true
              }
            }
          }
        },
        payments: { take: 5, orderBy: { period: 'desc' } },
        graduations: { take: 10, orderBy: { date: 'desc' } },
        schedules: true,
        currentGraduation: true
      }
    })
    if (!student) return reply.status(404).send({ code: 'NOT_FOUND', message: 'Aluno não encontrado' })

    const graduationLevels = await prisma.graduationLevel.findMany()
    const graduationsMap = graduationLevels.reduce((acc: any, g: any) => {
      acc[g.id] = g
      return acc
    }, {})

    const enrichedGraduations = student.graduations.map((g: any) => {
      const gradData = graduationsMap[g.newGraduationId]
      return {
        ...g,
        level: gradData?.name || 'Desconhecida',
        color: gradData?.color,
        colorLeft: gradData?.colorLeft,
        colorRight: gradData?.colorRight,
        pontaLeft: gradData?.pontaLeft,
        pontaRight: gradData?.pontaRight,
        cordaType: gradData?.cordaType
      }
    })

    return { ...student, graduations: enrichedGraduations }
  })

  app.post('/students', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) {
      return reply.status(401).send({ code: 'UNAUTHORIZED' })
    }
    const parsed = StudentSchema.safeParse((req as any).body)
    if (!parsed.success) {
      return reply.status(422).send({ code: 'VALIDATION_ERROR', details: parsed.error.issues })
    }
    try {
      const { activityTypeIds, turmaIds, scheduleIds, enrollments, activityTypeId, id, ...rest } = parsed.data
      const created = await prisma.student.create({
        data: {
          ...rest as any,
          organizationId: user.organizationId,
          activities: activityTypeIds ? {
            create: activityTypeIds.map(id => ({
              activityTypeId: id,
              organizationId: user.organizationId
            }))
          } : undefined,
          studentTurmas: enrollments ? {
            create: enrollments.map(e => ({
              turmaId: e.turmaId,
              organizationId: user.organizationId,
              status: e.status || 'ACTIVE',
              startDate: e.startDate,
              endDate: e.endDate,
              customMonthlyFeeCents: e.customMonthlyFeeCents
            }))
          } : (turmaIds ? {
            create: turmaIds.map(id => ({
              turmaId: id,
              organizationId: user.organizationId
            }))
          } : undefined),
          schedules: scheduleIds ? {
            connect: scheduleIds.map(id => ({ id }))
          } : undefined
        }
      })

      // Handle initial graduation if provided in metadata (from StudentFormModal)
      const gradMatch = rest.notes?.match(/Graduação: (.*)/)
      const dateMatch = rest.notes?.match(/Data Graduação: (.*)/)
      if (gradMatch && dateMatch) {
        const gradLevel = await prisma.graduationLevel.findFirst({ where: { name: gradMatch[1].trim() } })
        if (gradLevel) {
          await prisma.graduation.create({
            data: {
              organizationId: user.organizationId,
              studentId: created.id,
              newGraduationId: gradLevel.id,
              date: new Date(dateMatch[1].split('/').reverse().join('-')).toISOString().split('T')[0],
              type: 'ADJUSTMENT'
            }
          })
          await prisma.student.update({
            where: { id: created.id, organizationId: user.organizationId },
            data: { currentGraduationId: gradLevel.id }
          })
        }
      }

      return created
    } catch (e: any) {
      if (e.code === 'P2002') {
        return reply.status(409).send({ code: 'CONFLICT', message: 'CPF já cadastrado' })
      }
      throw e
    }
  })

  app.put('/students/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) {
      return reply.status(401).send({ code: 'UNAUTHORIZED' })
    }
    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const parsed = UpdateSchema.safeParse((req as any).body)
    if (!parsed.success) {
      return reply.status(422).send({ code: 'VALIDATION_ERROR', details: parsed.error.issues })
    }

    const { activityTypeIds, turmaIds, scheduleIds, enrollments, activityTypeId, id, ...rest } = parsed.data
    const isProfessor = user.role === 'PROFESSOR'

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Atualizar dados básicos
      const student = await tx.student.update({
        where: { id: params.id, organizationId: user.organizationId },
        data: {
          ...rest as any,
          // Sincronizar Horários (Set é seguro, ele gerencia a tabela de junção sem deletar registros de horário)
          schedules: (!isProfessor && scheduleIds) ? {
            set: scheduleIds.map(id => ({ id }))
          } : undefined
        }
      })

      // 2. Sincronizar Atividades (Se não for professor)
      if (!isProfessor && activityTypeIds) {
        const currentActivities = await tx.studentActivity.findMany({
          where: { studentId: params.id }
        })
        const toDelete = currentActivities.filter(a => !activityTypeIds.includes(a.activityTypeId))
        if (toDelete.length > 0) {
          await tx.studentActivity.deleteMany({
            where: {
              studentId: params.id,
              activityTypeId: { in: toDelete.map(a => a.activityTypeId) }
            }
          })
        }
        for (const actId of activityTypeIds) {
          await tx.studentActivity.upsert({
            where: { studentId_activityTypeId: { studentId: params.id, activityTypeId: actId } },
            create: { studentId: params.id, activityTypeId: actId, organizationId: user.organizationId },
            update: {}
          })
        }
      }

      // 3. Sincronizar Turmas (Matrículas)
      if (!isProfessor && (turmaIds || enrollments)) {
        const currentEnrollments = await tx.studentTurma.findMany({
          where: { studentId: params.id }
        })

        const nextTurmaIds = enrollments ? enrollments.map(e => e.turmaId) : (turmaIds || [])

        // Deletar matrículas que foram removidas
        const toDelete = currentEnrollments.filter(e => !nextTurmaIds.includes(e.turmaId))
        if (toDelete.length > 0) {
          await tx.studentTurma.deleteMany({
            where: {
              studentId: params.id,
              turmaId: { in: toDelete.map(e => e.turmaId) }
            }
          })
        }

        // Upsert para preservar dados existentes (ex: customMonthlyFeeCents)
        if (enrollments) {
          for (const e of enrollments) {
            await tx.studentTurma.upsert({
              where: { studentId_turmaId: { studentId: params.id, turmaId: e.turmaId } },
              create: {
                studentId: params.id,
                turmaId: e.turmaId,
                organizationId: user.organizationId,
                status: e.status || 'ACTIVE',
                startDate: e.startDate,
                endDate: e.endDate,
                customMonthlyFeeCents: e.customMonthlyFeeCents
              },
              update: {
                status: e.status || 'ACTIVE',
                startDate: e.startDate,
                endDate: e.endDate,
                customMonthlyFeeCents: e.customMonthlyFeeCents
              }
            })
          }
        } else if (turmaIds) {
          for (const tId of turmaIds) {
            await tx.studentTurma.upsert({
              where: { studentId_turmaId: { studentId: params.id, turmaId: tId } },
              create: {
                studentId: params.id,
                turmaId: tId,
                organizationId: user.organizationId,
                status: 'ACTIVE'
              },
              update: {} // Não altera nada se já existir, preservando dados extras
            })
          }
        }
      }

      return student
    })

    // Update graduation if changed in notes (Form UI)
    const gradMatch = rest.notes?.match(/Graduação: (.*)/)
    const dateMatch = rest.notes?.match(/Data Graduação: (.*)/)
    if (gradMatch && dateMatch) {
      const gradLevel = await prisma.graduationLevel.findFirst({ where: { name: gradMatch[1].trim() } })
      if (gradLevel && updated.currentGraduationId !== gradLevel.id) {
        await prisma.graduation.create({
          data: {
            organizationId: user.organizationId,
            studentId: params.id,
            newGraduationId: gradLevel.id,
            date: new Date(dateMatch[1].split('/').reverse().join('-')).toISOString().split('T')[0],
            type: 'ADJUSTMENT'
          }
        })
        await prisma.student.update({
          where: {
            id: params.id,
            organizationId: user.organizationId
          },
          data: { currentGraduationId: gradLevel.id }
        })
      }
    }

    return updated
  })

  app.delete('/students/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    await prisma.student.delete({
      where: {
        id: params.id,
        organizationId: user.organizationId
      }
    })
    return reply.status(204).send()
  })
}
