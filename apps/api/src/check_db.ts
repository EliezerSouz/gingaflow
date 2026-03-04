import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const orgs = await prisma.organization.findMany()
    console.log('Orgs:', orgs.length)
    const users = await prisma.user.findMany()
    console.log('Users:', users.map(u => ({ email: u.email, id: u.id, orgId: u.organizationId })))
}

main().catch(console.error).finally(() => prisma.$disconnect())
