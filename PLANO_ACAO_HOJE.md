# 🚀 PLANO DE AÇÃO - 28/01/2026
**Hora Início:** 09:22 BRT  
**Objetivo:** Continuar desenvolvimento - Sprint 3

---

## 📋 TAREFAS PARA HOJE

### 1️⃣ VALIDAÇÃO E TESTES (1 hora) - PRIORIDADE MÁXIMA

#### Teste 1: Busca de Alunos (Bug #8 corrigido)
**Tempo:** 15 min  
**Ações:**
- [ ] Iniciar servidor backend
- [ ] Iniciar aplicação Web
- [ ] Acessar /students
- [ ] Testar busca por nome
- [ ] Testar busca por CPF
- [ ] Validar que não há erro no console

**Resultado Esperado:** ✅ Busca funcionando sem erros

---

#### Teste 2: Criação de Unidades (Bug #9 corrigido)
**Tempo:** 15 min  
**Ações:**
- [ ] Acessar /settings/units
- [ ] Clicar em "Nova Unidade"
- [ ] Preencher: nome, endereço, cor
- [ ] Salvar
- [ ] Validar toast de sucesso
- [ ] Validar persistência no banco

**Resultado Esperado:** ✅ Unidade criada + toast de sucesso

---

#### Teste 3: Módulo Financeiro Completo
**Tempo:** 20 min  
**Ações:**
- [ ] Acessar /finance
- [ ] Criar novo pagamento
- [ ] Validar lista de alunos carregando
- [ ] Salvar pagamento
- [ ] Validar toast de sucesso
- [ ] Marcar como pago
- [ ] Validar atualização de status
- [ ] Testar filtros
- [ ] Testar paginação

**Resultado Esperado:** ✅ Módulo Financeiro 100% funcional

---

#### Teste 4: Toasts em Todos os Módulos
**Tempo:** 10 min  
**Ações:**
- [ ] Criar/editar graduação → validar toast
- [ ] Criar/editar unidade → validar toast
- [ ] Criar/editar turma → validar toast
- [ ] Criar/editar aluno → validar toast
- [ ] Criar/editar professor → validar toast
- [ ] Criar/editar pagamento → validar toast

**Resultado Esperado:** ✅ Todos os módulos com feedback visual

---

### 2️⃣ IMPLEMENTAÇÃO MOBILE (3 horas)

#### Tarefa 2.1: Módulo de Unidades (Mobile)
**Tempo:** 1 hora  
**Arquivos a criar:**
- `apps/mobile/src/screens/UnitsScreen.tsx`
- `apps/mobile/src/screens/UnitCreateScreen.tsx`

**Funcionalidades:**
- [ ] Listar unidades
- [ ] Criar unidade
- [ ] Editar unidade
- [ ] Deletar unidade (opcional)
- [ ] Cor da unidade
- [ ] Endereço

---

#### Tarefa 2.2: Módulo de Turmas (Mobile)
**Tempo:** 1 hora  
**Arquivos a criar:**
- `apps/mobile/src/screens/TurmasScreen.tsx`
- `apps/mobile/src/screens/TurmaCreateScreen.tsx`

**Funcionalidades:**
- [ ] Listar turmas por unidade
- [ ] Criar turma
- [ ] Editar turma
- [ ] Vincular a unidade
- [ ] Horários e dias da semana

---

#### Tarefa 2.3: Módulo de Professores (Mobile)
**Tempo:** 1 hora  
**Arquivos a criar:**
- `apps/mobile/src/screens/TeachersScreen.tsx`
- `apps/mobile/src/screens/TeacherCreateScreen.tsx`

**Funcionalidades:**
- [ ] Listar professores
- [ ] Criar professor
- [ ] Editar professor
- [ ] Vincular turmas
- [ ] Graduação

---

### 3️⃣ MELHORIAS DE QUALIDADE (1 hora)

#### Tarefa 3.1: Validação de CPF Mais Flexível
**Tempo:** 20 min  
**Arquivo:** `packages/shared/src/schemas.ts`

**Ações:**
- [ ] Permitir CPF com ou sem formatação
- [ ] Validar apenas dígitos
- [ ] Manter validação de dígitos verificadores (opcional)

---

#### Tarefa 3.2: Melhorar Tratamento de Erros
**Tempo:** 20 min  
**Arquivos:** Vários

**Ações:**
- [ ] Adicionar try/catch em operações críticas
- [ ] Melhorar mensagens de erro
- [ ] Adicionar loading states

---

#### Tarefa 3.3: Documentação
**Tempo:** 20 min  
**Ações:**
- [ ] Atualizar README
- [ ] Documentar APIs
- [ ] Criar guia de testes

---

## 🎯 RESULTADO ESPERADO DO DIA

- ✅ Todos os bugs críticos validados como corrigidos
- ✅ Módulo Financeiro 100% testado e funcional
- ✅ 3 novos módulos Mobile implementados (Unidades, Turmas, Professores)
- ✅ Validação de CPF melhorada
- ✅ Documentação atualizada

**Progresso Mobile:** 35% → 60%  
**Progresso Geral:** 70% → 80%

---

## 📊 CRONOGRAMA

| Hora | Atividade |
|------|-----------|
| 09:30 | Iniciar testes de validação |
| 10:30 | Implementar Unidades (Mobile) |
| 11:30 | Implementar Turmas (Mobile) |
| 12:30 | Pausa |
| 13:30 | Implementar Professores (Mobile) |
| 14:30 | Melhorias de qualidade |
| 15:30 | Documentação e revisão |

---

**Responsável:** Arquiteto Sênior + QA Lead  
**Data:** 28/01/2026  
**Status:** 🔄 EM ANDAMENTO
