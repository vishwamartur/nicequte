'use client'

import React, { useState, useCallback } from 'react'
import { RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react'

interface ErrorRecoveryProps {
  error: string
  onRetry?: () => void
  onFallback?: () => void
  showFallback?: boolean
  retryText?: string
  fallbackText?: string
  className?: string
}

export function ErrorRecovery({
  error,
  onRetry,
  onFallback,
  showFallback = false,
  retryText = 'Try Again',
  fallbackText = 'Use Offline Mode',
  className = ''
}: ErrorRecoveryProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = useCallback(async () => {
    if (!onRetry || isRetrying) return
    
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry, isRetrying])

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            Something went wrong
          </h3>
          <p className="mt-1 text-sm text-red-700">
            {error}
          </p>
          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            {onRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : retryText}
              </button>
            )}
            {showFallback && onFallback && (
              <button
                onClick={onFallback}
                className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                {fallbackText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface NetworkStatusProps {
  className?: string
}

export function NetworkStatus({ className = '' }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center">
        <WifiOff className="h-5 w-5 text-yellow-400 mr-2" />
        <p className="text-sm text-yellow-800">
          You're currently offline. Some features may not be available.
        </p>
      </div>
    </div>
  )
}

interface FallbackUIProps {
  title?: string
  message?: string
  children?: React.ReactNode
  className?: string
}

export function FallbackUI({
  title = 'Content Unavailable',
  message = 'This content is temporarily unavailable. Please try again later.',
  children,
  className = ''
}: FallbackUIProps) {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-8 text-center ${className}`}>
      <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {children}
    </div>
  )
}

interface RetryWrapperProps {
  children: React.ReactNode
  maxRetries?: number
  retryDelay?: number
  onError?: (error: Error, retryCount: number) => void
  fallback?: React.ReactNode
}

export function RetryWrapper({
  children,
  maxRetries = 3,
  retryDelay = 1000,
  onError,
  fallback
}: RetryWrapperProps) {
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = useCallback(async () => {
    if (retryCount >= maxRetries) return

    setIsRetrying(true)
    setError(null)

    // Wait for retry delay
    await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount)))

    try {
      setRetryCount(prev => prev + 1)
      // The children component should re-render and potentially succeed
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      onError?.(error, retryCount + 1)
    } finally {
      setIsRetrying(false)
    }
  }, [retryCount, maxRetries, retryDelay, onError])

  const handleReset = useCallback(() => {
    setError(null)
    setRetryCount(0)
    setIsRetrying(false)
  }, [])

  if (error && retryCount >= maxRetries) {
    return fallback || (
      <FallbackUI
        title="Unable to Load Content"
        message={`Failed to load after ${maxRetries} attempts. ${error.message}`}
      >
        <button
          onClick={handleReset}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </button>
      </FallbackUI>
    )
  }

  if (error) {
    return (
      <ErrorRecovery
        error={error.message}
        onRetry={handleRetry}
        retryText={isRetrying ? 'Retrying...' : `Retry (${retryCount}/${maxRetries})`}
      />
    )
  }

  return <>{children}</>
}

interface GracefulDegradationProps {
  feature: string
  isSupported: boolean
  fallback: React.ReactNode
  children: React.ReactNode
  showWarning?: boolean
}

export function GracefulDegradation({
  feature,
  isSupported,
  fallback,
  children,
  showWarning = true
}: GracefulDegradationProps) {
  if (!isSupported) {
    return (
      <div>
        {showWarning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              <p className="text-sm text-yellow-800">
                {feature} is not supported in your browser. Using fallback mode.
              </p>
            </div>
          </div>
        )}
        {fallback}
      </div>
    )
  }

  return <>{children}</>
}
