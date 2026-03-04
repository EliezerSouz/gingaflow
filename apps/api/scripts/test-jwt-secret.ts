// Teste: Verificar que servidor falha sem JWT_SECRET
import { spawn } from 'child_process'

console.log('🧪 TESTE: Servidor sem JWT_SECRET\n')

// Iniciar servidor SEM JWT_SECRET
const server = spawn('npx', ['tsx', 'src/server.ts'], {
    cwd: process.cwd(),
    env: {
        ...process.env,
        JWT_SECRET: undefined,  // Remover JWT_SECRET
        DATABASE_URL: process.env.DATABASE_URL
    }
})

let output = ''
let errorOutput = ''

server.stdout.on('data', (data) => {
    output += data.toString()
    console.log(data.toString())
})

server.stderr.on('data', (data) => {
    errorOutput += data.toString()
    console.error(data.toString())
})

server.on('close', (code) => {
    console.log(`\n📊 RESULTADO DO TESTE:\n`)

    if (code !== 0) {
        console.log('✅ SUCESSO: Servidor FALHOU ao iniciar (comportamento esperado)')
        console.log(`   Exit code: ${code}`)

        if (errorOutput.includes('JWT_SECRET') || output.includes('JWT_SECRET')) {
            console.log('✅ SUCESSO: Mensagem de erro menciona JWT_SECRET')
        } else {
            console.log('⚠️  ATENÇÃO: Mensagem de erro não menciona JWT_SECRET')
        }
    } else {
        console.log('❌ FALHA: Servidor INICIOU sem JWT_SECRET (comportamento inseguro)')
    }

    process.exit(code === 0 ? 1 : 0)  // Inverter: sucesso do teste = falha do servidor
})

// Timeout de 5 segundos
setTimeout(() => {
    console.log('\n⏱️  Timeout: Matando processo...')
    server.kill()
}, 5000)
