import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const students = await prisma.student.findMany()
    console.log('--- STUDENTS IN DB ---')
    console.log(JSON.stringify(students, null, 2))
    console.log('TOTAL:', students.length)
}

main().catch(console.error).finally(() => prisma.$disconnect())
