import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import StudentsList from './pages/StudentsList'
import StudentDetail from './pages/StudentDetail'
import TeachersList from './pages/TeachersList'
import TeacherDetail from './pages/TeacherDetail'
import TeacherAgenda from './pages/TeacherAgenda'
import AttendancePage from './pages/AttendancePage'
import GraduationsList from './pages/GraduationsList'
import PaymentsList from './pages/PaymentsList'
import Reports from './pages/Reports'
import SettingsGeneral from './pages/SettingsGeneral'
import SettingsUsers from './pages/SettingsUsers'
import { AcademicSettings } from './pages/AcademicSettings'
import ActivitiesPage from './pages/ActivitiesPage'
import UnitsPage from './pages/UnitsPage'
import SetupPage from './pages/SetupPage'

import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell, Sidebar, TopBar, PageHeader, Toolbar, Button, type IconName, type SidebarItem } from '@gingaflow/ui'
import { getSettings } from './services/settings'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { SettingsProvider, useSettings } from './contexts/SettingsContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Toaster } from 'sonner'

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <Toaster position="top-right" richColors />
            <AppContent />
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

function AppContent() {
  const { auth } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Shell title="Dashboard" subtitle="Visão geral do GingaFlow"><Dashboard /></Shell>} />
        <Route
          path="/students"
          element={
            <Shell
              title="Alunos"
              subtitle="Gestão de alunos"
              actions={[
                {
                  label: 'Novo aluno',
                  icon: 'plus',
                  variant: 'primary',
                  path: '/students?action=new'
                },
                { label: 'Exportar', icon: 'export', variant: 'secondary' }
              ]}
            >
              <StudentsList />
            </Shell>
          }
        />
        <Route path="/students/:id" element={<Shell title="Detalhes do Aluno" subtitle="Informações completas"><StudentDetail /></Shell>} />
        <Route
          path="/agenda"
          element={
            <ProtectedRoute allowedRoles={['PROFESSOR']}>
              <Shell title="Minha Agenda" subtitle="Turmas e horários">
                <TeacherAgenda />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <Shell title="Lista de Chamada" subtitle="Controle de presença">
              <AttendancePage />
            </Shell>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Shell
                title="Professores"
                subtitle="Gestão de professores"
                actions={[
                  {
                    label: 'Novo professor',
                    icon: 'plus',
                    variant: 'primary',
                    path: '/teachers?action=new'
                  }
                ]}
              >
                <TeachersList />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route path="/teachers/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><Shell title="Detalhes do Professor" subtitle="Gestão de professor e turmas"><TeacherDetail /></Shell></ProtectedRoute>} />
        <Route
          path="/graduations"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Shell title="Graduações" subtitle="Histórico de graduações">
                <GraduationsList />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Shell title="Financeiro" subtitle="Pagamentos e inadimplência">
                <PaymentsList />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Shell title="Relatórios" subtitle="Dashboards e indicadores">
                <Reports />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Shell title="Tipos de Atividade" subtitle="Gerencie as modalidades da academia">
                <ActivitiesPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/units"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Shell
                title="Unidades & Turmas"
                subtitle="Gerencie unidades e suas turmas"
              >
                <UnitsPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Shell title="Configuração Inicial" subtitle="Configure o sistema passo a passo">
                <SetupPage />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<Navigate to="/settings/general" />} />
        <Route
          path="/settings/general"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Shell title="Configurações Gerais" subtitle="Preferências do sistema">
                <SettingsGeneral />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Shell title="Gerenciar Usuários" subtitle="Controle de acesso">
                <SettingsUsers />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/units"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Shell title="Unidades & Turmas" subtitle="Gerencie unidades e suas turmas">
                <AcademicSettings />
              </Shell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/finance"
          element={<Navigate to="/settings/general" />}
        />
      </Routes>
    </BrowserRouter>
  )
}

function Shell({
  title,
  subtitle,
  children,
  toolbar,
  actions
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  toolbar?: React.ReactNode
  actions?: Array<{
    label: string
    icon: IconName
    variant?: 'primary' | 'secondary'
    path?: string
    onClick?: () => void
  }>
}) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { auth, setAuth } = useAuth()
  const { settings } = useSettings()

  const role = auth.role || 'ADMIN'

  const baseItems: SidebarItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' }
  ]

  const academicChildren: { label: string; path: string }[] = [
    { label: 'Alunos', path: '/students' },
    ...(role === 'ADMIN' ? [{ label: 'Professores', path: '/teachers' }] : []),
    ...(role === 'ADMIN' ? [{ label: 'Graduações', path: '/graduations' }] : []),
    ...(role === 'PROFESSOR' ? [{ label: 'Agenda', path: '/agenda' }] : []),
    { label: 'Lista de Chamada', path: '/attendance' }
  ]

  const groupedItems: SidebarItem[] = [
    ...(role === 'ADMIN' ? [{ label: 'Configuração Inicial', icon: 'check-circle' as IconName, path: '/setup' }] : []),
    { label: 'Acadêmico', icon: 'graduations' as IconName, path: '/academic', children: academicChildren },
    ...(role === 'ADMIN' ? [{
      label: 'Operacional',
      icon: 'home' as IconName,
      path: '/units',
      children: [
        { label: 'Unidades & Turmas', path: '/units' },
        { label: 'Atividades', path: '/activities' }
      ]
    }] : []),
    ...(role === 'ADMIN' ? [{ label: 'Financeiro', icon: 'finance' as IconName, path: '/finance', children: [{ label: 'Visão Geral', path: '/finance' }] }] : []),
    ...(role === 'ADMIN' ? [{ label: 'Relatórios', icon: 'reports' as IconName, path: '/reports', children: [{ label: 'Acadêmico', path: '/reports' }, { label: 'Financeiro', path: '/reports' }] }] : []),
    ...(role === 'ADMIN' ? [{
      label: 'Configurações',
      icon: 'settings' as IconName,
      path: '/settings',
      children: [
        { label: 'Geral', path: '/settings/general' },
        { label: 'Usuários', path: '/settings/users' },
        { label: 'Unidades & Turmas', path: '/settings/units' }
      ]
    }] : [])
  ]

  const items: SidebarItem[] = [
    ...baseItems,
    ...groupedItems,
    { label: theme === 'dark' ? 'Modo Claro' : 'Modo Escuro', icon: theme === 'dark' ? 'sun' : 'moon', path: '#theme' }
  ]

  const resolvedToolbar = actions ? (
    <Toolbar
      actions={actions.map(a => ({
        label: a.label,
        icon: a.icon,
        variant: a.variant,
        onClick: a.path ? () => navigate(a.path!) : a.onClick
      }))}
    />
  ) : (
    toolbar
  )

  return (
    <AppShell
      sidebar={
        <Sidebar
          items={items}
          activePath={location.pathname}
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
          onNavigate={p => {
            if (p === '#theme') {
              toggleTheme()
            } else {
              navigate(p)
            }
          }}
        />
      }
      topbar={
        <TopBar
          user={{ name: auth.name || 'Usuário', role: auth.role || undefined }}
          logo={settings.logoUrl}
          title={settings.groupName}
          onLogout={() => {
            localStorage.removeItem('token')
            setAuth({ token: null, role: null, name: null, organizationId: null, relatedId: null, loading: false })
            navigate('/login')
          }}
        />
      }
      header={
        <PageHeader
          title={title}
          subtitle={subtitle}
        />
      }
      toolbar={resolvedToolbar}
    >
      {children}
    </AppShell>
  )
}

// Helper types use UI package SidebarItem for consistency

function Placeholder({ title }: { title: string }) {
  return (
    <div className="p-8 text-center text-muted border-2 border-dashed rounded-lg">
      <h3 className="text-lg font-medium text-primary">Em desenvolvimento</h3>
      <p>A funcionalidade {title} será implementada em breve.</p>
    </div>
  )
}
