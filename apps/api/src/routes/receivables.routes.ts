import { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma'
import { z } from 'zod'

const ListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['PAID', 'OPEN', 'OVERDUE', 'PARTIAL', 'NEGOTIATED', 'CANCELLED']).optional(),
  student_id: z.string().uuid().optional()
})

const ReceivableSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  student_id: z.string().uuid(),
  turma_id: z.string().uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  original_value: z.number(),
  discount: z.number().default(0),
  interest: z.number().default(0),
  fine: z.number().default(0),
  final_value: z.number(),
  paid_value: z.number().default(0),
  balance: z.number(),
  due_date: z.string(),
  promise_date: z.string().optional().nullable(),
  status: z.enum(['PAID', 'OPEN', 'OVERDUE', 'PARTIAL', 'NEGOTIATED', 'CANCELLED']),
})

const PaymentSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  receivable_id: z.string().uuid(),
  amount: z.number(),
  method: z.string(),
  paid_at: z.string(),
  notes: z.string().optional().nullable(),
  created_by: z.string().optional().nullable()
})

const HistorySchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  receivable_id: z.string().uuid(),
  action: z.string(),
  old_value: z.string().optional().nullable(),
  new_value: z.string().optional().nullable(),
  created_by: z.string().optional().nullable()
})

export async function registerReceivableRoutes(app: FastifyInstance) {
  // GET /receivables
  app.get('/receivables', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    const query = ListQuery.parse((req as any).query)
    const where: any = { organizationId: user.organizationId }
    if (query.status) where.status = query.status
    if (query.student_id) where.studentId = query.student_id

    const [items, total] = await Promise.all([
      prisma.receivable.findMany({
        where,
        include: {
          student: { select: { id: true, full_name: true, cpf: true, status: true } },
          payments: true,
          history: true
        },
        orderBy: [{ dueDate: 'desc' }],
        skip: (query.page - 1) * query.per_page,
        take: query.per_page
      }),
      prisma.receivable.count({ where })
    ])

    return {
      data: items.map(m => ({...m, 
          organization_id: m.organizationId, student_id: m.studentId, turma_id: m.turmaId,
          original_value: m.originalValue, final_value: m.finalValue, 
          paid_value: m.paidValue, due_date: m.dueDate, promise_date: m.promiseDate
      })),
      meta: { page: query.page, per_page: query.per_page, total, page_count: Math.ceil(total / query.per_page) }
    }
  })

  // GET /receivables/:id
  app.get('/receivables/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') return reply.status(403).send({ code: 'FORBIDDEN' })

    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const item = await prisma.receivable.findFirst({
      where: { id: params.id, organizationId: user.organizationId },
      include: { student: true, payments: true, history: true }
    })
    if (!item) return reply.status(404).send({ code: 'NOT_FOUND' })
    return {
        ...item, organization_id: item.organizationId, student_id: item.studentId, turma_id: item.turmaId,
        original_value: item.originalValue, final_value: item.finalValue, 
        paid_value: item.paidValue, due_date: item.dueDate, promise_date: item.promiseDate
    }
  })

  // POST /receivables
  app.post('/receivables', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') return reply.status(403).send({ code: 'FORBIDDEN' })

    const parsed = ReceivableSchema.safeParse((req as any).body)
    if (!parsed.success) return reply.status(422).send({ code: 'VALIDATION_ERROR', details: parsed.error.issues })

    const p = parsed.data
    const created = await prisma.receivable.create({
      data: {
        id: p.id,
        organizationId: user.organizationId,
        studentId: p.student_id,
        turmaId: p.turma_id ?? null,
        description: p.description ?? null,
        period: p.period,
        originalValue: p.original_value,
        discount: p.discount,
        interest: p.interest,
        fine: p.fine,
        finalValue: p.final_value,
        paidValue: p.paid_value,
        balance: p.balance,
        dueDate: p.due_date,
        promiseDate: p.promise_date ?? null,
        status: p.status,
      }
    })
    return created
  })

  // PUT /receivables/:id
  app.put('/receivables/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') return reply.status(403).send({ code: 'FORBIDDEN' })

    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const parsed = ReceivableSchema.safeParse((req as any).body)
    if (!parsed.success) return reply.status(422).send({ code: 'VALIDATION_ERROR', details: parsed.error.issues })

    const p = parsed.data
    const updated = await prisma.receivable.update({
      where: { id: params.id, organizationId: user.organizationId },
      data: {
        studentId: p.student_id,
        turmaId: p.turma_id ?? null,
        description: p.description ?? null,
        period: p.period,
        originalValue: p.original_value,
        discount: p.discount,
        interest: p.interest,
        fine: p.fine,
        finalValue: p.final_value,
        paidValue: p.paid_value,
        balance: p.balance,
        dueDate: p.due_date,
        promiseDate: p.promise_date ?? null,
        status: p.status,
      }
    })
    return updated
  })

  // DELETE /receivables/:id
  app.delete('/receivables/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') return reply.status(403).send({ code: 'FORBIDDEN' })
    const { id } = z.object({ id: z.string().uuid() }).parse((req as any).params)
    await prisma.receivable.delete({ where: { id, organizationId: user.organizationId } })
    return { ok: true }
  })

  // POST /receivables/payments (ReceivablePayment)
  app.post('/receivables/payments', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') return reply.status(403).send({ code: 'FORBIDDEN' })

    const parsed = PaymentSchema.safeParse((req as any).body)
    if (!parsed.success) return reply.status(422).send({ code: 'VALIDATION_ERROR', details: parsed.error.issues })

    const p = parsed.data
    const created = await prisma.receivablePayment.create({
      data: {
        id: p.id,
        organizationId: user.organizationId,
        receivableId: p.receivable_id,
        amount: p.amount,
        method: p.method,
        paidAt: p.paid_at,
        notes: p.notes ?? null,
        createdBy: p.created_by ?? null
      }
    })
    return created
  })

  // DELETE /receivables/payments/:id
  app.delete('/receivables/payments/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') return reply.status(403).send({ code: 'FORBIDDEN' })
    const { id } = z.object({ id: z.string().uuid() }).parse((req as any).params)
    await prisma.receivablePayment.delete({ where: { id, organizationId: user.organizationId } })
    return { ok: true }
  })
  
  // POST /receivables/history (ReceivableHistory)
  app.post('/receivables/history', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') return reply.status(403).send({ code: 'FORBIDDEN' })

    const parsed = HistorySchema.safeParse((req as any).body)
    if (!parsed.success) return reply.status(422).send({ code: 'VALIDATION_ERROR', details: parsed.error.issues })

    const p = parsed.data
    const created = await prisma.receivableHistory.create({
      data: {
        id: p.id,
        organizationId: user.organizationId,
        receivableId: p.receivable_id,
        action: p.action,
        oldValue: p.old_value ?? null,
        newValue: p.new_value ?? null,
        createdBy: p.created_by ?? null
      }
    })
    return created
  })

  app.post('/receivables/generate', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    // Simplistic generation for desktop backward compatibility
    return { generated_count: 0 }
  })
}
