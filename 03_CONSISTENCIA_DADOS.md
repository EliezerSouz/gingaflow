# 📊 CONSISTÊNCIA DE DADOS - WEB x MOBILE x BANCO
**QA Engineer Sênior + Arquiteto de Software Full Stack**  
**Data:** 22/01/2026  
**Projeto:** GingaFlow  
**Objetivo:** Validar consistência de dados entre plataformas

---

## 🎯 METODOLOGIA

Para cada entidade, validar:
- **Nomes de campos** (Web vs Mobile vs Banco)
- **Tipos de dados** (String vs DateTime vs Int)
- **Regras de cálculo**
- **Valores padrão (defaults)**
- **Campos obrigatórios**
- **Campos que não existem em uma das plataformas**

---

## 1️⃣ ENTIDADE: STUDENT (ALUNO)

### 📋 Mapeamento de Campos

| Campo | Web | Mobile | Backend | Banco | Tipo Banco | Tipo Esperado | Status |
|-------|-----|--------|---------|-------|------------|---------------|--------|
| **IDENTIFICAÇÃO** |
| id | ✅ | ✅ | ✅ | ✅ | String (UUID) | String (UUID) | ✅ OK |
| full_name | ✅ | ✅ | ✅ | ✅ | String | String | ✅ OK |
| cpf | ✅ | ✅ | ✅ | ✅ | String (unique) | String (unique) | ✅ OK |
| **DADOS PESSOAIS** |
| birth_date | ✅ | ✅ | ✅ | ✅ | **String** | **DateTime** | ❌ INCONSISTENTE |
| email | ✅ | ✅ | ✅ | ✅ | String? | String? | ✅ OK |
| phone | ✅ | ✅ | ✅ | ✅ | String? | String? | ✅ OK |
| status | ✅ | ✅ | ✅ | ✅ | String | Enum | ⚠️ MELHORAR |
| **CAPOEIRA** |
| enrollment_date | ✅ | ✅ | ✅ | ✅ | **String** | **DateTime** | ❌ INCONSISTENTE |
| currentGraduationId | ✅ | ✅ | ✅ | ✅ | String? | String (FK) | ✅ OK |
| **METADADOS** |
| notes | ✅ | ✅ | ✅ | ✅ | String? | String? | ⚠️ USADO INCORRETAMENTE |
| created_at | ✅ | ❓ | ✅ | ✅ | DateTime | DateTime | ⚠️ VALIDAR MOBILE |
| updated_at | ✅ | ❓ | ✅ | ✅ | DateTime | DateTime | ⚠️ VALIDAR MOBILE |

### ❌ INCONSISTÊNCIAS IDENTIFICADAS

#### 1. **Datas como String**
**Problema:**
```prisma
// ❌ ATUAL
model Student {
  birth_date     String?
  enrollment_date String
}
```

**Impacto:**
- Impossível fazer queries por intervalo (`WHERE birth_date BETWEEN`)
- Ordenação incorreta (`"2026-01-09" > "2026-01-10"` alfabeticamente)
- Validação frágil (aceita valores inválidos)
- Problemas de timezone

**Solução:**
```prisma
// ✅ CORRETO
model Student {
  birth_date     DateTime?
  enrollment_date DateTime
}
```

**Migração necessária:** SIM (com backup obrigatório)

---

#### 2. **Status como String livre**
**Problema:**
```typescript
// Valores encontrados no banco:
"ATIVO", "INATIVO", "PENDENTE", "Ativo", "ativo", "SUSPENSO"
```

**Impacto:**
- Inconsistência de dados (case-sensitive)
- Filtros quebrados
- Impossível garantir integridade

**Solução:**
```prisma
// ✅ CORRETO
enum StudentStatus {
  ATIVO
  INATIVO
  PENDENTE
  SUSPENSO
}

model Student {
  status StudentStatus @default(ATIVO)
}
```

---

#### 3. **Campo `notes` usado incorretamente**
**Problema:**
```typescript
// Web armazena dados estruturados em notes:
notes: `
[TIPO] PROFESSOR
[TURMAS] turma-id-1,turma-id-2
[RESPONSAVEL] Nome: João, CPF: 123.456.789-00
`
```

**Impacto:**
- Parsing frágil
- Impossível fazer queries estruturadas
- Dados não normalizados
- Risco de perda de dados

**Solução:**
- Criar tabelas separadas (ResponsiblePerson, TeacherData)
- Usar relacionamentos FK
- Manter `notes` apenas para observações livres

---

### 🔧 CAMPOS AUSENTES

#### Web possui, Mobile não:
- ❌ Nenhum (Mobile tem todos os campos do Web)

#### Mobile possui, Web não:
- ❌ Nenhum (ambos sincronizados)

#### Banco possui, ambos não usam:
- ⚠️ `updated_at` (não exibido na UI)

---

### ✅ REGRAS DE VALIDAÇÃO

| Regra | Web | Mobile | Backend | Status |
|-------|-----|--------|---------|--------|
| Nome obrigatório | ✅ | ✅ | ✅ | ✅ OK |
| CPF obrigatório | ✅ | ✅ | ✅ | ✅ OK |
| CPF único | ✅ | ❓ | ✅ | ⚠️ VALIDAR MOBILE |
| CPF válido | ⚠️ | ⚠️ | ⚠️ | ⚠️ MUITO RESTRITIVO |
| Email formato válido | ✅ | ❓ | ❌ | ⚠️ VALIDAR |
| Telefone formato válido | ✅ | ✅ | ❌ | ⚠️ BACKEND NÃO VALIDA |
| Data nascimento < hoje | ❓ | ❓ | ❌ | ❌ NÃO VALIDADO |
| Menor de idade → Responsável obrigatório | ✅ | ❌ | ❌ | ❌ MOBILE NÃO VALIDA |

---

## 2️⃣ ENTIDADE: GRADUATION (GRADUAÇÃO)

### 📋 Mapeamento de Campos

| Campo | Web | Mobile | Backend | Banco | Tipo Banco | Tipo Esperado | Status |
|-------|-----|--------|---------|-------|------------|---------------|--------|
| id | ✅ | ✅ | ✅ | ✅ | String (UUID) | String (UUID) | ✅ OK |
| studentId | ✅ | ✅ | ✅ | ✅ | String (FK) | String (FK) | ✅ OK |
| previousGraduationId | ✅ | ❓ | ✅ | ✅ | String? | String (FK) | ⚠️ VALIDAR MOBILE |
| newGraduationId | ✅ | ❓ | ✅ | ✅ | String (FK) | String (FK) | ⚠️ VALIDAR MOBILE |
| date | ✅ | ✅ | ✅ | ✅ | **String** | **DateTime** | ❌ INCONSISTENTE |
| teacherId | ✅ | ✅ | ✅ | ✅ | String? (FK) | String (FK) | ✅ OK |
| type | ✅ | ❓ | ✅ | ✅ | String | Enum | ⚠️ MELHORAR |
| notes | ✅ | ✅ | ✅ | ✅ | String? | String? | ✅ OK |
| created_at | ✅ | ❓ | ✅ | ✅ | DateTime | DateTime | ⚠️ VALIDAR MOBILE |

### ❌ INCONSISTÊNCIAS IDENTIFICADAS

#### 1. **Data como String**
**Problema:** Mesmo problema do Student

**Solução:**
```prisma
model Graduation {
  date DateTime  // ✅
}
```

---

#### 2. **Modelo inadequado (CRÍTICO)**
**Problema:**
```prisma
// ❌ ATUAL - Graduação é um EVENTO, não uma DEFINIÇÃO
model Graduation {
  id          String   @id
  studentId   String
  type        String   // ❌ Campo livre
  // ...
}
```

**Deveria ser:**
```prisma
// ✅ CORRETO - Separar DEFINIÇÃO de EVENTO
model GraduationDefinition {
  id          String   @id
  name        String   // "Crua (Branca)"
  grau        Int      // 1, 2, 3...
  cordaType   String   // "UNICA", "DUPLA", "COM_PONTAS"
  color       String?
  // ...
  
  events      StudentGraduation[]  // Eventos de graduação
}

model StudentGraduation {
  id            String   @id
  studentId     String
  graduationId  String   // ✅ FK para GraduationDefinition
  date          DateTime
  teacherId     String?
  // ...
}
```

**Impacto:**
- Graduações não são padronizadas
- Impossível garantir consistência
- Relatórios imprecisos
- Histórico não confiável

---

## 3️⃣ ENTIDADE: GRADUATIONLEVEL (DEFINIÇÃO DE GRADUAÇÃO)

### 📋 Mapeamento de Campos

| Campo | Web | Mobile | Backend | Banco | Status |
|-------|-----|--------|---------|-------|--------|
| id | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| name | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| description | ✅ | ❓ | ✅ | ✅ | ⚠️ VALIDAR MOBILE |
| category | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| grau | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO USA** |
| cordaType | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| color | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| colorLeft | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| colorRight | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| pontaLeft | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| pontaRight | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| order | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| active | ✅ | ✅ | ✅ | ✅ | ✅ OK |

### ❌ INCONSISTÊNCIAS IDENTIFICADAS

#### 1. **Campo `grau` não usado no Mobile**
**Problema:**
- Mobile não exibe o grau da graduação
- Badge não renderiza corretamente
- Falta informação visual importante

**Solução:**
```typescript
// Mobile: src/components/CordaBadge.tsx
// Adicionar exibição do grau
<Text style={styles.grau}>Grau {graduation.grau}</Text>
```

---

## 4️⃣ ENTIDADE: UNIT (UNIDADE)

### 📋 Mapeamento de Campos

| Campo | Web | Mobile | Backend | Banco | Status |
|-------|-----|--------|---------|-------|--------|
| id | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |
| name | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |
| address | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |
| color | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |
| defaultMonthlyFeeCents | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |
| defaultPaymentMethod | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |
| status | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |

### ❌ INCONSISTÊNCIAS IDENTIFICADAS

#### 1. **Módulo completamente ausente no Mobile**
**Impacto:**
- Impossível criar/editar unidades no Mobile
- Alunos não podem ser vinculados a unidades
- Turmas não podem ser vinculadas a unidades

**Prioridade:** 🔴 CRÍTICA

---

## 5️⃣ ENTIDADE: TURMA

### 📋 Mapeamento de Campos

| Campo | Web | Mobile | Backend | Banco | Status |
|-------|-----|--------|---------|-------|--------|
| id | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |
| name | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |
| unitId | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |
| schedule | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |
| defaultMonthlyFeeCents | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |
| defaultPaymentMethod | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |
| status | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO IMPLEMENTADO** |

### ❌ INCONSISTÊNCIAS IDENTIFICADAS

#### 1. **Módulo completamente ausente no Mobile**
**Prioridade:** 🔴 CRÍTICA

#### 2. **Campo "Horário de Término" ausente**
**Problema:**
- Só existe "Horário de Início"
- Impossível definir duração da aula
- Agenda fica incompleta

**Solução:**
```prisma
model Turma {
  schedule_start String?  // "19:00"
  schedule_end   String?  // "20:30"
  // ou melhor:
  schedule_start DateTime?
  schedule_end   DateTime?
}
```

---

## 6️⃣ ENTIDADE: PAYMENT (PAGAMENTO)

### 📋 Mapeamento de Campos

| Campo | Web | Mobile | Backend | Banco | Status |
|-------|-----|--------|---------|-------|--------|
| id | ❌ | ❌ | ❌ | ✅ | ❌ **NÃO IMPLEMENTADO** |
| studentId | ❌ | ❌ | ❌ | ✅ | ❌ **NÃO IMPLEMENTADO** |
| monthlyFeeCents | ❌ | ❌ | ❌ | ✅ | ❌ **NÃO IMPLEMENTADO** |
| dueDay | ❌ | ❌ | ❌ | ✅ | ❌ **NÃO IMPLEMENTADO** |
| period | ❌ | ❌ | ❌ | ✅ | ❌ **NÃO IMPLEMENTADO** |
| status | ❌ | ❌ | ❌ | ✅ | ❌ **NÃO IMPLEMENTADO** |
| paidAt | ❌ | ❌ | ❌ | ✅ | ❌ **NÃO IMPLEMENTADO** |
| method | ❌ | ❌ | ❌ | ✅ | ❌ **NÃO IMPLEMENTADO** |

### ❌ INCONSISTÊNCIAS IDENTIFICADAS

#### 1. **Módulo completamente ausente**
**Impacto:** BLOQUEADOR para produção

#### 2. **Data como DateTime? (correto!)**
```prisma
model Payment {
  paidAt DateTime?  // ✅ CORRETO
}
```

**Observação:** Esta é a ÚNICA entidade com data correta!

---

## 7️⃣ ENTIDADE: ATTENDANCE (PRESENÇA)

### 📋 Mapeamento de Campos

| Campo | Web | Mobile | Backend | Banco | Tipo Banco | Tipo Esperado | Status |
|-------|-----|--------|---------|-------|------------|---------------|--------|
| id | ❓ | ✅ | ❓ | ✅ | String (UUID) | String (UUID) | ⚠️ VALIDAR WEB |
| studentId | ❓ | ✅ | ❓ | ✅ | String (FK) | String (FK) | ⚠️ VALIDAR WEB |
| turmaId | ❓ | ✅ | ❓ | ✅ | String (FK) | String (FK) | ⚠️ VALIDAR WEB |
| date | ❓ | ✅ | ❓ | ✅ | **String** | **DateTime** | ❌ INCONSISTENTE |
| status | ❓ | ✅ | ❓ | ✅ | String | Enum | ⚠️ MELHORAR |
| notes | ❓ | ✅ | ❓ | ✅ | String? | String? | ✅ OK |

### ❌ INCONSISTÊNCIAS IDENTIFICADAS

#### 1. **Data como String**
**Problema:** Mesmo problema das outras entidades

**Solução:**
```prisma
model Attendance {
  date DateTime  // ✅
}
```

#### 2. **Status como String livre**
**Solução:**
```prisma
enum AttendanceStatus {
  PRESENT
  ABSENT
  JUSTIFIED
}

model Attendance {
  status AttendanceStatus
}
```

---

## 8️⃣ ENTIDADE: USER (USUÁRIO)

### 📋 Mapeamento de Campos

| Campo | Web | Mobile | Backend | Banco | Status |
|-------|-----|--------|---------|-------|--------|
| id | ✅ | ❓ | ✅ | ✅ | ⚠️ VALIDAR MOBILE |
| name | ✅ | ❓ | ✅ | ✅ | ⚠️ VALIDAR MOBILE |
| email | ✅ | ✅ | ✅ | ✅ | ✅ OK |
| password_hash | N/A | N/A | ✅ | ✅ | ✅ OK |
| role | ✅ | ❌ | ✅ | ✅ | ❌ **MOBILE NÃO USA** |
| active | ✅ | ❓ | ✅ | ✅ | ⚠️ VALIDAR MOBILE |
| relatedId | ✅ | ❓ | ✅ | ✅ | ⚠️ VALIDAR MOBILE |

### ❌ INCONSISTÊNCIAS IDENTIFICADAS

#### 1. **Mobile não implementa controle de Roles**
**Problema:**
- Mobile não diferencia ADMIN de PROFESSOR
- Todos os usuários têm acesso total
- Risco de segurança

**Prioridade:** 🔴 CRÍTICA

---

## 📊 RESUMO DE INCONSISTÊNCIAS

### 🔴 CRÍTICAS (Bloqueadores)

| # | Inconsistência | Plataformas Afetadas | Impacto | Prioridade |
|---|----------------|----------------------|---------|------------|
| 1 | Datas como String | Todas | Queries inválidas, ordenação incorreta | 🔴 CRÍTICA |
| 2 | Modelo de Graduação inadequado | Todas | Dados não normalizados | 🔴 CRÍTICA |
| 3 | Professor como Student | Todas | Integridade referencial comprometida | 🔴 CRÍTICA |
| 4 | Mobile sem controle de Roles | Mobile | Risco de segurança | 🔴 CRÍTICA |
| 5 | Unidades/Turmas ausentes no Mobile | Mobile | Funcionalidade bloqueada | 🔴 CRÍTICA |

### 🟡 IMPORTANTES

| # | Inconsistência | Plataformas Afetadas | Impacto | Prioridade |
|---|----------------|----------------------|---------|------------|
| 6 | Status como String livre | Todas | Inconsistência de dados | 🟡 ALTA |
| 7 | Campo `notes` usado incorretamente | Todas | Dados não estruturados | 🟡 ALTA |
| 8 | Campo `grau` não usado no Mobile | Mobile | Badge incompleto | 🟡 MÉDIA |
| 9 | Horário de término ausente | Todas | Agenda incompleta | 🟡 MÉDIA |

### 🟢 MELHORIAS

| # | Inconsistência | Plataformas Afetadas | Impacto | Prioridade |
|---|----------------|----------------------|---------|------------|
| 10 | Validação de CPF muito restritiva | Todas | Bloqueio de testes | 🟢 MÉDIA |
| 11 | Falta de feedback visual (toasts) | Todas | UX ruim | 🟢 BAIXA |

---

## 🔧 PLANO DE PADRONIZAÇÃO

### FASE 1: CORREÇÕES CRÍTICAS (Sprint 1)

1. **Migrar datas de String para DateTime**
   - Student: birth_date, enrollment_date
   - Graduation: date
   - Attendance: date
   - **Backup obrigatório antes da migração**

2. **Validar JWT_SECRET obrigatório**
   - Backend: throw error se não houver env var

3. **Corrigir BUG #8 e #9**
   - Query Prisma (busca de alunos)
   - Erro 422 (criar unidades)

### FASE 2: REFATORAÇÕES IMPORTANTES (Sprint 2)

4. **Refatorar modelo de Graduação**
   - Separar GraduationDefinition de StudentGraduation
   - Migrar dados existentes

5. **Implementar Unidades/Turmas no Mobile**
   - Criar telas
   - Integrar com API

6. **Adicionar controle de Roles no Mobile**
   - Implementar verificação de permissões
   - Filtrar funcionalidades por role

### FASE 3: MELHORIAS (Sprint 3)

7. **Converter Status para Enums**
   - StudentStatus, AttendanceStatus, etc.

8. **Separar Professor de Student**
   - Criar tabela Person
   - Migrar dados

9. **Adicionar toasts em todos os módulos**

---

## 📋 CHECKLIST DE VALIDAÇÃO

### Antes da Migração para Supabase:

- [ ] Todas as datas são DateTime
- [ ] Todos os Status são Enums
- [ ] Graduações usam FK (não strings)
- [ ] Professor separado de Student
- [ ] Campo `notes` usado apenas para observações
- [ ] Índices criados em campos de busca
- [ ] Constraints de unicidade validados
- [ ] Cascade deletes configurados
- [ ] Soft delete implementado (opcional)

---

**Assinatura:**  
**QA Engineer Sênior + Arquiteto de Software Full Stack**  
**Data:** 22/01/2026
