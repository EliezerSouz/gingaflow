
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const activities = [
        { name: 'Capoeira', usaGraduacao: true },
        { name: 'Spinning', usaGraduacao: false },
        { name: 'Academia', usaGraduacao: false },
        { name: 'Personal', usaGraduacao: false },
        { name: 'Crossfit', usaGraduacao: false },
    ]

    // Remover Yoga se existir
    await prisma.activityType.deleteMany({
        where: { name: 'Yoga' }
    }).catch(() => { });

    for (const activity of activities) {
        await prisma.activityType.upsert({
            where: { name: activity.name },
            update: { usaGraduacao: activity.usaGraduacao },
            create: {
                name: activity.name,
                usaGraduacao: activity.usaGraduacao
            }
        })
    }

    console.log('Seed de atividades atualizado (Yoga removido, Personal adicionado)!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
