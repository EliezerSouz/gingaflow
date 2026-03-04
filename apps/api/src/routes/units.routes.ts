import { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma'
import { z } from 'zod'

const UnitBody = z.object({
  name: z.string().min(1),
  address: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  defaultMonthlyFeeCents: z.number().int().nullable().optional(),
  defaultPaymentMethod: z.string().nullable().optional(),
  status: z.enum(['ATIVA', 'INATIVA'])
})

const TurmaBody = z.object({
  name: z.string().min(1),
  unitId: z.string().uuid(),
  activityTypeId: z.string().uuid().nullable().optional(),
  teacherId: z.string().uuid().nullable().optional(),
  capacity: z.number().int().min(0).optional(),
  durationMinutes: z.number().int().min(1).optional(),
  schedules: z.array(z.object({
    dayOfWeek: z.enum(['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    teacherId: z.string().uuid().nullable().optional()
  })).optional(),
  schedule: z.string().nullable().optional(), // Deprecated
  defaultMonthlyFeeCents: z.number().int().nullable().optional(),
  defaultPaymentMethod: z.string().nullable().optional(),
  status: z.enum(['ATIVA', 'INATIVA'])
})

export async function registerUnitRoutes(app: FastifyInstance) {
  app.get('/units', async (req) => {
    const user = (req as any).currentUser
    if (!user) {
      throw new Error('UNAUTHORIZED')
    }
    const where: any = { organizationId: user.organizationId }
    let teacherId: string | undefined

    if (user.role === 'PROFESSOR') {
      const teacher = await prisma.teacher.findFirst({
        where: {
          userId: user.id,
          organizationId: user.organizationId
        },
      })
      if (teacher) {
        teacherId = teacher.id
        where.turmas = {
          some: {
            OR: [
              { teacherId: teacherId },
              { teacherLinks: { some: { teacherId: teacherId } } }
            ]
          }
        }
      }
    }

    const items = await prisma.unit.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        turmas: {
          where: teacherId ? {
            OR: [
              { teacherId: teacherId },
              { teacherLinks: { some: { teacherId: teacherId } } }
            ]
          } : undefined,
          orderBy: { name: 'asc' },
          include: {
            teacher: true,
            schedules: true
          }
        }
      }
    })
    return { data: items }
  })

  app.post('/units', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    const parsed = UnitBody.safeParse((req as any).body)
    if (!parsed.success) {
      return reply.status(422).send({ code: 'VALIDATION_ERROR', details: parsed.error.issues })
    }
    const created = await prisma.unit.create({
      data: {
        organizationId: user.organizationId,
        name: parsed.data.name,
        address: parsed.data.address ?? null,
        color: parsed.data.color ?? null,
        status: parsed.data.status,
        defaultMonthlyFeeCents: parsed.data.defaultMonthlyFeeCents ?? null,
        defaultPaymentMethod: parsed.data.defaultPaymentMethod ?? null
      }
    })
    return created
  })

  app.put('/units/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const parsed = UnitBody.partial().safeParse((req as any).body)
    if (!parsed.success) {
      return reply.status(422).send({ code: 'VALIDATION_ERROR', details: parsed.error.issues })
    }
    const updated = await prisma.unit.update({
      where: {
        id: params.id,
        organizationId: user.organizationId
      },
      data: {
        name: parsed.data.name,
        address: parsed.data.address ?? null,
        color: parsed.data.color ?? null,
        status: parsed.data.status,
        defaultMonthlyFeeCents: parsed.data.defaultMonthlyFeeCents ?? null,
        defaultPaymentMethod: parsed.data.defaultPaymentMethod ?? null
      }
    })
    return updated
  })

  app.get('/units/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) {
      return reply.status(401).send({ code: 'UNAUTHORIZED' })
    }
    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const unit = await prisma.unit.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId
      },
      include: {
        turmas: {
          orderBy: { name: 'asc' },
          include: {
            teacher: true,
            schedules: true
          }
        }
      }
    })
    if (!unit) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Unidade não encontrada' })
    }
    return unit
  })

  app.get('/units/:unit_id/turmas', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) {
      return reply.status(401).send({ code: 'UNAUTHORIZED' })
    }
    const params = z.object({ unit_id: z.string().uuid() }).parse((req as any).params)
    const items = await prisma.turma.findMany({
      where: {
        unitId: params.unit_id,
        organizationId: user.organizationId
      },
      orderBy: { name: 'asc' },
      include: {
        teacher: true,
        schedules: {
          include: { teacher: true },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        },
        _count: {
          select: { studentLinks: true }
        }
      }
    })
    return { data: items }
  })

  app.post('/turmas', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    const parsed = TurmaBody.safeParse((req as any).body)
    if (!parsed.success) {
      return reply.status(422).send({ code: 'VALIDATION_ERROR', details: parsed.error.issues })
    }
    const { schedules, ...rest } = parsed.data
    const created = await prisma.turma.create({
      data: {
        organizationId: user.organizationId,
        name: rest.name,
        unitId: rest.unitId,
        activityTypeId: rest.activityTypeId ?? null,
        teacherId: rest.teacherId ?? null,
        schedule: rest.schedule ?? null,
        capacity: rest.capacity ?? 0,
        durationMinutes: rest.durationMinutes ?? 60,
        status: rest.status,
        defaultMonthlyFeeCents: rest.defaultMonthlyFeeCents ?? null,
        defaultPaymentMethod: rest.defaultPaymentMethod ?? null,
        schedules: schedules ? {
          create: schedules.map(s => ({
            organizationId: user.organizationId,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            teacherId: s.teacherId
          }))
        } : undefined
      } as any
    })

    if (rest.teacherId) {
      await prisma.teacherTurma.create({
        data: {
          organizationId: user.organizationId,
          teacherId: rest.teacherId,
          turmaId: created.id
        }
      }).catch(() => { }) // Ignore if already exists (unlikely in POST)
    }

    return created
  })

  app.put('/turmas/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const parsed = TurmaBody.partial().safeParse((req as any).body)
    if (!parsed.success) {
      return reply.status(422).send({ code: 'VALIDATION_ERROR', details: parsed.error.issues })
    }
    const { schedules: newSchedules, ...rest } = parsed.data

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Atualizar dados básicos da turma
      const turma = await tx.turma.update({
        where: { id: params.id, organizationId: user.organizationId },
        data: {
          name: rest.name,
          unitId: rest.unitId,
          activityTypeId: rest.activityTypeId !== undefined ? rest.activityTypeId : undefined,
          teacherId: rest.teacherId !== undefined ? rest.teacherId : undefined,
          schedule: rest.schedule ?? undefined,
          capacity: rest.capacity ?? undefined,
          durationMinutes: rest.durationMinutes !== undefined ? rest.durationMinutes : undefined,
          status: rest.status,
          defaultMonthlyFeeCents: rest.defaultMonthlyFeeCents ?? undefined,
          defaultPaymentMethod: rest.defaultPaymentMethod ?? undefined,
        } as any
      })

      // 2. Sincronizar Horários se fornecidos
      if (newSchedules) {
        const currentSchedules = await tx.turmaSchedule.findMany({
          where: { turmaId: params.id }
        })

        // Identificar horários para deletar (aqueles que não estão no novo payload)
        const toDelete = currentSchedules.filter(curr =>
          !newSchedules.find(next => next.dayOfWeek === curr.dayOfWeek && next.startTime === curr.startTime)
        )

        if (toDelete.length > 0) {
          await tx.turmaSchedule.deleteMany({
            where: { id: { in: toDelete.map(d => d.id) } }
          })
        }

        // Criar ou Atualizar os novos horários
        for (const s of newSchedules) {
          await tx.turmaSchedule.upsert({
            where: {
              turmaId_dayOfWeek_startTime: {
                turmaId: params.id,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime
              }
            },
            create: {
              organizationId: user.organizationId,
              turmaId: params.id,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              teacherId: s.teacherId
            },
            update: {
              teacherId: s.teacherId
            }
          })
        }
      }

      // 3. Sincronizar Professor principal (TeacherTurma)
      if (rest.teacherId !== undefined) {
        await tx.teacherTurma.deleteMany({
          where: { turmaId: params.id, organizationId: user.organizationId }
        })
        if (rest.teacherId !== null) {
          await tx.teacherTurma.create({
            data: {
              organizationId: user.organizationId,
              teacherId: rest.teacherId,
              turmaId: params.id
            }
          }).catch(() => { })
        }
      }

      return tx.turma.findUnique({
        where: { id: params.id },
        include: { schedules: true }
      })
    })

    return updated
  })

  app.get('/turmas/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) {
      return reply.status(401).send({ code: 'UNAUTHORIZED' })
    }
    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const turma = await prisma.turma.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId
      },
      include: {
        unit: true,
        teacher: true,
        activityType: true,
        schedules: {
          include: { teacher: true }
        }
      }
    })
    if (!turma) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Turma não encontrada' })
    }
    return turma
  })
}
