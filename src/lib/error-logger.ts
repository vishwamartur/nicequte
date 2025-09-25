/**
 * Comprehensive error logging and monitoring utility
 */

export interface ErrorContext {
  userId?: string
  sessionId?: string
  userAgent?: string
  url?: string
  timestamp?: string
  component?: string
  action?: string
  additionalData?: Record<string, any>
}

export interface ErrorReport {
  id: string
  type: 'javascript' | 'network' | 'api' | 'user' | 'performance'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  stack?: string
  context: ErrorContext
  fingerprint: string
}

class ErrorLogger {
  private sessionId: string
  private errorQueue: ErrorReport[] = []
  private isOnline: boolean = true
  private maxQueueSize: number = 100
  private flushInterval: number = 30000 // 30 seconds

  constructor() {
    this.sessionId = this.generateSessionId()

    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      this.setupGlobalErrorHandlers()
      this.setupNetworkMonitoring()
      this.startPeriodicFlush()
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateFingerprint(error: Partial<ErrorReport>): string {
    const key = `${error.type}_${error.message}_${error.stack?.split('\n')[0] || ''}`
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16)
  }

  private setupGlobalErrorHandlers(): void {
    if (typeof window === 'undefined') return

    // Handle uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        severity: 'high',
        message: event.message,
        stack: event.error?.stack,
        context: {
          url: event.filename,
          component: 'global',
          action: 'uncaught_error',
          additionalData: {
            lineno: event.lineno,
            colno: event.colno
          }
        }
      })
    })

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'javascript',
        severity: 'high',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        context: {
          component: 'global',
          action: 'unhandled_rejection',
          additionalData: {
            reason: event.reason
          }
        }
      })
    })
  }

  private setupNetworkMonitoring(): void {
    if (typeof window === 'undefined') return

    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushErrors()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.logError({
        type: 'network',
        severity: 'medium',
        message: 'Network connection lost',
        context: {
          component: 'network',
          action: 'offline'
        }
      })
    })
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      if (this.errorQueue.length > 0 && this.isOnline) {
        this.flushErrors()
      }
    }, this.flushInterval)
  }

  private getContext(): ErrorContext {
    return {
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      timestamp: new Date().toISOString()
    }
  }

  public logError(errorData: Partial<ErrorReport>): void {
    const error: ErrorReport = {
      id: this.generateErrorId(),
      type: errorData.type || 'javascript',
      severity: errorData.severity || 'medium',
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      context: {
        ...this.getContext(),
        ...errorData.context
      },
      fingerprint: ''
    }

    error.fingerprint = this.generateFingerprint(error)

    // Add to queue
    this.errorQueue.push(error)

    // Prevent queue from growing too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Logged: ${error.type} - ${error.severity}`)
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
      console.error('Context:', error.context)
      console.groupEnd()
    }

    // Flush immediately for critical errors
    if (error.severity === 'critical' && this.isOnline) {
      this.flushErrors()
    }
  }

  public logApiError(url: string, status: number, message: string, context?: Partial<ErrorContext>): void {
    this.logError({
      type: 'api',
      severity: status >= 500 ? 'high' : 'medium',
      message: `API Error: ${message}`,
      context: {
        ...context,
        component: 'api',
        action: 'request_failed',
        additionalData: {
          url,
          status
        }
      }
    })
  }

  public logUserAction(action: string, component: string, additionalData?: Record<string, any>): void {
    this.logError({
      type: 'user',
      severity: 'low',
      message: `User action: ${action}`,
      context: {
        component,
        action,
        additionalData
      }
    })
  }

  public logPerformanceIssue(metric: string, value: number, threshold: number): void {
    this.logError({
      type: 'performance',
      severity: value > threshold * 2 ? 'high' : 'medium',
      message: `Performance issue: ${metric} (${value}ms > ${threshold}ms)`,
      context: {
        component: 'performance',
        action: 'threshold_exceeded',
        additionalData: {
          metric,
          value,
          threshold
        }
      }
    })
  }

  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length === 0 || !this.isOnline) {
      return
    }

    const errorsToSend = [...this.errorQueue]
    this.errorQueue = []

    try {
      // In production, send to your error reporting service
      // For now, we'll just log to console and store in localStorage
      
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to external service
        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ errors: errorsToSend })
        // })
        
        // Store in localStorage as fallback (only in browser)
        if (typeof localStorage !== 'undefined') {
          const existingErrors = JSON.parse(localStorage.getItem('error_logs') || '[]')
          const allErrors = [...existingErrors, ...errorsToSend].slice(-500) // Keep last 500 errors
          localStorage.setItem('error_logs', JSON.stringify(allErrors))
        }
      }

      console.log(`📊 Flushed ${errorsToSend.length} errors to logging service`)
    } catch (error) {
      // If sending fails, put errors back in queue
      this.errorQueue = [...errorsToSend, ...this.errorQueue]
      console.error('Failed to flush errors:', error)
    }
  }

  public getErrorStats(): { total: number; byType: Record<string, number>; bySeverity: Record<string, number> } {
    if (typeof localStorage === 'undefined') {
      return { total: 0, byType: {}, bySeverity: {} }
    }

    const logs = JSON.parse(localStorage.getItem('error_logs') || '[]') as ErrorReport[]
    
    const stats = {
      total: logs.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>
    }

    logs.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1
    })

    return stats
  }

  public clearErrorLogs(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('error_logs')
    }
    this.errorQueue = []
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger()

// Convenience functions
export const logError = (message: string, error?: Error, context?: Partial<ErrorContext>) => {
  errorLogger.logError({
    type: 'javascript',
    severity: 'medium',
    message,
    stack: error?.stack,
    context
  })
}

export const logApiError = (url: string, status: number, message: string, context?: Partial<ErrorContext>) => {
  errorLogger.logApiError(url, status, message, context)
}

export const logUserAction = (action: string, component: string, additionalData?: Record<string, any>) => {
  errorLogger.logUserAction(action, component, additionalData)
}

export const logPerformanceIssue = (metric: string, value: number, threshold: number) => {
  errorLogger.logPerformanceIssue(metric, value, threshold)
}
