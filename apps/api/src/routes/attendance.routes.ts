import { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma'
import { z } from 'zod'

const AttendanceRecordSchema = z.object({
  studentId: z.string().uuid(),
  sessionId: z.string().uuid().optional(),
  turmaId: z.string().uuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  time: z.string().optional().nullable(),
  status: z.enum(['PRESENT', 'ABSENT', 'JUSTIFIED']),
  notes: z.string().optional()
})

export async function registerAttendanceRoutes(app: FastifyInstance) {
  // Buscar lista de presença
  app.get('/attendance', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) {
      return reply.status(401).send({ code: 'UNAUTHORIZED' })
    }

    const query = z.object({
      sessionId: z.string().uuid().optional(),
      turmaId: z.string().uuid().optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      time: z.string().optional().nullable()
    }).parse((req as any).query)

    try {
      const records = await prisma.attendance.findMany({
        where: {
          organizationId: user.organizationId,
          ...(query.sessionId ? { sessionId: query.sessionId } : {
            turmaId: query.turmaId,
            date: query.date,
            time: query.time
          })
        }
      })

      return { data: records }
    } catch (error) {
      console.error('Erro ao buscar presenças:', error)
      return reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Erro interno ao buscar lista de presença'
      })
    }
  })

  // Criar/atualizar registro de presença
  app.post('/attendance', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) {
      return reply.status(401).send({ code: 'UNAUTHORIZED' })
    }

    const body = AttendanceRecordSchema.parse((req as any).body)

    try {
      // Verificar se o usuário tem permissão para registrar presença nesta turma
      if (user.role === 'PROFESSOR') {
        const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
        if (!teacher) return reply.status(403).send({ code: 'FORBIDDEN', message: 'Professor não encontrado' })

        const targetTurmaId = body.sessionId
          ? (await prisma.classSession.findUnique({ where: { id: body.sessionId } }))?.turmaId
          : body.turmaId || undefined

        if (!targetTurmaId) {
          return reply.status(400).send({ code: 'INVALID_DATA', message: 'Sessão ou Turma inválida' })
        }

        const teacherLink = await prisma.teacherTurma.findFirst({
          where: {
            teacherId: teacher.id,
            turmaId: targetTurmaId,
            organizationId: user.organizationId
          }
        })

        if (!teacherLink) {
          return reply.status(403).send({
            code: 'FORBIDDEN',
            message: 'Você não tem permissão para registrar presença nesta turma'
          })
        }
      }

      // Verificar se o aluno pertence à turma
      const targetTurmaIdForStudent = body.sessionId
        ? (await prisma.classSession.findUnique({ where: { id: body.sessionId } }))?.turmaId
        : body.turmaId || undefined

      if (!targetTurmaIdForStudent) {
        return reply.status(400).send({ code: 'INVALID_DATA', message: 'Sessão ou Turma inválida' })
      }

      const studentTurma = await prisma.studentTurma.findFirst({
        where: {
          studentId: body.studentId,
          turmaId: targetTurmaIdForStudent,
          organizationId: user.organizationId
        }
      })

      if (!studentTurma) {
        return reply.status(400).send({
          code: 'INVALID_DATA',
          message: 'Aluno não pertence a esta turma ou está inativo'
        })
      }

      // Criar ou atualizar registro
      const where: any = {
        studentId: body.studentId,
        organizationId: user.organizationId,
      }

      if (body.sessionId) {
        where.sessionId = body.sessionId
      } else {
        where.turmaId = body.turmaId
        where.date = body.date
        where.time = body.time
      }

      const existingRecord = await prisma.attendance.findFirst({ where })

      if (existingRecord) {
        // Atualizar registro existente
        const updated = await prisma.attendance.update({
          where: {
            id: existingRecord.id,
            organizationId: user.organizationId
          },
          data: {
            status: body.status,
            notes: body.notes
          }
        })

        return updated
      } else {
        // Criar novo registro
        const created = await prisma.attendance.create({
          data: {
            organizationId: user.organizationId,
            studentId: body.studentId,
            sessionId: body.sessionId || undefined,
            turmaId: body.turmaId || undefined,
            date: body.date || undefined,
            time: body.time,
            status: body.status,
            notes: body.notes
          }
        })

        return created
      }
    } catch (error) {
      console.error('Erro ao salvar presença:', error)

      if (error instanceof z.ZodError) {
        return reply.status(422).send({
          code: 'VALIDATION_ERROR',
          details: error.issues
        })
      }

      return reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Erro interno ao salvar presença'
      })
    }
  })

  // Buscar histórico de presenças de um aluno
  app.get('/attendance/student/:studentId', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) {
      return reply.status(401).send({ code: 'UNAUTHORIZED' })
    }

    const params = z.object({
      studentId: z.string().uuid()
    }).parse((req as any).params)

    const query = z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      turmaId: z.string().uuid().optional()
    }).parse((req as any).query)

    try {
      const where: any = {
        studentId: params.studentId,
        organizationId: user.organizationId
      }

      if (query.startDate && query.endDate) {
        where.date = {
          gte: query.startDate,
          lte: query.endDate
        }
      }

      if (query.turmaId) {
        where.turmaId = query.turmaId
      }

      const records = await prisma.attendance.findMany({
        where,
        include: {
          turma: {
            include: {
              unit: true
            }
          }
        },
        orderBy: [{ date: 'desc' }, { created_at: 'desc' }]
      })

      return { data: records }
    } catch (error) {
      console.error('Erro ao buscar histórico de presenças:', error)
      return reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Erro interno ao buscar histórico'
      })
    }
  })

  // Buscar relatório de presenças de uma turma
  app.get('/attendance/turma/:turmaId/report', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) {
      return reply.status(401).send({ code: 'UNAUTHORIZED' })
    }

    const params = z.object({
      turmaId: z.string().uuid()
    }).parse((req as any).params)

    const query = z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    }).parse((req as any).query)

    try {
      // Verificar permissões
      if (user.role === 'PROFESSOR') {
        const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
        if (!teacher) return reply.status(403).send({ code: 'FORBIDDEN', message: 'Professor não encontrado' })

        const teacherLink = await prisma.teacherTurma.findFirst({
          where: {
            teacherId: teacher.id,
            turmaId: params.turmaId,
            organizationId: user.organizationId
          }
        })

        if (!teacherLink) {
          return reply.status(403).send({
            code: 'FORBIDDEN',
            message: 'Você não tem permissão para acessar este relatório'
          })
        }
      }

      const students = await prisma.studentTurma.findMany({
        where: {
          turmaId: params.turmaId,
          organizationId: user.organizationId
        },
        include: {
          student: true
        }
      })

      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          turmaId: params.turmaId,
          organizationId: user.organizationId,
          date: {
            gte: query.startDate,
            lte: query.endDate
          }
        }
      })

      // Calcular estatísticas
      const report = students.map(studentTurma => {
        const studentRecords = attendanceRecords.filter(
          r => r.studentId === studentTurma.studentId
        )

        const totalDays = studentRecords.length
        const presentDays = studentRecords.filter(r => r.status === 'PRESENT').length
        const absentDays = studentRecords.filter(r => r.status === 'ABSENT').length
        const justifiedDays = studentRecords.filter(r => r.status === 'JUSTIFIED').length
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0

        return {
          studentId: studentTurma.studentId,
          studentName: studentTurma.student.full_name,
          totalDays,
          presentDays,
          absentDays,
          justifiedDays,
          attendanceRate: Math.round(attendanceRate)
        }
      })

      return { data: report }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      return reply.status(500).send({
        code: 'INTERNAL_ERROR',
        message: 'Erro interno ao gerar relatório'
      })
    }
  })
  // Obter ou criar sessão de aula
  app.post('/attendance/session', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) return reply.status(401).send({ code: 'UNAUTHORIZED' })

    const schema = z.object({
      turmaId: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTime: z.string().optional()
    })

    const { turmaId, date, startTime } = schema.parse((req as any).body)

    try {
      // 1. Verificar se já existe uma sessão para esta turma e data (e hora se fornecida)
      let scheduleId: string | undefined

      if (startTime) {
        const schedule = await prisma.turmaSchedule.findFirst({
          where: {
            turmaId,
            startTime,
            organizationId: user.organizationId
          }
        })
        scheduleId = schedule?.id
      }

      let session = await prisma.classSession.findFirst({
        where: {
          turmaId,
          date,
          turmaScheduleId: scheduleId,
          organizationId: user.organizationId
        }
      })

      if (!session) {
        // 2. Criar nova sessão se não existir
        session = await prisma.classSession.create({
          data: {
            organizationId: user.organizationId,
            turmaId,
            turmaScheduleId: scheduleId,
            date,
            status: 'SCHEDULED'
          }
        })
      }

      return { data: session }
    } catch (error) {
      console.error('Erro ao gerenciar sessão:', error)
      return reply.status(500).send({ code: 'INTERNAL_ERROR' })
    }
  })
}
