# 🔧 SOLUÇÃO DEFINITIVA - LIMPAR CACHE COMPLETO
**Data:** 30/01/2026 - 10:14 BRT

---

## ❌ PROBLEMA PERSISTENTE

O erro de Worklets ainda está acontecendo, causando crash do app.

**Sintomas:**
- App abre normalmente
- Ao clicar em "Nova Unidade" → Crash
- Volta para tela inicial (splash screen)
- Erro: `Cannot read property 'getUseOfValueInStyleWarning' of undefined`

---

## ✅ SOLUÇÃO DEFINITIVA

### **PARAR E REINICIAR COM CACHE LIMPO**

Vamos fazer uma limpeza completa:

#### **Passo 1: Parar o Expo**

No terminal onde `npm start` está rodando:
```
Ctrl + C
```

#### **Passo 2: Limpar Cache e Reiniciar**

```powershell
cd apps/mobile
npx expo start --clear
```

**OU** (se o comando acima não funcionar):

```powershell
cd apps/mobile
npm start -- --clear
```

---

## 🎯 O QUE ISSO FAZ?

**`--clear` flag:**
- ✅ Limpa cache do Metro Bundler
- ✅ Limpa cache do Expo
- ✅ Limpa cache do Watchman (se instalado)
- ✅ Remove arquivos temporários
- ✅ Força rebuild completo

---

## 📊 ALTERNATIVA: DELETAR CACHE MANUALMENTE

Se o `--clear` não resolver, delete manualmente:

```powershell
cd apps/mobile

# Deletar cache do Metro
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force node_modules\.cache

# Reiniciar
npm start
```

---

## 🚀 APÓS REINICIAR

1. ✅ Expo vai iniciar com cache limpo
2. ✅ Bundler vai recompilar tudo
3. ✅ App vai abrir no emulador
4. ✅ Fazer login novamente
5. ✅ Testar criar unidade

---

## 🔍 POR QUE ISSO ACONTECE?

### Causa Raiz

**React Native Reanimated** (biblioteca de animações) tem duas partes:
- **JavaScript:** Roda no Metro Bundler
- **Nativa:** Roda no emulador/dispositivo

**Quando o cache fica desatualizado:**
- Parte JS: v0.7.1
- Parte nativa: v0.5.1
- ❌ Mismatch → Crash

### Por Que Shift+C Não Funcionou?

`Shift+C` limpa cache do Metro, mas às vezes:
- ❌ Cache do Expo persiste
- ❌ Cache do Watchman persiste
- ❌ Arquivos temporários persistem

**Solução:** `--clear` flag limpa TUDO

---

## 📝 COMANDOS RESUMIDOS

### Opção 1: Expo Start Clear (Recomendado)
```powershell
# Parar Expo (Ctrl+C)
cd apps/mobile
npx expo start --clear
```

### Opção 2: NPM Start Clear
```powershell
# Parar Expo (Ctrl+C)
cd apps/mobile
npm start -- --clear
```

### Opção 3: Deletar Cache Manualmente
```powershell
cd apps/mobile
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force node_modules\.cache
npm start
```

---

## ✅ CHECKLIST

- [ ] Parar Expo (Ctrl+C)
- [ ] Executar `npx expo start --clear`
- [ ] Aguardar bundler compilar
- [ ] App abrir no emulador
- [ ] Fazer login
- [ ] Testar criar unidade
- [ ] Verificar se não crasha

---

## 🎯 RESUMO

**Problema:** Worklets mismatch causa crash  
**Causa:** Cache desatualizado persistente  
**Solução:** `npx expo start --clear`  
**Tempo:** 2-3 minutos (recompilação)  

---

## 🚨 SE AINDA NÃO FUNCIONAR

Se após `--clear` ainda der erro, tente:

### Opção Nuclear: Reinstalar Dependências

```powershell
cd apps/mobile

# Deletar node_modules
Remove-Item -Recurse -Force node_modules

# Reinstalar
npm install

# Iniciar com cache limpo
npx expo start --clear
```

**Tempo:** ~5-10 minutos (download de dependências)

---

**EXECUTE AGORA:**

```powershell
# 1. Parar Expo (Ctrl+C no terminal)
# 2. Executar:
cd apps/mobile
npx expo start --clear
```

Me conte quando o Expo reiniciar! 🚀

---

**Responsável:** Antigravity  
**Data:** 30/01/2026  
**Hora:** 10:14 BRT  
**Status:** ⏳ AGUARDANDO REINÍCIO COM CACHE LIMPO
