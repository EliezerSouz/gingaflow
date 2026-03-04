import { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma'
import { z } from 'zod'

const PromoteSchema = z.object({
  newGraduationId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  teacherId: z.string().uuid(),
  type: z.enum(['PROMOTION', 'ADJUSTMENT', 'CORRECTION']),
  notes: z.string().optional()
})

export async function registerGraduationRoutes(app: FastifyInstance) {
  app.get('/students/:id/graduations', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) return reply.status(401).send({ code: 'UNAUTHORIZED' })

    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const grads = await prisma.graduation.findMany({
      where: { studentId: params.id },
      include: { teacher: { select: { full_name: true, notes: true } } },
      orderBy: { date: 'desc' }
    })
    return { data: grads }
  })

  app.post('/students/:id/promote', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user) return reply.status(401).send({ code: 'UNAUTHORIZED' })
    
    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const body = PromoteSchema.parse((req as any).body)

    const student = await prisma.student.findUnique({ where: { id: params.id } })
    if (!student) return reply.status(404).send({ message: 'Aluno não encontrado' })

    // Validar se o aluno já tem essa graduação como atual (Evitar duplicação acidental)
    if (student.currentGraduationId === body.newGraduationId && body.type === 'PROMOTION') {
         return reply.status(400).send({ message: 'Aluno já possui esta graduação.' })
    }

    // Permissões
    if (user.role === 'PROFESSOR') {
        const linked = await prisma.studentTurma.findFirst({
            where: {
                studentId: student.id,
                turma: {
                    teacherLinks: {
                        some: { teacherId: user.relatedId }
                    }
                }
            }
        })
        // TODO: Verificar se user.relatedId é o mesmo teacherId enviado?
        // O professor pode selecionar OUTRO professor como responsável?
        // Regra: "Professor: Só pode promover alunos das suas turmas"
        // Não diz que ele deve ser o responsável. Mas faz sentido.
        
        if (!linked) {
            return reply.status(403).send({ message: 'Você só pode promover alunos das suas turmas' })
        }
    }

    // Criar Histórico
    const history = await prisma.graduation.create({
        data: {
            studentId: student.id,
            previousGraduationId: student.currentGraduationId || null,
            newGraduationId: body.newGraduationId,
            date: body.date,
            teacherId: body.teacherId,
            type: body.type,
            notes: body.notes
        }
    })

    // Atualizar Aluno (Sync Notes e currentGraduationId)
    let newNotes = student.notes || ''
    const gradLabel = `Graduação Inicial: ${body.newGraduationId}`
    
    if (newNotes.includes('Graduação Inicial:')) {
        newNotes = newNotes.replace(/Graduação Inicial: .*/, gradLabel)
    } else if (newNotes.includes('Graduação:')) {
        newNotes = newNotes.replace(/Graduação: .*/, gradLabel)
    } else {
        if (newNotes.includes('[CAPOEIRA]')) {
             newNotes = newNotes.replace('[CAPOEIRA]', `[CAPOEIRA]\n${gradLabel}`)
        } else {
             newNotes += `\n${gradLabel}`
        }
    }

    await prisma.student.update({
        where: { id: student.id },
        data: {
            currentGraduationId: body.newGraduationId,
            notes: newNotes
        }
    })

    return history
  })
}
