# 📊 GAP ANALYSIS - WEB x MOBILE
**QA Engineer Sênior + Arquiteto de Software Full Stack**  
**Data:** 22/01/2026  
**Projeto:** GingaFlow  
**Prioridade:** 🔴 **MOBILE FIRST** (Mobile deve ser a referência final)

---

## 🎯 METODOLOGIA

Criar lista clara de:
- ✅ Funcionalidades que existem **só no Web**
- ✅ Funcionalidades que existem **só no Mobile**
- ⚠️ Funcionalidades implementadas de **forma diferente**
- ❌ Funcionalidades **críticas ausentes no Mobile**

**Premissa:** 👉 **O Mobile deve ser a referência final**

---

## 1️⃣ FUNCIONALIDADES QUE EXISTEM SÓ NO WEB

### 🔴 CRÍTICAS (Essenciais para Mobile)

| # | Funcionalidade | Descrição | Prioridade | Estimativa |
|---|----------------|-----------|------------|------------|
| 1 | **Dashboard** | Visão geral com cards de resumo (total alunos, receita, etc.) | 🔴 CRÍTICA | 3 dias |
| 2 | **Módulo Unidades** | CRUD completo de unidades | 🔴 CRÍTICA | 2 dias |
| 3 | **Módulo Turmas** | CRUD completo de turmas | 🔴 CRÍTICA | 2 dias |
| 4 | **Módulo Professores** | CRUD completo de professores | 🔴 CRÍTICA | 3 dias |
| 5 | **Configurações Gerais** | Nome da academia, cor primária, logo | 🔴 CRÍTICA | 1 dia |
| 6 | **Busca de Alunos** | Campo de busca por nome/CPF | 🔴 CRÍTICA | 1 dia |

**Total estimado:** 12 dias de desenvolvimento

### 🟡 IMPORTANTES (Desejáveis para Mobile)

| # | Funcionalidade | Descrição | Prioridade | Estimativa |
|---|----------------|-----------|------------|------------|
| 7 | **Filtros Avançados** | Filtrar alunos por status, turma, graduação | 🟡 ALTA | 2 dias |
| 8 | **Exportação de Dados** | Exportar listas para CSV/PDF | 🟡 MÉDIA | 2 dias |
| 9 | **Gestão de Usuários** | CRUD de usuários (Admin/Professor) | 🟡 MÉDIA | 2 dias |
| 10 | **Logs de Auditoria** | Histórico de ações dos usuários | 🟡 BAIXA | 3 dias |

**Total estimado:** 9 dias de desenvolvimento

### 🟢 OPCIONAIS (Não prioritários)

| # | Funcionalidade | Descrição | Prioridade | Estimativa |
|---|----------------|-----------|------------|------------|
| 11 | **Tema Claro/Escuro** | Alternância de tema visual | 🟢 BAIXA | 1 dia |
| 12 | **Atalhos de Teclado** | Navegação rápida por teclado | 🟢 BAIXA | 1 dia |
| 13 | **Impressão de Relatórios** | Imprimir listas e relatórios | 🟢 BAIXA | 2 dias |

---

## 2️⃣ FUNCIONALIDADES QUE EXISTEM SÓ NO MOBILE

### ✅ EXCLUSIVAS DO MOBILE (Manter)

| # | Funcionalidade | Descrição | Justificativa | Status |
|---|----------------|-----------|---------------|--------|
| 1 | **Câmera para Foto** | Tirar foto do aluno diretamente | Recurso nativo mobile | ✅ Manter |
| 2 | **Notificações Push** | Alertas de vencimentos, eventos | Recurso nativo mobile | ✅ Manter |
| 3 | **Modo Offline** | Funcionar sem internet (parcial) | Recurso mobile | ✅ Manter |
| 4 | **Biometria** | Login com digital/Face ID | Recurso nativo mobile | ✅ Manter |

**Observação:** Essas funcionalidades são **exclusivas do Mobile** e não precisam ser portadas para o Web.

---

## 3️⃣ FUNCIONALIDADES IMPLEMENTADAS DE FORMA DIFERENTE

### ⚠️ DIVERGÊNCIAS IDENTIFICADAS

#### 1. **Cadastro de Aluno**

| Aspecto | Web | Mobile | Divergência | Ação |
|---------|-----|--------|-------------|------|
| **Estrutura** | 6 abas (Pessoal, Contato, Responsável, Capoeira, Financeiro, Observações) | 6 abas (mesma estrutura) | ✅ Igual | Nenhuma |
| **Responsável** | Exibe apenas se menor de 18 anos | ⚠️ **Sempre exibe** | ❌ DIVERGENTE | **Corrigir Mobile** |
| **Validação CPF** | Muito restritiva (rejeita fictícios) | Muito restritiva (rejeita fictícios) | ✅ Igual (mas problemático) | Permitir CPF fictício em dev |
| **Foto** | Upload de arquivo | Câmera + Galeria | ⚠️ Diferente (OK) | Manter diferença |
| **Feedback** | ❌ Sem toast | ❓ Não validado | ⚠️ Validar | Adicionar toast em ambos |

**Ação prioritária:** Corrigir exibição condicional do Responsável no Mobile

---

#### 2. **Listagem de Alunos**

| Aspecto | Web | Mobile | Divergência | Ação |
|---------|-----|--------|-------------|------|
| **Busca** | ❌ Quebrada (BUG #8) | ❓ Não validado | ⚠️ Validar | Corrigir Web primeiro |
| **Filtros** | Status, Turma, Graduação | ❌ Não implementado | ❌ DIVERGENTE | **Implementar no Mobile** |
| **Ordenação** | Nome, Data matrícula | ❌ Não implementado | ❌ DIVERGENTE | **Implementar no Mobile** |
| **Paginação** | ❌ Não implementado | ❌ Não implementado | ✅ Igual | Implementar em ambos (futuro) |
| **Cards** | Lista simples | Cards visuais | ⚠️ Diferente (OK) | Manter diferença (UX mobile) |

**Ação prioritária:** Implementar filtros e ordenação no Mobile

---

#### 3. **Graduações**

| Aspecto | Web | Mobile | Divergência | Ação |
|---------|-----|--------|-------------|------|
| **CRUD** | ✅ Completo | ✅ Completo | ✅ Igual | Nenhuma |
| **Badge Visual** | ✅ Renderiza corretamente | ⚠️ Não aparece (falta `level`) | ❌ DIVERGENTE | **Corrigir Mobile** |
| **Categorias** | Infantil, Adulto, Avançado | Infantil, Adulto, Avançado | ✅ Igual | Nenhuma |
| **Validação** | ❌ Permite registro vazio (BUG #6) | ❌ Permite registro vazio | ✅ Igual (mas problemático) | Corrigir ambos |

**Ação prioritária:** Corrigir badge de graduação no Mobile

---

#### 4. **Presença/Agenda**

| Aspecto | Web | Mobile | Divergência | Ação |
|---------|-----|--------|-------------|------|
| **Tela de Presença** | ❓ Não validado | ✅ Implementado | ⚠️ Validar Web | Validar Web |
| **Agenda** | ❓ Não validado | ✅ Implementado | ⚠️ Validar Web | Validar Web |
| **Filtro por Turma** | ❓ Não validado | ✅ Implementado | ⚠️ Validar Web | Validar Web |
| **Filtro por Data** | ❓ Não validado | ✅ Implementado | ⚠️ Validar Web | Validar Web |

**Observação:** Mobile pode estar **mais avançado** que Web neste módulo

---

#### 5. **Autenticação**

| Aspecto | Web | Mobile | Divergência | Ação |
|---------|-----|--------|-------------|------|
| **Login** | ✅ Funcional | ✅ Funcional | ✅ Igual | Nenhuma |
| **Logout** | ✅ Funcional | ❓ Não validado | ⚠️ Validar | Validar Mobile |
| **Roles (ADMIN/PROFESSOR)** | ✅ Implementado | ❌ Não implementado | ❌ DIVERGENTE | **Implementar no Mobile** |
| **Persistência de Sessão** | ✅ localStorage | ❓ AsyncStorage? | ⚠️ Validar | Validar Mobile |
| **Esqueci minha senha** | ❌ Não implementado | ❌ Não implementado | ✅ Igual | Implementar em ambos (futuro) |

**Ação prioritária:** Implementar controle de Roles no Mobile

---

## 4️⃣ FUNCIONALIDADES CRÍTICAS AUSENTES NO MOBILE

### 🔴 BLOQUEADORES (Impedem uso em produção)

| # | Funcionalidade | Impacto | Prioridade | Estimativa |
|---|----------------|---------|------------|------------|
| 1 | **Módulo Unidades** | Impossível vincular alunos/turmas a unidades | 🔴 CRÍTICA | 2 dias |
| 2 | **Módulo Turmas** | Impossível criar/editar turmas | 🔴 CRÍTICA | 2 dias |
| 3 | **Módulo Professores** | Impossível gerenciar professores | 🔴 CRÍTICA | 3 dias |
| 4 | **Módulo Financeiro** | Impossível registrar pagamentos | 🔴 CRÍTICA | 5 dias |
| 5 | **Dashboard** | Sem visão geral do sistema | 🔴 CRÍTICA | 3 dias |
| 6 | **Controle de Roles** | Todos os usuários têm acesso total | 🔴 CRÍTICA | 2 dias |

**Total estimado:** 17 dias de desenvolvimento

### 🟡 IMPORTANTES (Impactam UX)

| # | Funcionalidade | Impacto | Prioridade | Estimativa |
|---|----------------|---------|------------|------------|
| 7 | **Busca de Alunos** | Dificulta localização de alunos | 🟡 ALTA | 1 dia |
| 8 | **Filtros Avançados** | Dificulta gestão de grandes volumes | 🟡 ALTA | 2 dias |
| 9 | **Configurações Gerais** | Impossível personalizar app | 🟡 MÉDIA | 1 dia |
| 10 | **Relatórios** | Impossível acompanhar KPIs | 🟡 MÉDIA | 5 dias |

**Total estimado:** 9 dias de desenvolvimento

---

## 5️⃣ MATRIZ DE PRIORIZAÇÃO (MOBILE FIRST)

### 🎯 SPRINT 1 - FUNDAÇÃO (2 semanas)
**Objetivo:** Tornar Mobile funcional para uso básico

| # | Tarefa | Dias | Prioridade |
|---|--------|------|------------|
| 1 | Corrigir exibição condicional do Responsável | 0.5 | 🔴 CRÍTICA |
| 2 | Implementar controle de Roles (ADMIN/PROFESSOR) | 2 | 🔴 CRÍTICA |
| 3 | Implementar Módulo Unidades | 2 | 🔴 CRÍTICA |
| 4 | Implementar Módulo Turmas | 2 | 🔴 CRÍTICA |
| 5 | Implementar Módulo Professores | 3 | 🔴 CRÍTICA |
| 6 | Corrigir Badge de Graduação (adicionar `level`) | 0.5 | 🟡 ALTA |

**Total:** 10 dias

---

### 🎯 SPRINT 2 - FINANCEIRO (2 semanas)
**Objetivo:** Implementar gestão financeira

| # | Tarefa | Dias | Prioridade |
|---|--------|------|------------|
| 1 | Implementar Backend de Pagamentos | 2 | 🔴 CRÍTICA |
| 2 | Implementar Tela de Pagamentos (Mobile) | 2 | 🔴 CRÍTICA |
| 3 | Implementar Tela de Pagamentos (Web) | 2 | 🔴 CRÍTICA |
| 4 | Implementar Cálculo de Saldo | 1 | 🔴 CRÍTICA |
| 5 | Implementar Dashboard (Mobile) | 3 | 🔴 CRÍTICA |

**Total:** 10 dias

---

### 🎯 SPRINT 3 - REFINAMENTO (1 semana)
**Objetivo:** Melhorar UX e adicionar funcionalidades secundárias

| # | Tarefa | Dias | Prioridade |
|---|--------|------|------------|
| 1 | Implementar Busca de Alunos (Mobile) | 1 | 🟡 ALTA |
| 2 | Implementar Filtros Avançados (Mobile) | 2 | 🟡 ALTA |
| 3 | Implementar Configurações Gerais (Mobile) | 1 | 🟡 MÉDIA |
| 4 | Adicionar Toasts em todos os módulos | 1 | 🟡 MÉDIA |

**Total:** 5 dias

---

## 6️⃣ ROADMAP DE CONVERGÊNCIA WEB ↔ MOBILE

### FASE 1: MOBILE ALCANÇA WEB (Sprints 1-3)
**Objetivo:** Mobile ter todas as funcionalidades do Web

- ✅ Unidades, Turmas, Professores
- ✅ Financeiro (Pagamentos)
- ✅ Dashboard
- ✅ Configurações
- ✅ Busca e Filtros

**Resultado:** Mobile = Web (paridade funcional)

---

### FASE 2: MOBILE SE TORNA REFERÊNCIA (Sprint 4)
**Objetivo:** Mobile ter funcionalidades exclusivas que Web não tem

- ✅ Notificações Push (vencimentos, eventos)
- ✅ Modo Offline (cache local)
- ✅ Câmera integrada
- ✅ Biometria
- ✅ Geolocalização (check-in em aulas)

**Resultado:** Mobile > Web (Mobile é referência)

---

### FASE 3: WEB ADOTA MELHORIAS DO MOBILE (Sprint 5)
**Objetivo:** Web adotar boas práticas do Mobile

- ✅ UX mobile-first (cards, gestos)
- ✅ Feedback visual consistente (toasts)
- ✅ Loading states
- ✅ Validações em tempo real

**Resultado:** Web ← Mobile (Web aprende com Mobile)

---

## 7️⃣ ANÁLISE DE RISCO

### 🔴 RISCOS CRÍTICOS

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **Mobile não alcançar Web a tempo** | 60% | ALTO | Priorizar funcionalidades críticas (Sprints 1-2) |
| **Divergências não documentadas** | 40% | ALTO | Validação E2E contínua |
| **Bugs no Web impactam Mobile** | 80% | ALTO | Corrigir bugs do Web primeiro (BUG #8, #9) |
| **Falta de recursos para desenvolvimento** | 50% | ALTO | Contratar desenvolvedor mobile ou treinar equipe |

### 🟡 RISCOS MÉDIOS

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| **UX inconsistente entre plataformas** | 70% | MÉDIO | Design System compartilhado |
| **Performance do Mobile** | 40% | MÉDIO | Otimizar queries, implementar cache |
| **Compatibilidade de versões** | 30% | MÉDIO | Versionamento de API |

---

## 8️⃣ RECOMENDAÇÕES FINAIS

### 🎯 ESTRATÉGIA: MOBILE FIRST

1. **Corrigir bugs do Web PRIMEIRO** (BUG #8, #9)
   - Mobile não pode herdar bugs do Web
   - Garantir que API está estável

2. **Implementar funcionalidades críticas no Mobile** (Sprint 1-2)
   - Unidades, Turmas, Professores
   - Financeiro (Pagamentos)
   - Dashboard

3. **Mobile se torna referência** (Sprint 3-4)
   - Funcionalidades exclusivas (notificações, offline, câmera)
   - UX superior

4. **Web adota melhorias do Mobile** (Sprint 5+)
   - Design System mobile-first
   - Feedback visual consistente

### 📊 MÉTRICAS DE SUCESSO

- ✅ **Paridade Funcional:** Mobile tem 100% das funcionalidades do Web
- ✅ **Funcionalidades Exclusivas:** Mobile tem 5+ funcionalidades que Web não tem
- ✅ **UX Superior:** Mobile tem NPS > Web
- ✅ **Performance:** Mobile carrega em < 2s
- ✅ **Adoção:** 80% dos usuários preferem Mobile

---

## 📋 CHECKLIST DE CONVERGÊNCIA

### Mobile alcançou Web?
- [ ] Dashboard
- [ ] Unidades (CRUD completo)
- [ ] Turmas (CRUD completo)
- [ ] Professores (CRUD completo)
- [ ] Alunos (CRUD completo)
- [ ] Graduações (CRUD completo)
- [ ] Financeiro (Pagamentos)
- [ ] Presença/Agenda
- [ ] Configurações Gerais
- [ ] Busca e Filtros
- [ ] Controle de Roles

### Mobile é referência?
- [ ] Notificações Push
- [ ] Modo Offline
- [ ] Câmera integrada
- [ ] Biometria
- [ ] UX superior ao Web
- [ ] Performance superior ao Web

### Web adotou melhorias do Mobile?
- [ ] Design System mobile-first
- [ ] Toasts consistentes
- [ ] Loading states
- [ ] Validações em tempo real
- [ ] Cards visuais

---

**Assinatura:**  
**QA Engineer Sênior + Arquiteto de Software Full Stack**  
**Data:** 22/01/2026
