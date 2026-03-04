import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚀 Iniciando migração de horários...')

    const turmas = await prisma.turma.findMany({
        where: {
            schedule: { not: null }
        }
    })

    console.log(`Found ${turmas.length} turmas to migrate.`)

    for (const turma of turmas) {
        if (!turma.schedule) continue

        // Example schedule format: "SEG, QUA às 18:00" or similar
        // The current logic in dashboard.routes.ts splits by ','
        // parts.forEach(part => { if (part.includes(todayShort)) ... })

        const parts = turma.schedule.split(',').map(p => p.trim())

        for (const part of parts) {
            // Logic to extract day and time from part
            // This is tricky because the format varies.
            // We'll try to match common patterns.

            const weekDaysShort = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']
            const weekDaysLong = ['SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO', 'DOMINGO']

            let foundDay: string | null = null

            for (let i = 0; i < weekDaysShort.length; i++) {
                if (part.toUpperCase().includes(weekDaysShort[i]) || part.toUpperCase().includes(weekDaysLong[i])) {
                    foundDay = weekDaysShort[i]
                    break
                }
            }

            if (foundDay) {
                const timeMatch = part.match(/\d{2}:\d{2}/)
                const time = timeMatch ? timeMatch[0] : '00:00' // Default if not found

                try {
                    await prisma.turmaSchedule.upsert({
                        where: {
                            turmaId_dayOfWeek_startTime: {
                                turmaId: turma.id,
                                dayOfWeek: foundDay,
                                startTime: time
                            }
                        },
                        create: {
                            organizationId: turma.organizationId,
                            turmaId: turma.id,
                            dayOfWeek: foundDay,
                            startTime: time
                        },
                        update: {}
                    })
                    console.log(`✅ Migrated: Turma ${turma.name} -> ${foundDay} ${time}`)
                } catch (e) {
                    console.error(`❌ Error migrating part "${part}" for turma ${turma.name}:`, e)
                }
            }
        }
    }

    console.log('✨ Migração concluída!')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
