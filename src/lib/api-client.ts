/**
 * Enhanced API client with timeout, retry logic, and comprehensive error handling
 */

import { logApiError, logPerformanceIssue } from './error-logger'

export interface ApiError extends Error {
  status?: number
  code?: string
  details?: any
}

export interface ApiRequestOptions extends RequestInit {
  timeout?: number
  retries?: number
  retryDelay?: number
  retryCondition?: (error: ApiError) => boolean
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
  success: boolean
}

class ApiClient {
  private defaultTimeout = 10000 // 10 seconds
  private defaultRetries = 3
  private defaultRetryDelay = 1000 // 1 second

  /**
   * Create a timeout promise that rejects after specified milliseconds
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeout}ms`))
      }, timeout)
    })
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: ApiError): boolean {
    // Retry on network errors, timeouts, and 5xx server errors
    if (!error.status) return true // Network error
    return error.status >= 500 && error.status < 600
  }

  /**
   * Create an ApiError from various error types
   */
  private createApiError(error: any, status?: number): ApiError {
    const apiError = new Error(error.message || 'Unknown error') as ApiError
    apiError.name = 'ApiError'
    apiError.status = status || error.status
    apiError.code = error.code
    apiError.details = error.details || error
    return apiError
  }

  /**
   * Enhanced fetch with timeout and retry logic
   */
  async request<T = any>(
    url: string, 
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      retryDelay = this.defaultRetryDelay,
      retryCondition = this.isRetryableError,
      ...fetchOptions
    } = options

    let lastError: ApiError | null = null
    let attempt = 0
    const startTime = performance.now()

    while (attempt <= retries) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        // Make the request with timeout
        const response = await Promise.race([
          fetch(url, {
            ...fetchOptions,
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...fetchOptions.headers,
            },
          }),
          this.createTimeoutPromise(timeout)
        ])

        clearTimeout(timeoutId)

        // Log performance metrics
        const duration = performance.now() - startTime
        if (duration > 5000) { // Log slow requests (>5s)
          logPerformanceIssue('api_request_slow', duration, 5000)
        }

        // Handle response
        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`
          let errorDetails: any = null

          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
            errorDetails = errorData
          } catch {
            // Response is not JSON, use status text
          }

          const error = this.createApiError(
            { message: errorMessage, details: errorDetails },
            response.status
          )

          // Log API error
          logApiError(url, response.status, errorMessage, {
            component: 'api-client',
            action: fetchOptions.method || 'GET',
            additionalData: { attempt: attempt + 1, retries }
          })

          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              error: errorMessage,
              status: response.status,
              success: false
            }
          }

          throw error
        }

        // Parse successful response
        let data: T | undefined
        const contentType = response.headers.get('content-type')
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json()
        } else {
          data = await response.text() as any
        }

        return {
          data,
          status: response.status,
          success: true
        }

      } catch (error: any) {
        lastError = this.createApiError(error)

        // Check if we should retry
        if (attempt < retries && retryCondition(lastError)) {
          attempt++
          console.warn(`API request failed (attempt ${attempt}/${retries + 1}):`, lastError.message)
          
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1)
          await this.sleep(delay)
          continue
        }

        // No more retries or error is not retryable
        break
      }
    }

    // All retries exhausted
    return {
      error: lastError?.message || 'Request failed',
      status: lastError?.status || 0,
      success: false
    }
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  async get<T = any>(url: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' })
  }

  async post<T = any>(url: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T = any>(url: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T = any>(url: string, data?: any, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T = any>(url: string, options?: ApiRequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' })
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export class for custom instances
export { ApiClient }

// Utility function for backward compatibility
export async function fetchWithRetry<T = any>(
  url: string,
  options?: ApiRequestOptions
): Promise<T> {
  const response = await apiClient.request<T>(url, options)
  
  if (!response.success) {
    throw new Error(response.error || 'Request failed')
  }
  
  return response.data as T
}
