import { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma'
import { z } from 'zod'

export async function registerActivityTypesRoutes(server: FastifyInstance) {
    server.get('/activity-types', async (req, reply) => {
        const activityTypes = await prisma.activityType.findMany({
            orderBy: { created_at: 'asc' }
        })
        return activityTypes
    })

    server.post('/activity-types', async (req, reply) => {
        const schema = z.object({
            name: z.string(),
            usaGraduacao: z.boolean().default(true)
        })

        const data = schema.parse(req.body)

        const activityType = await prisma.activityType.create({
            data
        })

        return activityType
    })

    server.put('/activity-types/:id', async (req, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid()
        })
        const bodySchema = z.object({
            name: z.string().optional(),
            usaGraduacao: z.boolean().optional()
        })

        const { id } = paramsSchema.parse(req.params)
        const data = bodySchema.parse(req.body)

        const activityType = await prisma.activityType.update({
            where: { id },
            data
        })

        return activityType
    })

    server.delete('/activity-types/:id', async (req, reply) => {
        const paramsSchema = z.object({
            id: z.string().uuid()
        })

        const { id } = paramsSchema.parse(req.params)

        await prisma.activityType.delete({
            where: { id }
        })

        return { success: true }
    })
}
