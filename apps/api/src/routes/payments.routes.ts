import { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma'
import { PaymentSchema } from '@gingaflow/shared'
import { z } from 'zod'

const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['PAGO', 'EM_ABERTO', 'ATRASADO']).optional(),
  student_id: z.string().uuid().optional()
})

function toCents(v: string) {
  const n = Number(v)
  return Math.round(n * 100)
}

export async function registerPaymentRoutes(app: FastifyInstance) {
  // GET /payments - Listar pagamentos
  app.get('/payments', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    const query = ListQuery.parse((req as any).query)
    const where: any = {}
    if (query.status) where.status = query.status
    if (query.student_id) where.studentId = query.student_id

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              full_name: true,
              cpf: true,
              status: true
            }
          }
        },
        orderBy: [{ period: 'desc' }],
        skip: (query.page - 1) * query.per_page,
        take: query.per_page
      }),
      prisma.payment.count({ where })
    ])

    return {
      data: items,
      meta: { page: query.page, per_page: query.per_page, total, page_count: Math.ceil(total / query.per_page) }
    }
  })

  // GET /payments/:id - Buscar pagamento individual
  app.get('/payments/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }

    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        student: {
          select: {
            id: true,
            full_name: true,
            cpf: true,
            status: true
          }
        }
      }
    })

    if (!payment) {
      return reply.status(404).send({ code: 'NOT_FOUND', message: 'Pagamento não encontrado' })
    }

    return payment
  })

  // POST /payments - Criar pagamento
  app.post('/payments', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    const parsed = PaymentSchema.safeParse((req as any).body)
    if (!parsed.success) {
      return reply.status(422).send({ code: 'VALIDATION_ERROR', details: parsed.error.issues })
    }
    const p = parsed.data
    const status =
      p.status ??
      (p.paid_at ? 'PAGO' : new Date().getDate() > p.due_day ? 'ATRASADO' : 'EM_ABERTO')
    try {
      const created = await prisma.payment.create({
        data: {
          id: p.id,
          studentId: p.student_id!,
          monthlyFeeCents: toCents(p.monthly_fee),
          dueDay: p.due_day,
          period: p.period,
          status,
          paidAt: p.paid_at ? new Date(p.paid_at) : null,
          method: p.method ?? null,
          notes: p.notes ?? null
        }
      })
      return created
    } catch (e: any) {
      if (e.code === 'P2002') {
        return reply.status(409).send({ code: 'CONFLICT', message: 'Pagamento já registrado para esse período' })
      }
      throw e
    }
  })

  // PUT /payments/:id - Atualizar pagamento
  app.put('/payments/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }

    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const parsed = PaymentSchema.partial().safeParse((req as any).body)

    if (!parsed.success) {
      return reply.status(422).send({ code: 'VALIDATION_ERROR', details: parsed.error.issues })
    }

    const p = parsed.data
    const updateData: any = {}

    if (p.monthly_fee !== undefined) updateData.monthlyFeeCents = toCents(p.monthly_fee)
    if (p.due_day !== undefined) updateData.dueDay = p.due_day
    if (p.period !== undefined) updateData.period = p.period
    if (p.status !== undefined) updateData.status = p.status
    if (p.paid_at !== undefined) updateData.paidAt = p.paid_at ? new Date(p.paid_at) : null
    if (p.method !== undefined) updateData.method = p.method
    if (p.notes !== undefined) updateData.notes = p.notes

    try {
      const updated = await prisma.payment.update({
        where: { id: params.id },
        data: updateData
      })
      return updated
    } catch (e: any) {
      if (e.code === 'P2025') {
        return reply.status(404).send({ code: 'NOT_FOUND', message: 'Pagamento não encontrado' })
      }
      throw e
    }
  })

  // DELETE /payments/:id - Deletar pagamento
  app.delete('/payments/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }

    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)

    try {
      await prisma.payment.delete({
        where: { id: params.id }
      })
      return reply.status(204).send()
    } catch (e: any) {
      if (e.code === 'P2025') {
        return reply.status(404).send({ code: 'NOT_FOUND', message: 'Pagamento não encontrado' })
      }
      throw e
    }
  })
}
