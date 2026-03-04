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
  schedule: z.string().nullable().optional(),
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
        }
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
          include: { teacher: true }
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
          include: { teacher: true }
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
      include: { teacher: true }
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
    const data = parsed.data
    const created = await prisma.turma.create({
      data: {
        organizationId: user.organizationId,
        name: data.name,
        unitId: data.unitId,
        activityTypeId: data.activityTypeId ?? null,
        teacherId: data.teacherId ?? null,
        schedule: data.schedule ?? null,
        status: data.status,
        defaultMonthlyFeeCents: data.defaultMonthlyFeeCents ?? null,
        defaultPaymentMethod: data.defaultPaymentMethod ?? null
      }
    })

    if (data.teacherId) {
      await prisma.teacherTurma.create({
        data: {
          organizationId: user.organizationId,
          teacherId: data.teacherId,
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
    const data = parsed.data
    const updated = await prisma.turma.update({
      where: {
        id: params.id,
        organizationId: user.organizationId
      },
      data: {
        name: data.name,
        unitId: data.unitId,
        activityTypeId: data.activityTypeId !== undefined ? data.activityTypeId : undefined,
        teacherId: data.teacherId !== undefined ? data.teacherId : undefined,
        schedule: data.schedule ?? null,
        status: data.status,
        defaultMonthlyFeeCents: data.defaultMonthlyFeeCents ?? null,
        defaultPaymentMethod: data.defaultPaymentMethod ?? null
      }
    })

    // Sync TeacherTurma link
    if (data.teacherId !== undefined) {
      if (data.teacherId === null) {
        // Option 1: User set teacher to none. We could remove all links.
        await prisma.teacherTurma.deleteMany({
          where: {
            turmaId: params.id,
            organizationId: user.organizationId
          }
        })
      } else {
        // Option 2: Main teacher changed. Clear old ones and set new one.
        await prisma.teacherTurma.deleteMany({
          where: {
            turmaId: params.id,
            organizationId: user.organizationId
          }
        })
        await prisma.teacherTurma.create({
          data: {
            organizationId: user.organizationId,
            teacherId: data.teacherId,
            turmaId: params.id
          }
        }).catch(() => { })
      }
    }

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
        activityType: true
      }
    })
    if (!turma) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Turma não encontrada' })
    }
    return turma
  })
}
