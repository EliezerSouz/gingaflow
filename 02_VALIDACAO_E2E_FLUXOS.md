# 🧪 VALIDAÇÃO E2E - DO INÍCIO AO FIM
**QA Engineer Sênior + Arquiteto de Software Full Stack**  
**Data:** 22/01/2026  
**Projeto:** GingaFlow  
**Objetivo:** Validar cada fluxo comparando **Web x Mobile x Banco**

---

## 📋 METODOLOGIA

Para cada fluxo, responder:
- ✔️ **O fluxo existe no Web?**
- ✔️ **O fluxo existe no Mobile?**
- ⚠️ **Há divergência?**
- ❌ **O que está quebrado?**
- 🔧 **O que precisa ser ajustado?**
- 📱 **O que deve ser priorizado no Mobile?**

---

## FLUXO 1: CRIAÇÃO DE USUÁRIO (AUTH)

### ✔️ Existe no Web?
**SIM** - Funcionalidade implementada

**Detalhes:**
- Rota: `/auth/register` (POST)
- Campos: name, email, password, role (ADMIN/PROFESSOR)
- Validação: email único, senha com hash bcrypt
- Retorno: JWT token

### ✔️ Existe no Mobile?
**PARCIAL** - Login implementado, registro não visível

**Detalhes:**
- Tela de Login existe (`LoginScreen.tsx`)
- Não há tela de registro de novo usuário
- Provavelmente registro é feito apenas pelo Admin no Web

### ⚠️ Há divergência?
**SIM** - Mobile não possui tela de registro

**Divergências identificadas:**
1. Web permite criar usuários (Admin)
2. Mobile só permite login
3. Não há fluxo de "esqueci minha senha"

### ❌ O que está quebrado?
1. **JWT_SECRET gerado aleatoriamente** se não houver env var (CRÍTICO)
2. **Ausência de refresh token** (sessão expira sem aviso)
3. **Ausência de rate limiting** (vulnerável a brute force)

### 🔧 O que precisa ser ajustado?

**Backend:**
```typescript
// ❌ ATUAL (apps/api/src/server.ts)
await server.register(jwt, {
  secret: process.env.JWT_SECRET || crypto.randomUUID()  // INSEGURO
})

// ✅ CORRIGIR
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET é obrigatório')
}
await server.register(jwt, {
  secret: process.env.JWT_SECRET
})
```

**Web:**
- ✅ Já implementado corretamente

**Mobile:**
- Adicionar tela de "Esqueci minha senha" (opcional)
- Validar se token está sendo persistido corretamente

### 📱 Prioridade Mobile?
🟡 **MÉDIA** - Login funciona, registro não é necessário no Mobile (Admin cria no Web)

**Ação recomendada:**
- Validar persistência de token
- Implementar logout
- Adicionar feedback visual ao fazer login

---

## FLUXO 2: LOGIN / SESSÃO

### ✔️ Existe no Web?
**SIM** - Totalmente funcional

**Detalhes:**
- Rota: `/auth/login` (POST)
- Validação de credenciais
- Geração de JWT
- Armazenamento em localStorage
- Middleware de autenticação em rotas protegidas

### ✔️ Existe no Mobile?
**SIM** - Implementado

**Detalhes:**
- Tela: `LoginScreen.tsx`
- Context: `AuthContext` (provavelmente)
- Armazenamento: AsyncStorage (verificar)

### ⚠️ Há divergência?
**VALIDAR** - Não foi testado end-to-end

**Pontos a validar:**
1. Token está sendo persistido corretamente?
2. Sessão persiste após fechar o app?
3. Logout funciona?
4. Token expirado é tratado?

### ❌ O que está quebrado?
**Nada identificado** - Mas falta validação E2E

### 🔧 O que precisa ser ajustado?

**Mobile:**
1. Validar se está usando AsyncStorage (não localStorage)
2. Implementar tratamento de token expirado
3. Adicionar loading state ao fazer login
4. Adicionar feedback de erro (toast)

**Backend:**
- Implementar refresh token (opcional)
- Adicionar rate limiting (5 tentativas por minuto)

### 📱 Prioridade Mobile?
🔴 **CRÍTICA** - Validar funcionamento completo

**Checklist de validação:**
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas (mostrar erro)
- [ ] Persistência de sessão (fechar e abrir app)
- [ ] Logout (limpar token)
- [ ] Token expirado (redirecionar para login)
- [ ] Roles (ADMIN vs PROFESSOR)

---

## FLUXO 3: CRIAÇÃO DE CONTAS (UNIDADES)

### ✔️ Existe no Web?
**PARCIAL** - Implementado mas com BUG CRÍTICO

**Detalhes:**
- Rota: `/units` (POST)
- Campos: name, address, color, status, defaultMonthlyFeeCents, defaultPaymentMethod
- **BUG #9:** Erro 422 ao criar/editar unidades
- Dados criados desaparecem do banco

### ✔️ Existe no Mobile?
**NÃO** - Módulo não implementado

**Detalhes:**
- Não há tela de Unidades
- Não há menu para acessar Unidades
- Alunos não podem ser vinculados a unidades

### ⚠️ Há divergência?
**SIM** - Funcionalidade ausente no Mobile

### ❌ O que está quebrado?

**Web (BUG CRÍTICO #9):**
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

**Causa raiz:**
- Uso de `as any` esconde erros de tipo
- Campos opcionais não tratados corretamente
- Possível incompatibilidade entre schema Zod e Prisma

### 🔧 O que precisa ser ajustado?

**Backend (URGENTE):**
```typescript
// ✅ CORREÇÃO
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

**Web:**
- Adicionar toast de confirmação
- Adicionar validação visual de campos obrigatórios

**Mobile:**
- **IMPLEMENTAR MÓDULO COMPLETO**
- Criar tela de listagem de unidades
- Criar modal/tela de criação/edição
- Integrar com API

### 📱 Prioridade Mobile?
🔴 **CRÍTICA** - Essencial para vincular alunos e turmas

**Funcionalidades necessárias:**
1. Listar unidades
2. Criar unidade
3. Editar unidade
4. Deletar unidade (opcional)
5. Selecionar unidade ao criar turma
6. Filtrar turmas por unidade

---

## FLUXO 4: SALDO INICIAL (FINANCEIRO)

### ✔️ Existe no Web?
**NÃO** - Módulo Financeiro não implementado

### ✔️ Existe no Mobile?
**NÃO** - Módulo Financeiro não implementado

### ⚠️ Há divergência?
**NÃO** - Ambos não implementados

### ❌ O que está quebrado?
**MÓDULO INTEIRO AUSENTE** (BUG #15)

**Impacto:**
- Impossível registrar pagamentos
- Impossível controlar inadimplência
- Impossível gerar relatórios financeiros
- **IMPEDE PRODUÇÃO**

### 🔧 O que precisa ser ajustado?

**Banco de Dados:**
```prisma
// ✅ Tabela já existe
model Payment {
  id              String    @id @default(uuid())
  studentId       String
  student         Student   @relation(fields: [studentId], references: [id], onDelete: Cascade)
  monthlyFeeCents Int
  dueDay          Int
  period          String    // "2026-01"
  status          String    // "PAID", "PENDING", "OVERDUE"
  paidAt          DateTime?
  method          String?   // "PIX", "DINHEIRO", "CARTAO"
  notes           String?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  @@unique([studentId, period])
}
```

**Backend (IMPLEMENTAR):**
```typescript
// apps/api/src/routes/payments.routes.ts
import { FastifyInstance } from 'fastify'

export async function paymentsRoutes(app: FastifyInstance) {
  // GET /payments - Listar pagamentos
  app.get('/payments', async (req) => {
    const { studentId, status, period } = req.query
    
    const payments = await prisma.payment.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(status && { status }),
        ...(period && { period })
      },
      include: {
        student: {
          select: { full_name: true }
        }
      },
      orderBy: { period: 'desc' }
    })
    
    return payments
  })
  
  // POST /payments - Criar pagamento
  app.post('/payments', async (req) => {
    const { studentId, monthlyFeeCents, dueDay, period, status, method, notes } = req.body
    
    const payment = await prisma.payment.create({
      data: {
        studentId,
        monthlyFeeCents,
        dueDay,
        period,
        status,
        method,
        notes,
        paidAt: status === 'PAID' ? new Date() : null
      }
    })
    
    return payment
  })
  
  // PUT /payments/:id - Marcar como pago
  app.put('/payments/:id', async (req) => {
    const { id } = req.params
    const { status, method, paidAt } = req.body
    
    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        method,
        paidAt: status === 'PAID' ? (paidAt || new Date()) : null
      }
    })
    
    return payment
  })
}
```

**Web (IMPLEMENTAR):**
- Criar página `/financeiro/pagamentos`
- Listar pagamentos com filtros (aluno, status, período)
- Modal para registrar pagamento
- Botão "Marcar como Pago"
- Indicador visual de inadimplência

**Mobile (IMPLEMENTAR):**
- Tela de Pagamentos
- Filtros por aluno e status
- Registrar pagamento rápido
- Notificação de vencimentos próximos

### 📱 Prioridade Mobile?
🔴 **CRÍTICA** - Essencial para academias

**MVP Financeiro:**
1. Registrar pagamento manual
2. Listar pagamentos do aluno
3. Marcar como pago
4. Indicador de inadimplência

---

## FLUXO 5: LANÇAMENTOS (ENTRADA / SAÍDA / TRANSFERÊNCIA)

### ✔️ Existe no Web?
**NÃO** - Não há controle de caixa/tesouraria

### ✔️ Existe no Mobile?
**NÃO** - Não implementado

### ⚠️ Há divergência?
**NÃO** - Ambos não implementados

### ❌ O que está quebrado?
**FUNCIONALIDADE NÃO EXISTE**

**Observação:**
- Sistema atual só gerencia **mensalidades de alunos**
- Não há controle de **outras receitas** (eventos, produtos)
- Não há controle de **despesas** (aluguel, equipamentos)
- Não há **fluxo de caixa**

### 🔧 O que precisa ser ajustado?

**Decisão de Produto:**
1. **Opção A:** Manter escopo apenas em mensalidades (MVP)
2. **Opção B:** Implementar controle financeiro completo (Roadmap futuro)

**Se Opção B (Recomendado para academias):**

```prisma
// Adicionar ao schema.prisma
model Transaction {
  id          String   @id @default(uuid())
  type        String   // "INCOME", "EXPENSE", "TRANSFER"
  category    String   // "MENSALIDADE", "EVENTO", "ALUGUEL", "EQUIPAMENTO"
  amount      Int      // em centavos
  date        DateTime
  description String?
  paymentId   String?  // FK para Payment (se for mensalidade)
  payment     Payment? @relation(fields: [paymentId], references: [id])
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
}
```

### 📱 Prioridade Mobile?
🟢 **BAIXA** - Não faz parte do MVP atual

**Recomendação:**
- Focar primeiro em Pagamentos de Mensalidades
- Deixar controle de caixa completo para versão futura

---

## FLUXO 6: CATEGORIAS E SUBCATEGORIAS

### ✔️ Existe no Web?
**PARCIAL** - Apenas Graduações (que são categorias de cordas)

**Detalhes:**
- Graduações funcionam como "categorias" de níveis
- Não há categorias financeiras
- Não há categorias de despesas

### ✔️ Existe no Mobile?
**PARCIAL** - Graduações implementadas

### ⚠️ Há divergência?
**NÃO** - Ambos possuem apenas Graduações

### ❌ O que está quebrado?
**Modelo de Graduação inadequado**

**Problema Arquitetural:**
```prisma
// ❌ ATUAL
model Graduation {
  id          String   @id @default(uuid())
  studentId   String
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  type        String   // ❌ Campo livre (deveria ser FK)
  level       String   // ❌ Campo livre (deveria ser FK)
  date        String   // ❌ String ao invés de DateTime
  teacherId   String?  // ❌ String ao invés de FK
  teacher     Student? @relation("PromoterTeacher", fields: [teacherId], references: [id])
  notes       String?
}
```

**Impacto:**
- Graduações não são entidades padronizadas
- Impossível garantir consistência de dados
- Relatórios de graduação ficam imprecisos

### 🔧 O que precisa ser ajustado?

**Banco de Dados (REFATORAÇÃO IMPORTANTE):**
```prisma
// ✅ MODELO CORRETO
model GraduationDefinition {
  id          String   @id @default(uuid())
  name        String   // "Crua (Branca)"
  description String?
  category    String   // "Infantil", "Adulto"
  grau        Int      // 1, 2, 3...
  cordaType   String   // "UNICA", "DUPLA", "COM_PONTAS"
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
  date          DateTime  // ✅ DateTime ao invés de String
  teacherId     String?
  notes         String?
  created_at    DateTime @default(now())
  
  student       Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  graduation    GraduationDefinition @relation(fields: [graduationId], references: [id])
  teacher       Student? @relation("TeacherGraduation", fields: [teacherId], references: [id])
  
  @@unique([studentId, graduationId, date])
}
```

**Observação:**
- Tabela `GraduationLevel` já existe no banco!
- Mas não está sendo usada corretamente
- Precisa refatorar para usar FK ao invés de strings

### 📱 Prioridade Mobile?
🟡 **ALTA** - Badge de graduação não aparece corretamente

**Problema Mobile:**
- Badge não renderiza porque falta campo `level`
- API não retorna `level` nas graduações
- Workaround: parsear campo `notes`

**Ação imediata:**
```typescript
// Mobile: src/components/CordaBadge.tsx
// Adicionar fallback para extrair level das notes
const level = graduation.level || extractLevelFromNotes(graduation.notes)
```

---

## FLUXO 7: DATAS RETROATIVAS

### ✔️ Existe no Web?
**SIM** - Permite datas retroativas

**Detalhes:**
- Data de nascimento: campo livre
- Data de matrícula: campo livre
- Data de graduação: campo livre
- Não há validação de datas futuras

### ✔️ Existe no Mobile?
**SIM** - DatePicker permite qualquer data

### ⚠️ Há divergência?
**NÃO** - Ambos permitem datas retroativas

### ❌ O que está quebrado?
**Datas armazenadas como STRING**

**Problema Crítico:**
```prisma
// ❌ ATUAL
model Student {
  birth_date     String?  // ❌ Deveria ser DateTime
  enrollment_date String  // ❌ Deveria ser DateTime
}

model Attendance {
  date       String  // ❌ Deveria ser DateTime
}

model Graduation {
  date       String  // ❌ Deveria ser DateTime
}
```

**Impacto:**
- Impossível fazer queries por intervalo de datas
- Ordenação incorreta
- Validação frágil
- Problemas de timezone

### 🔧 O que precisa ser ajustado?

**Migração do Banco (IMPORTANTE):**
```sql
-- Migration: Converter datas de String para DateTime
-- ATENÇÃO: Backup obrigatório antes de executar

-- 1. Criar colunas temporárias
ALTER TABLE Student ADD COLUMN birth_date_temp DATETIME;
ALTER TABLE Student ADD COLUMN enrollment_date_temp DATETIME;
ALTER TABLE Attendance ADD COLUMN date_temp DATETIME;
ALTER TABLE Graduation ADD COLUMN date_temp DATETIME;

-- 2. Converter dados existentes (formato: "YYYY-MM-DD")
UPDATE Student SET birth_date_temp = datetime(birth_date) WHERE birth_date IS NOT NULL;
UPDATE Student SET enrollment_date_temp = datetime(enrollment_date);
UPDATE Attendance SET date_temp = datetime(date);
UPDATE Graduation SET date_temp = datetime(date);

-- 3. Remover colunas antigas
ALTER TABLE Student DROP COLUMN birth_date;
ALTER TABLE Student DROP COLUMN enrollment_date;
ALTER TABLE Attendance DROP COLUMN date;
ALTER TABLE Graduation DROP COLUMN date;

-- 4. Renomear colunas temporárias
ALTER TABLE Student RENAME COLUMN birth_date_temp TO birth_date;
ALTER TABLE Student RENAME COLUMN enrollment_date_temp TO enrollment_date;
ALTER TABLE Attendance RENAME COLUMN date_temp TO date;
ALTER TABLE Graduation RENAME COLUMN date_temp TO date;
```

**Schema Prisma (ATUALIZAR):**
```prisma
model Student {
  birth_date     DateTime?  // ✅
  enrollment_date DateTime  // ✅
}

model Attendance {
  date       DateTime  // ✅
}

model Graduation {
  date       DateTime  // ✅
}
```

### 📱 Prioridade Mobile?
🟡 **ALTA** - Garantir que Mobile envia DateTime correto

**Validação necessária:**
- Mobile está enviando ISO 8601? (`2026-01-22T14:30:00.000Z`)
- Backend está parseando corretamente?
- Timezone está sendo tratado?

---

## FLUXO 8: EDIÇÃO E EXCLUSÃO

### ✔️ Existe no Web?
**SIM** - Totalmente funcional

**Detalhes:**
- Editar: Alunos, Professores, Unidades, Turmas, Graduações
- Deletar: Todos os módulos acima
- Cascade delete configurado corretamente

### ✔️ Existe no Mobile?
**PARCIAL** - Editar alunos funciona, outros módulos não testados

**Detalhes:**
- Editar aluno: ✅ Implementado
- Deletar aluno: ❓ Não validado
- Editar graduação: ✅ Implementado
- Outros módulos: ❌ Não implementados

### ⚠️ Há divergência?
**SIM** - Mobile não possui todos os módulos

### ❌ O que está quebrado?
**Nada** - Funcionalidades implementadas funcionam

### 🔧 O que precisa ser ajustado?

**Mobile:**
1. Implementar edição de Unidades (quando módulo for criado)
2. Implementar edição de Turmas (quando módulo for criado)
3. Validar se deletar aluno funciona
4. Adicionar confirmação antes de deletar

**Web:**
- Adicionar toast de confirmação ao editar/deletar

### 📱 Prioridade Mobile?
🟡 **MÉDIA** - Funcionalidades básicas já existem

**Checklist:**
- [ ] Editar aluno (já funciona)
- [ ] Deletar aluno (validar)
- [ ] Confirmação antes de deletar
- [ ] Toast de sucesso/erro

---

## FLUXO 9: CÁLCULO DE SALDO

### ✔️ Existe no Web?
**NÃO** - Módulo Financeiro não implementado

### ✔️ Existe no Mobile?
**NÃO** - Módulo Financeiro não implementado

### ⚠️ Há divergência?
**NÃO** - Ambos não implementados

### ❌ O que está quebrado?
**FUNCIONALIDADE NÃO EXISTE**

### 🔧 O que precisa ser ajustado?

**Backend (IMPLEMENTAR):**
```typescript
// apps/api/src/routes/students.routes.ts
app.get('/students/:id/balance', async (req) => {
  const { id } = req.params
  
  // Buscar todos os pagamentos do aluno
  const payments = await prisma.payment.findMany({
    where: { studentId: id },
    orderBy: { period: 'asc' }
  })
  
  // Calcular saldo
  const totalExpected = payments.reduce((sum, p) => sum + p.monthlyFeeCents, 0)
  const totalPaid = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.monthlyFeeCents, 0)
  
  const balance = totalPaid - totalExpected
  const overdue = payments.filter(p => p.status === 'OVERDUE').length
  
  return {
    totalExpected,
    totalPaid,
    balance,
    overdueCount: overdue,
    status: balance >= 0 ? 'EM_DIA' : 'ATRASADO'
  }
})
```

**Web/Mobile (IMPLEMENTAR):**
- Exibir saldo no perfil do aluno
- Indicador visual (verde/vermelho)
- Histórico de pagamentos

### 📱 Prioridade Mobile?
🔴 **CRÍTICA** - Essencial para gestão financeira

---

## FLUXO 10: RELATÓRIOS / RESUMOS

### ✔️ Existe no Web?
**NÃO** - Módulo não implementado (BUG #16)

**Detalhes:**
- Menu "Relatórios" existe
- Redireciona para página de placeholder
- Nenhuma funcionalidade disponível

### ✔️ Existe no Mobile?
**NÃO** - Módulo não implementado

### ⚠️ Há divergência?
**NÃO** - Ambos não implementados

### ❌ O que está quebrado?
**MÓDULO INTEIRO AUSENTE**

### 🔧 O que precisa ser ajustado?

**Backend (IMPLEMENTAR):**
```typescript
// apps/api/src/routes/reports.routes.ts
export async function reportsRoutes(app: FastifyInstance) {
  // Relatório Financeiro
  app.get('/reports/financial', async (req) => {
    const { startDate, endDate } = req.query
    
    const payments = await prisma.payment.findMany({
      where: {
        period: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    
    const totalRevenue = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.monthlyFeeCents, 0)
    
    const totalPending = payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.monthlyFeeCents, 0)
    
    const totalOverdue = payments
      .filter(p => p.status === 'OVERDUE')
      .reduce((sum, p) => sum + p.monthlyFeeCents, 0)
    
    return {
      totalRevenue,
      totalPending,
      totalOverdue,
      paymentsByMonth: groupByMonth(payments)
    }
  })
  
  // Relatório de Alunos
  app.get('/reports/students', async (req) => {
    const total = await prisma.student.count()
    const active = await prisma.student.count({ where: { status: 'ATIVO' } })
    const inactive = await prisma.student.count({ where: { status: 'INATIVO' } })
    
    const byGraduation = await prisma.student.groupBy({
      by: ['currentGraduationId'],
      _count: true
    })
    
    return {
      total,
      active,
      inactive,
      byGraduation
    }
  })
  
  // Relatório de Frequência
  app.get('/reports/attendance', async (req) => {
    const { turmaId, startDate, endDate } = req.query
    
    const attendances = await prisma.attendance.findMany({
      where: {
        turmaId,
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    })
    
    const present = attendances.filter(a => a.status === 'PRESENT').length
    const absent = attendances.filter(a => a.status === 'ABSENT').length
    
    return {
      total: attendances.length,
      present,
      absent,
      attendanceRate: (present / attendances.length) * 100
    }
  })
}
```

### 📱 Prioridade Mobile?
🟡 **ALTA** - Importante para gestão, mas não bloqueador

**MVP Relatórios Mobile:**
1. Dashboard com resumo (total alunos, receita mensal)
2. Gráfico simples de frequência
3. Lista de inadimplentes

---

## 📊 RESUMO DE VALIDAÇÃO E2E

### ✅ FLUXOS FUNCIONANDO (WEB + MOBILE)
1. Login / Sessão (parcial)
2. Criar/Editar Aluno
3. Criar/Editar Graduação
4. Editar Professor (Web)

### ⚠️ FLUXOS COM BUGS CRÍTICOS
1. **Criar Unidades** (BUG #9 - erro 422)
2. **Buscar Alunos** (BUG #8 - query Prisma inválida)
3. **Autenticação** (JWT_SECRET aleatório)

### ❌ FLUXOS NÃO IMPLEMENTADOS
1. **Financeiro completo** (Pagamentos, Saldo, Inadimplência)
2. **Relatórios** (Financeiro, Alunos, Frequência)
3. **Modo Evento**
4. **Unidades/Turmas no Mobile**
5. **Professores no Mobile**

### 🔧 AJUSTES PRIORITÁRIOS

#### 🔴 CRÍTICOS (Bloqueadores)
1. Corrigir BUG #8 (busca de alunos)
2. Corrigir BUG #9 (criar unidades)
3. Validar JWT_SECRET obrigatório
4. Implementar módulo Financeiro (MVP)

#### 🟡 IMPORTANTES (Alta prioridade)
5. Migrar datas de String para DateTime
6. Refatorar modelo de Graduação
7. Implementar Unidades/Turmas no Mobile
8. Implementar Professores no Mobile
9. Adicionar toasts em todos os módulos

#### 🟢 DESEJÁVEIS (Médio prazo)
10. Implementar Relatórios
11. Separar Professor de Student (refatoração de banco)
12. Implementar refresh token
13. Adicionar rate limiting

---

**Assinatura:**  
**QA Engineer Sênior + Arquiteto de Software Full Stack**  
**Data:** 22/01/2026
