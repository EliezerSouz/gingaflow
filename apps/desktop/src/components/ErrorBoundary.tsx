import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button, Icon } from '@gingaflow/ui'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <Icon name="alert-triangle" className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Ops! Algo deu errado.</h1>
            <p className="text-gray-500 mb-6">
              Ocorreu um erro inesperado na aplicação. Tente recarregar a página.
            </p>
            
            {this.state.error && (
              <div className="text-left bg-gray-100 p-4 rounded text-xs font-mono text-red-800 mb-6 overflow-auto max-h-48">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReload} variant="primary">
                Recarregar Página
              </Button>
              <Button onClick={() => window.location.href = '/dashboard'} variant="secondary">
                Ir para Dashboard
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
