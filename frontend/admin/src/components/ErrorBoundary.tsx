import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, Home } from 'lucide-react'

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
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 max-w-2xl w-full flex flex-col items-center shadow-lg">
            <div className="rounded-full bg-destructive/10 p-4 mb-6">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            
            <h1 className="mb-2 text-2xl font-bold text-foreground">Виникла критична помилка</h1>
            <p className="mb-6 text-muted-foreground">
              Щось пішло не так при рендерингу інтерфейсу. Спробуйте повернутися на головну або перезавантажити сторінку.
            </p>

            <button 
              onClick={() => window.location.href = '/'}
              className="mb-8 flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Home className="h-5 w-5" /> Повернутись на головну
            </button>

            {this.state.error && (
              <details className="w-full text-left rounded-lg border border-border bg-card">
                <summary className="cursor-pointer p-4 font-semibold text-sm hover:bg-muted/30 transition-colors outline-none">
                  Технічні деталі
                </summary>
                <div className="border-t border-border p-4 text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                  <p className="font-bold text-destructive mb-2">{this.state.error.toString()}</p>
                  {this.state.errorInfo?.componentStack}
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
