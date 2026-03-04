import React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 transition-colors'
  const sizes =
    size === 'sm'
      ? 'px-3 py-1.5 text-sm'
      : 'px-4 py-2 text-sm'
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 border border-transparent',
    secondary: 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-brand-500',
    ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-brand-500',
    danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500 border border-transparent'
  }
  return (
    <button
      {...props}
      className={[base, sizes, variants[variant], className].filter(Boolean).join(' ')}
    />
  )
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & { label?: string }

export function Input({ label, className, ...props }: InputProps) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm text-gray-700 dark:text-gray-300">{label}</span>}
      <input
        {...props}
        className={
          'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-brand-500 focus:ring-brand-500 placeholder-gray-400 ' +
          (className ?? '')
        }
      />
    </label>
  )
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }

export function Select({ label, className, children, ...props }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm text-gray-700 dark:text-gray-300">{label}</span>}
      <select
        {...props}
        className={
          'w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm focus:border-brand-500 focus:ring-brand-500 ' +
          (className ?? '')
        }
      >
        {children}
      </select>
    </label>
  )
}

export type IconName =
  | 'dashboard'
  | 'students'
  | 'graduations'
  | 'finance'
  | 'reports'
  | 'settings'
  | 'user'
  | 'plus'
  | 'export'
  | 'menu'
  | 'sun'
  | 'moon'
  | 'eye'
  | 'more-vertical'
  | 'edit'
  | 'credit-card'
  | 'x-circle'
  | 'check-circle'
  | 'arrow-left'
  | 'home'
  | 'trash'
  | 'chevron-up'
  | 'chevron-down'
  | 'chevron-right'
  | 'check'
  | 'x'
  | 'minus'
  | 'refresh'
  | 'alert-triangle'
  | 'calendar'
  | 'check-square'
  | 'medal'

export function Icon({ name, className }: { name: IconName; className?: string }) {
  const common = 'w-5 h-5'
  switch (name) {
    case 'home':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    case 'trash':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      )
    case 'arrow-left':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
      )
    case 'menu':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      )
    case 'chevron-up':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z" />
        </svg>
      )
    case 'chevron-down':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      )
    case 'chevron-right':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 17l5-5-5-5v10z" />
        </svg>
      )
    case 'dashboard':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      )
    case 'students':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z" />
        </svg>
      )
    case 'graduations':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3l9 5-9 5-9-5 9-5zm0 7l6 3v4l-6 3-6-3v-4l6-3z" />
        </svg>
      )
    case 'finance':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 5H3v14h18V5zm-2 4H5V7h14v2zM7 12h2v4H7v-4zm4 0h2v4h-2v-4zm4 0h2v4h-2v-4z" />
        </svg>
      )
    case 'reports':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 3h10v4h4v14H3V3h4zm0 2v14h12V9h-4V5H7zm2 4h8v2H9V9zm0 4h8v2H9v-2zm0 4h8v2H9v-2z" />
        </svg>
      )
    case 'settings':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.4 12.9c.1-.3.1-.6.1-.9s0-.6-.1-.9l2.1-1.6-2-3.5-2.5 1c-.5-.4-1-.7-1.6-.9l-.4-2.7h-4l-.4 2.7c-.6.2-1.1.5-1.6.9l-2.5-1-2 3.5 2.1 1.6c-.1.3-.1.6-.1.9s0 .6.1.9L2.6 14.5l2 3.5 2.5-1c.5.4 1 .7 1.6.9l.4 2.7h4l.4-2.7c.6-.2 1.1-.5 1.6-.9l2.5 1 2-3.5-2.1-1.6zM12 15.5c-1.9 0-3.5-1.6-3.5-3.5S10.1 8.5 12 8.5s3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
        </svg>
      )
    case 'user':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5z" />
        </svg>
      )
    case 'plus':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
        </svg>
      )
    case 'minus':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <rect x="5" y="11" width="14" height="2" />
        </svg>
      )
    case 'export':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3l5 5h-3v6h-4V8H7l5-5zm-7 14h14v2H5v-2z" />
        </svg>
      )
    case 'refresh':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15A9 9 0 1 1 23 10" />
        </svg>
      )
    case 'sun':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
        </svg>
      )
    case 'moon':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z" />
        </svg>
      )
    case 'eye':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'more-vertical':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      )
    case 'edit':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      )
    case 'credit-card':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )
    case 'x-circle':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )
    case 'check-circle':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      )
    case 'check':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )
    case 'x':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )
    case 'alert-triangle':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    case 'calendar':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      )
    case 'check-square':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )
    case 'medal':
      return (
        <svg className={common + ' ' + (className ?? '')} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
      )
    default:
      return null
  }
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={'rounded bg-white dark:bg-gray-800 p-4 shadow dark:shadow-none dark:border dark:border-gray-700 ' + (className ?? '')}>{children}</div>
}

export function MetricCard({
  icon,
  title,
  value,
  subtitle
}: {
  icon: IconName
  title: string
  value: string | number
  subtitle?: string
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="rounded bg-brand-50 dark:bg-brand-900/50 p-2 text-brand-700 dark:text-brand-300">
          <Icon name={icon} />
        </div>
        <div className="flex-1">
          <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</div>
          {subtitle && <div className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</div>}
        </div>
      </div>
    </Card>
  )
}

export type SidebarItem = {
  label: string
  icon: IconName
  path: string
  children?: Array<{ label: string; path: string }>
}

export function Sidebar({
  items,
  activePath,
  collapsed,
  onNavigate,
  onToggle
}: {
  items: SidebarItem[]
  activePath: string
  collapsed?: boolean
  onNavigate: (path: string) => void
  onToggle?: () => void
}) {
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])

  // Auto expand parent if child is active
  React.useEffect(() => {
    items.forEach(item => {
      if (item.children?.some(child => activePath.startsWith(child.path))) {
        setExpandedItems(prev => prev.includes(item.path) ? prev : [...prev, item.path])
      }
    })
  }, [activePath, items])

  const toggleExpand = (path: string) => {
    setExpandedItems(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    )
  }

  return (
    <aside
      className={
        'flex h-full flex-col border-r bg-white dark:bg-gray-800 dark:border-gray-700 transition-all duration-300 ' +
        (collapsed ? 'w-16' : 'w-64')
      }
    >
      <div className={'flex h-16 items-center border-b px-4 dark:border-gray-700 ' + (collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <div className="text-xl font-bold text-brand-600 dark:text-brand-400 tracking-tight">
            GingaFlow
          </div>
        )}
        <button
          onClick={onToggle}
          className="rounded p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-2 py-4 overflow-y-auto">
        {items.map(item => {
          const active = activePath === item.path || (item.children?.some(child => activePath.startsWith(child.path)) ?? false)
          const isExpanded = expandedItems.includes(item.path)
          const hasChildren = item.children && item.children.length > 0

          return (
            <div key={item.path}>
              <button
                onClick={() => {
                  if (hasChildren && !collapsed) {
                    toggleExpand(item.path)
                  } else {
                    onNavigate(item.path)
                  }
                }}
                className={
                  'group flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
                  (active && !hasChildren
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white')
                }
                title={item.label}
              >
                <div className="flex items-center gap-3">
                  <div className={(active && !hasChildren) ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400'}>
                    <Icon name={item.icon} />
                  </div>
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && hasChildren && (
                  <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {!collapsed && hasChildren && isExpanded && (
                <div className="ml-9 mt-1 space-y-1 border-l-2 border-gray-100 dark:border-gray-700 pl-2">
                  {item.children!.map(child => {
                    const childActive = activePath === child.path
                    return (
                      <button
                        key={child.path}
                        onClick={() => onNavigate(child.path)}
                        className={
                          'flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors ' +
                          (childActive
                            ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white')
                        }
                      >
                        {child.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

export function TopBar({
  logo,
  title,
  breadcrumb,
  user,
  collapsed,
  onToggle,
  onProfile,
  onLogout
}: {
  logo?: string
  title?: string
  breadcrumb?: string[]
  user: { name: string; role?: string }
  collapsed?: boolean
  onToggle?: () => void
  onProfile?: () => void
  onLogout?: () => void
}) {
  return (
    <div className="flex h-16 flex-shrink-0 items-center justify-between border-b bg-white dark:bg-gray-800 dark:border-gray-700 px-4 shadow-sm z-20">
      <div className="flex items-center gap-4">
        {onToggle && (
          <button onClick={onToggle} className="rounded p-1 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Icon name="menu" className="h-6 w-6" />
          </button>
        )}
        {logo && (
          logo.startsWith('http') || logo.startsWith('data:') ? (
            <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
          ) : (
            <div className="text-xl font-bold text-brand-700 dark:text-brand-400 tracking-tight">{logo}</div>
          )
        )}
        <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
        <div>
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="mb-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {breadcrumb.join(' / ')}
            </div>
          )}
          {title && <div className="text-sm font-medium text-gray-900 dark:text-white">{title}</div>}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l dark:border-gray-700">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role?.toLowerCase() || 'Usuário'}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-700 dark:text-brand-300 font-medium">
            {user.name[0]}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Toolbar({
  actions
}: {
  actions: Array<{ label: string; icon: IconName; variant?: 'primary' | 'secondary'; onClick?: () => void }>
}) {
  return (
    <div className="flex items-center justify-end gap-3 py-4">
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={a.onClick}
          className={
            (a.variant === 'secondary'
              ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              : 'bg-brand-600 text-white shadow-sm hover:bg-brand-700') +
            ' inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all'
          }
        >
          <Icon name={a.icon} />
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  )
}

export function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-max px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-xs rounded shadow-lg z-50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
      </div>
    </div>
  )
}

export function Dropdown({
  trigger,
  items
}: {
  trigger: React.ReactNode
  items: Array<{ label: string; onClick: () => void; icon?: IconName; variant?: 'default' | 'danger' }>
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  const [coords, setCoords] = React.useState({ top: 0, left: 0 })

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleScroll() {
      if (open) setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    if (open) {
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleScroll)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [open])

  const toggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setCoords({
        top: rect.bottom + 5,
        left: rect.right - 224
      })
    }
    setOpen(!open)
  }

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <div onClick={toggle}>{trigger}</div>
      {open && (
        <div
          className="fixed w-56 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]"
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="py-1">
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  item.onClick()
                  setOpen(false)
                }}
                className={
                  'group flex w-full items-center px-4 py-2 text-sm ' +
                  (item.variant === 'danger'
                    ? 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700')
                }
              >
                {item.icon && <Icon name={item.icon} className="mr-3 h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300" />}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="py-2">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{subtitle}</p>}
    </div>
  )
}

export function AppShell({
  sidebar,
  topbar,
  header,
  toolbar,
  children
}: {
  sidebar: React.ReactNode
  topbar: React.ReactNode
  header: React.ReactNode
  toolbar?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {sidebar}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <div className="z-20 flex-shrink-0 relative">{topbar}</div>
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
            <div className="py-8">
              {header}
              {toolbar}
              <div className="mt-8">{children}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'brand' | 'gray'

export function Badge({ variant = 'neutral', children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  const variants: Record<BadgeVariant, string> = {
    neutral: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
    gray: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
    success: 'bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400',
    warning: 'bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400',
    danger: 'bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400',
    brand: 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
  }
  return <span className={'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ' + variants[variant]}>{children}</span>
}

export function Modal({
  open,
  title,
  children,
  primaryAction,
  secondaryAction,
  onClose
}: {
  open: boolean
  title: string
  children: React.ReactNode
  primaryAction?: { label: string; onClick: () => void; variant?: ButtonVariant }
  secondaryAction?: { label: string; onClick: () => void }
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded bg-white dark:bg-gray-800 shadow-lg dark:border dark:border-gray-700">
        <div className="border-b dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{title}</div>
        <div className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 max-h-[80vh] overflow-y-auto">{children}</div>
        <div className="flex justify-end gap-2 border-t dark:border-gray-700 px-4 py-3">
          {secondaryAction && (
            <Button variant="secondary" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              variant={primaryAction.variant ?? 'primary'}
              size="sm"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </Button>
          )}
          {!primaryAction && !secondaryAction && (
            <Button variant="secondary" size="sm" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

type TabsValue = string

export function Tabs({
  value,
  onChange,
  children
}: {
  value: TabsValue
  onChange: (value: TabsValue) => void
  children: React.ReactNode
}) {
  return (
    <div data-value={value} data-on-change={!!onChange}>
      {children}
    </div>
  )
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="inline-flex rounded-md border dark:border-gray-700 bg-white dark:bg-gray-800 p-1 text-sm">{children}</div>
}

export function TabsTrigger({
  value,
  current,
  onChange,
  children
}: {
  value: TabsValue
  current: TabsValue
  onChange: (value: TabsValue) => void
  children: React.ReactNode
}) {
  const active = current === value
  return (
    <button
      onClick={() => onChange(value)}
      className={
        'rounded px-3 py-1.5 transition-all ' +
        (active ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700')
      }
    >
      {children}
    </button>
  )
}

export function TabsContent({
  value,
  current,
  children
}: {
  value: TabsValue
  current: TabsValue
  children: React.ReactNode
}) {
  if (value !== current) return null
  return <div className="mt-4">{children}</div>
}

export function EmptyState({
  icon,
  title,
  description,
  action
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded border border-dashed dark:border-gray-700 bg-surface-alt dark:bg-gray-800/50 px-6 py-10 text-center">
      {icon && <div className="mb-3 text-brand-600 dark:text-brand-400">{icon}</div>}
      <div className="text-sm font-medium text-gray-900 dark:text-white">{title}</div>
      {description && <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Table<T = any>({
  columns,
  data
}: {
  columns: Array<{ key: string; header: string; width?: string; render?: (value: any, row: T) => React.ReactNode }>
  data: Array<T>
}) {
  return (
    <div className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
      <div className="grid border-b dark:border-gray-700 bg-surface-alt dark:bg-gray-900/50" style={{ gridTemplateColumns: columns.map(c => c.width ?? '1fr').join(' ') }}>
        {columns.map(col => (
          <div key={col.key} className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {col.header}
          </div>
        ))}
      </div>
      <div className="divide-y dark:divide-gray-700">
        {data.map((row: any, i) => (
          <div key={i} className="grid hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" style={{ gridTemplateColumns: columns.map(c => c.width ?? '1fr').join(' ') }}>
            {columns.map(col => (
              <div key={col.key} className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200 flex items-center">
                {col.render ? col.render(row[col.key], row) : row[col.key]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Pagination({
  page,
  pageCount,
  onChange
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
}) {
  const items = []
  for (let i = 1; i <= pageCount; i++) items.push(i)
  return (
    <div className="mt-3 flex items-center justify-end gap-2">
      <button
        className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Anterior
      </button>
      {items.map(i => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={
            'rounded px-3 py-1 text-sm transition-colors ' + (i === page ? 'bg-brand-600 text-white' : 'border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700')
          }
        >
          {i}
        </button>
      ))}
      <button
        className="rounded border dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
      >
        Próxima
      </button>
    </div>
  )
}

export function FormField({
  label,
  children,
  hint,
  error
}: {
  label: string
  children: React.ReactNode
  hint?: string
  error?: string
}) {
  return (
    <div>
      <div className="mb-1 text-sm text-gray-700 dark:text-gray-300">{label}</div>
      <div>{children}</div>
      {hint && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</div>}
      {error && <div className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</div>}
    </div>
  )
}
