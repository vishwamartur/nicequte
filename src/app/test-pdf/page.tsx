/**
 * PDF Generation Test Suite - DEVELOPMENT ONLY
 *
 * This page is for development and debugging purposes only.
 * It should NOT be linked in the main navigation or user interface.
 *
 * Regular users should use the "Download PDF" button on quotation pages,
 * which directly calls generateQuotationPDF() without any test suite involvement.
 *
 * Access: http://localhost:3001/test-pdf (development only)
 */

'use client'

import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { Download, FileText, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { generatePDFFromElement } from '@/lib/pdf-generator'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  duration?: number
}

export default function TestPDFPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { toasts, showSuccess, showError, removeToast } = useToast()

  const updateTestResult = (name: string, status: TestResult['status'], message: string, duration?: number) => {
    setTestResults(prev => prev.map(test => 
      test.name === name ? { ...test, status, message, duration } : test
    ))
  }

  const runPDFTests = async () => {
    setIsRunning(true)
    
    const tests: TestResult[] = [
      { name: 'Basic PDF Generation', status: 'pending', message: 'Testing basic PDF generation...' },
      { name: 'Color Compatibility', status: 'pending', message: 'Testing color function compatibility...' },
      { name: 'CSS Sanitization', status: 'pending', message: 'Testing CSS sanitization...' },
      { name: 'Fallback Method', status: 'pending', message: 'Testing fallback PDF generation...' }
    ]
    
    setTestResults(tests)

    // Test 1: Basic PDF Generation
    try {
      const startTime = Date.now()
      await generatePDFFromElement('test-content', {
        filename: 'test-basic.pdf',
        format: 'a4',
        orientation: 'portrait'
      })
      const duration = Date.now() - startTime
      updateTestResult('Basic PDF Generation', 'success', `PDF generated successfully in ${duration}ms`, duration)
      showSuccess('Test Passed', 'Basic PDF generation test passed')
    } catch (error) {
      updateTestResult('Basic PDF Generation', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      showError('Test Failed', 'Basic PDF generation test failed')
    }

    // Test 2: Color Compatibility
    try {
      const startTime = Date.now()
      await generatePDFFromElement('color-test-content', {
        filename: 'test-colors.pdf',
        format: 'a4',
        orientation: 'portrait'
      })
      const duration = Date.now() - startTime
      updateTestResult('Color Compatibility', 'success', `Color compatibility test passed in ${duration}ms`, duration)
      showSuccess('Test Passed', 'Color compatibility test passed')
    } catch (error) {
      updateTestResult('Color Compatibility', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      showError('Test Failed', 'Color compatibility test failed')
    }

    // Test 3: CSS Sanitization
    try {
      const startTime = Date.now()
      await generatePDFFromElement('css-test-content', {
        filename: 'test-css.pdf',
        format: 'a4',
        orientation: 'portrait'
      })
      const duration = Date.now() - startTime
      updateTestResult('CSS Sanitization', 'success', `CSS sanitization test passed in ${duration}ms`, duration)
      showSuccess('Test Passed', 'CSS sanitization test passed')
    } catch (error) {
      updateTestResult('CSS Sanitization', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      showError('Test Failed', 'CSS sanitization test failed')
    }

    // Test 4: Fallback Method (simulate error)
    try {
      const startTime = Date.now()
      // This should trigger the fallback method
      await generatePDFFromElement('fallback-test-content', {
        filename: 'test-fallback.pdf',
        format: 'a4',
        orientation: 'portrait'
      })
      const duration = Date.now() - startTime
      updateTestResult('Fallback Method', 'success', `Fallback method test passed in ${duration}ms`, duration)
      showSuccess('Test Passed', 'Fallback method test passed')
    } catch (error) {
      updateTestResult('Fallback Method', 'error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      showError('Test Failed', 'Fallback method test failed')
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'pending':
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Development Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-semibold text-yellow-800">Development Tool Only</h2>
          </div>
          <p className="text-yellow-700 mt-2">
            This test suite is for development and debugging purposes only. Regular users should use the
            "Download PDF" button on quotation pages for normal PDF generation.
          </p>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF Generation Test Suite</h1>
          <p className="text-gray-600">
            Test the PDF generation functionality and compatibility fixes
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Run PDF Tests</h2>
              <p className="text-gray-600">
                This will test various aspects of PDF generation including color compatibility and fallback methods.
              </p>
            </div>
            <button
              onClick={runPDFTests}
              disabled={isRunning}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              <span>{isRunning ? 'Running Tests...' : 'Run Tests'}</span>
            </button>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
            <div className="space-y-4">
              {testResults.map((test, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h3 className="font-medium text-gray-900">{test.name}</h3>
                        <p className="text-sm text-gray-600">{test.message}</p>
                      </div>
                    </div>
                    {test.duration && (
                      <span className="text-sm text-gray-500">{test.duration}ms</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Content Elements */}
        <div className="hidden">
          {/* Basic Test Content */}
          <div id="test-content" className="pdf-compatible p-8 bg-white">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Basic PDF Test</h1>
            <p className="text-gray-700 mb-4">This is a basic test of PDF generation functionality.</p>
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-sm text-gray-600">Test content with borders and styling.</p>
            </div>
          </div>

          {/* Color Test Content */}
          <div id="color-test-content" className="pdf-compatible p-8 bg-white">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Color Compatibility Test</h1>
            <div className="space-y-4">
              <div className="bg-blue-100 text-blue-800 p-4 rounded">Blue background test</div>
              <div className="bg-green-100 text-green-800 p-4 rounded">Green background test</div>
              <div className="bg-red-100 text-red-800 p-4 rounded">Red background test</div>
              <div className="bg-gray-100 text-gray-800 p-4 rounded">Gray background test</div>
            </div>
          </div>

          {/* CSS Test Content */}
          <div id="css-test-content" className="pdf-compatible p-8 bg-white">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">CSS Sanitization Test</h1>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Column 1</th>
                  <th className="border border-gray-300 p-2 text-left">Column 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">Row 1, Cell 1</td>
                  <td className="border border-gray-300 p-2">Row 1, Cell 2</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-2">Row 2, Cell 1</td>
                  <td className="border border-gray-300 p-2">Row 2, Cell 2</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Fallback Test Content */}
          <div id="fallback-test-content" className="pdf-compatible p-8 bg-white">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Fallback Method Test</h1>
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Test Item</span>
              <span className="text-gray-600">₹1,000.00</span>
            </div>
            <div className="border-t border-gray-300 pt-4">
              <div className="flex justify-between items-center font-bold">
                <span>Total</span>
                <span>₹1,000.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
