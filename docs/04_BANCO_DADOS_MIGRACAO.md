# 🗄️ BANCO DE DADOS - ANÁLISE E MIGRAÇÃO
**QA Engineer Sênior + Arquiteto de Software Full Stack**  
**Data:** 22/01/2026  
**Projeto:** GingaFlow  
**Objetivo:** Avaliar banco atual e preparar migração para Supabase

---

## 🎯 SITUAÇÃO ATUAL

### Banco de Dados Local
- **Tipo:** SQLite
- **Localização:** `apps/api/data/dev.db`
- **ORM:** Prisma
- **Ambiente:** Desenvolvimento/Testes

### Banco de Dados Futuro
- **Tipo:** PostgreSQL (Supabase)
- **Features:** Auth + Realtime + Storage
- **Ambiente:** Produção

---

## 1️⃣ AVALIAÇÃO DO BANCO ATUAL

### ✅ PONTOS FORTES

#### 1. **Relacionamentos Corretos**
```prisma
// ✅ Relacionamentos bem definidos
Student ↔ Payment (1:N com cascade delete)
Student ↔ Graduation (1:N com cascade delete)
Unit ↔ Turma (1:N com cascade delete)
StudentTurma (N:N entre Student e Turma)
TeacherTurma (N:N entre Teacher e Turma)
Attendance (presença com unique constraint correto)
```

#### 2. **Constraints Adequados**
```prisma
// ✅ Constraints de unicidade
@@unique([studentId, period])           // Payment
@@unique([teacherId, turmaId])          // TeacherTurma
@@unique([studentId, turmaId])          // StudentTurma
@@unique([studentId, turmaId, date])    // Attendance
```

#### 3. **Cascade Deletes**
```prisma
// ✅ Todos os relacionamentos possuem onDelete: Cascade
student Student @relation(fields: [studentId], references: [id], onDelete: Cascade)
```

#### 4. **UUIDs como Primary Keys**
```prisma
// ✅ Uso de UUIDs (melhor para sistemas distribuídos)
id String @id @default(uuid())
```

---

### ❌ PROBLEMAS CRÍTICOS

#### 1. **Datas como String** 🔴 CRÍTICO

**Problema:**
```prisma
model Student {
  birth_date     String?  // ❌
  enrollment_date String  // ❌
}

model Attendance {
  date String  // ❌
}

model Graduation {
  date String  // ❌
}
```

**Impacto:**
- ❌ Impossível fazer queries por intervalo de datas
- ❌ Ordenação incorreta (alfabética ao invés de cronológica)
- ❌ Validação frágil (aceita valores inválidos como "abc")
- ❌ Problemas de timezone
- ❌ Incompatível com PostgreSQL (Supabase espera DateTime)

**Solução:**
```prisma
model Student {
  birth_date     DateTime?  // ✅
  enrollment_date DateTime  // ✅
}

model Attendance {
  date DateTime  // ✅
}

model Graduation {
  date DateTime  // ✅
}
```

**Migração:** Ver seção "Migração de Dados"

---

#### 2. **Modelo de Graduação Inadequado** 🔴 CRÍTICO

**Problema:**
```prisma
// ❌ Graduação é um EVENTO, mas campos são strings livres
model Graduation {
  id          String   @id @default(uuid())
  studentId   String
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  type        String   // ❌ Campo livre (deveria ser FK)
  // previousGraduationId e newGraduationId existem mas não são usados corretamente
  date        String   // ❌ String ao invés de DateTime
  teacherId   String?  // ❌ String ao invés de FK
  notes       String?
}
```

**Impacto:**
- ❌ Graduações não são entidades padronizadas
- ❌ Impossível garantir consistência de dados
- ❌ Relatórios de graduação ficam imprecisos
- ❌ Histórico de graduação não é confiável
- ❌ Queries complexas são impossíveis

**Solução:**
```prisma
// ✅ MODELO CORRETO - Separar DEFINIÇÃO de EVENTO

// Tabela de DEFINIÇÕES (já existe como GraduationLevel!)
model GraduationLevel {
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
  
  // Relacionamento com eventos
  studentGraduations StudentGraduation[]
}

// Tabela de EVENTOS (renomear Graduation para StudentGraduation)
model StudentGraduation {
  id                   String   @id @default(uuid())
  studentId            String
  previousGraduationId String?  // FK para GraduationLevel
  newGraduationId      String   // FK para GraduationLevel
  date                 DateTime // ✅ DateTime
  teacherId            String?  // FK para Student (professor)
  notes                String?
  created_at           DateTime @default(now())
  
  student              Student         @relation(fields: [studentId], references: [id], onDelete: Cascade)
  previousGraduation   GraduationLevel? @relation("PreviousGraduation", fields: [previousGraduationId], references: [id])
  newGraduation        GraduationLevel  @relation("NewGraduation", fields: [newGraduationId], references: [id])
  teacher              Student?         @relation("TeacherGraduation", fields: [teacherId], references: [id])
  
  @@unique([studentId, newGraduationId, date])
}
```

**Observação:** A tabela `GraduationLevel` **já existe** no banco! Só precisa ser usada corretamente.

---

#### 3. **Professor como Student** 🔴 CRÍTICO

**Problema:**
```typescript
// Backend filtra professores por string no campo notes
const students = await prisma.student.findMany({
  where: {
    notes: {
      contains: '[TIPO] PROFESSOR'  // ❌ Filtro frágil
    }
  }
})
```

**Impacto:**
- ❌ Professores e alunos compartilham mesma tabela
- ❌ Filtros frágeis (dependem de string no campo `notes`)
- ❌ Impossível garantir integridade (professor pode ser deletado como aluno)
- ❌ Queries ineficientes (full table scan no campo `notes`)
- ❌ Relacionamentos confusos (Student → Student)

**Solução (Opção A - Simples):**
```prisma
// Adicionar campo type ao Student
model Student {
  id             String        @id @default(uuid())
  full_name      String
  cpf            String        @unique
  type           String        @default("STUDENT")  // "STUDENT", "TEACHER", "BOTH"
  // ... resto dos campos
}

// Criar índice para performance
@@index([type])
```

**Solução (Opção B - Ideal):**
```prisma
// Criar tabela Person (base comum)
model Person {
  id             String        @id @default(uuid())
  full_name      String
  cpf            String        @unique
  birth_date     DateTime?
  email          String?
  phone          String?
  type           String        // "STUDENT", "TEACHER", "BOTH"
  status         String
  notes          String?
  created_at     DateTime      @default(now())
  updated_at     DateTime      @updatedAt
  
  studentData    StudentData?
  teacherData    TeacherData?
}

model StudentData {
  id              String   @id @default(uuid())
  personId        String   @unique
  enrollment_date DateTime
  currentGraduationId String?
  person          Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  payments        Payment[]
  graduations     StudentGraduation[]
  studentTurmas   StudentTurma[]
  attendances     Attendance[]
}

model TeacherData {
  id              String   @id @default(uuid())
  personId        String   @unique
  specialization  String?
  hire_date       DateTime?
  person          Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  teacherTurmas   TeacherTurma[]
  graduations     TeacherGraduation[]
}
```

**Recomendação:** Opção A para MVP, Opção B para longo prazo

---

#### 4. **Falta de Índices** 🟡 IMPORTANTE

**Problema:**
```prisma
// ❌ Campos de busca sem índices
model Student {
  full_name String  // Usado em buscas, sem índice
  cpf       String @unique  // ✅ Unique já cria índice
  status    String  // Usado em filtros, sem índice
}
```

**Impacto:**
- ❌ Queries lentas em tabelas grandes
- ❌ Full table scan em buscas

**Solução:**
```prisma
model Student {
  // ... campos
  
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

#### 5. **Falta de Soft Delete** 🟢 OPCIONAL

**Problema:**
```prisma
// ❌ Cascade delete permanente
onDelete: Cascade
```

**Impacto:**
- ❌ Dados deletados são perdidos permanentemente
- ❌ Impossível recuperar dados deletados por engano
- ❌ Auditoria comprometida

**Solução:**
```prisma
model Student {
  // ... campos
  deleted_at DateTime?
  
  @@index([deleted_at])
}

// Queries sempre filtram deleted_at IS NULL
const students = await prisma.student.findMany({
  where: { deleted_at: null }
})
```

---

## 2️⃣ PREPARAÇÃO PARA SUPABASE

### ✅ Compatibilidade SQLite → PostgreSQL

| Feature | SQLite | PostgreSQL | Compatível? | Ação Necessária |
|---------|--------|------------|-------------|-----------------|
| UUIDs | ✅ String | ✅ UUID | ✅ | Nenhuma |
| DateTime | ⚠️ String | ✅ TIMESTAMP | ❌ | **Migrar datas** |
| Enums | ❌ String | ✅ ENUM | ⚠️ | Criar enums |
| JSON | ✅ | ✅ | ✅ | Nenhuma |
| Full-text search | ❌ | ✅ | ✅ | Implementar no Supabase |
| Triggers | ✅ | ✅ | ✅ | Nenhuma |
| Foreign Keys | ✅ | ✅ | ✅ | Nenhuma |

### 🔧 Ajustes Necessários

#### 1. **Migrar Datas de String para DateTime**
```sql
-- SQLite não suporta ALTER COLUMN TYPE
-- Solução: Criar coluna nova, copiar dados, deletar antiga, renomear

-- Exemplo para Student.birth_date
ALTER TABLE Student ADD COLUMN birth_date_temp DATETIME;
UPDATE Student SET birth_date_temp = datetime(birth_date) WHERE birth_date IS NOT NULL;
ALTER TABLE Student DROP COLUMN birth_date;
ALTER TABLE Student RENAME COLUMN birth_date_temp TO birth_date;
```

#### 2. **Criar Enums no PostgreSQL**
```sql
-- PostgreSQL
CREATE TYPE student_status AS ENUM ('ATIVO', 'INATIVO', 'PENDENTE', 'SUSPENSO');
CREATE TYPE payment_status AS ENUM ('PAID', 'PENDING', 'OVERDUE');
CREATE TYPE attendance_status AS ENUM ('PRESENT', 'ABSENT', 'JUSTIFIED');
```

```prisma
// Prisma
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

#### 3. **Configurar Row Level Security (RLS) no Supabase**
```sql
-- Exemplo: Professores só veem seus alunos
CREATE POLICY "Professores veem apenas seus alunos"
ON Student
FOR SELECT
USING (
  auth.jwt() ->> 'role' = 'ADMIN'
  OR
  id IN (
    SELECT st.studentId
    FROM StudentTurma st
    JOIN TeacherTurma tt ON st.turmaId = tt.turmaId
    WHERE tt.teacherId = auth.jwt() ->> 'relatedId'
  )
);
```

---

## 3️⃣ SEPARAÇÃO POR USUÁRIO

### ✅ Situação Atual

**Multi-tenancy:** ❌ NÃO IMPLEMENTADO

**Problema:**
- Todos os usuários compartilham os mesmos dados
- Não há separação por academia/grupo
- Impossível usar o sistema para múltiplas academias

**Observação:** Para MVP de academia única, isso é aceitável.

### 🔧 Preparação para Multi-tenancy (Futuro)

```prisma
// Adicionar campo organizationId em todas as tabelas
model Organization {
  id         String   @id @default(uuid())
  name       String
  slug       String   @unique
  created_at DateTime @default(now())
  
  students   Student[]
  units      Unit[]
  users      User[]
}

model Student {
  id             String       @id @default(uuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  // ... resto dos campos
  
  @@index([organizationId])
}

// RLS no Supabase
CREATE POLICY "Usuários veem apenas sua organização"
ON Student
FOR SELECT
USING (organizationId = auth.jwt() ->> 'organizationId');
```

---

## 4️⃣ MIGRAÇÃO DE DADOS

### 📋 Checklist Pré-Migração

- [ ] **Backup completo do banco SQLite**
- [ ] **Exportar dados para JSON/CSV**
- [ ] **Validar integridade dos dados**
- [ ] **Testar migração em ambiente de desenvolvimento**
- [ ] **Documentar mapeamento de campos**

### 🔄 Script de Migração

```typescript
// scripts/migrate-to-supabase.ts
import { PrismaClient as SQLitePrisma } from './prisma/sqlite'
import { PrismaClient as PostgresPrisma } from './prisma/postgres'

async function migrate() {
  const sqlite = new SQLitePrisma()
  const postgres = new PostgresPrisma()
  
  console.log('🔄 Iniciando migração...')
  
  // 1. Migrar Unidades
  console.log('📦 Migrando Unidades...')
  const units = await sqlite.unit.findMany()
  for (const unit of units) {
    await postgres.unit.create({
      data: {
        id: unit.id,
        name: unit.name,
        address: unit.address,
        color: unit.color,
        status: unit.status,
        created_at: unit.created_at,
        updated_at: unit.updated_at
      }
    })
  }
  
  // 2. Migrar Turmas
  console.log('🏫 Migrando Turmas...')
  const turmas = await sqlite.turma.findMany()
  for (const turma of turmas) {
    await postgres.turma.create({
      data: {
        id: turma.id,
        name: turma.name,
        unitId: turma.unitId,
        schedule: turma.schedule,
        status: turma.status,
        created_at: turma.created_at,
        updated_at: turma.updated_at
      }
    })
  }
  
  // 3. Migrar Alunos (convertendo datas)
  console.log('👥 Migrando Alunos...')
  const students = await sqlite.student.findMany()
  for (const student of students) {
    await postgres.student.create({
      data: {
        id: student.id,
        full_name: student.full_name,
        cpf: student.cpf,
        birth_date: student.birth_date ? new Date(student.birth_date) : null,  // ✅ Converter
        enrollment_date: new Date(student.enrollment_date),  // ✅ Converter
        email: student.email,
        phone: student.phone,
        status: student.status,
        notes: student.notes,
        created_at: student.created_at,
        updated_at: student.updated_at
      }
    })
  }
  
  // 4. Migrar Graduações
  console.log('🥋 Migrando Graduações...')
  const graduations = await sqlite.graduation.findMany()
  for (const graduation of graduations) {
    await postgres.graduation.create({
      data: {
        id: graduation.id,
        studentId: graduation.studentId,
        type: graduation.type,
        date: new Date(graduation.date),  // ✅ Converter
        teacherId: graduation.teacherId,
        notes: graduation.notes,
        created_at: graduation.created_at
      }
    })
  }
  
  // 5. Migrar Pagamentos
  console.log('💰 Migrando Pagamentos...')
  const payments = await sqlite.payment.findMany()
  for (const payment of payments) {
    await postgres.payment.create({
      data: {
        id: payment.id,
        studentId: payment.studentId,
        monthlyFeeCents: payment.monthlyFeeCents,
        dueDay: payment.dueDay,
        period: payment.period,
        status: payment.status,
        paidAt: payment.paidAt,
        method: payment.method,
        notes: payment.notes,
        created_at: payment.created_at,
        updated_at: payment.updated_at
      }
    })
  }
  
  // 6. Migrar Presenças (convertendo datas)
  console.log('📅 Migrando Presenças...')
  const attendances = await sqlite.attendance.findMany()
  for (const attendance of attendances) {
    await postgres.attendance.create({
      data: {
        id: attendance.id,
        studentId: attendance.studentId,
        turmaId: attendance.turmaId,
        date: new Date(attendance.date),  // ✅ Converter
        status: attendance.status,
        notes: attendance.notes,
        created_at: attendance.created_at,
        updated_at: attendance.updated_at
      }
    })
  }
  
  console.log('✅ Migração concluída!')
}

migrate()
  .catch(console.error)
  .finally(() => process.exit())
```

---

## 5️⃣ VALIDAÇÃO PÓS-MIGRAÇÃO

### 📋 Checklist de Validação

- [ ] **Contagem de registros** (SQLite vs Supabase)
- [ ] **Validar integridade referencial** (FKs)
- [ ] **Testar queries críticas**
- [ ] **Validar datas** (timezone correto)
- [ ] **Testar autenticação** (Supabase Auth)
- [ ] **Validar permissões** (RLS)
- [ ] **Testar realtime** (subscriptions)
- [ ] **Backup do Supabase**

### 🧪 Queries de Validação

```sql
-- Validar contagem de registros
SELECT 'Student' as table_name, COUNT(*) as count FROM Student
UNION ALL
SELECT 'Payment', COUNT(*) FROM Payment
UNION ALL
SELECT 'Graduation', COUNT(*) FROM Graduation
UNION ALL
SELECT 'Attendance', COUNT(*) FROM Attendance;

-- Validar integridade referencial
SELECT s.id, s.full_name
FROM Student s
LEFT JOIN Payment p ON s.id = p.studentId
WHERE p.id IS NULL AND s.status = 'ATIVO';

-- Validar datas
SELECT id, birth_date, enrollment_date
FROM Student
WHERE birth_date > CURRENT_DATE
   OR enrollment_date > CURRENT_DATE;
```

---

## 6️⃣ RECOMENDAÇÕES FINAIS

### 🔴 ANTES DA MIGRAÇÃO (Obrigatório)

1. ✅ **Corrigir modelo de Graduação** (usar GraduationLevel)
2. ✅ **Migrar datas de String para DateTime**
3. ✅ **Adicionar índices** em campos de busca
4. ✅ **Validar dados existentes** (CPFs, emails, datas)
5. ✅ **Backup completo**

### 🟡 DURANTE A MIGRAÇÃO (Recomendado)

6. ✅ **Criar enums** (StudentStatus, PaymentStatus, etc.)
7. ✅ **Implementar RLS** (Row Level Security)
8. ✅ **Configurar Supabase Auth**
9. ✅ **Testar em ambiente de staging**

### 🟢 APÓS A MIGRAÇÃO (Opcional)

10. ✅ **Implementar soft delete**
11. ✅ **Separar Professor de Student**
12. ✅ **Implementar multi-tenancy**
13. ✅ **Configurar realtime subscriptions**
14. ✅ **Implementar full-text search**

---

## 📊 RESUMO EXECUTIVO

### ✅ BANCO ATUAL (SQLite)
- **Estrutura:** Sólida, relacionamentos corretos
- **Constraints:** Adequados
- **Performance:** Suficiente para desenvolvimento

### ❌ PROBLEMAS CRÍTICOS
1. Datas como String (BLOQUEADOR)
2. Modelo de Graduação inadequado (BLOQUEADOR)
3. Professor como Student (IMPORTANTE)
4. Falta de índices (IMPORTANTE)

### ✅ COMPATIBILIDADE COM SUPABASE
- **Geral:** 80% compatível
- **Ajustes necessários:** Datas, Enums, RLS
- **Risco:** BAIXO (com preparação adequada)

### 🎯 RECOMENDAÇÃO

**APROVAR migração para Supabase APÓS:**
1. Corrigir datas (String → DateTime)
2. Refatorar modelo de Graduação
3. Adicionar índices
4. Testar em staging

**Tempo estimado:** 1-2 sprints (2-4 semanas)

---

**Assinatura:**  
**QA Engineer Sênior + Arquiteto de Software Full Stack**  
**Data:** 22/01/2026
