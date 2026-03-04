# 📱 GUIA DE TESTES - APLICATIVO MOBILE
**Data:** 28/01/2026  
**Hora:** 10:10 BRT

---

## ✅ STATUS DOS SERVIÇOS

### Backend API
- **Status:** ✅ RODANDO
- **Porta:** 5175
- **URL:** http://0.0.0.0:5175
- **Comando:** `npm run dev` (apps/api)

### Mobile App (Expo)
- **Status:** ✅ INICIANDO
- **Comando:** `npm start` (apps/mobile)
- **Aguardando:** QR Code aparecer

---

## 📋 INSTRUÇÕES PARA TESTAR

### Passo 1: Aguardar Expo Iniciar
Aguarde o terminal mostrar:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### Passo 2: Abrir no Dispositivo/Emulador

**Opção A: Dispositivo Físico**
1. Instalar Expo Go no celular (se ainda não tiver)
2. Escanear o QR Code que aparecerá no terminal
3. Aguardar o app carregar

**Opção B: Emulador Android**
1. Abrir emulador Android
2. Pressionar `a` no terminal do Expo
3. Aguardar o app carregar

**Opção C: Simulador iOS (Mac)**
1. Abrir simulador iOS
2. Pressionar `i` no terminal do Expo
3. Aguardar o app carregar

### Passo 3: Fazer Login
1. Tela de login aparecerá
2. Usar credenciais de teste ou criar novo usuário
3. Fazer login

---

## 🧪 ROTEIRO DE TESTES

### TESTE 1: Módulo de Unidades (15 min)

#### 1.1 Acessar Unidades
1. No Dashboard, clicar no botão **"Unidades"** (ícone vermelho)
2. ✅ Verificar: Tela de listagem abre

#### 1.2 Criar Unidade
1. Clicar em **"Nova Unidade"**
2. Preencher:
   - Nome: `Unidade Teste Mobile`
   - Endereço: `Rua Teste, 123, Centro`
   - Cor: Selecionar **Azul** (#3B82F6)
   - Mensalidade: `150.00`
   - Forma de pagamento: **PIX**
   - Status: **Ativa**
3. Clicar em **"Criar Unidade"**
4. ✅ Verificar: Alert de sucesso aparece
5. ✅ Verificar: Volta para lista
6. ✅ Verificar: Unidade aparece na lista com barra azul

#### 1.3 Editar Unidade
1. Na unidade criada, clicar em **"Editar"**
2. ✅ Verificar: Dados carregam corretamente
3. Alterar:
   - Nome: `Unidade Teste Mobile EDITADA`
   - Cor: Selecionar **Verde** (#10B981)
4. Clicar em **"Atualizar"**
5. ✅ Verificar: Alert de sucesso
6. ✅ Verificar: Nome e cor atualizados na lista

#### 1.4 Pull to Refresh
1. Puxar a lista para baixo
2. ✅ Verificar: Indicador de loading aparece
3. ✅ Verificar: Lista recarrega

---

### TESTE 2: Módulo de Turmas (15 min)

#### 2.1 Acessar Turmas
1. Voltar ao Dashboard
2. Clicar no botão **"Turmas"** (ícone azul)
3. ✅ Verificar: Tela de listagem abre

#### 2.2 Criar Turma
1. Clicar em **"Nova Turma"**
2. Preencher:
   - Nome: `Turma Teste Mobile`
   - Unidade: Selecionar **"Unidade Teste Mobile EDITADA"**
   - Dias: Marcar **SEG**, **QUA**, **SEX**
   - Horário: `18:00`
   - Status: **Ativa**
3. ✅ Verificar: Preview mostra "SEG 18:00, QUA 18:00, SEX 18:00"
4. Clicar em **"Criar Turma"**
5. ✅ Verificar: Alert de sucesso
6. ✅ Verificar: Turma aparece agrupada sob a unidade

#### 2.3 Editar Turma
1. Na turma criada, clicar em **"Editar"**
2. ✅ Verificar: Dados carregam (dias marcados, horário correto)
3. Alterar:
   - Nome: `Turma Teste Mobile EDITADA`
   - Dias: Desmarcar SEG, marcar TER e QUI
   - Horário: `19:00`
4. ✅ Verificar: Preview atualiza para "TER 19:00, QUA 19:00, QUI 19:00, SEX 19:00"
5. Clicar em **"Atualizar"**
6. ✅ Verificar: Alterações aparecem na lista

---

### TESTE 3: Módulo de Professores (20 min)

#### 3.1 Acessar Professores
1. Voltar ao Dashboard
2. Clicar no botão **"Professores"** (ícone roxo)
3. ✅ Verificar: Tela de listagem abre

#### 3.2 Criar Professor
1. Clicar em **"Novo Professor"**
2. Preencher:
   - Nome Completo: `João Silva Teste`
   - Apelido: `Mestre Teste`
   - CPF: `12345678900`
   - Email: `teste@gingaflow.com`
   - Telefone: `(11) 99999-9999`
   - Graduação: Selecionar uma (se houver)
   - Status: **Ativo**
3. Rolar até **"Turmas"**
4. Marcar a turma **"Turma Teste Mobile EDITADA"**
5. ✅ Verificar: Checkmark (✓) aparece
6. Clicar em **"Cadastrar"**
7. ✅ Verificar: Alert de sucesso
8. ✅ Verificar: Professor aparece na lista
9. ✅ Verificar: Mostra "1 unidade • 1 turma"
10. ✅ Verificar: Nome da unidade e turma aparecem

#### 3.3 Editar Professor
1. No professor criado, clicar em **"Editar"**
2. ✅ Verificar: Dados carregam corretamente
3. ✅ Verificar: Turma está marcada com checkmark
4. Alterar:
   - Nome: `João Silva Teste EDITADO`
   - Apelido: `Mestre Teste EDITADO`
5. Clicar em **"Atualizar"**
6. ✅ Verificar: Alterações aparecem na lista

#### 3.4 Toggle Status
1. No professor, clicar em **"Inativar"**
2. ✅ Verificar: Confirmação aparece
3. Confirmar
4. ✅ Verificar: Status muda para INATIVO (badge vermelho)
5. Clicar em **"Ativar"**
6. ✅ Verificar: Status volta para ATIVO (badge verde)

---

### TESTE 4: Validações (5 min)

#### 4.1 Validação de Campos Obrigatórios
1. Tentar criar unidade sem nome
   - ✅ Verificar: Alert "Nome da unidade é obrigatório"
2. Tentar criar turma sem nome
   - ✅ Verificar: Alert "Nome da turma é obrigatório"
3. Tentar criar turma sem selecionar unidade
   - ✅ Verificar: Alert "Selecione uma unidade"
4. Tentar criar turma sem selecionar dias
   - ✅ Verificar: Alert "Selecione pelo menos um dia da semana"
5. Tentar criar professor sem nome
   - ✅ Verificar: Alert "Nome completo é obrigatório"
6. Tentar criar professor sem CPF
   - ✅ Verificar: Alert "CPF é obrigatório"

---

### TESTE 5: Navegação (5 min)

#### 5.1 Navegação entre Telas
1. Dashboard → Unidades → Criar → Cancelar → Lista → Dashboard
   - ✅ Verificar: Fluxo funciona
2. Dashboard → Turmas → Criar → Cancelar → Lista → Dashboard
   - ✅ Verificar: Fluxo funciona
3. Dashboard → Professores → Criar → Cancelar → Lista → Dashboard
   - ✅ Verificar: Fluxo funciona

#### 5.2 Botão Voltar
1. Em cada tela, testar botão voltar nativo do Android/iOS
   - ✅ Verificar: Volta para tela anterior

---

## ✅ CHECKLIST FINAL

### Funcionalidades Críticas
- [ ] Unidades: Listar ✅
- [ ] Unidades: Criar ✅
- [ ] Unidades: Editar ✅
- [ ] Unidades: Excluir ✅
- [ ] Turmas: Listar ✅
- [ ] Turmas: Criar ✅
- [ ] Turmas: Editar ✅
- [ ] Turmas: Excluir ✅
- [ ] Professores: Listar ✅
- [ ] Professores: Criar ✅
- [ ] Professores: Editar ✅
- [ ] Professores: Toggle Status ✅
- [ ] Professores: Excluir ✅

### UX/UI
- [ ] Loading states aparecem
- [ ] Empty states aparecem
- [ ] Pull to refresh funciona
- [ ] Alerts de sucesso aparecem
- [ ] Alerts de erro aparecem
- [ ] Navegação fluida
- [ ] Cores e design consistentes

### Integrações
- [ ] Turmas aparecem vinculadas a unidades
- [ ] Professores aparecem vinculados a turmas
- [ ] Contadores estão corretos
- [ ] Dados persistem após refresh

---

## 📊 RESULTADO ESPERADO

### ✅ APROVADO se:
- Todos os itens do checklist funcionam
- Nenhum crash ou erro crítico
- Dados persistem corretamente
- UX é fluida e intuitiva

### ❌ REPROVADO se:
- Qualquer funcionalidade crítica falha
- Crashes ou erros não tratados
- Dados não persistem
- Navegação quebrada

---

## 📝 COMO REPORTAR BUGS

Se encontrar algum bug, me informe com:
1. **O que você estava fazendo**
2. **O que esperava que acontecesse**
3. **O que realmente aconteceu**
4. **Mensagem de erro (se houver)**

---

**Boa sorte nos testes!** 🧪

**Tempo estimado:** 60 minutos  
**Responsável:** Você (com meu suporte)
