import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in AeroOps Control Tower component:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          role="alert"
          className="rounded-xl bg-slate-900/90 border border-rose-900/60 p-8 max-w-xl mx-auto my-12 text-center space-y-4 shadow-xl"
        >
          <div className="h-12 w-12 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 mx-auto flex items-center justify-center">
            <AlertOctagon className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">Operations Module Error</h2>
            <p className="text-xs text-slate-400 mt-1">
              A temporary runtime rendering issue occurred in this operations module.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 rounded-lg bg-slate-950 text-rose-300 font-mono text-[11px] text-left border border-slate-800 max-h-24 overflow-y-auto">
              {this.state.error.message}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reload Application State</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
