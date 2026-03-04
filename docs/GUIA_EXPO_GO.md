# 📱 GUIA RÁPIDO - ABRIR NO EXPO GO
**Data:** 29/01/2026 - 14:47 BRT

---

## ✅ STATUS DOS SERVIÇOS

### Backend API
- ✅ **RODANDO** há 5h18min
- 🌐 Porta: **5175**
- 📍 URL: `http://0.0.0.0:5175`

### Expo Metro Bundler
- ✅ **RODANDO** há 3h26min
- 📱 Aguardando conexão do Expo Go

---

## 📱 COMO ABRIR NO EXPO GO

### Passo 1: Instalar Expo Go (se ainda não tiver)
- **Android:** [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS:** [App Store](https://apps.apple.com/app/expo-go/id982107779)

### Passo 2: Encontrar o QR Code
O QR Code está no terminal onde você executou `npm start` no diretório `apps/mobile`.

**Procure por algo assim:**
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│   ████ ▄▄▄▄▄ █▀█ █▄█▀▀▀▄█ ▄▄▄▄▄ ████                        │
│   ████ █   █ █▀▀█ ▀ █▀█ █ █   █ ████                        │
│   ████ █▄▄▄█ █ ▀▄▀▄ ▀▄ ▀█ █▄▄▄█ ████                        │
│   ... (QR Code completo)                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘

› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or Camera (iOS)
```

### Passo 3: Escanear o QR Code

#### **Android:**
1. Abrir **Expo Go**
2. Tocar em **"Scan QR Code"**
3. Escanear o QR Code do terminal
4. Aguardar o app carregar

#### **iOS:**
1. Abrir o app **Câmera** nativo
2. Apontar para o QR Code
3. Tocar na notificação que aparecer
4. Aguardar o Expo Go abrir e carregar

### Passo 4: Aguardar Carregar
- ⏳ Primeira vez pode demorar 1-2 minutos
- 📦 Expo está baixando e compilando o bundle
- ✅ Quando terminar, verá a tela de Login

---

## 🔧 ALTERNATIVA: USAR URL DIRETA

Se o QR Code não funcionar, você pode digitar a URL manualmente no Expo Go:

1. Abrir **Expo Go**
2. Tocar em **"Enter URL manually"**
3. Digitar: `exp://192.168.x.x:8081` (substituir x.x pelo IP da sua máquina)
4. Aguardar carregar

**Para descobrir seu IP:**
```powershell
ipconfig
```
Procure por "Endereço IPv4" na sua conexão de rede ativa.

---

## 📊 O QUE ESPERAR

### Tela de Login
Primeira tela que você verá:
```
┌─────────────────────────┐
│                         │
│      🥋 GINGAFLOW       │
│                         │
│   Email: _________      │
│   Senha: _________      │
│                         │
│      [ ENTRAR ]         │
│                         │
└─────────────────────────┘
```

### Credenciais de Teste
Se você já tem um usuário cadastrado, use suas credenciais.

Caso contrário, pode ser necessário criar um usuário primeiro (me avise se precisar).

---

## 🧪 APÓS FAZER LOGIN

Você verá o **Dashboard** com 8 cards de métricas:
- 👥 Total de Alunos
- ✅ Alunos Ativos
- 🏫 Unidades
- 📚 Turmas
- 👨‍🏫 Professores
- ✅ Professores Ativos
- 💰 Inadimplentes
- ⏰ Próximos Vencimentos

**Toque em qualquer card** para navegar para o módulo correspondente!

---

## ⚠️ PROBLEMAS COMUNS

### QR Code não aparece
**Solução:** Pressione `r` no terminal para recarregar

### "Unable to connect to Metro"
**Solução:** 
1. Certifique-se que o celular e o computador estão na **mesma rede WiFi**
2. Desative VPN se estiver usando
3. Verifique se o firewall não está bloqueando a porta 8081

### App não carrega / tela branca
**Solução:**
1. Feche e abra o Expo Go novamente
2. Escaneie o QR Code novamente
3. Aguarde um pouco mais (pode demorar na primeira vez)

### Erro de conexão com API
**Solução:**
1. Verifique se o Backend está rodando (porta 5175)
2. O app mobile precisa acessar a API pela rede local

---

## 📞 PRECISA DE AJUDA?

Se encontrar qualquer problema:
1. Me envie uma mensagem descrevendo o erro
2. Se possível, tire um print da tela
3. Me diga em qual passo você está

**Estou aqui para ajudar!** 😊

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Escanear QR Code
2. ✅ Fazer Login
3. ✅ Ver Dashboard
4. 🧪 Executar testes (ver `PLANO_TESTES_29_01_2026.md`)

---

**Status:** ✅ **EXPO RODANDO - PRONTO PARA ESCANEAR!**  
**Tempo de execução:** 3h26min  
**Aguardando:** Você escanear o QR Code! 📱

**Boa sorte!** 🚀
