import { useCallback, useEffect, useRef, useState } from 'react'

export interface AsyncOperationState<T> {
  data: T | null
  loading: boolean
  error: string | null
  success: boolean
}

export interface AsyncOperationOptions {
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
  resetOnDeps?: boolean
}

/**
 * Hook for managing async operations with proper cleanup and error handling
 */
export function useAsyncOperation<T = any>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: AsyncOperationOptions = {}
) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false
  })

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  // Execute the async operation
  const execute = useCallback(async () => {
    // Cleanup any previous operation
    cleanup()

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false
    }))

    try {
      const result = await asyncFunction()

      // Check if component is still mounted and operation wasn't aborted
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        setState({
          data: result,
          loading: false,
          error: null,
          success: true
        })

        options.onSuccess?.(result)
      }
    } catch (error: any) {
      // Check if component is still mounted and operation wasn't aborted
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        const errorMessage = error.message || 'An error occurred'
        
        setState({
          data: null,
          loading: false,
          error: errorMessage,
          success: false
        })

        options.onError?.(errorMessage)
      }
    }
  }, [asyncFunction, cleanup, options])

  // Reset state
  const reset = useCallback(() => {
    cleanup()
    setState({
      data: null,
      loading: false,
      error: null,
      success: false
    })
  }, [cleanup])

  // Effect to run the operation when dependencies change
  useEffect(() => {
    if (options.resetOnDeps) {
      reset()
    }
    execute()
  }, dependencies)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      cleanup()
    }
  }, [cleanup])

  return {
    ...state,
    execute,
    reset,
    isLoading: state.loading
  }
}

/**
 * Hook for manual async operations (not triggered by dependencies)
 */
export function useAsyncCallback<T = any, Args extends any[] = any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false
  })

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  // Execute the async operation
  const execute = useCallback(async (...args: Args) => {
    // Cleanup any previous operation
    cleanup()

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false
    }))

    try {
      const result = await asyncFunction(...args)

      // Check if component is still mounted and operation wasn't aborted
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        setState({
          data: result,
          loading: false,
          error: null,
          success: true
        })

        options.onSuccess?.(result)
        return result
      }
    } catch (error: any) {
      // Check if component is still mounted and operation wasn't aborted
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        const errorMessage = error.message || 'An error occurred'
        
        setState({
          data: null,
          loading: false,
          error: errorMessage,
          success: false
        })

        options.onError?.(errorMessage)
        throw error
      }
    }
  }, [asyncFunction, cleanup, options])

  // Reset state
  const reset = useCallback(() => {
    cleanup()
    setState({
      data: null,
      loading: false,
      error: null,
      success: false
    })
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      cleanup()
    }
  }, [cleanup])

  return {
    ...state,
    execute,
    reset,
    isLoading: state.loading
  }
}

/**
 * Hook for debounced async operations
 */
export function useDebouncedAsyncOperation<T = any>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = [],
  delay: number = 300,
  options: AsyncOperationOptions = {}
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const debouncedAsyncFunction = useCallback(() => {
    return new Promise<T>((resolve, reject) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await asyncFunction()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }, [asyncFunction, delay])

  const result = useAsyncOperation(debouncedAsyncFunction, dependencies, options)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return result
}
