# 📋 LIST REVIEW MACRO - GINGAFLOW
**QA Engineer Sênior + Arquiteto de Software Full Stack**  
**Data:** 22/01/2026  
**Projeto:** GingaFlow (Sistema de Gestão para Academias de Capoeira)  
**Prioridade:** 🔴 **MOBILE FIRST** (Mobile deve refletir exatamente as mesmas regras do Web)

---

## 🎯 CONTEXTO IDENTIFICADO

### Estrutura do Projeto
```
gingaflow/
├── apps/
│   ├── api/              # Backend Fastify + Prisma (SQLite local)
│   ├── desktop/          # Web App (React + Tauri) - QUASE FINALIZADO
│   └── mobile/           # Mobile App (React Native + Expo) - RECÉM INICIADO
├── packages/
│   ├── shared/           # Schemas Zod compartilhados
│   └── ui/               # Componentes reutilizáveis
└── database/             # SQLite local (migração futura para Supabase)
```

### Status Atual
- ✅ **Web (Desktop):** ~80% concluído, funcional mas com bugs críticos
- ⚠️ **Mobile:** ~20% concluído, estrutura básica criada
- 🗄️ **Backend:** Funcional mas com problemas de arquitetura
- 💾 **Banco:** SQLite local, preparando migração para Supabase

---

## 1️⃣ CHECKLIST MACRO - VISÃO GERAL

### 🔐 AUTENTICAÇÃO E USUÁRIOS
| Item | Web | Mobile | Backend | Banco | Status | Prioridade |
|------|-----|--------|---------|-------|--------|------------|
| Login com email/senha | ✅ | ✅ | ✅ | ✅ | OK | - |
| JWT Token | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🔴 CRÍTICA |
| Hash de senha (bcrypt) | ✅ | N/A | ✅ | ✅ | OK | - |
| Roles (ADMIN/PROFESSOR) | ✅ | ❌ | ✅ | ✅ | **FALTA NO MOBILE** | 🔴 CRÍTICA |
| Sessão persistente | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🟡 ALTA |
| Logout | ✅ | ❓ | N/A | N/A | **VALIDAR MOBILE** | 🟢 MÉDIA |
| JWT_SECRET obrigatório | ❌ | N/A | ❌ | N/A | **RISCO DE SEGURANÇA** | 🔴 CRÍTICA |

**🚨 PROBLEMAS CRÍTICOS:**
- JWT_SECRET gerado aleatoriamente se não houver env var (INSEGURO)
- Permissões de PROFESSOR não testadas end-to-end
- Mobile não implementa controle de roles

---

### 📊 CADASTROS BASE

#### Unidades
| Item | Web | Mobile | Backend | Banco | Status | Prioridade |
|------|-----|--------|---------|-------|--------|------------|
| Criar unidade | ⚠️ | ❌ | ⚠️ | ✅ | **BUG CRÍTICO #9** (erro 422) | 🔴 CRÍTICA |
| Listar unidades | ✅ | ❌ | ✅ | ✅ | **FALTA NO MOBILE** | 🔴 CRÍTICA |
| Editar unidade | ⚠️ | ❌ | ⚠️ | ✅ | **BUG CRÍTICO #9** | 🔴 CRÍTICA |
| Deletar unidade | ✅ | ❌ | ✅ | ✅ | **FALTA NO MOBILE** | 🟢 MÉDIA |
| Cor da unidade | ✅ | ❌ | ✅ | ✅ | **FALTA NO MOBILE** | 🟢 BAIXA |
| Endereço | ✅ | ❌ | ✅ | ✅ | **FALTA NO MOBILE** | 🟡 MÉDIA |
| Mensalidade padrão | ✅ | ❌ | ✅ | ✅ | **FALTA NO MOBILE** | 🟡 ALTA |

#### Turmas
| Item | Web | Mobile | Backend | Banco | Status | Prioridade |
|------|-----|--------|---------|-------|--------|------------|
| Criar turma | ✅ | ❌ | ✅ | ✅ | **FALTA NO MOBILE** | 🔴 CRÍTICA |
| Listar turmas | ✅ | ❌ | ✅ | ✅ | **FALTA NO MOBILE** | 🔴 CRÍTICA |
| Vincular a unidade | ✅ | ❌ | ✅ | ✅ | **FALTA NO MOBILE** | 🔴 CRÍTICA |
| Horário de início | ✅ | ❌ | ✅ | ✅ | **FALTA NO MOBILE** | 🟡 ALTA |
| Horário de término | ❌ | ❌ | ❌ | ❌ | **BUG #4** (campo ausente) | 🟡 ALTA |
| Dias da semana | ✅ | ❌ | ✅ | ✅ | **FALTA NO MOBILE** | 🟡 ALTA |
| Mensalidade padrão | ✅ | ❌ | ✅ | ✅ | **FALTA NO MOBILE** | 🟡 ALTA |

#### Graduações
| Item | Web | Mobile | Backend | Banco | Status | Prioridade |
|------|-----|--------|---------|-------|--------|------------|
| Criar graduação | ✅ | ✅ | ✅ | ✅ | OK | - |
| Listar graduações | ✅ | ✅ | ✅ | ✅ | OK | - |
| Editar graduação | ✅ | ✅ | ✅ | ✅ | OK | - |
| Deletar graduação | ✅ | ✅ | ✅ | ✅ | OK | - |
| Corda única | ✅ | ✅ | ✅ | ✅ | OK | - |
| Corda dupla | ✅ | ✅ | ✅ | ✅ | OK | - |
| Corda com pontas | ✅ | ✅ | ✅ | ✅ | OK | - |
| Categorias (Infantil/Adulto) | ✅ | ✅ | ✅ | ✅ | OK | - |
| Ordem de exibição | ✅ | ✅ | ✅ | ✅ | OK | - |
| Badge visual | ✅ | ⚠️ | N/A | N/A | **PROBLEMA NO MOBILE** (falta level) | 🟡 MÉDIA |
| Validação (impedir vazios) | ❌ | ❌ | ❌ | ❌ | **BUG #6** (registro fantasma) | 🟡 MÉDIA |

**🚨 PROBLEMA ARQUITETURAL:**
- Modelo de Graduação inadequado (strings ao invés de FK)
- Histórico de graduação não é confiável
- Impossível garantir consistência de dados

---

### 👥 ALUNOS

| Item | Web | Mobile | Backend | Banco | Status | Prioridade |
|------|-----|--------|---------|-------|--------|------------|
| **DADOS PESSOAIS** |
| Nome completo | ✅ | ✅ | ✅ | ✅ | OK | - |
| CPF | ✅ | ✅ | ✅ | ✅ | OK | - |
| Data de nascimento | ✅ | ✅ | ✅ | ⚠️ | **STRING** (deveria ser DateTime) | 🟡 ALTA |
| Email | ✅ | ✅ | ✅ | ✅ | OK | - |
| Telefone | ✅ | ✅ | ✅ | ✅ | OK | - |
| WhatsApp | ✅ | ✅ | ✅ | ✅ | OK | - |
| Endereço completo | ✅ | ✅ | ✅ | ✅ | OK | - |
| Foto | ❌ | ❌ | ❌ | ❌ | NÃO IMPLEMENTADO | 🟢 BAIXA |
| Status (ATIVO/INATIVO) | ✅ | ✅ | ✅ | ✅ | OK | - |
| **RESPONSÁVEL (se menor)** |
| Exibição condicional | ✅ | ❌ | N/A | N/A | **BUG MOBILE** (sempre aparece) | 🔴 CRÍTICA |
| Nome do responsável | ✅ | ✅ | ✅ | ✅ | OK | - |
| CPF do responsável | ✅ | ✅ | ✅ | ✅ | OK | - |
| Grau de parentesco | ✅ | ✅ | ✅ | ✅ | OK | - |
| Validação CPF | ⚠️ | ⚠️ | ⚠️ | N/A | **BUG #10** (muito restritiva) | 🟡 ALTA |
| **CAPOEIRA** |
| Graduação inicial | ✅ | ✅ | ✅ | ✅ | OK | - |
| Data de matrícula | ✅ | ✅ | ✅ | ⚠️ | **STRING** (deveria ser DateTime) | 🟡 ALTA |
| Professor vinculado | ✅ | ✅ | ✅ | ✅ | OK | - |
| Unidade vinculada | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🟡 ALTA |
| Turma vinculada | ✅ | ✅ | ✅ | ✅ | OK | - |
| **FINANCEIRO** |
| Mensalidade | ✅ | ✅ | ✅ | ✅ | OK | - |
| Dia de vencimento | ✅ | ✅ | ✅ | ✅ | OK | - |
| Forma de pagamento | ✅ | ✅ | ✅ | ✅ | OK | - |
| **FUNCIONALIDADES** |
| Criar aluno | ⚠️ | ✅ | ✅ | ✅ | **WEB BLOQUEADO** (erro 422 unidades) | 🔴 CRÍTICA |
| Listar alunos | ⚠️ | ✅ | ⚠️ | ✅ | **BUG #8** (busca quebrada) | 🔴 CRÍTICA |
| Buscar aluno | ❌ | ❓ | ❌ | ✅ | **BUG CRÍTICO #8** | 🔴 CRÍTICA |
| Editar aluno | ✅ | ✅ | ✅ | ✅ | OK | - |
| Deletar aluno | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🟡 MÉDIA |
| Ver detalhes | ✅ | ✅ | ✅ | ✅ | OK | - |
| Feedback visual (toast) | ❌ | ❓ | N/A | N/A | **BUG #11** (falta toast) | 🟢 BAIXA |

**🚨 PROBLEMAS CRÍTICOS:**
- **BUG #8:** Busca completamente quebrada (query Prisma inválida)
- **BUG #9:** Impossível criar unidades (erro 422) - bloqueia criação de alunos
- **BUG #10:** Validação de CPF impede testes
- Responsável aparece sempre no Mobile (não respeita idade)

---

### 👨‍🏫 PROFESSORES

| Item | Web | Mobile | Backend | Banco | Status | Prioridade |
|------|-----|--------|---------|-------|--------|------------|
| **DADOS PESSOAIS** |
| Nome completo | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🔴 CRÍTICA |
| CPF | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🔴 CRÍTICA |
| Data de nascimento | ❌ | ❌ | ❌ | ❌ | **BUG #12** (campo ausente) | 🟡 MÉDIA |
| Email | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🟡 ALTA |
| Telefone | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🟡 ALTA |
| Endereço | ❌ | ❌ | ❌ | ❌ | **BUG #12** (campo ausente) | 🟡 MÉDIA |
| Especialidade | ❌ | ❌ | ❌ | ❌ | **BUG #12** (workaround com "apelido") | 🟡 MÉDIA |
| Nome de Capoeira | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🟢 BAIXA |
| Graduação | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🟡 ALTA |
| **FUNCIONALIDADES** |
| Criar professor | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🔴 CRÍTICA |
| Listar professores | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🔴 CRÍTICA |
| Editar professor | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🟡 ALTA |
| Deletar professor | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🟡 MÉDIA |
| Vincular turmas | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🔴 CRÍTICA |
| Ver detalhes | ✅ | ❓ | ✅ | ✅ | **VALIDAR MOBILE** | 🟡 MÉDIA |
| Separação Alunos/Professores | ✅ | ❌ | ⚠️ | ⚠️ | **PROBLEMA ARQUITETURAL** | 🔴 CRÍTICA |
| Feedback visual (toast) | ❌ | ❓ | N/A | N/A | **BUG #13** (falta toast) | 🟢 BAIXA |

**🚨 PROBLEMA ARQUITETURAL GRAVE:**
- Professores e Alunos compartilham mesma tabela `Student`
- Filtro por string no campo `notes` (`[TIPO] PROFESSOR`)
- Impossível garantir integridade referencial
- Queries ineficientes (full table scan)
- Mobile não tem separação clara

---

### 💰 FLUXOS FINANCEIROS

| Item | Web | Mobile | Backend | Banco | Status | Prioridade |
|------|-----|--------|---------|-------|--------|------------|
| **PAGAMENTOS** |
| Registrar pagamento | ❌ | ❌ | ❌ | ✅ | **BUG #15** (não implementado) | 🔴 CRÍTICA |
| Listar pagamentos | ❌ | ❌ | ❌ | ✅ | **BUG #15** (não implementado) | 🔴 CRÍTICA |
| Marcar como pago | ❌ | ❌ | ❌ | ✅ | **BUG #15** (não implementado) | 🔴 CRÍTICA |
| Filtrar por status | ❌ | ❌ | ❌ | ✅ | **BUG #15** (não implementado) | 🟡 ALTA |
| Filtrar por aluno | ❌ | ❌ | ❌ | ✅ | **BUG #15** (não implementado) | 🟡 ALTA |
| Editar pagamento | ❌ | ❌ | ❌ | ✅ | **BUG #15** (não implementado) | 🟡 MÉDIA |
| Deletar pagamento | ❌ | ❌ | ❌ | ✅ | **BUG #15** (não implementado) | 🟡 MÉDIA |
| **CÁLCULOS** |
| Saldo do aluno | ❌ | ❌ | ❌ | ✅ | NÃO IMPLEMENTADO | 🔴 CRÍTICA |
| Inadimplência | ❌ | ❌ | ❌ | ✅ | NÃO IMPLEMENTADO | 🔴 CRÍTICA |
| Receita mensal | ❌ | ❌ | ❌ | ✅ | NÃO IMPLEMENTADO | 🟡 ALTA |
| **VALIDAÇÕES** |
| Período único por aluno | N/A | N/A | ✅ | ✅ | OK (constraint no banco) | - |
| Data de pagamento | N/A | N/A | ⚠️ | ⚠️ | **STRING** (deveria ser DateTime) | 🟡 ALTA |

**🚨 BLOQUEADOR CRÍTICO:**
- Módulo Financeiro **COMPLETAMENTE AUSENTE** em Web e Mobile
- Tabela `Payment` existe no banco mas sem rotas/UI
- Essencial para academias (gestão de mensalidades)
- **IMPEDE PRODUÇÃO**

---

### 📅 PRESENÇA E AGENDA

| Item | Web | Mobile | Backend | Banco | Status | Prioridade |
|------|-----|--------|---------|-------|--------|------------|
| **PRESENÇA** |
| Registrar presença | ❓ | ✅ | ❓ | ✅ | **VALIDAR WEB** | 🔴 CRÍTICA |
| Lista de chamada | ❓ | ✅ | ❓ | ✅ | **VALIDAR WEB** | 🔴 CRÍTICA |
| Filtrar por turma | ❓ | ✅ | ❓ | ✅ | **VALIDAR WEB** | 🟡 ALTA |
| Filtrar por data | ❓ | ✅ | ❓ | ✅ | **VALIDAR WEB** | 🟡 ALTA |
| Editar presença | ❓ | ❓ | ❓ | ✅ | **VALIDAR AMBOS** | 🟡 MÉDIA |
| Histórico de presença | ❓ | ❓ | ❓ | ✅ | **VALIDAR AMBOS** | 🟡 MÉDIA |
| **AGENDA** |
| Visualizar agenda | ❓ | ✅ | ❓ | ✅ | **VALIDAR WEB** | 🟡 ALTA |
| Filtro por professor | ❓ | ✅ | ❓ | ✅ | **VALIDAR WEB** | 🟡 ALTA |
| Filtro por unidade | ❓ | ❓ | ❓ | ✅ | **VALIDAR AMBOS** | 🟡 MÉDIA |
| Permissões (Admin x Professor) | ❓ | ❓ | ❌ | N/A | **NÃO TESTADO** | 🔴 CRÍTICA |

**⚠️ VALIDAÇÃO NECESSÁRIA:**
- Funcionalidades de Presença/Agenda não foram testadas no Web
- Mobile possui telas mas não foram validadas end-to-end
- Permissões de Professor não foram testadas

---

### 📊 RELATÓRIOS

| Item | Web | Mobile | Backend | Banco | Status | Prioridade |
|------|-----|--------|---------|-------|--------|------------|
| Relatório Financeiro | ❌ | ❌ | ❌ | ✅ | **BUG #16** (não implementado) | 🔴 CRÍTICA |
| Relatório de Alunos | ❌ | ❌ | ❌ | ✅ | **BUG #16** (não implementado) | 🟡 ALTA |
| Relatório de Frequência | ❌ | ❌ | ❌ | ✅ | **BUG #16** (não implementado) | 🟡 ALTA |
| Relatório de Graduações | ❌ | ❌ | ❌ | ✅ | **BUG #16** (não implementado) | 🟡 MÉDIA |
| Filtros de data | ❌ | ❌ | ❌ | N/A | NÃO IMPLEMENTADO | 🟡 ALTA |
| Exportação (PDF/Excel) | ❌ | ❌ | ❌ | N/A | NÃO IMPLEMENTADO | 🟡 MÉDIA |
| Gráficos | ❌ | ❌ | ❌ | N/A | NÃO IMPLEMENTADO | 🟢 BAIXA |

**🚨 BLOQUEADOR:**
- Módulo de Relatórios **COMPLETAMENTE AUSENTE**
- Menu existe mas redireciona para placeholder
- Impossível acompanhar KPIs e tomar decisões gerenciais

---

### 🎉 MODO EVENTO

| Item | Web | Mobile | Backend | Banco | Status | Prioridade |
|------|-----|--------|---------|-------|--------|------------|
| Criar evento | ❌ | ❌ | ❌ | ❌ | **BUG #17** (não existe) | 🟢 BAIXA |
| Gestão de participantes | ❌ | ❌ | ❌ | ❌ | NÃO EXISTE | 🟢 BAIXA |
| Ativar modo evento | ❌ | ❌ | ❌ | ❌ | NÃO EXISTE | 🟢 BAIXA |

**📝 OBSERVAÇÃO:**
- Funcionalidade não encontrada em nenhum lugar
- Não faz parte do MVP atual
- Documentar ausência ou remover referências

---

## 2️⃣ PONTOS SENSÍVEIS PARA MOBILE

### 🔴 CRÍTICOS
1. **Autenticação JWT:** Validar se Mobile está usando corretamente os tokens
2. **Roles e Permissões:** Mobile não implementa controle de ADMIN/PROFESSOR
3. **Responsável Condicional:** Sempre aparece, não respeita idade do aluno
4. **Separação Alunos/Professores:** Mobile lista todos juntos
5. **Módulo de Unidades/Turmas:** Completamente ausente no Mobile
6. **Sincronização de Dados:** Validar se Mobile está usando mesma API que Web

### 🟡 IMPORTANTES
7. **Badge de Graduação:** Não aparece corretamente (falta campo `level`)
8. **Drawer Navigator:** Não implementado
9. **Feedback Visual:** Validar se Mobile tem toasts
10. **Validação de Formulários:** Validar se Mobile tem mesmas regras que Web

---

## 3️⃣ RISCOS PARA PRODUÇÃO

### 🔥 BLOQUEADORES ABSOLUTOS
| # | Risco | Probabilidade | Impacto | Plataforma |
|---|-------|---------------|---------|------------|
| 1 | **Busca de alunos quebrada** (BUG #8) | 100% | CRÍTICO | Web |
| 2 | **Impossível criar unidades** (BUG #9) | 100% | CRÍTICO | Web |
| 3 | **Módulo Financeiro ausente** (BUG #15) | 100% | CRÍTICO | Ambos |
| 4 | **JWT_SECRET aleatório** | 50% | CRÍTICO | Backend |
| 5 | **Permissões não testadas** | 80% | ALTO | Ambos |

### ⚠️ RISCOS ALTOS
| # | Risco | Probabilidade | Impacto | Plataforma |
|---|-------|---------------|---------|------------|
| 6 | **Modelo de Graduação inadequado** | 100% | ALTO | Banco |
| 7 | **Professor como Student** (herança incorreta) | 100% | ALTO | Banco |
| 8 | **Datas como String** | 100% | ALTO | Banco |
| 9 | **Vazamento de stack trace** | 100% | ALTO | Backend |
| 10 | **Ausência de transações** | 60% | ALTO | Backend |

### 🟡 RISCOS MÉDIOS
| # | Risco | Probabilidade | Impacto | Plataforma |
|---|-------|---------------|---------|------------|
| 11 | **Validação CPF muito restritiva** | 100% | MÉDIO | Ambos |
| 12 | **Campos ausentes em formulários** | 100% | MÉDIO | Ambos |
| 13 | **Falta de feedback visual** | 100% | MÉDIO | Ambos |
| 14 | **Mobile desatualizado** | 100% | MÉDIO | Mobile |

---

## 4️⃣ RESUMO EXECUTIVO

### ✅ PONTOS FORTES
- Arquitetura monorepo bem estruturada
- Separação clara de responsabilidades
- Componentes reutilizáveis (`@gingaflow/ui`)
- Schemas compartilhados (Zod)
- Persistência de dados funcionando
- Interface visual consistente (Web)

### ❌ BLOQUEADORES CRÍTICOS
1. **2 bugs críticos no Web** (busca + unidades)
2. **3 módulos essenciais ausentes** (Financeiro, Relatórios, Modo Evento)
3. **Mobile muito defasado** (~60% de funcionalidades faltando)
4. **Modelo de dados inadequado** (Graduação, Professor/Aluno)
5. **Segurança comprometida** (JWT_SECRET, stack trace, permissões)

### ⚠️ INCONSISTÊNCIAS WEB x MOBILE

| Módulo | Web | Mobile | Divergência |
|--------|-----|--------|-------------|
| Dashboard | ✅ 100% | ❌ 0% | **FALTA IMPLEMENTAR** |
| Unidades | ⚠️ 80% | ❌ 0% | **FALTA IMPLEMENTAR** |
| Turmas | ⚠️ 80% | ❌ 0% | **FALTA IMPLEMENTAR** |
| Graduações | ✅ 90% | ⚠️ 70% | Badge não aparece |
| Alunos | ⚠️ 60% | ⚠️ 70% | Responsável sempre aparece |
| Professores | ✅ 80% | ❌ 0% | **FALTA IMPLEMENTAR** |
| Presença | ❓ | ⚠️ 50% | **VALIDAR WEB** |
| Agenda | ❓ | ⚠️ 50% | **VALIDAR WEB** |
| Financeiro | ❌ 0% | ❌ 0% | **NÃO IMPLEMENTADO** |
| Relatórios | ❌ 0% | ❌ 0% | **NÃO IMPLEMENTADO** |

### 📊 MATURIDADE GERAL
- **Web:** 65% (funcional mas com bugs críticos)
- **Mobile:** 25% (estrutura básica, muitas funcionalidades faltando)
- **Backend:** 70% (funcional mas com problemas de arquitetura)
- **Banco:** 60% (modelo correto mas com ressalvas graves)

---

## 5️⃣ PARECER FINAL

### 🚫 **NÃO APROVAR PARA PRODUÇÃO**

**Justificativa:**
- 5 bloqueadores críticos impedem uso em produção
- Mobile está 60% defasado em relação ao Web
- Módulo Financeiro ausente (essencial para academias)
- Riscos de segurança não mitigados
- Modelo de dados precisa de refatoração

### ⚠️ **APROVAR PARA HOMOLOGAÇÃO LIMITADA**

**Condições:**
- Uso interno apenas (máximo 10 usuários)
- Backup diário obrigatório
- Monitoramento de erros (Sentry)
- Escopo limitado (sem Financeiro, sem Relatórios)

---

**Assinatura:**  
**QA Engineer Sênior + Arquiteto de Software Full Stack**  
**Data:** 22/01/2026
