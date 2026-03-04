import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupTestUnits() {
  console.log('🧹 Iniciando limpeza de unidades de teste...\n')

  try {
    // Listar unidades antes da limpeza
    const beforeUnits = await prisma.unit.findMany({
      select: { id: true, name: true }
    })
    console.log('📋 Unidades ANTES da limpeza:')
    beforeUnits.forEach(u => console.log(`  - ${u.name}`))
    console.log(`  Total: ${beforeUnits.length}\n`)

    // Deletar unidades com "Teste" no nome
    const deleted = await prisma.unit.deleteMany({
      where: {
        OR: [
          { name: { contains: 'Teste' } },
          { name: { contains: 'QA' } },
          { name: { contains: 'Test' } }
        ]
      }
    })

    console.log(`✅ ${deleted.count} unidade(s) de teste deletada(s)\n`)

    // Listar unidades após a limpeza
    const afterUnits = await prisma.unit.findMany({
      select: { id: true, name: true }
    })
    console.log('📋 Unidades APÓS a limpeza:')
    afterUnits.forEach(u => console.log(`  - ${u.name}`))
    console.log(`  Total: ${afterUnits.length}\n`)

    console.log('✅ Limpeza concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro durante limpeza:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

cleanupTestUnits()
  .catch(console.error)
  .finally(() => process.exit())
