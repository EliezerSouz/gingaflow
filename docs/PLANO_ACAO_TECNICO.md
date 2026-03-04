# 🚀 PLANO DE AÇÃO TÉCNICO - GINGAFLOW
**Data:** 08/01/2026  
**Objetivo:** Correção de Bugs Críticos e Preparação para Produção

---

## 📋 RESUMO EXECUTIVO

**Status Atual:** ⚠️ APTO COM RESTRIÇÕES CRÍTICAS  
**Bugs Críticos:** 5 bloqueadores  
**Tempo Estimado:** 2-3 semanas (MVP) | 6-8 semanas (Completo)  
**Prioridade:** 🔥 URGENTE

---

## 🔥 SPRINT 1: CORREÇÕES CRÍTICAS (1 SEMANA)

### Objetivo: Resolver bugs bloqueadores e habilitar homologação

---

### ✅ TAREFA 1.1: Corrigir Bug #8 - Busca de Alunos (SQLite)

**Prioridade:** 🔥 CRÍTICA  
**Tempo Estimado:** 2 horas  
**Responsável:** Backend Developer

**Arquivo:** `apps/api/src/routes/students.routes.ts`

**Código Atual (BUGADO):**
```typescript
// Linha 34-39
if (query.q) {
  where.OR = [
    { full_name: { contains: query.q, mode: 'insensitive' } },  // ❌ ERRO
    { cpf: { contains: query.q } }
  ]
}
```

**Correção:**
```typescript
// Opção 1: Case-sensitive (rápido, mas não ideal)
if (query.q) {
  where.OR = [
    { full_name: { contains: query.q } },
    { cpf: { contains: query.q } }
  ]
}

// Opção 2: Case-insensitive manual (recomendado)
if (query.q) {
  const searchTerm = query.q.toLowerCase()
  where.OR = [
    { 
      full_name: { 
        contains: searchTerm,
        // Requer migração: adicionar coluna full_name_lower
      } 
    },
    { cpf: { contains: query.q } }
  ]
}

// Opção 3: Migrar para PostgreSQL (melhor a longo prazo)
// Requer: nova migration, atualização de DATABASE_URL
```

**Passos:**
1. Editar `apps/api/src/routes/students.routes.ts` linha 36
2. Remover `mode: 'insensitive'`
3. Testar busca no frontend
4. Commit: `fix: remove unsupported mode parameter in SQLite query`

**Validação:**
```bash
# Testar busca
curl "http://localhost:5175/students?q=Eliezer" \
  -H "Authorization: Bearer <TOKEN>"

# Resultado esperado: 200 OK com lista de alunos
```

---

### ✅ TAREFA 1.2: Corrigir Bug #9 - Erro 422 ao Criar Unidades

**Prioridade:** 🔥 CRÍTICA  
**Tempo Estimado:** 3 horas  
**Responsável:** Backend Developer

**Arquivo:** `apps/api/src/routes/units.routes.ts`

**Código Atual (BUGADO):**
```typescript
// Linha 44-51
const created = await prisma.unit.create({ data: {
  name: parsed.data.name,
  address: parsed.data.address,
  color: parsed.data.color,
  status: parsed.data.status,
  defaultMonthlyFeeCents: parsed.data.defaultMonthlyFeeCents,
  defaultPaymentMethod: parsed.data.defaultPaymentMethod
} as any })  // ❌ Type assertion esconde erro
```

**Correção:**
```typescript
// Remover 'as any' e tratar campos opcionais corretamente
const created = await prisma.unit.create({ 
  data: {
    name: parsed.data.name,
    address: parsed.data.address ?? null,
    color: parsed.data.color ?? null,
    status: parsed.data.status,
    defaultMonthlyFeeCents: parsed.data.defaultMonthlyFeeCents ?? null,
    defaultPaymentMethod: parsed.data.defaultPaymentMethod ?? null
  }
})
```

**Passos:**
1. Editar `apps/api/src/routes/units.routes.ts` linha 44-51
2. Remover `as any`
3. Adicionar `?? null` para campos opcionais
4. Repetir correção em `PUT /units/:id` (linha 65-72)
5. Testar criação e edição de unidades
6. Commit: `fix: handle optional fields in unit creation`

**Validação:**
```bash
# Criar unidade
curl -X POST http://localhost:5175/units \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unidade Teste",
    "address": "Rua Teste, 123",
    "color": "#EF4444",
    "status": "ATIVA"
  }'

# Resultado esperado: 200 OK com unidade criada
```

---

### ✅ TAREFA 1.3: Adicionar Error Handler Global

**Prioridade:** 🔥 CRÍTICA  
**Tempo Estimado:** 2 horas  
**Responsável:** Backend Developer

**Arquivo:** `apps/api/src/server.ts`

**Adicionar após linha 23:**
```typescript
// Error Handler Global
server.setErrorHandler((error, request, reply) => {
  server.log.error({
    err: error,
    url: request.url,
    method: request.method,
    user: (request as any).currentUser?.id
  })
  
  // Não expor detalhes técnicos em produção
  if (process.env.NODE_ENV === 'production') {
    // Erro genérico
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
```

**Passos:**
1. Adicionar error handler em `server.ts`
2. Testar forçando erro (ex: query inválida)
3. Validar que stack trace não vaza em produção
4. Commit: `feat: add global error handler to prevent stack trace leakage`

---

### ✅ TAREFA 1.4: Validar JWT_SECRET Obrigatório

**Prioridade:** 🔥 CRÍTICA  
**Tempo Estimado:** 1 hora  
**Responsável:** Backend Developer

**Arquivo:** `apps/api/src/server.ts`

**Código Atual (INSEGURO):**
```typescript
// Linha 21-23
await server.register(jwt, {
  secret: process.env.JWT_SECRET || crypto.randomUUID()  // ❌ INSEGURO
})
```

**Correção:**
```typescript
// Validar JWT_SECRET obrigatório
if (!process.env.JWT_SECRET) {
  server.log.fatal('JWT_SECRET não definido')
  throw new Error('JWT_SECRET é obrigatório. Defina em .env')
}

await server.register(jwt, {
  secret: process.env.JWT_SECRET
})
```

**Passos:**
1. Editar `server.ts` linha 21-23
2. Adicionar validação de `JWT_SECRET`
3. Atualizar `.env.example` com `JWT_SECRET=your-secret-here`
4. Commit: `fix: require JWT_SECRET environment variable`

---

### ✅ TAREFA 1.5: Adicionar Toasts em Todos os Módulos

**Prioridade:** 🔥 CRÍTICA  
**Tempo Estimado:** 4 horas  
**Responsável:** Frontend Developer

**Instalação:**
```bash
cd apps/desktop
pnpm add sonner
```

**Arquivos a Modificar:**
1. `src/pages/SettingsUnits.tsx`
2. `src/pages/SettingsGeneral.tsx`
3. `src/pages/GraduationsList.tsx`
4. `src/pages/StudentsList.tsx`
5. `src/pages/TeachersList.tsx`

**Exemplo de Implementação:**

**1. Adicionar Provider em `App.tsx`:**
```typescript
import { Toaster } from 'sonner'

function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      {/* resto do app */}
    </>
  )
}
```

**2. Usar em cada módulo:**
```typescript
import { toast } from 'sonner'

async function handleSubmit() {
  setLoading(true)
  try {
    if (unit) {
      await updateUnit(unit.id, formData)
      toast.success('Unidade atualizada com sucesso!')
    } else {
      await createUnit(formData)
      toast.success('Unidade criada com sucesso!')
    }
    onSuccess()
  } catch (e: any) {
    console.error(e)
    const message = e.message || 'Erro ao salvar unidade'
    toast.error(message)
  } finally {
    setLoading(false)
  }
}
```

**Passos:**
1. Instalar `sonner`
2. Adicionar `<Toaster />` em `App.tsx`
3. Adicionar toasts em todos os handlers de submit
4. Testar cada módulo
5. Commit: `feat: add toast notifications for user feedback`

---

### ✅ TAREFA 1.6: Testar Permissões de Professor End-to-End

**Prioridade:** 🔥 CRÍTICA  
**Tempo Estimado:** 4 horas  
**Responsável:** QA + Backend Developer

**Cenários de Teste:**

**1. Criar usuário Professor:**
```bash
# Login como Admin
curl -X POST http://localhost:5175/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gingaflow.local","password":"admin123"}'

# Criar Professor
curl -X POST http://localhost:5175/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Professor Teste",
    "email": "professor@test.com",
    "password": "123456",
    "role": "PROFESSOR",
    "relatedId": "<ID_DO_PROFESSOR_NA_TABELA_STUDENT>"
  }'
```

**2. Testar Acesso Permitido:**
```bash
# Login como Professor
curl -X POST http://localhost:5175/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professor@test.com","password":"123456"}'

# Listar alunos (deve retornar apenas alunos das turmas do professor)
curl http://localhost:5175/students \
  -H "Authorization: Bearer <PROFESSOR_TOKEN>"

# Resultado esperado: 200 OK com lista filtrada
```

**3. Testar Acesso Negado:**
```bash
# Tentar acessar settings (deve falhar)
curl http://localhost:5175/settings \
  -H "Authorization: Bearer <PROFESSOR_TOKEN>"

# Resultado esperado: 403 FORBIDDEN

# Tentar criar usuário (deve falhar)
curl -X POST http://localhost:5175/users \
  -H "Authorization: Bearer <PROFESSOR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@test.com","password":"123456","role":"ADMIN"}'

# Resultado esperado: 403 FORBIDDEN
```

**4. Adicionar Proteção em Rotas Faltantes:**

**Arquivo:** `apps/api/src/server.ts`

```typescript
// Proteger rota de settings (linha 233)
server.put('/settings', async (req, reply) => {
  const currentUser = (req as any).currentUser
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return reply.status(403).send({ code: 'FORBIDDEN' })
  }
  // ... resto do código
})

// Proteger rota de payments (se implementada)
server.get('/payments', async (req, reply) => {
  const currentUser = (req as any).currentUser
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return reply.status(403).send({ code: 'FORBIDDEN' })
  }
  // ... resto do código
})
```

**Passos:**
1. Criar usuário Professor via API
2. Testar todos os endpoints com token de Professor
3. Documentar quais rotas são acessíveis
4. Adicionar proteção em rotas faltantes
5. Commit: `test: validate professor permissions end-to-end`

---

## 📊 SPRINT 2: MÓDULO FINANCEIRO MVP (2 SEMANAS)

### Objetivo: Implementar funcionalidade essencial de pagamentos

---

### ✅ TAREFA 2.1: Criar Rotas de Pagamentos

**Prioridade:** 🟡 ALTA  
**Tempo Estimado:** 8 horas  
**Responsável:** Backend Developer

**Arquivo:** `apps/api/src/routes/payments.routes.ts`

**Implementação:**
```typescript
import { FastifyInstance } from 'fastify'
import { prisma } from '../database/prisma'
import { z } from 'zod'

const PaymentBody = z.object({
  studentId: z.string().uuid(),
  monthlyFeeCents: z.number().int().min(0),
  dueDay: z.number().int().min(1).max(31),
  period: z.string().regex(/^\d{4}-\d{2}$/), // "2026-01"
  status: z.enum(['PENDENTE', 'PAGO', 'ATRASADO']),
  paidAt: z.string().datetime().optional(),
  method: z.enum(['PIX', 'DINHEIRO', 'CARTAO', 'TRANSFERENCIA']).optional(),
  notes: z.string().optional()
})

export async function registerPaymentRoutes(app: FastifyInstance) {
  // GET /payments - Listar pagamentos
  app.get('/payments', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    
    const query = z.object({
      studentId: z.string().uuid().optional(),
      status: z.string().optional(),
      period: z.string().optional(),
      page: z.coerce.number().int().min(1).default(1),
      per_page: z.coerce.number().int().min(1).max(100).default(20)
    }).parse((req as any).query)
    
    const where: any = {}
    if (query.studentId) where.studentId = query.studentId
    if (query.status) where.status = query.status
    if (query.period) where.period = query.period
    
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: { student: true },
        orderBy: { period: 'desc' },
        skip: (query.page - 1) * query.per_page,
        take: query.per_page
      }),
      prisma.payment.count({ where })
    ])
    
    return {
      data: items,
      meta: {
        page: query.page,
        per_page: query.per_page,
        total,
        page_count: Math.ceil(total / query.per_page)
      }
    }
  })
  
  // POST /payments - Criar pagamento
  app.post('/payments', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    
    const parsed = PaymentBody.safeParse((req as any).body)
    if (!parsed.success) {
      return reply.status(422).send({ 
        code: 'VALIDATION_ERROR', 
        details: parsed.error.issues 
      })
    }
    
    try {
      const created = await prisma.payment.create({ 
        data: parsed.data 
      })
      return created
    } catch (e: any) {
      if (e.code === 'P2002') {
        return reply.status(409).send({ 
          code: 'CONFLICT', 
          message: 'Pagamento já existe para este período' 
        })
      }
      throw e
    }
  })
  
  // PUT /payments/:id - Atualizar pagamento
  app.put('/payments/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    
    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    const body = PaymentBody.partial().parse((req as any).body)
    
    const updated = await prisma.payment.update({ 
      where: { id: params.id }, 
      data: body 
    })
    return updated
  })
  
  // DELETE /payments/:id - Deletar pagamento
  app.delete('/payments/:id', async (req, reply) => {
    const user = (req as any).currentUser
    if (!user || user.role !== 'ADMIN') {
      return reply.status(403).send({ code: 'FORBIDDEN' })
    }
    
    const params = z.object({ id: z.string().uuid() }).parse((req as any).params)
    await prisma.payment.delete({ where: { id: params.id } })
    return reply.status(204).send()
  })
}
```

**Passos:**
1. Criar arquivo `payments.routes.ts`
2. Implementar CRUD completo
3. Adicionar validações
4. Testar todas as rotas
5. Commit: `feat: implement payment routes (CRUD)`

---

### ✅ TAREFA 2.2: Criar UI de Pagamentos

**Prioridade:** 🟡 ALTA  
**Tempo Estimado:** 12 horas  
**Responsável:** Frontend Developer

**Arquivo:** `apps/desktop/src/pages/PaymentsList.tsx`

**Implementação:**
```typescript
import React, { useState, useEffect } from 'react'
import { PageHeader, Button, Icon, Table, Badge, Modal, FormField, Input, Select } from '@gingaflow/ui'
import { listPayments, createPayment, updatePayment, Payment } from '../services/payments'
import { listStudents, Student } from '../services/students'
import { toast } from 'sonner'

export default function PaymentsList() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  
  useEffect(() => {
    loadPayments()
    loadStudents()
  }, [])
  
  async function loadPayments() {
    setLoading(true)
    try {
      const res = await listPayments({})
      setPayments(res.data)
    } catch (e) {
      toast.error('Erro ao carregar pagamentos')
    } finally {
      setLoading(false)
    }
  }
  
  async function loadStudents() {
    try {
      const res = await listStudents({ per_page: 1000 })
      setStudents(res.data)
    } catch (e) {
      console.error(e)
    }
  }
  
  function handleMarkAsPaid(payment: Payment) {
    // Implementar lógica de marcar como pago
  }
  
  return (
    <div>
      <PageHeader 
        title="Pagamentos" 
        subtitle="Gerencie as mensalidades dos alunos"
        action={
          <Button onClick={() => setShowModal(true)}>
            <Icon name="plus" className="mr-2" />
            Novo Pagamento
          </Button>
        }
      />
      
      {/* Tabela de pagamentos */}
      <Table
        columns={[
          { key: 'student', label: 'Aluno' },
          { key: 'period', label: 'Período' },
          { key: 'value', label: 'Valor' },
          { key: 'status', label: 'Status' },
          { key: 'actions', label: 'Ações' }
        ]}
        data={payments.map(p => ({
          student: p.student.full_name,
          period: p.period,
          value: `R$ ${(p.monthlyFeeCents / 100).toFixed(2)}`,
          status: <Badge variant={p.status === 'PAGO' ? 'success' : 'warning'}>{p.status}</Badge>,
          actions: (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => handleMarkAsPaid(p)}
            >
              Marcar como Pago
            </Button>
          )
        }))}
      />
      
      {/* Modal de criação/edição */}
      {showModal && (
        <PaymentModal 
          payment={editingPayment}
          students={students}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            loadPayments()
          }}
        />
      )}
    </div>
  )
}
```

**Passos:**
1. Criar `PaymentsList.tsx`
2. Criar `PaymentModal.tsx`
3. Criar `services/payments.ts`
4. Adicionar rota em `App.tsx`
5. Testar criação, edição e listagem
6. Commit: `feat: implement payments UI (list, create, edit)`

---

## 📈 SPRINT 3: REFATORAÇÕES IMPORTANTES (2 SEMANAS)

### Objetivo: Melhorar qualidade e estabilidade

---

### ✅ TAREFA 3.1: Refatorar Modelo de Graduação

**Prioridade:** 🟡 ALTA  
**Tempo Estimado:** 8 horas  
**Responsável:** Backend Developer + DBA

**Criar Migration:**
```bash
cd apps/api
npx prisma migrate dev --name refactor_graduation_model
```

**Arquivo:** `apps/api/prisma/schema.prisma`

**Adicionar:**
```prisma
model GraduationDefinition {
  id          String   @id @default(uuid())
  name        String
  description String?
  category    String
  grau        Int
  cordaType   String
  color       String?
  colorLeft   String?
  colorRight  String?
  pontaLeft   String?
  pontaRight  String?
  order       Int
  active      Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  studentGraduations StudentGraduation[]
}

model StudentGraduation {
  id            String   @id @default(uuid())
  studentId     String
  graduationId  String
  date          DateTime
  teacherId     String?
  notes         String?
  created_at    DateTime @default(now())
  
  student       Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  graduation    GraduationDefinition @relation(fields: [graduationId], references: [id])
  
  @@unique([studentId, graduationId, date])
}
```

**Migração de Dados:**
```typescript
// Script de migração
async function migrateGraduations() {
  // 1. Criar GraduationDefinition a partir de settings.json
  const settings = JSON.parse(readFileSync(settingsFile, 'utf-8'))
  for (const grad of settings.graduations) {
    await prisma.graduationDefinition.create({
      data: {
        id: grad.id,
        name: grad.name,
        description: grad.description,
        category: grad.category,
        grau: grad.grau,
        cordaType: grad.cordaType,
        color: grad.color,
        colorLeft: grad.colorLeft,
        colorRight: grad.colorRight,
        pontaLeft: grad.pontaLeft,
        pontaRight: grad.pontaRight,
        order: grad.order,
        active: grad.active
      }
    })
  }
  
  // 2. Migrar Graduation antiga para StudentGraduation
  const oldGraduations = await prisma.graduation.findMany()
  for (const old of oldGraduations) {
    // Encontrar GraduationDefinition correspondente
    const def = await prisma.graduationDefinition.findFirst({
      where: { name: old.type }
    })
    
    if (def) {
      await prisma.studentGraduation.create({
        data: {
          studentId: old.studentId,
          graduationId: def.id,
          date: new Date(old.date),
          notes: old.notes
        }
      })
    }
  }
  
  // 3. Deletar tabela antiga
  // await prisma.graduation.deleteMany()
}
```

---

### ✅ TAREFA 3.2: Adicionar Transações em Operações Críticas

**Prioridade:** 🟡 ALTA  
**Tempo Estimado:** 4 horas  
**Responsável:** Backend Developer

**Arquivos a Modificar:**
1. `teachers.routes.ts` (linha 144-153)
2. Futuras operações de pagamento
3. Operações de matrícula

**Exemplo:**
```typescript
// teachers.routes.ts
app.put('/teachers/:id/assignments', async (req, reply) => {
  // ... validações
  
  await prisma.$transaction(async (tx) => {
    await tx.teacherTurma.deleteMany({
      where: { teacherId: params.id }
    })
    
    if (turmaIds.length > 0) {
      await tx.teacherTurma.createMany({
        data: turmaIds.map(id => ({
          teacherId: params.id,
          turmaId: id
        }))
      })
    }
  })
  
  return reply.status(204).send()
})
```

---

## 📝 CHECKLIST DE VALIDAÇÃO

### Antes de Deploy em Homologação

- [ ] Bug #8 corrigido e testado
- [ ] Bug #9 corrigido e testado
- [ ] Error handler global implementado
- [ ] JWT_SECRET validado
- [ ] Toasts adicionados em todos os módulos
- [ ] Permissões de Professor testadas
- [ ] Backup do banco de dados criado
- [ ] Logs estruturados configurados
- [ ] Monitoramento de erros configurado (Sentry)

### Antes de Deploy em Produção

- [ ] Módulo Financeiro implementado (MVP)
- [ ] Modelo de Graduação refatorado
- [ ] Transações implementadas
- [ ] Testes E2E automatizados (mínimo 80% coverage)
- [ ] Documentação de API (Swagger)
- [ ] Rate limiting implementado
- [ ] Migração para PostgreSQL
- [ ] Backup automatizado configurado
- [ ] Plano de rollback documentado

---

## 📊 MÉTRICAS DE SUCESSO

### Sprint 1
- ✅ 0 bugs críticos bloqueadores
- ✅ 100% das rotas protegidas testadas
- ✅ 100% dos módulos com feedback visual

### Sprint 2
- ✅ Módulo Financeiro funcional (CRUD completo)
- ✅ Relatório de inadimplência disponível
- ✅ Integração com alunos funcionando

### Sprint 3
- ✅ Modelo de dados normalizado
- ✅ 0 operações críticas sem transação
- ✅ Cobertura de testes > 70%

---

**Assinatura:**  
**Arquiteto Sênior + QA Lead**  
**Data:** 08/01/2026
