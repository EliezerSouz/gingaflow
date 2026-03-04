import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
})

async function main() {
    console.log('--- Testando Conexão com Supabase ---')
    try {
        const orgs = await prisma.organization.findMany()
        console.log('✅ Conexão estabelecida com sucesso!')
        console.log(`📊 Total de organizações encontradas: ${orgs.length}`)
    } catch (error: any) {
        console.error('❌ Erro detalhado ao conectar:')
        console.error(`Código: ${error.code}`)
        console.error(`Mensagem: ${error.message}`)
    } finally {
        await prisma.$disconnect()
    }
}

main()
