# 🚨 APP TRAVADO NA SPLASH - SOLUÇÃO DRÁSTICA
**Data:** 30/01/2026 - 10:24 BRT

---

## ❌ PROBLEMA CRÍTICO

O app está travado na tela de splash (tela inicial) e não carrega.

**Sintomas:**
- Tela branca com logo "mobile"
- Não passa da splash screen
- Erro de Worklets persiste

---

## 🔍 DIAGNÓSTICO

### Causa Provável

O erro de **Worklets mismatch** está impedindo o app de inicializar completamente.

**Worklets** fazem parte do `react-native-reanimated`, que é usado por:
- React Navigation (animações de transição)
- Componentes com animações
- Gestos (react-native-gesture-handler)

### Por Que Não Resolveu?

1. ❌ Shift+C não limpou cache profundo
2. ❌ `--clear` pode não ter sido executado
3. ❌ Cache nativo do emulador persiste
4. ❌ Versões desincronizadas

---

## ✅ SOLUÇÃO DRÁSTICA

### **OPÇÃO 1: REINSTALAR DEPENDÊNCIAS** ⭐ RECOMENDADO

#### Passo 1: Parar Tudo
```powershell
# Parar Expo (Ctrl+C no terminal mobile)
# Parar Backend (Ctrl+C no terminal api)
```

#### Passo 2: Limpar e Reinstalar
```powershell
cd apps/mobile

# Deletar node_modules e cache
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force .metro

# Reinstalar dependências
npm install

# Iniciar com cache limpo
npx expo start --clear
```

**Tempo:** ~5-10 minutos (download de dependências)

---

### **OPÇÃO 2: RESETAR EMULADOR**

Se a Opção 1 não funcionar, o problema pode estar no emulador:

#### Passo 1: Fechar Emulador
```
Fechar o emulador Android
```

#### Passo 2: Limpar Cache do Emulador
```powershell
# Limpar cache do emulador
cd %USERPROFILE%\.android\avd
# Deletar pasta do emulador e recriar
```

#### Passo 3: Reiniciar Emulador
```powershell
# Abrir Android Studio
# Tools → AVD Manager
# Wipe Data do emulador
# Iniciar emulador novamente
```

---

### **OPÇÃO 3: CRIAR NOVO EMULADOR**

Se nada funcionar:

1. Abrir **Android Studio**
2. **Tools → AVD Manager**
3. **Create Virtual Device**
4. Escolher **Pixel 5** ou similar
5. API Level **33** ou **34**
6. **Finish**
7. Iniciar novo emulador
8. Rodar app nele

---

## 🎯 COMANDOS RESUMIDOS

### Reinstalar Dependências (Mais Comum)
```powershell
cd apps/mobile
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .expo
npm install
npx expo start --clear
```

### Limpar Tudo (Mais Drástico)
```powershell
cd apps/mobile

# Limpar tudo
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force .metro
Remove-Item -Force package-lock.json

# Reinstalar
npm install

# Iniciar
npx expo start --clear
```

---

## 📊 CHECKLIST DE TROUBLESHOOTING

### Nível 1: Cache
- [ ] Shift+C no Expo
- [ ] `npx expo start --clear`

### Nível 2: Dependências
- [ ] Deletar `node_modules`
- [ ] Deletar `.expo`
- [ ] `npm install`
- [ ] `npx expo start --clear`

### Nível 3: Emulador
- [ ] Fechar emulador
- [ ] Wipe Data no AVD Manager
- [ ] Reiniciar emulador
- [ ] Rodar app novamente

### Nível 4: Recriação
- [ ] Criar novo emulador
- [ ] Rodar app no novo emulador

---

## 🔍 VERIFICAR LOGS

Enquanto tenta as soluções, verifique os logs:

### Terminal do Expo
```
Procure por:
- "ERROR"
- "Worklets"
- "Reanimated"
- "Failed to"
```

### Logcat do Android
```powershell
adb logcat | Select-String -Pattern "error|exception|crash"
```

---

## 📝 INFORMAÇÕES ÚTEIS

### Versões Esperadas

Verifique `package.json`:
```json
{
  "react-native-reanimated": "~3.x.x",
  "react-native-gesture-handler": "~2.x.x",
  "@react-navigation/native": "^6.x.x"
}
```

### Cache Locations

**Windows:**
- Metro: `apps/mobile/.metro`
- Expo: `apps/mobile/.expo`
- Node: `apps/mobile/node_modules`
- Temp: `%TEMP%\metro-*`
- Temp: `%TEMP%\haste-map-*`

---

## 🚀 PRÓXIMOS PASSOS

### 1. Tentar Opção 1 (Reinstalar)
```powershell
cd apps/mobile
Remove-Item -Recurse -Force node_modules .expo
npm install
npx expo start --clear
```

### 2. Se Não Funcionar: Opção 2 (Emulador)
```
Wipe Data no AVD Manager
Reiniciar emulador
```

### 3. Se Ainda Não Funcionar: Opção 3 (Novo Emulador)
```
Criar novo emulador
Testar nele
```

---

## ⏱️ ESTIMATIVA DE TEMPO

| Opção | Tempo | Sucesso |
|-------|-------|---------|
| Opção 1: Reinstalar | 5-10 min | 80% |
| Opção 2: Wipe Emulador | 2-3 min | 15% |
| Opção 3: Novo Emulador | 5-10 min | 5% |

---

## 🎯 RESUMO

**Problema:** App travado na splash  
**Causa:** Worklets mismatch + cache  
**Solução:** Reinstalar dependências  
**Comando:** Ver acima  

---

**EXECUTE A OPÇÃO 1 AGORA:**

```powershell
cd apps/mobile
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .expo
npm install
npx expo start --clear
```

Me conte o resultado! 🚀

---

**Responsável:** Antigravity  
**Data:** 30/01/2026  
**Hora:** 10:24 BRT  
**Status:** ⏳ AGUARDANDO REINSTALAÇÃO
