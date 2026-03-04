import { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

export async function registerTeacherRoutes(app: FastifyInstance) {
  app.get('/teachers', async (req) => {
    const user = (req as any).currentUser
    if (!user) throw new Error('UNAUTHORIZED')

    const teachers = await prisma.teacher.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { full_name: 'asc' },
      include: {
        teacherTurmas: {
          include: {
            turma: {
              include: {
                unit: true,
                schedules: { include: { teacher: true } }
              }
            }
          }
        },
        schedules: {
          include: {
            turma: {
              include: { unit: true, teacher: true }
            }
          }
        },
        user: true
      }
    })

    const data = teachers.map(t => {
      const unitsMap: Record<string, any> = {}

      // From legacy/access links
      t.teacherTurmas.forEach(link => {
        const uId = link.turma.unit.id
        if (!unitsMap[uId]) {
          unitsMap[uId] = { id: link.turma.unit.id, name: link.turma.unit.name, color: link.turma.unit.color, turmas: [] }
        }
        if (!unitsMap[uId].turmas.find((tt: any) => tt.id === link.turma.id)) {
          unitsMap[uId].turmas.push({
            id: link.turma.id,
            name: link.turma.name,
            schedule: link.turma.schedule,
            status: link.turma.status,
            schedules: (link.turma as any).schedules
          })
        }
      });

      // From specific schedule assignments
      (t as any).schedules?.forEach((s: any) => {
        const uId = s.turma.unit.id
        if (!unitsMap[uId]) {
          unitsMap[uId] = { id: s.turma.unit.id, name: s.turma.unit.name, color: s.turma.unit.color, turmas: [] }
        }
        let turma = unitsMap[uId].turmas.find((tt: any) => tt.id === s.turma.id)
        if (!turma) {
          turma = {
            id: s.turma.id,
            name: s.turma.name,
            schedule: s.turma.schedule,
            status: s.turma.status,
            schedules: []
          }
          unitsMap[uId].turmas.push(turma)
        }
      })

      return {
        id: t.id,
        full_name: t.full_name,
        nickname: t.nickname,
        graduation: t.graduation,
        cpf: t.cpf,
        email: t.email,
        phone: t.phone,
        status: t.status,
        notes: t.notes,
        userId: t.userId,
        linkedEmail: t.user?.email,
        units: Object.values(unitsMap)
      }
    })

    return { data }
  })

  app.get('/teachers/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) return reply.status(401).send({ code: 'UNAUTHORIZED' })

    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const teacher = await prisma.teacher.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId
      },
      include: {
        teacherTurmas: {
          include: {
            turma: {
              include: {
                unit: true,
                schedules: { include: { teacher: true } }
              }
            }
          }
        },
        schedules: {
          include: {
            turma: {
              include: { unit: true, teacher: true }
            }
          }
        },
        user: true
      }
    })

    if (!teacher) return reply.status(404).send({ code: 'NOT_FOUND' })

    const unitsMap: Record<string, any> = {}
    teacher.teacherTurmas.forEach(link => {
      const uId = link.turma.unit.id
      if (!unitsMap[uId]) {
        unitsMap[uId] = { id: link.turma.unit.id, name: link.turma.unit.name, color: link.turma.unit.color, turmas: [] }
      }
      if (!unitsMap[uId].turmas.find((tt: any) => tt.id === link.turma.id)) {
        unitsMap[uId].turmas.push({
          id: link.turma.id,
          name: link.turma.name,
          schedule: link.turma.schedule,
          status: link.turma.status,
          schedules: (link.turma as any).schedules
        })
      }
    });

    (teacher as any).schedules?.forEach((s: any) => {
      const uId = s.turma.unit.id
      if (!unitsMap[uId]) {
        unitsMap[uId] = { id: s.turma.unit.id, name: s.turma.unit.name, color: s.turma.unit.color, turmas: [] }
      }
      let turma = unitsMap[uId].turmas.find((tt: any) => tt.id === s.turma.id)
      if (!turma) {
        turma = {
          id: s.turma.id,
          name: s.turma.name,
          schedule: s.turma.schedule,
          status: s.turma.status,
          schedules: []
        }
        unitsMap[uId].turmas.push(turma)
      }
    })

    return {
      id: teacher.id,
      full_name: teacher.full_name,
      nickname: teacher.nickname,
      graduation: teacher.graduation,
      cpf: teacher.cpf,
      email: teacher.email,
      phone: teacher.phone,
      status: teacher.status,
      notes: teacher.notes,
      userId: teacher.userId,
      linkedEmail: teacher.user?.email,
      units: Object.values(unitsMap)
    }
  })

  app.post('/teachers', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') return reply.status(403).send({ code: 'FORBIDDEN' })

    const Body = z.object({
      full_name: z.string().min(1),
      nickname: z.string().nullable().optional(),
      cpf: z.string().min(1),
      email: z.string().email().nullable().optional(),
      phone: z.string().nullable().optional(),
      status: z.enum(['ATIVO', 'INATIVO']),
      graduation: z.string().nullable().optional(),
      turmaIds: z.array(z.string().uuid()).optional(),
      scheduleIds: z.array(z.string().uuid()).optional(),
      notes: z.string().nullable().optional(),
      createAccount: z.boolean().optional(),
      role: z.enum(['ADMIN', 'PROFESSOR']).optional(),
      password: z.string().min(6).optional()
    })

    const parsed = Body.parse(req.body)
    const { full_name, nickname, graduation, cpf, email, phone, status, turmaIds, scheduleIds, notes, createAccount, role, password } = parsed

    let userId: string | undefined

    if (createAccount && email && password) {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser) return reply.status(409).send({ code: 'CONFLICT', message: 'Email de conta já cadastrado' })

      const newUser = await prisma.user.create({
        data: {
          organizationId: user.organizationId,
          name: full_name,
          email,
          role: role || 'PROFESSOR',
          active: status === 'ATIVO',
          password_hash: bcrypt.hashSync(password, 10)
        }
      })
      userId = newUser.id
    }

    const teacher = await prisma.teacher.create({
      data: {
        organizationId: user.organizationId,
        full_name,
        nickname,
        graduation,
        cpf,
        email,
        phone,
        status,
        notes,
        userId,
        teacherTurmas: turmaIds ? {
          create: turmaIds.map(id => ({
            turmaId: id,
            organizationId: user.organizationId
          }))
        } : undefined
      }
    })

    // Sync Turma.teacherId for the selected turmas
    if (turmaIds && turmaIds.length > 0) {
      await prisma.turma.updateMany({
        where: { id: { in: turmaIds }, organizationId: user.organizationId },
        data: { teacherId: teacher.id }
      })
    }

    // Sync TurmaSchedule.teacherId for specific schedules
    if (scheduleIds && scheduleIds.length > 0) {
      await prisma.turmaSchedule.updateMany({
        where: { id: { in: scheduleIds }, organizationId: user.organizationId },
        data: { teacherId: teacher.id }
      })
    }

    return teacher
  })

  app.put('/teachers/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') return reply.status(403).send({ code: 'FORBIDDEN' })

    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const Body = z.object({
      full_name: z.string().min(1),
      nickname: z.string().nullable().optional(),
      cpf: z.string().min(1),
      email: z.string().email().nullable().optional(),
      phone: z.string().nullable().optional(),
      status: z.enum(['ATIVO', 'INATIVO']),
      graduation: z.string().nullable().optional(),
      turmaIds: z.array(z.string().uuid()).optional(),
      scheduleIds: z.array(z.string().uuid()).optional(),
      notes: z.string().nullable().optional(),
      createAccount: z.boolean().optional(),
      role: z.enum(['ADMIN', 'PROFESSOR']).optional(),
      password: z.string().min(6).optional()
    })

    const parsed = Body.parse(req.body)
    const { turmaIds, scheduleIds, createAccount, role, password, nickname, graduation, ...rest } = parsed

    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        id: params.id,
        organizationId: user.organizationId
      }
    })
    if (!existingTeacher) return reply.status(404).send({ code: 'NOT_FOUND' })

    let userId = existingTeacher.userId

    // Handle account creation/update
    if (createAccount && !userId && rest.email && password) {
      const existingUser = await prisma.user.findUnique({ where: { email: rest.email } })
      if (existingUser) return reply.status(409).send({ code: 'CONFLICT', message: 'Email de conta já cadastrado' })

      const newUser = await prisma.user.create({
        data: {
          organizationId: user.organizationId,
          name: rest.full_name,
          email: rest.email,
          role: 'PROFESSOR',
          active: rest.status === 'ATIVO',
          password_hash: bcrypt.hashSync(password, 10)
        }
      })
      userId = newUser.id
    } else if (userId && password) {
      // Update password of existing user
      await prisma.user.update({
        where: { id: userId, organizationId: user.organizationId },
        data: {
          password_hash: bcrypt.hashSync(password, 10),
          active: rest.status === 'ATIVO'
        }
      })
    } else if (userId) {
      // Sync active state and email
      await prisma.user.update({
        where: { id: userId, organizationId: user.organizationId },
        data: {
          active: rest.status === 'ATIVO',
          email: rest.email || undefined,
          role: role || undefined
        }
      })
    }

    if (turmaIds) {
      // 1. Unset this teacher as 'main' teacher from all turmas where they were assigned
      await prisma.turma.updateMany({
        where: {
          teacherId: params.id,
          organizationId: user.organizationId
        },
        data: { teacherId: null }
      })

      // 2. Delete existing links
      await prisma.teacherTurma.deleteMany({
        where: {
          teacherId: params.id,
          organizationId: user.organizationId
        }
      })

      // 3. Set this teacher as 'main' teacher for the selected turmas
      if (turmaIds.length > 0) {
        await prisma.turma.updateMany({
          where: { id: { in: turmaIds }, organizationId: user.organizationId },
          data: { teacherId: params.id }
        })
      }
    }

    if (scheduleIds) {
      // 1. Unset this teacher from all schedules where they were assigned
      await prisma.turmaSchedule.updateMany({
        where: { teacherId: params.id, organizationId: user.organizationId },
        data: { teacherId: null }
      })

      // 2. Set this teacher for the selected schedules
      if (scheduleIds.length > 0) {
        await prisma.turmaSchedule.updateMany({
          where: { id: { in: scheduleIds }, organizationId: user.organizationId },
          data: { teacherId: params.id }
        })
      }
    }

    const teacher = await prisma.teacher.update({
      where: {
        id: params.id,
        organizationId: user.organizationId
      },
      data: {
        ...rest,
        nickname,
        graduation,
        userId,
        teacherTurmas: turmaIds ? {
          create: turmaIds.map(id => ({
            turmaId: id,
            organizationId: user.organizationId
          }))
        } : undefined
      }
    })

    return teacher
  })

  app.delete('/teachers/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') return reply.status(403).send({ code: 'FORBIDDEN' })

    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    await prisma.teacher.delete({
      where: {
        id: params.id,
        organizationId: user.organizationId
      }
    })
    return reply.status(204).send()
  })
}

