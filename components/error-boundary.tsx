"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component for catching and displaying errors gracefully.
 * Wraps page content to prevent crashes from breaking the entire UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Error details are surfaced in the fallback UI — no console noise in production
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught:", error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <DefaultErrorFallback error={this.state.error} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error?: Error | null
  onRetry?: () => void
}

/**
 * Default error fallback UI component.
 * Can be used standalone or as the ErrorBoundary's default fallback.
 */
export function DefaultErrorFallback({ error, onRetry }: DefaultErrorFallbackProps) {
  return (
    <Card className="border-destructive/30 bg-destructive/5 max-w-md mx-auto my-8">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-lg">Something went wrong</CardTitle>
        <CardDescription>
          An unexpected error occurred. Please try again.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-muted p-3">
            <p className="text-xs text-muted-foreground font-mono break-all">
              {error.message || "Unknown error"}
            </p>
          </div>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface DataErrorStateProps {
  title?: string
  description?: string
  error?: Error | null
  onRetry?: () => void
}

/**
 * Error state component for data fetching errors.
 * Use when a query fails and you want to show an inline error with retry.
 */
export function DataErrorState({ 
  title = "Failed to load data",
  description = "Something went wrong while fetching data.",
  error,
  onRetry 
}: DataErrorStateProps) {
  return (
    <Card className="border-destructive/20 border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <h3 className="font-medium text-sm">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          {description}
        </p>
        {error && (
          <p className="mt-2 text-xs text-destructive font-mono">
            {error.message}
          </p>
        )}
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-4">
            <RefreshCw className="mr-2 h-3 w-3" />
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
