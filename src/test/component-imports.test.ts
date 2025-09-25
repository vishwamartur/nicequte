/**
 * Test file to verify all component imports work correctly
 * This helps identify any import/export issues before deployment
 */

// Test Error Handling Components
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { ErrorRecovery, NetworkStatus, RetryWrapper, FallbackUI, GracefulDegradation } from '@/components/ui/ErrorRecovery'
import ClientInitializer from '@/components/ClientInitializer'

// Test API and Utility Imports
import { apiClient, ApiClient, fetchWithRetry } from '@/lib/api-client'
import { errorLogger, logError, logApiError, logPerformanceIssue, logUserAction } from '@/lib/error-logger'
import { browserCompatibility, initBrowserCompatibility } from '@/lib/browser-compatibility'

// Test Hook Imports
import { useAsyncOperation, useAsyncCallback, useDebouncedAsyncOperation } from '@/hooks/useAsyncOperation'
import { useSafeState, useAsyncState, useDebouncedState, useOptimisticState } from '@/hooks/useSafeState'

// Test UI Component Imports
import { ToastContainer, useToast } from '@/components/ui/Toast'

// Test Layout Imports
import Layout from '@/components/layout/Layout'
import Header from '@/components/layout/Header'

// Test Quotation Component Imports
import QuotationPreview from '@/components/quotation/QuotationPreview'

// Test Utility Imports
import { formatCurrency, formatDate, calculateGST, calculateGSTBreakdown, generateQuotationNumber, cn } from '@/lib/utils'
import { generateQuotationPDF, printElement } from '@/lib/pdf-generator'

// Test Database Imports
import { prisma } from '@/lib/prisma'
import { seedDatabase } from '@/lib/seed'
import { getDatabaseInitializer } from '@/lib/database-init'

console.log('✅ All component imports successful!')

// Export a simple test function to verify functionality
export function testComponentImports() {
  const tests = [
    // Error Handling Components
    { name: 'ErrorBoundary', component: ErrorBoundary },
    { name: 'ErrorRecovery', component: ErrorRecovery },
    { name: 'NetworkStatus', component: NetworkStatus },
    { name: 'RetryWrapper', component: RetryWrapper },
    { name: 'FallbackUI', component: FallbackUI },
    { name: 'GracefulDegradation', component: GracefulDegradation },
    { name: 'ClientInitializer', component: ClientInitializer },
    
    // API and Utilities
    { name: 'apiClient', component: apiClient },
    { name: 'ApiClient', component: ApiClient },
    { name: 'fetchWithRetry', component: fetchWithRetry },
    { name: 'errorLogger', component: errorLogger },
    { name: 'logError', component: logError },
    { name: 'logApiError', component: logApiError },
    { name: 'logPerformanceIssue', component: logPerformanceIssue },
    { name: 'logUserAction', component: logUserAction },
    { name: 'browserCompatibility', component: browserCompatibility },
    { name: 'initBrowserCompatibility', component: initBrowserCompatibility },
    
    // Hooks
    { name: 'useAsyncOperation', component: useAsyncOperation },
    { name: 'useAsyncCallback', component: useAsyncCallback },
    { name: 'useDebouncedAsyncOperation', component: useDebouncedAsyncOperation },
    { name: 'useSafeState', component: useSafeState },
    { name: 'useAsyncState', component: useAsyncState },
    { name: 'useDebouncedState', component: useDebouncedState },
    { name: 'useOptimisticState', component: useOptimisticState },
    
    // UI Components
    { name: 'ToastContainer', component: ToastContainer },
    { name: 'useToast', component: useToast },
    { name: 'Layout', component: Layout },
    { name: 'Header', component: Header },
    { name: 'QuotationPreview', component: QuotationPreview },
    
    // Utilities
    { name: 'formatCurrency', component: formatCurrency },
    { name: 'formatDate', component: formatDate },
    { name: 'calculateGST', component: calculateGST },
    { name: 'calculateGSTBreakdown', component: calculateGSTBreakdown },
    { name: 'generateQuotationNumber', component: generateQuotationNumber },
    { name: 'cn', component: cn },
    { name: 'generateQuotationPDF', component: generateQuotationPDF },
    { name: 'printElement', component: printElement },
    
    // Database
    { name: 'prisma', component: prisma },
    { name: 'seedDatabase', component: seedDatabase },
    { name: 'getDatabaseInitializer', component: getDatabaseInitializer }
  ]
  
  const results = tests.map(test => ({
    name: test.name,
    imported: test.component !== undefined,
    type: typeof test.component
  }))
  
  const failed = results.filter(r => !r.imported)
  const passed = results.filter(r => r.imported)
  
  console.log(`✅ Import Test Results:`)
  console.log(`   Passed: ${passed.length}/${tests.length}`)
  console.log(`   Failed: ${failed.length}/${tests.length}`)
  
  if (failed.length > 0) {
    console.log(`❌ Failed imports:`)
    failed.forEach(f => console.log(`   - ${f.name}`))
  }
  
  return {
    total: tests.length,
    passed: passed.length,
    failed: failed.length,
    success: failed.length === 0,
    results
  }
}

export default testComponentImports
