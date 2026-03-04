import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import bcrypt from 'bcryptjs'
import { LoginInputSchema, UserSchema } from '@gingaflow/shared'
import { z } from 'zod'
import { prisma } from './database/prisma'
import { registerStudentRoutes } from './routes/students.routes'
import { registerPaymentRoutes } from './routes/payments.routes'
import { registerGraduationRoutes } from './routes/graduations.routes'
import { registerUnitRoutes } from './routes/units.routes'
import { registerTeacherRoutes } from './routes/teachers.routes'
import { registerAttendanceRoutes } from './routes/attendance.routes'
import { registerReportsRoutes } from './routes/reports.routes'
import { registerActivityTypesRoutes } from './routes/activityTypes.routes'

const server = Fastify({ logger: true })

// Trigger reload
await server.register(cors, { origin: true })

// Validar JWT_SECRET obrigatório
if (!process.env.JWT_SECRET) {
  server.log.fatal('JWT_SECRET não definido')
  throw new Error('JWT_SECRET é obrigatório. Defina em .env')
}

await server.register(jwt, {
  secret: process.env.JWT_SECRET
})

// Error Handler Global - Evita vazamento de stack trace
server.setErrorHandler((error, request, reply) => {
  server.log.error({
    err: error,
    url: request.url,
    method: request.method,
    user: (request as any).currentUser?.id
  })

  // Não expor detalhes técnicos em produção
  if (process.env.NODE_ENV === 'production') {
    reply.status(500).send({
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor. Por favor, tente novamente.'
    })
  } else {
    // Erro detalhado em desenvolvimento
    reply.status(500).send({
      code: 'INTERNAL_ERROR',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    })
  }
})

server.get('/health', async () => ({ status: 'ok' }))

async function ensureUsers() {
  let org = await prisma.organization.findFirst()
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'GingaFlow Matriz',
        plan: 'ADMIN'
      }
    })
    server.log.info('seeded-default-org')
  }

  const specificUser = await prisma.user.findUnique({
    where: { email: 'admin@gingaflow.local' }
  })

  if (!specificUser) {
    const passwordHash = bcrypt.hashSync('admin123', 10)
    await prisma.user.create({
      data: {
        organizationId: org.id,
        name: 'Admin',
        email: 'admin@gingaflow.local',
        role: 'ADMIN',
        active: true,
        password_hash: passwordHash
      }
    })
    server.log.info('seeded-default-admin')
  }
}

async function ensureSettings() {
  const org = await prisma.organization.findFirst()
  if (!org) return

  const settings = await prisma.appSettings.findFirst({
    where: { organizationId: org.id }
  })
  if (!settings) {
    await prisma.appSettings.create({
      data: {
        organizationId: org.id,
        groupName: 'Grupo de Capoeira',
        themeColor: 'blue',
        defaultMonthlyFee: 0,
        defaultPaymentMethod: 'PIX'
      }
    })
    server.log.info('seeded-default-settings')
  }
}

async function ensureActivityTypes() {
  const org = await prisma.organization.findFirst()
  if (!org) return

  let capoeira = await prisma.activityType.findUnique({
    where: {
      organizationId_name: {
        organizationId: org.id,
        name: 'Capoeira'
      }
    }
  })

  if (!capoeira) {
    await prisma.activityType.create({
      data: {
        organizationId: org.id,
        name: 'Capoeira',
        usaGraduacao: true
      }
    })
    server.log.info('seeded-capoeira')
  }
}

// Run seeds
await ensureUsers()
await ensureSettings()
await ensureActivityTypes()

server.post('/auth/login', async (req, reply) => {
  const parsed = LoginInputSchema.safeParse(req.body)
  if (!parsed.success) {
    return reply.status(422).send({
      code: 'VALIDATION_ERROR',
      message: 'Erros de validação',
      details: parsed.error.issues.map(i => ({ field: i.path.join('.'), error: i.message }))
    })
  }
  const payload = parsed.data

  const user = await prisma.user.findUnique({
    where: { email: payload.email }
  })

  if (!user) {
    server.log.warn({ email: payload.email }, 'login-failed-user-not-found')
    return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Credenciais inválidas' })
  }

  if (user.active === false) {
    server.log.warn({ email: payload.email }, 'login-failed-user-inactive')
    return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Usuário inativo' })
  }

  const ok = bcrypt.compareSync(payload.password, user.password_hash)
  if (!ok) {
    server.log.warn({ email: payload.email }, 'login-failed-password-mismatch')
    return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Credenciais inválidas' })
  }

  const token = await reply.jwtSign({
    sub: user.id,
    role: user.role,
    orgId: user.organizationId
  })

  const safeUser = UserSchema.parse({
    id: user.id,
    organizationId: user.organizationId,
    name: user.name,
    email: user.email,
    role: user.role as 'ADMIN' | 'PROFESSOR',
    relatedId: user.relatedId || undefined
  })

  return { token, user: safeUser }
})

server.addHook('onRequest', async (req, reply) => {
  if (req.url === '/health' || req.url === '/auth/login') {
    return
  }
  try {
    await req.jwtVerify()
  } catch {
    return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Token inválido' })
  }

  const userId = (req.user as any).sub
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    return reply.status(404).send({ code: 'NOT_FOUND', message: 'Usuário não encontrado' })
  }
  ; (req as any).currentUser = user
})

server.get('/me', async (req, reply) => {
  const user = (req as any).currentUser
  if (!user) {
    return reply.status(401).send({ code: 'UNAUTHORIZED', message: 'Usuário não autenticado' })
  }
  const safeUser = UserSchema.parse({
    id: user.id,
    organizationId: user.organizationId,
    name: user.name,
    email: user.email,
    role: user.role as 'ADMIN' | 'PROFESSOR',
    relatedId: user.relatedId || undefined
  })
  return safeUser
})

server.post('/users', async (req, reply) => {
  const currentUser = (req as any).currentUser
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return reply.status(403).send({ code: 'FORBIDDEN', message: 'Apenas administradores podem criar usuários' })
  }

  const BodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'PROFESSOR']),
    active: z.boolean().optional(),
    relatedId: z.string().optional()
  })

  try {
    const body = BodySchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return reply.status(409).send({ code: 'CONFLICT', message: 'Email já cadastrado' })
    }

    const newUser = await prisma.user.create({
      data: {
        organizationId: currentUser.organizationId,
        name: body.name,
        email: body.email,
        role: body.role,
        active: body.active ?? true,
        password_hash: bcrypt.hashSync(body.password, 10),
        relatedId: body.relatedId
      }
    })

    return { id: newUser.id }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return reply.status(422).send({ code: 'VALIDATION_ERROR', details: err.issues })
    }
    throw err
  }
})

server.get('/users', async (req, reply) => {
  const currentUser = (req as any).currentUser
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return reply.status(403).send({ code: 'FORBIDDEN' })
  }
  const users = await prisma.user.findMany({
    where: { organizationId: currentUser.organizationId }
  })
  return users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    relatedId: u.relatedId
  }))
})

server.put('/users/:id', async (req, reply) => {
  const currentUser = (req as any).currentUser
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return reply.status(403).send({ code: 'FORBIDDEN' })
  }
  const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
  const BodySchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['ADMIN', 'PROFESSOR']).optional(),
    active: z.boolean().optional()
  })

  const body = BodySchema.parse(req.body)

  const updateData: any = {}
  if (body.name) updateData.name = body.name
  if (body.email) updateData.email = body.email
  if (body.role) updateData.role = body.role
  if (body.active !== undefined) updateData.active = body.active
  if (body.password) updateData.password_hash = bcrypt.hashSync(body.password, 10)

  try {
    const updated = await prisma.user.update({
      where: {
        id: params.id,
        organizationId: currentUser.organizationId
      },
      data: updateData
    })
    return { id: updated.id }
  } catch (e: any) {
    if (e.code === 'P2025') return reply.status(404).send({ code: 'NOT_FOUND' })
    throw e
  }
})

server.delete('/users/:id', async (req, reply) => {
  const currentUser = (req as any).currentUser
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return reply.status(403).send({ code: 'FORBIDDEN' })
  }
  const params = z.object({ id: z.string().uuid() }).parse((req as any).params)

  try {
    await prisma.user.delete({
      where: {
        id: params.id,
        organizationId: currentUser.organizationId
      }
    })
    return reply.status(204).send()
  } catch (e: any) {
    if (e.code === 'P2025') return reply.status(404).send({ code: 'NOT_FOUND' })
    throw e
  }
})

server.get('/settings', async (req, reply) => {
  const currentUser = (req as any).currentUser
  if (!currentUser) return reply.status(401).send({ code: 'UNAUTHORIZED' })

  // Ensure settings exist first
  let settings = await prisma.appSettings.findUnique({
    where: { organizationId: currentUser.organizationId }
  })
  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        organizationId: currentUser.organizationId,
        groupName: 'Grupo de Capoeira'
      }
    })
  }

  const graduations = await prisma.graduationLevel.findMany({
    where: { organizationId: currentUser.organizationId },
    orderBy: { order: 'asc' }
  })

  return {
    ...settings,
    graduations
  }
})

server.put('/settings', async (req, reply) => {
  const currentUser = (req as any).currentUser
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return reply.status(403).send({ code: 'FORBIDDEN' })
  }

  const GraduationSettingsSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    grau: z.number().int().nullable().optional(),
    cordaType: z.enum(['UNICA', 'DUPLA', 'COM_PONTAS']).nullable().optional(),
    color: z.string().nullable().optional(),
    colorLeft: z.string().nullable().optional(),
    colorRight: z.string().nullable().optional(),
    pontaLeft: z.string().nullable().optional(),
    pontaRight: z.string().nullable().optional(),
    order: z.number().int(),
    active: z.boolean()
  })

  const BodySchema = z.object({
    groupName: z.string().nullable().optional(),
    logoUrl: z.string().nullable().optional(),
    themeColor: z.string().nullable().optional(),
    defaultMonthlyFee: z.number().nullable().optional(),
    defaultPaymentMethod: z.string().nullable().optional(),
    graduations: z.array(GraduationSettingsSchema).optional()
  })


  const parsedBody = BodySchema.safeParse(req.body)
  if (!parsedBody.success) {
    server.log.error({ err: parsedBody.error }, 'Validation error')
    return reply.status(422).send({
      code: 'VALIDATION_ERROR',
      message: 'Erro de validação',
      details: parsedBody.error.issues
    })
  }
  const body = parsedBody.data

  // Update App Settings
  let settings = await prisma.appSettings.findUnique({
    where: { organizationId: currentUser.organizationId }
  })
  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        organizationId: currentUser.organizationId,
        groupName: 'Grupo de Capoeira'
      }
    })
  }

  const updatedSettings = await prisma.appSettings.update({
    where: {
      id: settings.id,
      organizationId: currentUser.organizationId
    },
    data: {
      groupName: body.groupName ?? undefined,
      logoUrl: body.logoUrl, // Note: LogoURL is nullable in Prisma schema
      themeColor: body.themeColor ?? undefined,
      defaultMonthlyFee: body.defaultMonthlyFee ?? undefined,
      defaultPaymentMethod: body.defaultPaymentMethod ?? undefined
    }
  })

  // Update Graduations
  // Strategy: If graduations provided, we transactionally sync them?
  // Or just update/create. The input `id` is a UUID.
  // The frontend typically sends the whole list.
  // For now we can iterate and upsert. To handle deletions, we might need to delete passed IDs not in DB?
  // To keep it simple and stable: loop upsert. Deletion logic is a bit more complex if not explicit.
  // Assuming frontend manages IDs.

  if (body.graduations) {
    const graduations = body.graduations

    // Determine which to delete (if the user removed some from the list)
    // Actually, usually bulk update implies replacing the list.
    // Safe approach:
    // 1. Get existing IDs
    // 2. IDs in body
    // 3. Delete (Existing - Body)
    // 4. Upsert Body

    // However, since we are doing "concise and stable", let's trust the IDs.
    // If an ID is new (random UUID from front), create.
    // If ID exists, update.

    // NOTE: If the user deleted a graduation in UI, it won't be in the list.
    // So we should delete those not present in the new list.

    const incomingIds = graduations.map(g => g.id)

    await prisma.$transaction(async (tx) => {
      // Delete removed
      await tx.graduationLevel.deleteMany({
        where: {
          id: { notIn: incomingIds },
          organizationId: currentUser.organizationId
        }
      })

      // Upsert all
      for (const g of graduations) {
        await tx.graduationLevel.upsert({
          where: {
            id: g.id,
            organizationId: currentUser.organizationId
          },
          create: {
            id: g.id,
            organizationId: currentUser.organizationId,
            name: g.name,
            description: g.description,
            category: g.category,
            grau: g.grau,
            cordaType: g.cordaType,
            color: g.color,
            colorLeft: g.colorLeft,
            colorRight: g.colorRight,
            pontaLeft: g.pontaLeft,
            pontaRight: g.pontaRight,
            order: g.order,
            active: g.active
          },
          update: {
            name: g.name,
            description: g.description,
            category: g.category,
            grau: g.grau,
            cordaType: g.cordaType,
            color: g.color,
            colorLeft: g.colorLeft,
            colorRight: g.colorRight,
            pontaLeft: g.pontaLeft,
            pontaRight: g.pontaRight,
            order: g.order,
            active: g.active
          }
        })
      }
    })
  }

  const finalGraduations = await prisma.graduationLevel.findMany({
    where: { organizationId: currentUser.organizationId },
    orderBy: { order: 'asc' }
  })

  return {
    ...updatedSettings,
    graduations: finalGraduations
  }
})

await registerStudentRoutes(server)
await registerPaymentRoutes(server)
await registerGraduationRoutes(server)
await registerUnitRoutes(server)
await registerTeacherRoutes(server)
await registerAttendanceRoutes(server)
await registerReportsRoutes(server)
await registerActivityTypesRoutes(server)

server.listen({ port: 5175, host: '0.0.0.0' }).then(addr => {
  server.log.info({ addr }, 'api-started')
}).catch(err => {
  server.log.error(err)
  process.exit(1)
})
