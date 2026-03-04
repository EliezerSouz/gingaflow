import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const turmas = await prisma.turma.findMany({
        include: {
            _count: { select: { studentLinks: true } }
        }
    })
    console.log('TURMAS:', JSON.stringify(turmas, null, 2))

    const students = await prisma.student.count()
    console.log('TOTAL STUDENTS:', students)
}

main().catch(console.error).finally(() => prisma.$disconnect())
