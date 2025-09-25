import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook that provides safe state updates that won't cause errors if component unmounts
 */
export function useSafeState<T>(initialState: T | (() => T)) {
  const [state, setState] = useState(initialState)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const setSafeState = useCallback((newState: T | ((prevState: T) => T)) => {
    if (isMountedRef.current) {
      setState(newState)
    }
  }, [])

  return [state, setSafeState] as const
}

/**
 * Hook for managing async state with race condition prevention
 */
export function useAsyncState<T>(initialState: T) {
  const [state, setSafeState] = useSafeState(initialState)
  const [loading, setLoading] = useSafeState(false)
  const [error, setError] = useSafeState<string | null>(null)
  const operationIdRef = useRef(0)

  const setAsyncState = useCallback(async (asyncOperation: () => Promise<T>) => {
    const currentOperationId = ++operationIdRef.current
    
    setLoading(true)
    setError(null)

    try {
      const result = await asyncOperation()
      
      // Only update state if this is still the latest operation
      if (currentOperationId === operationIdRef.current) {
        setSafeState(result)
        setLoading(false)
      }
    } catch (err) {
      // Only update error if this is still the latest operation
      if (currentOperationId === operationIdRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }
  }, [setSafeState, setLoading, setError])

  const reset = useCallback(() => {
    operationIdRef.current++
    setSafeState(initialState)
    setLoading(false)
    setError(null)
  }, [setSafeState, setLoading, setError, initialState])

  return {
    state,
    loading,
    error,
    setAsyncState,
    reset,
    setState: setSafeState
  }
}

/**
 * Hook for managing multiple concurrent async operations
 */
export function useConcurrentAsyncState<T extends Record<string, any>>(initialState: T) {
  const [state, setSafeState] = useSafeState(initialState)
  const [loadingStates, setLoadingStates] = useSafeState<Record<string, boolean>>({})
  const [errors, setErrors] = useSafeState<Record<string, string | null>>({})
  const operationIdsRef = useRef<Record<string, number>>({})

  const setAsyncStateForKey = useCallback(async <K extends keyof T>(
    key: K,
    asyncOperation: () => Promise<T[K]>
  ) => {
    const keyStr = key as string
    const currentOperationId = ((operationIdsRef.current[keyStr] as number) || 0) + 1
    operationIdsRef.current[keyStr] = currentOperationId
    
    setLoadingStates(prev => ({ ...prev, [key]: true }))
    setErrors(prev => ({ ...prev, [key]: null }))

    try {
      const result = await asyncOperation()
      
      // Only update state if this is still the latest operation for this key
      if (currentOperationId === operationIdsRef.current[key as string]) {
        setSafeState(prev => ({ ...prev, [key]: result }))
        setLoadingStates(prev => ({ ...prev, [key]: false }))
      }
    } catch (err) {
      // Only update error if this is still the latest operation for this key
      if (currentOperationId === operationIdsRef.current[key as string]) {
        setErrors(prev => ({ 
          ...prev, 
          [key]: err instanceof Error ? err.message : 'An error occurred' 
        }))
        setLoadingStates(prev => ({ ...prev, [key]: false }))
      }
    }
  }, [setSafeState, setLoadingStates, setErrors])

  const resetKey = useCallback(<K extends keyof T>(key: K) => {
    operationIdsRef.current[key as string] = (operationIdsRef.current[key as string] || 0) + 1
    setSafeState(prev => ({ ...prev, [key]: initialState[key] }))
    setLoadingStates(prev => ({ ...prev, [key]: false }))
    setErrors(prev => ({ ...prev, [key]: null }))
  }, [setSafeState, setLoadingStates, setErrors, initialState])

  const resetAll = useCallback(() => {
    Object.keys(operationIdsRef.current).forEach(key => {
      operationIdsRef.current[key] = (operationIdsRef.current[key] || 0) + 1
    })
    setSafeState(initialState)
    setLoadingStates({})
    setErrors({})
  }, [setSafeState, setLoadingStates, setErrors, initialState])

  return {
    state,
    loadingStates,
    errors,
    setAsyncStateForKey,
    resetKey,
    resetAll,
    setState: setSafeState,
    isLoading: (key: keyof T) => loadingStates[key as string] || false,
    getError: (key: keyof T) => errors[key as string] || null
  }
}

/**
 * Hook for debounced state updates to prevent rapid successive updates
 */
export function useDebouncedState<T>(initialState: T, delay: number = 300) {
  const [state, setSafeState] = useSafeState(initialState)
  const [debouncedState, setDebouncedState] = useSafeState(initialState)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    setSafeState(newState)
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedState(typeof newState === 'function' ? 
        (newState as (prevState: T) => T)(state) : 
        newState
      )
    }, delay)
  }, [setSafeState, setDebouncedState, delay, state])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [state, debouncedState, setState] as const
}

/**
 * Hook for managing optimistic updates with rollback capability
 */
export function useOptimisticState<T>(initialState: T) {
  const [state, setSafeState] = useSafeState(initialState)
  const [optimisticState, setOptimisticState] = useSafeState(initialState)
  const [isOptimistic, setIsOptimistic] = useSafeState(false)
  const rollbackStateRef = useRef<T>(initialState)

  const setOptimisticUpdate = useCallback((newState: T | ((prevState: T) => T)) => {
    if (!isOptimistic) {
      rollbackStateRef.current = state
    }
    
    setOptimisticState(newState)
    setIsOptimistic(true)
  }, [state, isOptimistic, setOptimisticState, setIsOptimistic])

  const confirmOptimisticUpdate = useCallback(() => {
    setSafeState(optimisticState)
    setIsOptimistic(false)
  }, [optimisticState, setSafeState, setIsOptimistic])

  const rollbackOptimisticUpdate = useCallback(() => {
    setOptimisticState(rollbackStateRef.current)
    setIsOptimistic(false)
  }, [setOptimisticState, setIsOptimistic])

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    setSafeState(newState)
    if (!isOptimistic) {
      setOptimisticState(newState)
    }
  }, [setSafeState, setOptimisticState, isOptimistic])

  return {
    state: isOptimistic ? optimisticState : state,
    actualState: state,
    optimisticState,
    isOptimistic,
    setState,
    setOptimisticUpdate,
    confirmOptimisticUpdate,
    rollbackOptimisticUpdate
  }
}
