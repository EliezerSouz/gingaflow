# MAPEAMENTO WEB → MOBILE - GINGAFLOW

## ESTRUTURA DE NAVEGAÇÃO

### WEB (Sidebar)
1. Dashboard
2. Acadêmico
   - Alunos
   - Professores
   - Graduações
3. Financeiro
   - Pagamentos
4. Agenda
   - Chamada
   - Agenda do Professor
5. Relatórios
6. Configurações
   - Geral
   - Unidades
   - Turmas
   - Usuários
   - Financeiro
   - Acadêmico

### MOBILE (Bottom Tabs + Drawer)
**Bottom Tabs (Principal):**
- Dashboard
- Acadêmico (com sub-navegação)
- Agenda
- Perfil

**Drawer Menu (Lateral - acessível via ícone):**
- Financeiro
- Relatórios
- Configurações

## TELAS A IMPLEMENTAR

### ✅ Já Existem (Parcial)
- [x] Login
- [~] Dashboard (básico)
- [~] AcademicScreen (lista alunos)
- [~] StudentDetails
- [~] StudentEdit
- [~] ScheduleScreen (agenda)
- [x] ProfileScreen

### 🔴 FALTAM (Críticas)
- [ ] StudentCreate (Modal completo com 6 abas)
- [ ] TeachersList
- [ ] TeacherDetails
- [ ] GraduationsList
- [ ] AttendancePage (Chamada)
- [ ] PaymentsList
- [ ] Reports
- [ ] Settings (todas as sub-telas)

## COMPONENTES COMPARTILHADOS NECESSÁRIOS

### Formulários
- [ ] FormField (Label + Input + Error)
- [ ] Select (Dropdown nativo)
- [ ] DatePicker
- [ ] Checkbox
- [ ] RadioGroup

### Navegação
- [ ] DrawerMenu (Sidebar Mobile)
- [ ] TabBar customizada

### Dados
- [ ] GraduationBadge (visual de corda)
- [ ] StatusBadge
- [ ] EmptyState
- [ ] LoadingState

## PRIORIDADE DE IMPLEMENTAÇÃO

### FASE 1 - CORE (Agora)
1. Refatorar Dashboard (espelhar Web)
2. Criar DrawerMenu (sidebar mobile)
3. Implementar StudentCreate completo (6 abas)
4. Implementar TeachersList + Details
5. Implementar GraduationsList

### FASE 2 - OPERACIONAL
6. Implementar AttendancePage (Chamada)
7. Implementar PaymentsList
8. Implementar Reports

### FASE 3 - ADMIN
9. Implementar todas as Settings

## DECISÕES DE DESIGN

### Navegação
- **Bottom Tabs:** 4 itens principais (Dashboard, Acadêmico, Agenda, Perfil)
- **Drawer:** Menu lateral para funcionalidades secundárias (Financeiro, Relatórios, Config)
- **Stack:** Navegação interna (Details, Edit, Create)

### Formulários
- Usar **Modal** para Create/Edit (igual Web)
- Abas horizontais scrolláveis
- Validação em tempo real
- Feedback visual de erros

### Dados
- Graduação com preview visual (corda colorida)
- Status com badges coloridos
- Pull-to-refresh em todas as listas
- Infinite scroll quando aplicável

## PRÓXIMOS PASSOS

1. ✅ Criar este documento
2. [ ] Implementar DrawerNavigator
3. [ ] Refatorar Dashboard
4. [ ] Criar StudentCreateModal completo
5. [ ] Implementar TeachersList
6. [ ] Continuar sequencialmente...
