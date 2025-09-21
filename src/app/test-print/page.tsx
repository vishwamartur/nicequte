'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { Printer, Download, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { generatePDFFromElement, printElement, printQuotation } from '@/lib/pdf-generator'
import { printQuotation as printQuotationUtil } from '@/lib/print-utils'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  duration?: number
}

export default function TestPrintPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [sampleQuotation, setSampleQuotation] = useState<any>(null)
  const { showSuccess, showError } = useToast()

  // Sample quotation data for testing
  const mockQuotation = {
    id: 'test-123',
    quotationNumber: 'QT-2024-001',
    title: 'Test Quotation',
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subtotal: 10000,
    gstRate: 18,
    gstAmount: 1800,
    totalAmount: 11800,
    notes: 'This is a test quotation for print functionality testing.',
    customer: {
      id: 'cust-1',
      name: 'Test Customer Ltd.',
      email: 'test@customer.com',
      phone: '+91 98765 43210',
      address: '123 Test Street, Test City, Test State 123456',
      gstNumber: '29TESTGST1234F1Z5'
    },
    company: {
      id: 'comp-1',
      name: 'InvGen Solutions',
      address: '456 Business Avenue, Tech City, State 654321',
      phone: '+91 87654 32109',
      email: 'info@invgen.com',
      gstNumber: '29INVGEN1234F1Z5'
    },
    items: [
      {
        id: 'item-1',
        quantity: 2,
        unitPrice: 2500,
        lineTotal: 5000,
        product: {
          id: 'prod-1',
          name: 'Premium PVC Pipe',
          description: 'High-quality PVC pipe for plumbing applications',
          unit: 'meter',
          category: { name: 'Plumbing' }
        }
      },
      {
        id: 'item-2',
        quantity: 10,
        unitPrice: 500,
        lineTotal: 5000,
        product: {
          id: 'prod-2',
          name: 'LED Bulb 9W',
          description: 'Energy-efficient LED bulb with warm white light',
          unit: 'piece',
          category: { name: 'Electrical' }
        }
      }
    ]
  }

  const updateTestResult = (name: string, status: 'success' | 'error', message: string, duration?: number) => {
    setTestResults(prev => prev.map(test => 
      test.name === name 
        ? { ...test, status, message, duration }
        : test
    ))
  }

  const runTest = async (testName: string, testFunction: () => Promise<void>) => {
    const startTime = Date.now()
    try {
      await testFunction()
      const duration = Date.now() - startTime
      updateTestResult(testName, 'success', 'Test passed successfully', duration)
    } catch (error) {
      const duration = Date.now() - startTime
      updateTestResult(testName, 'error', error instanceof Error ? error.message : 'Test failed', duration)
    }
  }

  const testPrintStyles = async () => {
    // Test if print styles are loaded correctly
    const printStyles = Array.from(document.styleSheets).some(sheet => {
      try {
        return Array.from(sheet.cssRules).some(rule => 
          rule.cssText.includes('@media print')
        )
      } catch (e) {
        return false
      }
    })
    
    if (!printStyles) {
      throw new Error('Print styles not found in stylesheets')
    }
  }

  const testPrintElement = async () => {
    // Create a test element
    const testDiv = document.createElement('div')
    testDiv.id = 'test-print-element'
    testDiv.innerHTML = '<h1>Test Print Element</h1><p>This is a test for print functionality.</p>'
    testDiv.style.position = 'absolute'
    testDiv.style.left = '-9999px'
    document.body.appendChild(testDiv)

    try {
      // Test the print element function (won't actually print in test)
      printElement('test-print-element')
    } finally {
      document.body.removeChild(testDiv)
    }
  }

  const testPDFGeneration = async () => {
    // Create a test element for PDF generation
    const testDiv = document.createElement('div')
    testDiv.id = 'test-pdf-element'
    testDiv.innerHTML = `
      <div style="padding: 20px;">
        <h1>Test PDF Generation</h1>
        <p>This is a test document for PDF generation.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="border: 1px solid #ddd; padding: 8px;">Item</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Price</th>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Test Item</td>
            <td style="border: 1px solid #ddd; padding: 8px;">₹1000</td>
          </tr>
        </table>
      </div>
    `
    testDiv.style.position = 'absolute'
    testDiv.style.left = '-9999px'
    testDiv.style.width = '800px'
    testDiv.style.backgroundColor = 'white'
    document.body.appendChild(testDiv)

    try {
      await generatePDFFromElement('test-pdf-element', {
        filename: 'test-document.pdf',
        format: 'a4',
        orientation: 'portrait'
      })
    } finally {
      document.body.removeChild(testDiv)
    }
  }

  const testQuotationPrint = async () => {
    // Test the quotation-specific print function
    printQuotationUtil(mockQuotation)
  }

  const testBulkOperations = async () => {
    // Simulate bulk operations
    const quotations = [mockQuotation, { ...mockQuotation, id: 'test-124', quotationNumber: 'QT-2024-002' }]
    
    // Test bulk print preparation
    for (const quotation of quotations) {
      printQuotationUtil(quotation)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    
    // Initialize test results
    const tests = [
      'Print Styles Loading',
      'Print Element Function',
      'PDF Generation',
      'Quotation Print Function',
      'Bulk Operations'
    ]
    
    setTestResults(tests.map(name => ({
      name,
      status: 'pending' as const,
      message: 'Running...'
    })))

    // Run tests sequentially
    await runTest('Print Styles Loading', testPrintStyles)
    await runTest('Print Element Function', testPrintElement)
    await runTest('PDF Generation', testPDFGeneration)
    await runTest('Quotation Print Function', testQuotationPrint)
    await runTest('Bulk Operations', testBulkOperations)

    setIsRunning(false)
    
    const successCount = testResults.filter(t => t.status === 'success').length
    const totalTests = testResults.length
    
    if (successCount === totalTests) {
      showSuccess('All Tests Passed', `${successCount}/${totalTests} tests completed successfully`)
    } else {
      showError('Some Tests Failed', `${successCount}/${totalTests} tests passed`)
    }
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Print & Export Functionality Test
          </h1>
          <p className="text-gray-600">
            Test all print and export features to ensure they work correctly across different browsers and scenarios.
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Test Suite</h2>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
            </button>
          </div>

          {/* Test Results */}
          <div className="space-y-3">
            {testResults.map((test, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <span className="font-medium text-gray-900">{test.name}</span>
                  </div>
                  {test.duration && (
                    <span className="text-sm text-gray-500">{test.duration}ms</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-600">{test.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Test Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Tests</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => printQuotationUtil(mockQuotation)}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
            >
              <Printer className="h-5 w-5 text-gray-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Test Print Quotation</div>
                <div className="text-sm text-gray-500">Open print dialog for sample quotation</div>
              </div>
            </button>

            <button
              onClick={() => generatePDFFromElement('test-content', { filename: 'manual-test.pdf' })}
              className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-3"
            >
              <Download className="h-5 w-5 text-gray-600" />
              <div className="text-left">
                <div className="font-medium text-gray-900">Test PDF Download</div>
                <div className="text-sm text-gray-500">Generate PDF from test content</div>
              </div>
            </button>
          </div>
        </div>

        {/* Test Content for PDF Generation */}
        <div id="test-content" className="hidden">
          <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Manual Test Document</h1>
            <p>This is a test document for manual PDF generation testing.</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Item</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>Test Item 1</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>₹1,000</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>Test Item 2</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>₹2,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <ToastContainer />
    </Layout>
  )
}
