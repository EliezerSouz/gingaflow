# GingaFlow - Sistema de Gestão para Capoeira

GingaFlow é um ecossistema completo para gestão de alunos, turmas, graduações e financeiro, focado em escolas de Capoeira e artes marciais.

## 🚀 Estrutura do Projeto

O projeto utiliza um **Monorepo** com as seguintes divisões:

- **`apps/mobile`**: Aplicação móvel desenvolvida com React Native e Expo.
- **`apps/api`**: Backend desenvolvido com Fastify, Prisma ORM e SQLite/Supabase.
- **`packages/shared`**: Tipagens e esquemas de validação (Zod) compartilhados entre frontend e backend.
- **`docs/`**: Histórico de análise e planos de implementação.

## 🛠️ Tecnologias Principais

- **Frontend Mobile**: React Native, Expo, React Navigation, Axios.
- **Backend API**: Node.js, Fastify, TypeScript.
- **Banco de Dados**: Prisma (atualmente usando SQLite local, em transição para Supabase/PostgreSQL).
- **Segurança**: JWT (JSON Web Tokens) e Roles (ADMIN/PROFESSOR).

## 📖 Documentação Importante

Os documentos de histórico e planejamento foram movidos para a pasta `/docs`:

- [Plano MVP Mobile](docs/PLANO_MVP_MOBILE_23_02_2026.md)
- [Análise Técnica Completa](docs/ANALISE_TECNICA_COMPLETA.md)
- [Guia de Testes](docs/GUIA_TESTES_USUARIO.md)

## 🏗️ Como Rodar (Desenvolvimento)

### Pré-requisitos
- Node.js (v18+)
- PNPM (recomendado) ou NPM

### Backend
```bash
cd apps/api
npm install
npm run dev
```

### Mobile
```bash
cd apps/mobile
npm install
npx expo start
```

## 🔒 Regras de Acesso (RBAC)

- **ADMIN**: Acesso total a unidades, turmas, professores, financeiro e configurações.
- **PROFESSOR**:
  - Acesso restrito aos alunos de suas próprias turmas.
  - Pode registrar presenças e promover alunos de suas turmas.
  - Não visualiza dados financeiros sensíveis ou configurações globais.

## 🚀 Próximos Passos (Roadmap)
1. **Migração Supabase**: Mover o banco de dados local (SQLite) para a nuvem (PostgreSQL) para permitir sincronização real.
2. **Sistema de Presença**: Implementar controle de chamadas por turma.
3. **Módulo Financeiro**: Registro de pagamentos e controle de inadimplência.
