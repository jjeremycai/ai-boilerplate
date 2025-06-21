import { Component, ErrorInfo, ReactNode } from 'react'
import { Catalyst } from '@cai/ui-tw'

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset)
      }

      return <DefaultErrorFallback error={this.state.error} reset={this.reset} />
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error: Error
  reset: () => void
}

function DefaultErrorFallback({ error, reset }: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Catalyst.Card className="max-w-md w-full">
        <Catalyst.CardContent className="p-6 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <Catalyst.Heading level={2} className="mb-2">
            Something went wrong
          </Catalyst.Heading>
          
          <Catalyst.Text className="mb-4 text-gray-600 dark:text-gray-400">
            {error.message || 'An unexpected error occurred'}
          </Catalyst.Text>
          
          {process.env.NODE_ENV === 'development' && error.stack && (
            <details className="mb-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                View error details
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex gap-3 justify-center">
            <Catalyst.Button onClick={reset}>
              Try again
            </Catalyst.Button>
            <Catalyst.Button color="white" onClick={() => window.location.href = '/'}>
              Go home
            </Catalyst.Button>
          </div>
        </Catalyst.CardContent>
      </Catalyst.Card>
    </div>
  )
}

// Hook for using error boundary
import { useErrorBoundary as useReactErrorBoundary } from 'react-error-boundary'

export function useErrorBoundary() {
  return useReactErrorBoundary()
}

// Route-level error boundary for TanStack Router
export function RouteErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return <DefaultErrorFallback error={error} reset={reset} />
}