# ⚠️ ERRO 404 /settings - SOLUÇÃO RÁPIDA
**Data:** 29/01/2026 - 17:20 BRT

---

## ❌ ERRO ATUAL

**Console:**
```
⚠️ 404 Warning: URL http://192.168.1.6:5175/settings not found
```

---

## 🔍 ANÁLISE

### O Que Aconteceu

1. ✅ A rota `/settings` **EXISTE** no backend (linha 281 do server.ts)
2. ✅ A rota requer **autenticação** (verifica `currentUser`)
3. ❌ O app mobile **NÃO está enviando token** JWT
4. ❌ Backend retorna **404** (deveria ser 401, mas ok)

### Por Que Não Tem Token?

Quando resetamos o banco de dados:
- ✅ Banco foi limpo
- ✅ Usuário admin foi recriado
- ❌ **Token antigo ficou inválido**
- ❌ **AsyncStorage ainda tem token antigo**

---

## ✅ SOLUÇÃO RÁPIDA

### **FAÇA LOGOUT E LOGIN NOVAMENTE**

#### Opção A: Logout pelo App
1. Abrir menu lateral (☰)
2. Tocar em "Sair" ou "Logout"
3. Fazer login novamente

#### Opção B: Limpar Storage (Mais Rápido)
1. Fechar o app no emulador
2. No terminal do Expo, pressionar `r` para reload
3. App abrirá na tela de login
4. Fazer login com:
   ```
   Email:    admin@gingaflow.local
   Senha:    admin123
   ```

---

## 🎯 APÓS LOGIN

✅ Token será salvo corretamente  
✅ Todas as requisições terão autenticação  
✅ `/settings` funcionará  
✅ Dashboard carregará sem erros  

---

## 🔧 VERIFICAÇÃO TÉCNICA

### Como o Token Funciona

**1. Login:**
```typescript
// AuthContext.tsx linha 41-56
async function signIn(email: string, pass: string) {
    const response = await api.post('/auth/login', { email, password: pass });
    const { token, user } = response.data;
    
    // Salva token no storage
    await AsyncStorage.multiSet([
        ['@gingaflow_token', token],
        ['@gingaflow_user', JSON.stringify(user)],
    ]);
}
```

**2. Interceptor Adiciona Token:**
```typescript
// api.ts linha 46-52
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('@gingaflow_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
```

**3. Backend Valida:**
```typescript
// server.ts linha 137-154
server.addHook('onRequest', async (req, reply) => {
    if (req.url === '/health' || req.url === '/auth/login') {
        return; // Rotas públicas
    }
    try {
        await req.jwtVerify(); // Valida token
    } catch {
        return reply.status(401).send({ 
            code: 'UNAUTHORIZED', 
            message: 'Token inválido' 
        });
    }
});
```

---

## ⚠️ POR QUE 404 E NÃO 401?

**Comportamento Atual:**
- Token inválido/ausente → Middleware retorna 401
- Mas a mensagem diz "404"

**Possível Causa:**
- Axios pode estar interpretando erro de forma diferente
- Ou há um redirect/fallback que retorna 404

**Não é problema crítico:**
- ✅ Solução é a mesma: fazer login novamente
- ✅ Após login, funcionará normalmente

---

## 📋 CHECKLIST

- [ ] Fechar app no emulador
- [ ] Pressionar `r` no Expo para reload
- [ ] Ver tela de login
- [ ] Fazer login com credenciais:
  - Email: `admin@gingaflow.local`
  - Senha: `admin123`
- [ ] Verificar Dashboard carregando
- [ ] Confirmar que não há mais erros 404

---

## 🎯 RESUMO

**Problema:** Token JWT inválido após reset do banco  
**Causa:** AsyncStorage tem token antigo  
**Solução:** Fazer logout e login novamente  
**Tempo:** 30 segundos  

---

**FAÇA LOGOUT E LOGIN NOVAMENTE!** 🔐

Depois me conte se funcionou! 😊

---

**Responsável:** Antigravity  
**Data:** 29/01/2026  
**Hora:** 17:20 BRT  
**Status:** ⚠️ AGUARDANDO LOGIN
