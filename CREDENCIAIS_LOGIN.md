# 🔐 CREDENCIAIS DE LOGIN - GINGAFLOW
**Data:** 29/01/2026 - 17:02 BRT

---

## ✅ USUÁRIO ADMIN PADRÃO

O sistema cria automaticamente um usuário administrador quando o banco está vazio.

### **Credenciais:**

```
Email:    admin@gingaflow.local
Senha:    admin123
```

---

## 📱 COMO FAZER LOGIN NO APP

### **Passo 1: Abrir o App**
O app já deve estar aberto no emulador mostrando a tela de login.

### **Passo 2: Digitar as Credenciais**
```
Email:    admin@gingaflow.local
Senha:    admin123
```

### **Passo 3: Tocar em "ENTRAR"**
Aguarde alguns segundos...

### **Passo 4: Ver o Dashboard**
✅ Você verá o Dashboard com 8 cards de métricas!

---

## 🎯 APÓS O LOGIN

Você verá esta tela:

```
┌─────────────────────────────┐
│                             │
│       🏠 DASHBOARD          │
│                             │
│  ┌──────────┬──────────┐   │
│  │ 👥       │ ✅       │   │
│  │ Alunos   │ Ativos   │   │
│  │ 0        │ 0        │   │
│  └──────────┴──────────┘   │
│                             │
│  ┌──────────┬──────────┐   │
│  │ 🏫       │ 📚       │   │
│  │ Unidades │ Turmas   │   │
│  │ 0        │ 0        │   │
│  └──────────┴──────────┘   │
│                             │
│  ┌──────────┬──────────┐   │
│  │ 👨‍🏫      │ ✅       │   │
│  │ Profs    │ Ativos   │   │
│  │ 0        │ 0        │   │
│  └──────────┴──────────┘   │
│                             │
│  ┌──────────┬──────────┐   │
│  │ 💰       │ ⏰       │   │
│  │ Inadimpl │ Venc.    │   │
│  │ 0        │ 0        │   │
│  └──────────┴──────────┘   │
│                             │
└─────────────────────────────┘
```

**Toque em qualquer card** para navegar!

---

## 🧪 TESTE RÁPIDO (10 min)

Agora que você está logado, teste:

### 1️⃣ Criar Unidade
- Dashboard → Toque em **"Unidades"**
- Toque no botão **"+"**
- Preencha e crie

### 2️⃣ Criar Turma
- Dashboard → Toque em **"Turmas"**
- Toque no botão **"+"**
- Preencha e crie

### 3️⃣ Criar Professor
- Dashboard → Toque em **"Professores"**
- Toque no botão **"+"**
- Preencha e crie

### 4️⃣ Verificar Dashboard
- Volte ao Dashboard
- ✅ Números devem ter atualizado!

---

## 🔧 SE PRECISAR CRIAR OUTRO USUÁRIO

Você pode criar outros usuários pelo app Web ou pela API.

### Via API (precisa estar logado como ADMIN):
```powershell
# Primeiro fazer login e pegar o token
# Depois usar o token para criar usuário
POST /users
{
  "name": "Novo Usuário",
  "email": "usuario@teste.com",
  "password": "senha123",
  "role": "PROFESSOR"
}
```

---

## ⚠️ IMPORTANTE

### Segurança
Estas são credenciais de **desenvolvimento/teste**.

Em **produção**, você deve:
1. Mudar a senha do admin
2. Usar senhas fortes
3. Não compartilhar credenciais

### Banco de Dados
O usuário admin é criado automaticamente quando:
- O banco está vazio (count = 0)
- O servidor inicia pela primeira vez

---

## 📊 RESUMO

| Campo | Valor |
|-------|-------|
| **Email** | `admin@gingaflow.local` |
| **Senha** | `admin123` |
| **Role** | `ADMIN` |
| **Status** | `Ativo` |

---

**Agora faça login e explore o app!** 🚀

Me conte como está funcionando! 😊

---

**Responsável:** Antigravity  
**Data:** 29/01/2026  
**Hora:** 17:02 BRT  
**Status:** ✅ CREDENCIAIS PRONTAS!
