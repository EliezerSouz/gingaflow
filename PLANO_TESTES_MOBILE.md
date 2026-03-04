# 🧪 PLANO DE TESTES - MÓDULOS MOBILE
**Data:** 28/01/2026  
**Hora Início:** 10:09 BRT  
**Objetivo:** Validar os 3 módulos implementados (Unidades, Turmas, Professores)

---

## ✅ SERVIDOR BACKEND

**Status:** ✅ RODANDO  
**Porta:** 5175  
**URL:** http://0.0.0.0:5175  
**Hora Início:** 10:09 BRT

---

## 📋 CHECKLIST DE TESTES

### 1️⃣ TESTE: Módulo de Unidades (Mobile)

#### 1.1 Listagem de Unidades
- [ ] Abrir tela de Unidades
- [ ] Verificar se carrega lista existente
- [ ] Verificar empty state (se não houver unidades)
- [ ] Testar pull to refresh
- [ ] Verificar exibição de:
  - [ ] Nome da unidade
  - [ ] Cor da unidade (barra superior)
  - [ ] Endereço
  - [ ] Status (badge)
  - [ ] Mensalidade padrão
  - [ ] Forma de pagamento

#### 1.2 Criar Nova Unidade
- [ ] Clicar em "Nova Unidade"
- [ ] Preencher nome: "Unidade Teste Mobile"
- [ ] Preencher endereço: "Rua Teste, 123"
- [ ] Selecionar cor: Azul (#3B82F6)
- [ ] Definir mensalidade: 150.00
- [ ] Selecionar forma de pagamento: PIX
- [ ] Salvar
- [ ] Verificar toast/alert de sucesso
- [ ] Verificar se voltou para lista
- [ ] Verificar se unidade aparece na lista

#### 1.3 Editar Unidade
- [ ] Clicar em "Editar" em uma unidade
- [ ] Verificar se dados carregam corretamente
- [ ] Alterar nome para "Unidade Teste Mobile Editada"
- [ ] Alterar cor para Verde (#10B981)
- [ ] Salvar
- [ ] Verificar toast/alert de sucesso
- [ ] Verificar se alterações aparecem na lista

#### 1.4 Excluir Unidade
- [ ] Clicar em "Excluir" em uma unidade
- [ ] Verificar confirmação
- [ ] Confirmar exclusão
- [ ] Verificar toast/alert de sucesso
- [ ] Verificar se unidade sumiu da lista

---

### 2️⃣ TESTE: Módulo de Turmas (Mobile)

#### 2.1 Listagem de Turmas
- [ ] Abrir tela de Turmas
- [ ] Verificar se carrega lista existente
- [ ] Verificar agrupamento por unidade
- [ ] Verificar empty state (se não houver turmas)
- [ ] Testar pull to refresh
- [ ] Verificar exibição de:
  - [ ] Nome da turma
  - [ ] Horário (schedule)
  - [ ] Status (badge)
  - [ ] Nome da unidade
  - [ ] Cor da unidade (dot)
  - [ ] Contador de turmas por unidade

#### 2.2 Criar Nova Turma
- [ ] Clicar em "Nova Turma"
- [ ] Preencher nome: "Turma Teste Mobile"
- [ ] Selecionar unidade: "Unidade Teste Mobile Editada"
- [ ] Selecionar dias: SEG, QUA, SEX
- [ ] Definir horário: 18:00
- [ ] Verificar preview do horário
- [ ] Salvar
- [ ] Verificar toast/alert de sucesso
- [ ] Verificar se voltou para lista
- [ ] Verificar se turma aparece na lista

#### 2.3 Editar Turma
- [ ] Clicar em "Editar" em uma turma
- [ ] Verificar se dados carregam corretamente
- [ ] Alterar nome para "Turma Teste Mobile Editada"
- [ ] Alterar dias para TER, QUI
- [ ] Alterar horário para 19:00
- [ ] Salvar
- [ ] Verificar toast/alert de sucesso
- [ ] Verificar se alterações aparecem na lista

#### 2.4 Excluir Turma
- [ ] Clicar em "Excluir" em uma turma
- [ ] Verificar confirmação
- [ ] Confirmar exclusão
- [ ] Verificar toast/alert de sucesso
- [ ] Verificar se turma sumiu da lista

---

### 3️⃣ TESTE: Módulo de Professores (Mobile)

#### 3.1 Listagem de Professores
- [ ] Abrir tela de Professores
- [ ] Verificar se carrega lista existente
- [ ] Verificar empty state (se não houver professores)
- [ ] Testar pull to refresh
- [ ] Verificar exibição de:
  - [ ] Nome completo
  - [ ] Apelido de capoeira
  - [ ] Graduação
  - [ ] Email
  - [ ] Telefone
  - [ ] Status (badge)
  - [ ] Unidades vinculadas
  - [ ] Turmas vinculadas
  - [ ] Contadores (X unidades • Y turmas)

#### 3.2 Criar Novo Professor
- [ ] Clicar em "Novo Professor"
- [ ] Preencher nome: "João Silva Teste"
- [ ] Preencher apelido: "Mestre Teste"
- [ ] Preencher CPF: 12345678900
- [ ] Preencher email: teste@gingaflow.com
- [ ] Preencher telefone: (11) 99999-9999
- [ ] Selecionar graduação (se houver)
- [ ] Selecionar turmas: marcar 2-3 turmas
- [ ] Verificar checkmarks nas turmas selecionadas
- [ ] Salvar
- [ ] Verificar toast/alert de sucesso
- [ ] Verificar se voltou para lista
- [ ] Verificar se professor aparece na lista
- [ ] Verificar se turmas aparecem vinculadas

#### 3.3 Editar Professor
- [ ] Clicar em "Editar" em um professor
- [ ] Verificar se dados carregam corretamente
- [ ] Verificar se turmas vinculadas estão marcadas
- [ ] Alterar nome para "João Silva Teste Editado"
- [ ] Alterar apelido para "Mestre Teste Editado"
- [ ] Adicionar/remover turmas
- [ ] Salvar
- [ ] Verificar toast/alert de sucesso
- [ ] Verificar se alterações aparecem na lista

#### 3.4 Toggle Status do Professor
- [ ] Clicar em "Inativar" em um professor ativo
- [ ] Verificar confirmação
- [ ] Confirmar
- [ ] Verificar toast/alert de sucesso
- [ ] Verificar se status mudou para INATIVO
- [ ] Clicar em "Ativar" no mesmo professor
- [ ] Verificar confirmação
- [ ] Confirmar
- [ ] Verificar se status mudou para ATIVO

#### 3.5 Excluir Professor
- [ ] Clicar em "Excluir" em um professor
- [ ] Verificar confirmação
- [ ] Confirmar exclusão
- [ ] Verificar toast/alert de sucesso
- [ ] Verificar se professor sumiu da lista

---

### 4️⃣ TESTE: Navegação e Integração

#### 4.1 Dashboard - Acesso Rápido
- [ ] Abrir Dashboard
- [ ] Verificar botão "Unidades"
- [ ] Clicar e verificar navegação
- [ ] Voltar ao Dashboard
- [ ] Verificar botão "Turmas"
- [ ] Clicar e verificar navegação
- [ ] Voltar ao Dashboard
- [ ] Verificar botão "Professores"
- [ ] Clicar e verificar navegação

#### 4.2 Navegação entre Módulos
- [ ] De Unidades → Criar Unidade → Voltar
- [ ] De Turmas → Criar Turma → Voltar
- [ ] De Professores → Criar Professor → Voltar
- [ ] Verificar botão de voltar nativo
- [ ] Verificar botão de cancelar nos formulários

#### 4.3 Integração de Dados
- [ ] Criar unidade
- [ ] Criar turma vinculada a essa unidade
- [ ] Criar professor vinculado a essa turma
- [ ] Verificar se:
  - [ ] Turma aparece na unidade
  - [ ] Professor aparece na turma
  - [ ] Unidade aparece no professor
  - [ ] Contadores estão corretos

---

### 5️⃣ TESTE: Validações e Erros

#### 5.1 Validação de Campos Obrigatórios
- [ ] Tentar criar unidade sem nome → Verificar erro
- [ ] Tentar criar turma sem nome → Verificar erro
- [ ] Tentar criar turma sem unidade → Verificar erro
- [ ] Tentar criar turma sem dias → Verificar erro
- [ ] Tentar criar professor sem nome → Verificar erro
- [ ] Tentar criar professor sem CPF → Verificar erro

#### 5.2 Tratamento de Erros de API
- [ ] Desligar servidor backend
- [ ] Tentar carregar lista → Verificar mensagem de erro
- [ ] Tentar criar registro → Verificar mensagem de erro
- [ ] Religar servidor
- [ ] Testar pull to refresh → Verificar recuperação

---

## 📊 CRITÉRIOS DE SUCESSO

### ✅ Aprovado se:
- [ ] Todas as listagens carregam corretamente
- [ ] Todas as criações funcionam
- [ ] Todas as edições funcionam
- [ ] Todas as exclusões funcionam
- [ ] Navegação funciona perfeitamente
- [ ] Validações estão funcionando
- [ ] Feedback visual está presente (alerts/toasts)
- [ ] Loading states aparecem
- [ ] Empty states aparecem quando apropriado
- [ ] Pull to refresh funciona
- [ ] Integrações entre módulos funcionam
- [ ] Dados persistem corretamente

### ❌ Reprovado se:
- [ ] Qualquer funcionalidade crítica não funciona
- [ ] Crashes ou erros não tratados
- [ ] Dados não persistem
- [ ] Navegação quebrada
- [ ] Validações ausentes

---

## 📝 REGISTRO DE BUGS

### Bugs Encontrados:
(Preencher durante os testes)

1. **Bug #1:**
   - Descrição:
   - Severidade: (Crítico/Alto/Médio/Baixo)
   - Passos para reproduzir:
   - Status:

---

## ⏱️ TEMPO ESTIMADO

- **Teste Unidades:** 15 min
- **Teste Turmas:** 15 min
- **Teste Professores:** 20 min
- **Teste Navegação:** 5 min
- **Teste Validações:** 5 min
- **Total:** 60 min

---

## 📋 PRÓXIMOS PASSOS APÓS TESTES

### Se APROVADO (0 bugs críticos):
1. ✅ Marcar módulos como validados
2. ✅ Atualizar documentação
3. ✅ Continuar com próximos módulos (Dashboard, Financeiro)

### Se REPROVADO (bugs críticos):
1. ❌ Documentar bugs encontrados
2. ❌ Priorizar correções
3. ❌ Corrigir bugs críticos
4. ❌ Re-testar

---

**Responsável:** QA Lead  
**Data:** 28/01/2026  
**Status:** 🔄 EM ANDAMENTO
