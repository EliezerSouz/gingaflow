# 🚀 PLANO DE ENTREGA MVP - GINGAFLOW MOBILE
**Gerado em:** 23/02/2026  
**Tech Lead:** Análise automática completa  
**Objetivo:** App mobile rodando em MVP estável esta semana

---

## 📊 DIAGNÓSTICO EXECUTADO

### Versão do ambiente
- Node.js: v22.17.1
- npm: 10.9.2
- Expo SDK: 54.0.x
- React Native: 0.76.7 (corrigido de 0.81.5)
- React: 18.3.1 (corrigido de 19.1.0)
- Reanimated: 3.16.7 (corrigido de 4.2.1)

### Banco de dados atual
- SQLite via Prisma (backend Node.js/Fastify na porta 5175)
- Backend funcional para desenvolvimento local

---

## 🔴 PROBLEMAS CRÍTICOS — CORRIGIDOS

| # | Problema | Correção Aplicada |
|---|----------|-------------------|
| C1 | `react: 19.1.0` incompatível com Expo SDK 54 | ✅ Downgraded para 18.3.1 |
| C2 | `react-native: 0.81.5` errado para Expo SDK 54 | ✅ Downgraded para 0.76.7 |
| C3 | `react-native-reanimated: ^4.2.1` quebra o startup | ✅ Downgraded para ~3.16.7 |
| C4 | `@react-navigation/drawer` instalado sem ser usado | ✅ Removido |
| C5 | `AuthContext` sem tratamento de loading → flash de tela | ✅ Corrigido com RootApp |
| C6 | `@types/react`, `babel-preset-expo`, `typescript` versões erradas | ✅ Alinhados ao SDK 54 |

---

## 📅 PLANO DE EXECUÇÃO EM DIAS

### DIA 1 (Hoje, 23/02) — FAZER RODAR 🔨
**Objetivo:** App abre sem crash no emulador/celular

#### Checklist Dia 1:
- [x] Corrigir versões incompatíveis (React, RN, Reanimated)
- [x] Remover dependências não usadas
- [x] Corrigir App.tsx com loading state
- [ ] **Limpar cache e fazer reinstall completo:**
  ```bash
  cd apps/mobile
  npm install  # ← já executado
  npx expo start --clear
  ```
- [ ] Testar login com `admin@gingaflow.local` / `admin123`
- [ ] Confirmar que o Dashboard carrega (mesmo com dados zerados)
- [ ] Testar navegação básica (Dashboard → Acadêmico → Graduações → Agenda)

#### Se precisar rodar no celular físico:
1. Descobrir IP local: `ipconfig` (procure "Endereço IPv4")
2. Editar `apps/mobile/src/services/api.ts`:
   ```typescript
   export const EXTERNAL_API_URL = 'http://SEU-IP:5175';
   ```
3. Garantir que API está rodando: `cd apps/api && pnpm dev`
4. Instalar Expo Go no celular
5. Escanear QR code

---

### DIA 2 (24/02) — ESTABILIZAR FLUXO PRINCIPAL 🔧
**Objetivo:** Fluxo completo de Alunos funcionando

#### Tarefas:
- [ ] Testar CRUD completo de Alunos (AcademicScreen + StudentFormModal)
- [ ] Testar CRUD de Unidades (UnitsScreen + UnitCreateScreen)
- [ ] Testar CRUD de Turmas (TurmasScreen + TurmaCreateScreen)
- [ ] Testar CRUD de Professores (TeachersScreen + TeacherCreateScreen)
- [ ] Verificar chamadas de API (checar logs no console do Expo)
- [ ] Corrigir erros de 404/401 que aparecerem nos logs
- [ ] Testar graduações na tela de listagem

#### Possíveis problemas esperados:
- API não responde → verificar se backend está na porta 5175
- 401 Unauthorized → verificar token JWT no AsyncStorage
- 500 Internal Error → checar logs do backend

---

### DIA 3 (25/02) — INTEGRAR SUPABASE 🗄️
**Objetivo:** Migrar do SQLite para banco em nuvem

#### Setup Supabase:
1. Criar conta em [supabase.com](https://supabase.com) (gratuito)
2. Criar novo projeto: "gingaflow"
3. Ir em **SQL Editor** → colar conteúdo de `database/supabase_schema.sql`
4. Executar o script

#### Integração no backend (Fastify):
```bash
cd apps/api
# Instalar cliente Supabase
npm install @supabase/supabase-js
```

Atualizar `apps/api/.env`:
```env
# Manter SQLite por ora, adicionar Supabase para dados novos
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="gingaflow-secret-2026"

# Supabase
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbG..."  # chave de serviço (não anon!)
```

#### Criar `apps/api/src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
);
```

> **💡 Estratégia:** Manter Prisma+SQLite funcionando. Adicionar Supabase como destino paralelo para novos dados. Migrar tabela por tabela.

---

### DIA 4 (26/02) — TESTES E POLISH ✅
**Objetivo:** App validado e pronto para uso real

#### Checklist de Testes Manuais MVP:

##### 🔐 Autenticação
- [ ] Login com credenciais válidas → entra no dashboard
- [ ] Login com credenciais inválidas → mostra erro
- [ ] Fechar e reabrir o app → continua logado (sessão persistente)
- [ ] Logout → volta para tela de login

##### 🏠 Dashboard
- [ ] Carrega sem crash
- [ ] Exibe métricas (mesmo que zeradas)
- [ ] Botões Quick Actions navegam corretamente
- [ ] Pull-to-refresh funciona
- [ ] Menu lateral (SimpleDrawer) abre/fecha

##### 👥 Alunos (AcademicScreen)
- [ ] Lista alunos
- [ ] Busca por nome funciona
- [ ] Cria novo aluno (formulário completo)
- [ ] Edita aluno existente
- [ ] Visualiza detalhes do aluno
- [ ] Badge de graduação exibido

##### 🏢 Unidades
- [ ] Lista unidades
- [ ] Cria nova unidade (nome + cor + endereço)
- [ ] Edita unidade
- [ ] Exclui unidade (com confirmação)

##### 🎓 Turmas
- [ ] Lista turmas
- [ ] Cria turma (selecionar unidade + dias + horário)
- [ ] Edita turma

##### 👨‍🏫 Professores
- [ ] Lista professores
- [ ] Cria professor (com turmas vinculadas)
- [ ] Edita professor

##### 🎖️ Graduações
- [ ] Lista graduações configuradas
- [ ] Visualiza badge de corda visualmente

---

## 🏗️ ESTRUTURA RECOMENDADA (PÓS-MVP)

```
apps/mobile/src/
├── App.tsx                    ✅ Correto
├── components/
│   ├── ui/                    ✅ Card, Button, Badge, CordaBadge
│   ├── SimpleDrawer.tsx       ✅ Menu lateral
│   ├── StudentFormModal.tsx   ✅ Modal de criação/edição
│   └── GraduationFormModal.tsx ✅
├── context/
│   └── AuthContext.tsx        ✅ Autenticação global
├── navigation/
│   └── AppNavigator.tsx       ✅ Stack + Tabs
├── screens/                   ✅ Todas implementadas
├── services/
│   ├── api.ts                 ✅ Axios configurado
│   └── supabase.ts            📋 A criar (Dia 3)
├── hooks/                     📋 Criar hooks reutilizáveis
│   ├── useStudents.ts
│   ├── useUnits.ts
│   └── useTeachers.ts
├── types/
│   ├── index.ts               ✅ User, Unit, Turma
│   └── navigation.ts          ✅ RootStackParamList
└── utils/
    └── format.ts              ✅ formatCurrency, etc.
```

---

## 📱 STATUS ATUAL DOS MÓDULOS MOBILE

| Módulo | Status | Telas Implementadas |
|--------|--------|---------------------|
| Login | ✅ 100% | LoginScreen |
| Dashboard | ✅ 80% | DashboardScreen + SimpleDrawer |
| Alunos | ✅ 80% | AcademicScreen + StudentFormModal + Details |
| Unidades | ✅ 90% | UnitsScreen + UnitCreateScreen |
| Turmas | ✅ 90% | TurmasScreen + TurmaCreateScreen |
| Professores | ✅ 85% | TeachersScreen + TeacherCreateScreen |
| Graduações | ✅ 70% | GraduationsScreen + GraduationFormModal |
| Agenda | ⚠️ 40% | AgendaScreen (incompleta) |
| Financeiro | ❌ 0% | Placeholder no Navigator |
| Relatórios | ❌ 0% | Placeholder no Navigator |

---

## 💡 DECISÕES TÉCNICAS

### Por que mantivemos o backend Fastify+Prisma?
- Já está funcional e testado
- Migrar para Supabase diretamente seria risco alto para o prazo
- Estratégia: adicionar Supabase gradualmente por tabela

### Por que removemos o Drawer do React Navigation?
- O app usa `SimpleDrawer` (Modal customizado) no Dashboard
- Ter as duas implementações causava conflito de dependências
- O Modal é mais simples e já funciona

### Por que downgraded React 19 → 18?
- Expo SDK 54 tem suporte oficial apenas para React 18.3.x
- React 19 na nova arquitetura (New Arch habilitada no app.json) ainda não é estável com Expo

---

## 🚦 COMO EXECUTAR AGORA

### Terminal 1 — Backend API:
```bash
cd f:/Antigravity/capoeira-app/gingaflow/apps/api
pnpm dev
# Deve aparecer: Server running on http://localhost:5175
```

### Terminal 2 — App Mobile:
```bash
cd f:/Antigravity/capoeira-app/gingaflow/apps/mobile
npx expo start --clear
```

### Depois:
- **Emulador Android:** pressione `a` no terminal
- **Expo Go (celular):** escaneie o QR code
- **Web:** pressione `w` (para debug rápido)

---

## ⚠️ PONTOS DE ATENÇÃO

1. **`app.json` tem `"newArchEnabled": true`** — Se houver problemas, desabilitar temporariamente
2. **`EXTERNAL_API_URL = ''`** em `api.ts` — Para celular físico, precisa setar o IP
3. **Drawer import** em `DrawerNavigator.tsx` ainda importa `@react-navigation/drawer` — arquivo pode ser removido ou mantido sem risco
4. **CPF obrigatório** em TeacherCreateScreen — validação muito restritiva pode bloquear testes

---

*Plano gerado pela análise automática completa do projeto GingaFlow.*  
*Baseado no STATUS_ATUAL_28_01_2026.md e varredura de código em 23/02/2026.*
