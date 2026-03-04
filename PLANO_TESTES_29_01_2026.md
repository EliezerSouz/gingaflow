# 🧪 PLANO DE TESTES - 29/01/2026
**Hora Início:** 09:07 BRT  
**Objetivo:** Validar módulos Mobile implementados em 28/01/2026

---

## ✅ STATUS DOS SERVIÇOS

### Backend API
- **Status:** ✅ RODANDO
- **Porta:** 5175
- **URL:** http://0.0.0.0:5175
- **Comando:** `npm run dev` (apps/api)
- **PID:** 15392

### Mobile App (Expo)
- **Status:** 🔄 INICIANDO
- **Comando:** `npm start` (apps/mobile)
- **Aguardando:** Metro Bundler completar

---

## 📋 MÓDULOS A TESTAR

### ✅ Implementados (28/01/2026)
1. **Unidades** - 100% ⭐
2. **Turmas** - 100% ⭐
3. **Professores** - 100% ⭐
4. **Dashboard** - 80% ⭐

### ⏳ Já Existentes (Validar)
5. **Autenticação** - 100%
6. **Graduações** - 70%
7. **Alunos** - 75%

---

## 🧪 ROTEIRO DE TESTES COMPLETO

### FASE 1: Autenticação (5 min)

#### Teste 1.1: Login
- [ ] Abrir app no dispositivo/emulador
- [ ] Tela de login aparece
- [ ] Fazer login com credenciais válidas
- [ ] ✅ Verificar: Redirecionamento para Dashboard

#### Teste 1.2: Sessão
- [ ] Fechar e reabrir app
- [ ] ✅ Verificar: Usuário continua logado

---

### FASE 2: Dashboard (10 min)

#### Teste 2.1: Métricas Visíveis
- [ ] ✅ Verificar: 8 cards de métricas aparecem
- [ ] ✅ Verificar: Ícones coloridos corretos
- [ ] ✅ Verificar: Números carregam (não "0" ou "---")

#### Teste 2.2: Navegação por Cards
- [ ] Clicar em **"Alunos"**
  - ✅ Verificar: Navega para tela de alunos
  - Voltar ao Dashboard
- [ ] Clicar em **"Unidades"**
  - ✅ Verificar: Navega para tela de unidades
  - Voltar ao Dashboard
- [ ] Clicar em **"Turmas"**
  - ✅ Verificar: Navega para tela de turmas
  - Voltar ao Dashboard
- [ ] Clicar em **"Professores"**
  - ✅ Verificar: Navega para tela de professores
  - Voltar ao Dashboard

#### Teste 2.3: Pull to Refresh
- [ ] Puxar Dashboard para baixo
- [ ] ✅ Verificar: Indicador de loading aparece
- [ ] ✅ Verificar: Métricas recarregam

---

### FASE 3: Módulo de Unidades (20 min)

#### Teste 3.1: Listar Unidades
- [ ] Acessar **"Unidades"** pelo Dashboard
- [ ] ✅ Verificar: Lista de unidades aparece
- [ ] ✅ Verificar: Cada card mostra:
  - Nome da unidade
  - Endereço
  - Barra de cor (lado esquerdo)
  - Badge de status (Ativa/Inativa)
  - Botões Editar/Excluir

#### Teste 3.2: Criar Unidade
- [ ] Clicar em **"Nova Unidade"** (botão +)
- [ ] Preencher:
  - Nome: `Unidade Teste 29/01`
  - Endereço: `Rua Teste, 456, Bairro Novo`
  - Cor: Selecionar **Roxo** (#8B5CF6)
  - Mensalidade: `180.00`
  - Forma de pagamento: **Cartão de Crédito**
  - Status: **Ativa**
- [ ] Clicar em **"Criar Unidade"**
- [ ] ✅ Verificar: Alert de sucesso aparece
- [ ] ✅ Verificar: Volta para lista
- [ ] ✅ Verificar: Nova unidade aparece com barra roxa

#### Teste 3.3: Editar Unidade
- [ ] Na unidade criada, clicar em **"Editar"**
- [ ] ✅ Verificar: Formulário carrega com dados corretos
- [ ] Alterar:
  - Nome: `Unidade Teste 29/01 EDITADA`
  - Cor: Selecionar **Verde** (#10B981)
- [ ] Clicar em **"Atualizar"**
- [ ] ✅ Verificar: Alert de sucesso
- [ ] ✅ Verificar: Nome e cor atualizados na lista

#### Teste 3.4: Excluir Unidade
- [ ] Na unidade criada, clicar em **"Excluir"**
- [ ] ✅ Verificar: Confirmação aparece
- [ ] Cancelar
- [ ] ✅ Verificar: Unidade permanece na lista
- [ ] Clicar em **"Excluir"** novamente
- [ ] Confirmar
- [ ] ✅ Verificar: Unidade removida da lista

#### Teste 3.5: Validações
- [ ] Tentar criar unidade sem nome
  - ✅ Verificar: Alert "Nome da unidade é obrigatório"
- [ ] Criar unidade válida para próximos testes:
  - Nome: `Unidade Principal`
  - Cor: Azul (#3B82F6)
  - Status: Ativa

---

### FASE 4: Módulo de Turmas (25 min)

#### Teste 4.1: Listar Turmas
- [ ] Acessar **"Turmas"** pelo Dashboard
- [ ] ✅ Verificar: Lista agrupada por unidades
- [ ] ✅ Verificar: Cada turma mostra:
  - Nome
  - Horário
  - Dias da semana
  - Unidade vinculada
  - Botões Editar/Excluir

#### Teste 4.2: Criar Turma
- [ ] Clicar em **"Nova Turma"** (botão +)
- [ ] Preencher:
  - Nome: `Turma Teste 29/01`
  - Unidade: Selecionar **"Unidade Principal"**
  - Dias: Marcar **SEG**, **QUA**, **SEX**
  - Horário: `18:00`
  - Status: **Ativa**
- [ ] ✅ Verificar: Preview mostra "SEG 18:00, QUA 18:00, SEX 18:00"
- [ ] Clicar em **"Criar Turma"**
- [ ] ✅ Verificar: Alert de sucesso
- [ ] ✅ Verificar: Turma aparece agrupada sob "Unidade Principal"

#### Teste 4.3: Editar Turma
- [ ] Na turma criada, clicar em **"Editar"**
- [ ] ✅ Verificar: Dados carregam corretamente
- [ ] ✅ Verificar: Dias SEG, QUA, SEX estão marcados
- [ ] ✅ Verificar: Horário mostra "18:00"
- [ ] Alterar:
  - Nome: `Turma Teste 29/01 EDITADA`
  - Dias: Desmarcar SEG, marcar TER e QUI
  - Horário: `19:30`
- [ ] ✅ Verificar: Preview atualiza para "TER 19:30, QUA 19:30, QUI 19:30, SEX 19:30"
- [ ] Clicar em **"Atualizar"**
- [ ] ✅ Verificar: Alterações aparecem na lista

#### Teste 4.4: Seletor de Dias
- [ ] Criar nova turma
- [ ] Testar cada dia da semana:
  - [ ] SEG ✅
  - [ ] TER ✅
  - [ ] QUA ✅
  - [ ] QUI ✅
  - [ ] SEX ✅
  - [ ] SAB ✅
  - [ ] DOM ✅
- [ ] ✅ Verificar: Preview atualiza em tempo real
- [ ] Cancelar

#### Teste 4.5: Validações
- [ ] Tentar criar turma sem nome
  - ✅ Verificar: Alert "Nome da turma é obrigatório"
- [ ] Tentar criar turma sem selecionar unidade
  - ✅ Verificar: Alert "Selecione uma unidade"
- [ ] Tentar criar turma sem selecionar dias
  - ✅ Verificar: Alert "Selecione pelo menos um dia da semana"

---

### FASE 5: Módulo de Professores (30 min)

#### Teste 5.1: Listar Professores
- [ ] Acessar **"Professores"** pelo Dashboard
- [ ] ✅ Verificar: Lista de professores aparece
- [ ] ✅ Verificar: Cada card mostra:
  - Nome completo
  - Apelido
  - Badge de status (Ativo/Inativo)
  - Contador de unidades e turmas
  - Lista de unidades e turmas vinculadas
  - Botões Editar/Inativar/Excluir

#### Teste 5.2: Criar Professor
- [ ] Clicar em **"Novo Professor"** (botão +)
- [ ] Preencher:
  - Nome Completo: `Maria Santos Teste`
  - Apelido: `Professora Maria`
  - CPF: `98765432100`
  - Email: `maria@gingaflow.com`
  - Telefone: `(21) 98888-7777`
  - Graduação: Selecionar uma (se houver)
  - Status: **Ativo**
- [ ] Rolar até **"Turmas"**
- [ ] Marcar a turma **"Turma Teste 29/01 EDITADA"**
- [ ] ✅ Verificar: Checkmark (✓) aparece
- [ ] Clicar em **"Cadastrar"**
- [ ] ✅ Verificar: Alert de sucesso
- [ ] ✅ Verificar: Professor aparece na lista
- [ ] ✅ Verificar: Mostra "1 unidade • 1 turma"
- [ ] ✅ Verificar: Nome da unidade e turma aparecem

#### Teste 5.3: Editar Professor
- [ ] No professor criado, clicar em **"Editar"**
- [ ] ✅ Verificar: Dados carregam corretamente
- [ ] ✅ Verificar: Turma está marcada com checkmark
- [ ] Alterar:
  - Nome: `Maria Santos Teste EDITADA`
  - Apelido: `Mestra Maria`
- [ ] Clicar em **"Atualizar"**
- [ ] ✅ Verificar: Alterações aparecem na lista

#### Teste 5.4: Toggle Status
- [ ] No professor, clicar em **"Inativar"**
- [ ] ✅ Verificar: Confirmação aparece
- [ ] Confirmar
- [ ] ✅ Verificar: Status muda para INATIVO (badge vermelho)
- [ ] Clicar em **"Ativar"**
- [ ] ✅ Verificar: Status volta para ATIVO (badge verde)

#### Teste 5.5: Vincular Múltiplas Turmas
- [ ] Editar professor
- [ ] Criar mais uma turma (se necessário)
- [ ] Marcar 2 ou mais turmas
- [ ] ✅ Verificar: Contador atualiza corretamente
- [ ] Salvar
- [ ] ✅ Verificar: Todas as turmas aparecem na lista

#### Teste 5.6: Validações
- [ ] Tentar criar professor sem nome
  - ✅ Verificar: Alert "Nome completo é obrigatório"
- [ ] Tentar criar professor sem CPF
  - ✅ Verificar: Alert "CPF é obrigatório"

---

### FASE 6: Integração entre Módulos (15 min)

#### Teste 6.1: Fluxo Completo
- [ ] Criar Unidade → Criar Turma vinculada → Criar Professor vinculado
- [ ] ✅ Verificar: Dados aparecem corretamente em cada módulo
- [ ] ✅ Verificar: Contadores no Dashboard atualizam

#### Teste 6.2: Exclusão em Cascata
- [ ] Tentar excluir unidade que tem turmas vinculadas
- [ ] ✅ Verificar: Sistema impede ou avisa sobre dependências

#### Teste 6.3: Dados Persistem
- [ ] Fechar e reabrir app
- [ ] ✅ Verificar: Todos os dados criados permanecem
- [ ] ✅ Verificar: Dashboard mostra números corretos

---

### FASE 7: UX/UI (10 min)

#### Teste 7.1: Loading States
- [ ] Em cada tela, verificar:
  - [ ] Indicador de loading aparece ao carregar dados
  - [ ] Indicador de loading aparece ao salvar
  - [ ] Indicador de loading aparece ao excluir

#### Teste 7.2: Empty States
- [ ] Criar novo usuário (ou limpar dados)
- [ ] Acessar cada módulo vazio
- [ ] ✅ Verificar: Mensagem "Nenhum(a) X encontrado(a)" aparece

#### Teste 7.3: Pull to Refresh
- [ ] Em cada lista, puxar para baixo
- [ ] ✅ Verificar: Indicador aparece e dados recarregam

#### Teste 7.4: Navegação
- [ ] Testar botão voltar em todas as telas
- [ ] ✅ Verificar: Sempre volta para tela anterior correta
- [ ] Testar navegação pelo menu/drawer
- [ ] ✅ Verificar: Todas as opções funcionam

---

## ✅ CHECKLIST FINAL

### Funcionalidades Críticas
- [ ] **Unidades:** Listar ✅
- [ ] **Unidades:** Criar ✅
- [ ] **Unidades:** Editar ✅
- [ ] **Unidades:** Excluir ✅
- [ ] **Turmas:** Listar ✅
- [ ] **Turmas:** Criar ✅
- [ ] **Turmas:** Editar ✅
- [ ] **Turmas:** Excluir ✅
- [ ] **Professores:** Listar ✅
- [ ] **Professores:** Criar ✅
- [ ] **Professores:** Editar ✅
- [ ] **Professores:** Toggle Status ✅
- [ ] **Professores:** Excluir ✅
- [ ] **Dashboard:** 8 métricas ✅
- [ ] **Dashboard:** Navegação por cards ✅

### UX/UI
- [ ] Loading states aparecem
- [ ] Empty states aparecem
- [ ] Pull to refresh funciona
- [ ] Alerts de sucesso aparecem
- [ ] Alerts de erro aparecem
- [ ] Navegação fluida
- [ ] Cores e design consistentes

### Integrações
- [ ] Turmas vinculadas a unidades
- [ ] Professores vinculados a turmas
- [ ] Contadores corretos no Dashboard
- [ ] Dados persistem após refresh
- [ ] Dados persistem após fechar app

---

## 📊 CRITÉRIOS DE APROVAÇÃO

### ✅ APROVADO se:
- ✅ Todos os 13 itens de funcionalidades críticas funcionam
- ✅ Nenhum crash ou erro crítico
- ✅ Dados persistem corretamente
- ✅ UX é fluida e intuitiva
- ✅ Validações funcionam corretamente

### ❌ REPROVADO se:
- ❌ Qualquer funcionalidade crítica falha
- ❌ Crashes ou erros não tratados
- ❌ Dados não persistem
- ❌ Navegação quebrada
- ❌ Validações não funcionam

---

## 📝 TEMPLATE DE REPORTE DE BUGS

Se encontrar bugs, documente assim:

```
### BUG #XX: [Título Curto]
**Módulo:** [Unidades/Turmas/Professores/Dashboard]
**Severidade:** [Crítica/Alta/Média/Baixa]
**Reprodução:**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Esperado:** [O que deveria acontecer]
**Atual:** [O que realmente acontece]
**Erro:** [Mensagem de erro, se houver]
**Screenshot:** [Se aplicável]
```

---

## ⏱️ TEMPO ESTIMADO

| Fase | Tempo |
|------|-------|
| Fase 1: Autenticação | 5 min |
| Fase 2: Dashboard | 10 min |
| Fase 3: Unidades | 20 min |
| Fase 4: Turmas | 25 min |
| Fase 5: Professores | 30 min |
| Fase 6: Integração | 15 min |
| Fase 7: UX/UI | 10 min |
| **TOTAL** | **115 min (~2h)** |

---

## 🎯 PRÓXIMOS PASSOS APÓS TESTES

### Se APROVADO:
1. ✅ Documentar resultados
2. ✅ Atualizar progresso do projeto
3. 🚀 Implementar próximo módulo (Financeiro)

### Se REPROVADO:
1. 📝 Documentar todos os bugs encontrados
2. 🔧 Priorizar correções
3. 🔄 Corrigir bugs críticos
4. 🧪 Re-testar

---

**Responsável:** QA Lead + Desenvolvedor  
**Data:** 29/01/2026  
**Hora Início:** 09:07 BRT  
**Status:** 🔄 AGUARDANDO EXPO INICIAR

**Boa sorte nos testes!** 🧪🚀
