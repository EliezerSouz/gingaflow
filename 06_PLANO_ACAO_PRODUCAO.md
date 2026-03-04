# 🚀 PLANO DE AÇÃO PARA PRODUÇÃO
**QA Engineer Sênior + Arquiteto de Software Full Stack**  
**Data:** 22/01/2026  
**Projeto:** GingaFlow  
**Objetivo:** Roadmap estruturado para colocar aplicação em produção

---

## 🎯 VISÃO GERAL

### Status Atual
- **Web:** 65% completo (funcional mas com bugs críticos)
- **Mobile:** 25% completo (estrutura básica)
- **Backend:** 70% completo (funcional mas com problemas de arquitetura)
- **Banco:** 60% completo (modelo correto mas com ressalvas graves)

### Meta
- **Web:** 95% completo (produção)
- **Mobile:** 95% completo (produção - PRIORIDADE)
- **Backend:** 90% completo (produção)
- **Banco:** 95% completo (pronto para Supabase)

---

## 📋 PLANO DE AÇÃO EM ORDEM DE PRIORIDADE

---

## 🔴 FASE 1: CORREÇÕES CRÍTICAS (BLOQUEADORES)
**Duração:** 1 semana (5 dias úteis)  
**Objetivo:** Eliminar bugs que impedem uso básico

### DIA 1-2: Backend - Correções Urgentes

#### ✅ TAREFA 1.1: Corrigir BUG #8 (Busca de Alunos)
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 2 horas  
**Responsável:** Backend Developer

**Problema:**
```typescript
// apps/api/src/routes/students.routes.ts (linha 36)
where.OR = [
  { full_name: { contains: query.q, mode: 'insensitive' } },  // ❌ ERRO
  { cpf: { contains: query.q } }
]
```

**Solução:**
```typescript
// ✅ CORREÇÃO (SQLite não suporta mode: 'insensitive')
where.OR = [
  { full_name: { contains: query.q } },  // Remove mode
  { cpf: { contains: query.q } }
]

// OU (melhor - case-insensitive manual)
where.OR = [
  { 
    full_name: { 
      contains: query.q.toLowerCase() 
    } 
  },
  { cpf: { contains: query.q } }
]
```

**Validação:**
- [ ] Testar busca por nome
- [ ] Testar busca por CPF
- [ ] Testar busca case-insensitive
- [ ] Validar que não há erro no console

---

#### ✅ TAREFA 1.2: Corrigir BUG #9 (Criar Unidades - Erro 422)
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 2 horas  
**Responsável:** Backend Developer

**Problema:**
```typescript
// apps/api/src/routes/units.routes.ts (linhas 44-51)
const created = await prisma.unit.create({ 
  data: {
    name: parsed.data.name,
    address: parsed.data.address,
    color: parsed.data.color,
    status: parsed.data.status,
    defaultMonthlyFeeCents: parsed.data.defaultMonthlyFeeCents,
    defaultPaymentMethod: parsed.data.defaultPaymentMethod
  } as any  // ❌ Type assertion esconde erro
})
```

**Solução:**
```typescript
// ✅ CORREÇÃO - Tratar campos opcionais
const created = await prisma.unit.create({ 
  data: {
    name: parsed.data.name,
    address: parsed.data.address || null,
    color: parsed.data.color || null,
    status: parsed.data.status,
    defaultMonthlyFeeCents: parsed.data.defaultMonthlyFeeCents || null,
    defaultPaymentMethod: parsed.data.defaultPaymentMethod || null
  }
})
```

**Validação:**
- [ ] Criar unidade com todos os campos
- [ ] Criar unidade com campos opcionais vazios
- [ ] Editar unidade existente
- [ ] Validar persistência no banco

---

#### ✅ TAREFA 1.3: Validar JWT_SECRET Obrigatório
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 30 minutos  
**Responsável:** Backend Developer

**Problema:**
```typescript
// apps/api/src/server.ts (linha 22)
await server.register(jwt, {
  secret: process.env.JWT_SECRET || crypto.randomUUID()  // ❌ INSEGURO
})
```

**Solução:**
```typescript
// ✅ CORREÇÃO
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET é obrigatório. Configure no arquivo .env')
}

await server.register(jwt, {
  secret: process.env.JWT_SECRET
})
```

**Validação:**
- [ ] Tentar iniciar servidor sem JWT_SECRET (deve falhar)
- [ ] Configurar JWT_SECRET no .env
- [ ] Validar que servidor inicia corretamente
- [ ] Testar login e geração de token

---

#### ✅ TAREFA 1.4: Adicionar Error Handler Global
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 1 hora  
**Responsável:** Backend Developer

**Problema:**
- Stack traces do Prisma expostos ao frontend
- Erros técnicos visíveis para usuário final

**Solução:**
```typescript
// apps/api/src/server.ts
server.setErrorHandler((error, request, reply) => {
  server.log.error(error)
  
  // Não expor detalhes técnicos em produção
  if (process.env.NODE_ENV === 'production') {
    reply.status(500).send({
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    })
  } else {
    reply.status(500).send({
      code: 'INTERNAL_ERROR',
      message: error.message,
      stack: error.stack
    })
  }
})
```

**Validação:**
- [ ] Forçar erro no backend
- [ ] Validar que stack trace não aparece em produção
- [ ] Validar que erro aparece nos logs do servidor
- [ ] Testar em desenvolvimento (stack trace deve aparecer)

---

### DIA 3: Frontend - Feedback Visual

#### ✅ TAREFA 1.5: Adicionar Toasts em Todos os Módulos
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 4 horas  
**Responsável:** Frontend Developer

**Problema:**
- Nenhum módulo exibe toast de confirmação ao salvar
- Usuário não sabe se operação foi bem-sucedida

**Solução:**
```bash
# Instalar biblioteca de toast
npm install sonner
```

```typescript
// Web: apps/desktop/src/App.tsx
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

```typescript
// Exemplo de uso em formulário
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
  } catch (e) {
    console.error(e)
    toast.error('Erro ao salvar unidade')
  } finally {
    setLoading(false)
  }
}
```

**Módulos a atualizar:**
- [ ] Unidades (criar, editar, deletar)
- [ ] Turmas (criar, editar, deletar)
- [ ] Graduações (criar, editar, deletar)
- [ ] Alunos (criar, editar, deletar)
- [ ] Professores (criar, editar, deletar)
- [ ] Configurações (salvar)

---

### DIA 4-5: Mobile - Correções Urgentes

#### ✅ TAREFA 1.6: Corrigir Responsável Condicional (Mobile)
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 1 hora  
**Responsável:** Mobile Developer

**Problema:**
```typescript
// apps/mobile/src/screens/StudentCreateScreen.tsx
// Responsável aparece SEMPRE, não respeita idade
```

**Solução:**
```typescript
// Calcular se é menor de idade
const isMinor = () => {
  if (!formData.birth_date) return false
  const birthDate = new Date(formData.birth_date)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  return age < 18
}

// Envolver seção Responsável em condicional
{isMinor() && (
  <View>
    <Text>Responsável</Text>
    {/* campos do responsável */}
  </View>
)}
```

**Validação:**
- [ ] Criar aluno maior de 18 anos (responsável não deve aparecer)
- [ ] Criar aluno menor de 18 anos (responsável deve aparecer)
- [ ] Editar aluno e mudar idade (responsável deve aparecer/desaparecer)

---

#### ✅ TAREFA 1.7: Corrigir Badge de Graduação (Mobile)
**Prioridade:** 🟡 ALTA  
**Tempo:** 2 horas  
**Responsável:** Mobile Developer

**Problema:**
- Badge de graduação não aparece porque falta campo `level`
- API não retorna `level` nas graduações

**Solução:**
```typescript
// Mobile: src/components/CordaBadge.tsx
// Adicionar fallback para extrair level das notes
const getLevel = (graduation: Graduation) => {
  // Tentar usar campo level (se existir)
  if (graduation.level) return graduation.level
  
  // Fallback: extrair das notes
  const match = graduation.notes?.match(/\[LEVEL\]\s*(\d+)/)
  return match ? parseInt(match[1]) : 0
}

// Usar no componente
const level = getLevel(graduation)
```

**Validação:**
- [ ] Badge renderiza corretamente
- [ ] Grau é exibido
- [ ] Cores estão corretas
- [ ] Funciona com graduações antigas (sem level)

---

## 🟡 FASE 2: MÓDULO FINANCEIRO (ESSENCIAL)
**Duração:** 2 semanas (10 dias úteis)  
**Objetivo:** Implementar gestão de pagamentos

### SEMANA 1: Backend + Web

#### ✅ TAREFA 2.1: Implementar Backend de Pagamentos
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 2 dias  
**Responsável:** Backend Developer

**Criar arquivo:** `apps/api/src/routes/payments.routes.ts`

```typescript
import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const CreatePaymentSchema = z.object({
  studentId: z.string().uuid(),
  monthlyFeeCents: z.number().int().positive(),
  dueDay: z.number().int().min(1).max(31),
  period: z.string().regex(/^\d{4}-\d{2}$/), // "2026-01"
  status: z.enum(['PAID', 'PENDING', 'OVERDUE']),
  method: z.string().optional(),
  notes: z.string().optional()
})

export async function paymentsRoutes(app: FastifyInstance) {
  // GET /payments - Listar pagamentos
  app.get('/payments', async (req) => {
    const { studentId, status, period } = req.query as any
    
    const payments = await app.prisma.payment.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(status && { status }),
        ...(period && { period })
      },
      include: {
        student: {
          select: { full_name: true, cpf: true }
        }
      },
      orderBy: { period: 'desc' }
    })
    
    return payments
  })
  
  // POST /payments - Criar pagamento
  app.post('/payments', async (req) => {
    const parsed = CreatePaymentSchema.parse(req.body)
    
    const payment = await app.prisma.payment.create({
      data: {
        ...parsed,
        paidAt: parsed.status === 'PAID' ? new Date() : null
      }
    })
    
    return payment
  })
  
  // PUT /payments/:id - Atualizar pagamento
  app.put('/payments/:id', async (req) => {
    const { id } = req.params as any
    const { status, method, paidAt } = req.body as any
    
    const payment = await app.prisma.payment.update({
      where: { id },
      data: {
        status,
        method,
        paidAt: status === 'PAID' ? (paidAt || new Date()) : null
      }
    })
    
    return payment
  })
  
  // GET /students/:id/balance - Calcular saldo
  app.get('/students/:id/balance', async (req) => {
    const { id } = req.params as any
    
    const payments = await app.prisma.payment.findMany({
      where: { studentId: id },
      orderBy: { period: 'asc' }
    })
    
    const totalExpected = payments.reduce((sum, p) => sum + p.monthlyFeeCents, 0)
    const totalPaid = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.monthlyFeeCents, 0)
    
    const balance = totalPaid - totalExpected
    const overdueCount = payments.filter(p => p.status === 'OVERDUE').length
    
    return {
      totalExpected,
      totalPaid,
      balance,
      overdueCount,
      status: balance >= 0 ? 'EM_DIA' : 'ATRASADO'
    }
  })
}
```

**Registrar rotas:**
```typescript
// apps/api/src/server.ts
import { paymentsRoutes } from './routes/payments.routes'

await server.register(paymentsRoutes)
```

**Validação:**
- [ ] GET /payments retorna lista
- [ ] POST /payments cria pagamento
- [ ] PUT /payments/:id atualiza status
- [ ] GET /students/:id/balance calcula saldo
- [ ] Constraint de unicidade funciona (studentId + period)

---

#### ✅ TAREFA 2.2: Implementar Tela de Pagamentos (Web)
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 3 dias  
**Responsável:** Frontend Developer

**Criar arquivo:** `apps/desktop/src/pages/Payments.tsx`

**Funcionalidades:**
- [ ] Listar pagamentos com filtros (aluno, status, período)
- [ ] Modal para registrar novo pagamento
- [ ] Botão "Marcar como Pago"
- [ ] Indicador visual de inadimplência (vermelho/verde)
- [ ] Exibir saldo do aluno
- [ ] Filtrar por mês/ano

**Validação:**
- [ ] Criar pagamento manual
- [ ] Marcar como pago
- [ ] Filtrar por aluno
- [ ] Filtrar por status
- [ ] Validar cálculo de saldo

---

### SEMANA 2: Mobile

#### ✅ TAREFA 2.3: Implementar Tela de Pagamentos (Mobile)
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 3 dias  
**Responsável:** Mobile Developer

**Criar arquivo:** `apps/mobile/src/screens/PaymentsScreen.tsx`

**Funcionalidades:**
- [ ] Listar pagamentos do aluno
- [ ] Registrar pagamento rápido
- [ ] Marcar como pago
- [ ] Indicador de inadimplência
- [ ] Notificação de vencimentos próximos

**Validação:**
- [ ] Criar pagamento
- [ ] Marcar como pago
- [ ] Validar sincronização com Web
- [ ] Testar notificações

---

#### ✅ TAREFA 2.4: Implementar Dashboard (Mobile)
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 2 dias  
**Responsável:** Mobile Developer

**Criar arquivo:** `apps/mobile/src/screens/DashboardScreen.tsx`

**Cards:**
- [ ] Total de Alunos (ativos/inativos)
- [ ] Receita Mensal
- [ ] Inadimplência (quantidade e valor)
- [ ] Próximas Aulas (agenda)
- [ ] Graduações Pendentes

**Validação:**
- [ ] Cards carregam corretamente
- [ ] Dados estão atualizados
- [ ] Performance (< 2s de carregamento)

---

## 🟡 FASE 3: MOBILE ALCANÇA WEB
**Duração:** 2 semanas (10 dias úteis)  
**Objetivo:** Implementar módulos ausentes no Mobile

### SEMANA 1: Unidades, Turmas, Professores

#### ✅ TAREFA 3.1: Implementar Módulo Unidades (Mobile)
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 2 dias  
**Responsável:** Mobile Developer

**Funcionalidades:**
- [ ] Listar unidades
- [ ] Criar unidade
- [ ] Editar unidade
- [ ] Deletar unidade (opcional)
- [ ] Selecionar unidade ao criar turma

---

#### ✅ TAREFA 3.2: Implementar Módulo Turmas (Mobile)
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 2 dias  
**Responsável:** Mobile Developer

**Funcionalidades:**
- [ ] Listar turmas
- [ ] Criar turma
- [ ] Editar turma
- [ ] Vincular a unidade
- [ ] Selecionar turma ao criar aluno

---

#### ✅ TAREFA 3.3: Implementar Módulo Professores (Mobile)
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 3 dias  
**Responsável:** Mobile Developer

**Funcionalidades:**
- [ ] Listar professores
- [ ] Criar professor
- [ ] Editar professor
- [ ] Vincular turmas
- [ ] Separar de alunos (abas ou telas diferentes)

---

### SEMANA 2: Controle de Roles e Refinamentos

#### ✅ TAREFA 3.4: Implementar Controle de Roles (Mobile)
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 2 dias  
**Responsável:** Mobile Developer

**Funcionalidades:**
- [ ] Verificar role do usuário (ADMIN/PROFESSOR)
- [ ] Filtrar funcionalidades por role
- [ ] Professor vê apenas seus alunos
- [ ] Professor não acessa Configurações

**Validação:**
- [ ] Login como ADMIN (acesso total)
- [ ] Login como PROFESSOR (acesso limitado)
- [ ] Validar filtros de dados

---

#### ✅ TAREFA 3.5: Adicionar Busca e Filtros (Mobile)
**Prioridade:** 🟡 ALTA  
**Tempo:** 2 dias  
**Responsável:** Mobile Developer

**Funcionalidades:**
- [ ] Busca de alunos por nome/CPF
- [ ] Filtrar por status (ATIVO/INATIVO)
- [ ] Filtrar por turma
- [ ] Filtrar por graduação
- [ ] Ordenar por nome/data matrícula

---

## 🟢 FASE 4: REFATORAÇÕES IMPORTANTES
**Duração:** 2 semanas (10 dias úteis)  
**Objetivo:** Corrigir modelo de dados e preparar para Supabase

### SEMANA 1: Banco de Dados

#### ✅ TAREFA 4.1: Migrar Datas de String para DateTime
**Prioridade:** 🟡 ALTA  
**Tempo:** 2 dias  
**Responsável:** Backend Developer

**⚠️ BACKUP OBRIGATÓRIO ANTES DE EXECUTAR**

**Script de migração:**
```sql
-- Student
ALTER TABLE Student ADD COLUMN birth_date_temp DATETIME;
ALTER TABLE Student ADD COLUMN enrollment_date_temp DATETIME;
UPDATE Student SET birth_date_temp = datetime(birth_date) WHERE birth_date IS NOT NULL;
UPDATE Student SET enrollment_date_temp = datetime(enrollment_date);
ALTER TABLE Student DROP COLUMN birth_date;
ALTER TABLE Student DROP COLUMN enrollment_date;
ALTER TABLE Student RENAME COLUMN birth_date_temp TO birth_date;
ALTER TABLE Student RENAME COLUMN enrollment_date_temp TO enrollment_date;

-- Graduation
ALTER TABLE Graduation ADD COLUMN date_temp DATETIME;
UPDATE Graduation SET date_temp = datetime(date);
ALTER TABLE Graduation DROP COLUMN date;
ALTER TABLE Graduation RENAME COLUMN date_temp TO date;

-- Attendance
ALTER TABLE Attendance ADD COLUMN date_temp DATETIME;
UPDATE Attendance SET date_temp = datetime(date);
ALTER TABLE Attendance DROP COLUMN date;
ALTER TABLE Attendance RENAME COLUMN date_temp TO date;
```

**Atualizar schema Prisma:**
```prisma
model Student {
  birth_date     DateTime?
  enrollment_date DateTime
}

model Graduation {
  date DateTime
}

model Attendance {
  date DateTime
}
```

**Validação:**
- [ ] Backup criado
- [ ] Migração executada sem erros
- [ ] Dados preservados
- [ ] Web e Mobile funcionam corretamente
- [ ] Queries por data funcionam

---

#### ✅ TAREFA 4.2: Refatorar Modelo de Graduação
**Prioridade:** 🟡 ALTA  
**Tempo:** 3 dias  
**Responsável:** Backend Developer

**Objetivo:** Usar `GraduationLevel` como FK ao invés de strings

**Migração:**
```prisma
// Renomear Graduation para StudentGraduation
model StudentGraduation {
  id                   String   @id @default(uuid())
  studentId            String
  previousGraduationId String?
  newGraduationId      String
  date                 DateTime
  teacherId            String?
  notes                String?
  created_at           DateTime @default(now())
  
  student              Student         @relation(fields: [studentId], references: [id], onDelete: Cascade)
  previousGraduation   GraduationLevel? @relation("PreviousGraduation", fields: [previousGraduationId], references: [id])
  newGraduation        GraduationLevel  @relation("NewGraduation", fields: [newGraduationId], references: [id])
  teacher              Student?         @relation("TeacherGraduation", fields: [teacherId], references: [id])
  
  @@unique([studentId, newGraduationId, date])
}
```

**Validação:**
- [ ] Dados migrados corretamente
- [ ] Histórico de graduações preservado
- [ ] Web e Mobile funcionam
- [ ] Relatórios de graduação funcionam

---

### SEMANA 2: Melhorias

#### ✅ TAREFA 4.3: Adicionar Índices no Banco
**Prioridade:** 🟡 MÉDIA  
**Tempo:** 1 dia  
**Responsável:** Backend Developer

```prisma
model Student {
  @@index([full_name])
  @@index([status])
  @@index([currentGraduationId])
}

model Payment {
  @@index([status])
  @@index([period])
}

model Attendance {
  @@index([date])
  @@index([status])
}
```

---

#### ✅ TAREFA 4.4: Implementar Transações em Operações Críticas
**Prioridade:** 🟡 MÉDIA  
**Tempo:** 2 dias  
**Responsável:** Backend Developer

**Exemplo:**
```typescript
// Atualizar turmas do professor
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
```

---

## 🎯 FASE 5: PREPARAÇÃO PARA PRODUÇÃO
**Duração:** 1 semana (5 dias úteis)  
**Objetivo:** Testes, documentação e deploy

### DIA 1-3: Testes E2E

#### ✅ TAREFA 5.1: Testes E2E Completos
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 3 dias  
**Responsável:** QA Engineer

**Fluxos a testar:**
- [ ] Criar usuário → Login → Logout
- [ ] Criar unidade → Criar turma → Vincular professor
- [ ] Criar aluno → Vincular turma → Registrar presença
- [ ] Criar graduação → Atribuir ao aluno
- [ ] Registrar pagamento → Marcar como pago → Validar saldo
- [ ] Gerar relatórios
- [ ] Testar permissões (ADMIN vs PROFESSOR)

---

### DIA 4: Documentação

#### ✅ TAREFA 5.2: Documentação de API
**Prioridade:** 🟡 ALTA  
**Tempo:** 1 dia  
**Responsável:** Backend Developer

**Ferramentas:** Swagger/OpenAPI

**Documentar:**
- [ ] Todas as rotas
- [ ] Schemas de request/response
- [ ] Códigos de erro
- [ ] Exemplos de uso

---

### DIA 5: Deploy

#### ✅ TAREFA 5.3: Deploy em Staging
**Prioridade:** 🔴 CRÍTICA  
**Tempo:** 1 dia  
**Responsável:** DevOps/Backend Developer

**Checklist:**
- [ ] Configurar variáveis de ambiente
- [ ] Migrar banco para Supabase
- [ ] Deploy do backend
- [ ] Deploy do Web
- [ ] Publicar Mobile (TestFlight/Google Play Beta)
- [ ] Configurar monitoramento (Sentry)
- [ ] Configurar backup automático

---

## 📊 CRONOGRAMA RESUMIDO

| Fase | Duração | Objetivo | Status |
|------|---------|----------|--------|
| **Fase 1** | 1 semana | Correções Críticas | ⏳ Pendente |
| **Fase 2** | 2 semanas | Módulo Financeiro | ⏳ Pendente |
| **Fase 3** | 2 semanas | Mobile Alcança Web | ⏳ Pendente |
| **Fase 4** | 2 semanas | Refatorações | ⏳ Pendente |
| **Fase 5** | 1 semana | Preparação Produção | ⏳ Pendente |

**Total:** 8 semanas (2 meses)

---

## ⚠️ O QUE DEVE SER CORRIGIDO **ANTES** DE PRODUÇÃO

### 🔴 BLOQUEADORES ABSOLUTOS

1. ✅ **BUG #8** - Busca de alunos quebrada
2. ✅ **BUG #9** - Impossível criar unidades
3. ✅ **JWT_SECRET** - Validar obrigatório
4. ✅ **Error Handler** - Não expor stack trace
5. ✅ **Módulo Financeiro** - Implementar MVP
6. ✅ **Toasts** - Feedback visual em todos os módulos
7. ✅ **Responsável Condicional** - Corrigir Mobile
8. ✅ **Controle de Roles** - Implementar no Mobile

**Sem esses itens, NÃO APROVAR para produção.**

---

## 🟡 O QUE PODE FICAR PARA **DEPOIS**

### Melhorias Não-Bloqueadoras

1. Relatórios completos (MVP pode ter apenas Dashboard)
2. Modo Evento (não faz parte do MVP)
3. Soft Delete (pode ser implementado depois)
4. Separar Professor de Student (refatoração grande)
5. Multi-tenancy (se for academia única)
6. Exportação de dados (CSV/PDF)
7. Notificações Push (Mobile)
8. Modo Offline (Mobile)

---

## 🚨 RISCOS REAIS SE ALGO FOR IGNORADO

| Item Ignorado | Risco | Probabilidade | Impacto |
|---------------|-------|---------------|---------|
| **BUG #8 (Busca)** | Impossível localizar alunos | 100% | CRÍTICO |
| **BUG #9 (Unidades)** | Impossível criar alunos | 100% | CRÍTICO |
| **JWT_SECRET** | Tokens inválidos após restart | 50% | CRÍTICO |
| **Error Handler** | Vazamento de informações | 100% | ALTO |
| **Módulo Financeiro** | Impossível gerenciar mensalidades | 100% | CRÍTICO |
| **Toasts** | UX ruim, cliques duplicados | 80% | MÉDIO |
| **Datas como String** | Queries inválidas, migração difícil | 100% | ALTO |
| **Modelo de Graduação** | Dados inconsistentes | 100% | ALTO |

---

## 📋 MILESTONES CURTOS (3-5 DIAS)

### MILESTONE 1: Backend Estável (5 dias)
- [ ] Corrigir BUG #8 e #9
- [ ] Validar JWT_SECRET
- [ ] Adicionar Error Handler
- [ ] Testes de integração

### MILESTONE 2: Feedback Visual (3 dias)
- [ ] Adicionar toasts em Web
- [ ] Adicionar toasts em Mobile
- [ ] Validar UX

### MILESTONE 3: Mobile Crítico (5 dias)
- [ ] Corrigir Responsável Condicional
- [ ] Corrigir Badge de Graduação
- [ ] Implementar Controle de Roles

### MILESTONE 4: Financeiro MVP (10 dias)
- [ ] Backend de Pagamentos
- [ ] Tela de Pagamentos (Web)
- [ ] Tela de Pagamentos (Mobile)
- [ ] Dashboard (Mobile)

### MILESTONE 5: Mobile Completo (10 dias)
- [ ] Unidades (Mobile)
- [ ] Turmas (Mobile)
- [ ] Professores (Mobile)
- [ ] Busca e Filtros (Mobile)

### MILESTONE 6: Banco de Dados (5 dias)
- [ ] Migrar datas para DateTime
- [ ] Refatorar modelo de Graduação
- [ ] Adicionar índices

### MILESTONE 7: Produção (5 dias)
- [ ] Testes E2E completos
- [ ] Documentação de API
- [ ] Deploy em Staging
- [ ] Validação final

---

## 🎯 RECOMENDAÇÃO FINAL

### ✅ APROVAR PARA HOMOLOGAÇÃO APÓS:
- Milestone 1 (Backend Estável)
- Milestone 2 (Feedback Visual)
- Milestone 3 (Mobile Crítico)

**Tempo:** 13 dias (2.5 semanas)

### ✅ APROVAR PARA PRODUÇÃO APÓS:
- Milestone 4 (Financeiro MVP)
- Milestone 5 (Mobile Completo)
- Milestone 6 (Banco de Dados)
- Milestone 7 (Produção)

**Tempo:** 43 dias (8.5 semanas)

---

## 📊 RECURSOS NECESSÁRIOS

### Equipe Mínima
- 1 Backend Developer (full-time)
- 1 Frontend Developer (Web - full-time)
- 1 Mobile Developer (full-time)
- 1 QA Engineer (part-time)
- 1 DevOps (part-time)

### Equipe Ideal
- 2 Backend Developers
- 1 Frontend Developer (Web)
- 2 Mobile Developers
- 1 QA Engineer
- 1 DevOps
- 1 Product Owner

---

**Assinatura:**  
**QA Engineer Sênior + Arquiteto de Software Full Stack**  
**Data:** 22/01/2026

---

## 📎 ANEXOS

### Checklist de Validação Final

- [ ] Todos os bugs críticos corrigidos
- [ ] Módulo Financeiro implementado
- [ ] Mobile tem paridade com Web
- [ ] Banco de dados migrado para DateTime
- [ ] Testes E2E passando
- [ ] Documentação de API completa
- [ ] Deploy em Staging funcionando
- [ ] Backup automático configurado
- [ ] Monitoramento (Sentry) ativo
- [ ] Variáveis de ambiente configuradas
- [ ] JWT_SECRET seguro
- [ ] Error handler implementado
- [ ] Toasts em todos os módulos
- [ ] Controle de Roles funcionando
- [ ] Performance validada (< 2s)
