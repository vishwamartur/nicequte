'use client'

import Layout from '@/components/layout/Layout'
import { useState } from 'react'
import { Play, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { runAllTests } from '@/lib/test-crud'

interface TestResult {
  success: boolean
  results: {
    crud: { success: boolean; message?: string; error?: string }
    validation: { success: boolean; message?: string; error?: string }
  }
}

export default function TestCRUDPage() {
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const runTests = async () => {
    setTesting(true)
    setTestResult(null)
    setLogs([])

    // Capture console logs
    const originalLog = console.log
    const originalError = console.error
    const capturedLogs: string[] = []

    console.log = (...args) => {
      const message = args.join(' ')
      capturedLogs.push(message)
      setLogs(prev => [...prev, message])
      originalLog(...args)
    }

    console.error = (...args) => {
      const message = `ERROR: ${args.join(' ')}`
      capturedLogs.push(message)
      setLogs(prev => [...prev, message])
      originalError(...args)
    }

    try {
      const result = await runAllTests()
      setTestResult(result)
    } catch (error) {
      console.error('Test execution failed:', error)
    } finally {
      // Restore original console methods
      console.log = originalLog
      console.error = originalError
      setTesting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRUD Operations Test</h1>
          <p className="mt-2 text-gray-600">
            Test the Create, Read, Update, and Delete functionality for products
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Run CRUD Tests</h2>
              <p className="text-sm text-gray-600 mt-1">
                This will test all product CRUD operations and validation rules
              </p>
            </div>
            <button
              onClick={runTests}
              disabled={testing}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {testing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Running Tests...</span>
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  <span>Run Tests</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
            
            <div className="space-y-4">
              {/* Overall Result */}
              <div className={`p-4 rounded-lg border ${
                testResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )}
                  <span className={`font-semibold ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {testResult.success ? 'All Tests Passed!' : 'Some Tests Failed'}
                  </span>
                </div>
              </div>

              {/* Individual Test Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CRUD Tests */}
                <div className={`p-4 rounded-lg border ${
                  testResult.results.crud.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {testResult.results.crud.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">CRUD Operations</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {testResult.results.crud.success 
                      ? testResult.results.crud.message 
                      : testResult.results.crud.error}
                  </p>
                </div>

                {/* Validation Tests */}
                <div className={`p-4 rounded-lg border ${
                  testResult.results.validation.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    {testResult.results.validation.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">Validation Tests</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {testResult.results.validation.success 
                      ? testResult.results.validation.message 
                      : testResult.results.validation.error}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Logs */}
        {logs.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Logs</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">What This Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">CRUD Operations</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create new product with all fields</li>
                <li>• Read product by ID</li>
                <li>• Update product information</li>
                <li>• Delete product (hard delete)</li>
                <li>• Verify deletion completed</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Validation Tests</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Required field validation</li>
                <li>• Price validation (positive numbers)</li>
                <li>• JSON specifications format</li>
                <li>• Category existence validation</li>
                <li>• SKU uniqueness validation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Usage Instructions</h2>
          <div className="text-sm text-blue-800 space-y-2">
            <p>1. Make sure the database is seeded with sample data</p>
            <p>2. Click "Run Tests" to execute all CRUD operations</p>
            <p>3. Review the test results and logs for any issues</p>
            <p>4. All tests should pass if the CRUD functionality is working correctly</p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
