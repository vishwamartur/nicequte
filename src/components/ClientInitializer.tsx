'use client'

import { useEffect } from 'react'
import { initBrowserCompatibility } from '@/lib/browser-compatibility'
import { errorLogger } from '@/lib/error-logger'

/**
 * Client-side initialization component
 * Handles browser compatibility checks, error logging setup, and other client-only initialization
 */
export default function ClientInitializer() {
  useEffect(() => {
    // Initialize browser compatibility checks
    initBrowserCompatibility()

    // Log application startup
    errorLogger.logUserAction('app_startup', 'application', {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })

    // Performance monitoring
    if ('performance' in window && 'getEntriesByType' in performance) {
      // Monitor page load performance
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
          if (navigation) {
            const loadTime = navigation.loadEventEnd - navigation.fetchStart
            
            // Log slow page loads (>3 seconds)
            if (loadTime > 3000) {
              errorLogger.logPerformanceIssue('page_load_slow', loadTime, 3000)
            }
          }
        }, 0)
      })
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory
        if (memory) {
          const usedMB = memory.usedJSHeapSize / 1024 / 1024
          const limitMB = memory.jsHeapSizeLimit / 1024 / 1024
          
          // Log high memory usage (>80% of limit)
          if (usedMB > limitMB * 0.8) {
            errorLogger.logPerformanceIssue('memory_usage_high', usedMB, limitMB * 0.8)
          }
        }
      }

      // Check memory every 30 seconds
      const memoryInterval = setInterval(checkMemory, 30000)
      
      return () => clearInterval(memoryInterval)
    }
  }, [])

  // This component doesn't render anything
  return null
}
