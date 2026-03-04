# 🐛 ERROS ENCONTRADOS - TROUBLESHOOTING
**Data:** 29/01/2026 - 17:06 BRT

---

## ❌ ERROS IDENTIFICADOS

### Erro 1: Validação Zod - "too_big"
```
Data: {"code":"INTERNAL_ERROR","message":"[\n {\n \"code\": \"too_big\",\n \"maximum\": 100,\n \"type\": \"number\"..."}
```

**Problema:** Algum campo numérico está excedendo o valor máximo de 100.

### Erro 2: Status 500
```
Response Error: Request failed with status code 500
```

**Problema:** Erro interno do servidor ao processar requisição.

### Erro 3: Status 500 (repetido)
```
Status: 500
```

---

## 🔍 ANÁLISE

### Possíveis Causas:

1. **Dados no Banco Inválidos**
   - Algum registro tem valor numérico > 100
   - Pode ser: mensalidade, idade, ordem, etc.

2. **Schema de Validação Muito Restritivo**
   - Validação Zod com `.max(100)` pode estar bloqueando dados válidos

3. **Migração de Dados**
   - Dados antigos não compatíveis com validação nova

---

## 🔧 SOLUÇÕES

### Solução 1: Limpar Banco de Dados (Mais Rápido)

Se você está apenas testando e não tem dados importantes:

```powershell
# Parar o backend (Ctrl+C)
cd apps/api
npx prisma migrate reset --force
npm run dev
```

Isso vai:
- ✅ Limpar todo o banco
- ✅ Recriar as tabelas
- ✅ Criar usuário admin novamente
- ✅ Começar do zero

### Solução 2: Identificar o Campo Problemático

Vamos verificar qual campo está causando o erro:

1. Verificar logs do backend
2. Identificar qual rota está falhando
3. Ajustar validação ou dados

### Solução 3: Ajustar Validações

Se o problema for validação muito restritiva:
- Aumentar limite de 100 para valor maior
- Remover validação desnecessária

---

## 🎯 RECOMENDAÇÃO IMEDIATA

**Opção A: Reset do Banco (Recomendado para Testes)**

Vantagens:
- ✅ Rápido (2 minutos)
- ✅ Garante dados limpos
- ✅ Remove qualquer inconsistência

Desvantagens:
- ❌ Perde dados existentes (mas você está testando)

**Opção B: Debug Detalhado**

Vantagens:
- ✅ Mantém dados existentes
- ✅ Identifica problema real

Desvantagens:
- ❌ Mais demorado (15-30 min)

---

## 📊 PRÓXIMOS PASSOS

### Se Escolher Reset (Opção A):

1. Parar backend (Ctrl+C no terminal)
2. Executar reset do banco
3. Reiniciar backend
4. Fazer login novamente
5. Testar funcionalidades

### Se Escolher Debug (Opção B):

1. Verificar logs completos do backend
2. Identificar qual rota está falhando
3. Verificar dados no banco
4. Ajustar validação ou dados
5. Testar novamente

---

## 🔍 INFORMAÇÕES ADICIONAIS

### Contexto:
- Você fez login com sucesso
- Erro ocorre ao tentar carregar alguma tela/dados
- Erro é de validação Zod (campo numérico > 100)

### Possíveis Telas Afetadas:
- Dashboard (ao carregar métricas)
- Configurações (ao carregar settings)
- Graduações (ao carregar lista)
- Qualquer tela que carregue dados do banco

---

## ❓ O QUE VOCÊ PREFERE?

**Opção A:** Reset do banco (rápido, começa do zero)  
**Opção B:** Debug detalhado (mantém dados, mais demorado)

Me diga qual opção você prefere e eu te ajudo! 😊

---

## 📝 NOTAS

### Para Evitar no Futuro:
1. Validar dados antes de inserir no banco
2. Usar validações mais flexíveis
3. Ter seeds de dados válidos
4. Testes automatizados de validação

### Logs Úteis:
- Backend: Terminal onde `npm run dev` está rodando
- Mobile: Console do Expo (que você mostrou)

---

**Responsável:** Antigravity  
**Data:** 29/01/2026  
**Hora:** 17:06 BRT  
**Status:** ⚠️ AGUARDANDO SUA DECISÃO
