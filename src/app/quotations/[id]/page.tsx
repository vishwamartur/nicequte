'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import QuotationPreview from '@/components/quotation/QuotationPreview'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import {
  ArrowLeft,
  Edit,
  Printer,
  Download,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateQuotationPDF, printElement } from '@/lib/pdf-generator'
import '../../../styles/pdf-compatible.css'

interface QuotationItem {
  id: string
  quantity: number
  unitPrice: number
  lineTotal: number
  description: string | null
  product: {
    id: string
    name: string
    description: string | null
    unit: string
    category: {
      name: string
      type: 'PLUMBING' | 'ELECTRICAL'
    }
  }
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  gstNumber: string | null
}

interface Company {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  gstNumber: string | null
}

interface Quotation {
  id: string
  quotationNumber: string
  title: string | null
  description: string | null
  subtotal: number
  gstAmount: number
  gstRate: number
  totalAmount: number
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  validUntil: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  customer: Customer
  company: Company
  items: QuotationItem[]
}

export default function QuotationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toasts, removeToast, showSuccess, showError } = useToast()
  
  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [printLoading, setPrintLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadQuotation(params.id as string)
    }
  }, [params.id])

  const loadQuotation = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/quotations/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          showError('Not Found', 'Quotation not found')
          router.push('/quotations')
          return
        }
        throw new Error('Failed to load quotation')
      }

      const data = await response.json()
      setQuotation(data)
    } catch (error) {
      console.error('Error loading quotation:', error)
      showError('Error', 'Failed to load quotation')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    if (!quotation) return

    try {
      setStatusLoading(true)
      const response = await fetch(`/api/quotations/${quotation.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update status')
      }

      const result = await response.json()
      setQuotation(result.quotation)
      showSuccess('Status Updated', `Quotation status changed to ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      showError('Error', error.message || 'Failed to update status')
    } finally {
      setStatusLoading(false)
    }
  }

  const handlePrint = async () => {
    try {
      setPrintLoading(true)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for UI
      printElement('quotation-preview')
      showSuccess('Print Ready', 'Print dialog opened')
    } catch (error) {
      console.error('Error printing:', error)
      showError('Print Error', 'Failed to open print dialog')
    } finally {
      setPrintLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!quotation) return

    try {
      setPdfLoading(true)
      await generateQuotationPDF(quotation)
      showSuccess('PDF Generated', 'Quotation PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      showError('PDF Error', 'Failed to generate PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Edit className="h-4 w-4" />
      case 'SENT':
        return <Send className="h-4 w-4" />
      case 'ACCEPTED':
        return <CheckCircle className="h-4 w-4" />
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />
      case 'EXPIRED':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800'
      case 'SENT':
        return 'bg-blue-100 text-blue-800'
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!quotation) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Quotation Not Found</h2>
          <p className="text-gray-600 mt-2">The requested quotation could not be found.</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quotation {quotation.quotationNumber}
              </h1>
              <div className="flex items-center space-x-4 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                  {getStatusIcon(quotation.status)}
                  <span className="ml-1">{quotation.status}</span>
                </span>
                <span className="text-sm text-gray-500">
                  Created {formatDate(new Date(quotation.createdAt))}
                </span>
                {quotation.validUntil && (
                  <span className="text-sm text-gray-500">
                    Valid until {formatDate(new Date(quotation.validUntil))}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push(`/quotations/${quotation.id}/edit`)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit</span>
            </button>
            
            <button
              onClick={handlePrint}
              disabled={printLoading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {printLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              <span>Print</span>
            </button>
            
            <button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {pdfLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Status Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">Update status:</span>
            {['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'].map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                disabled={statusLoading || quotation.status === status}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                  quotation.status === status
                    ? getStatusColor(status)
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
            {statusLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            )}
          </div>
        </div>

        {/* Quotation Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Customer</h3>
              <p className="text-lg font-semibold text-gray-900">{quotation.customer.name}</p>
              {quotation.customer.email && (
                <p className="text-sm text-gray-600">{quotation.customer.email}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(quotation.totalAmount)}
              </p>
              <p className="text-sm text-gray-600">
                {quotation.items.length} item{quotation.items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">GST</h3>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(quotation.gstAmount)} ({quotation.gstRate}%)
              </p>
              <p className="text-sm text-gray-600">
                Subtotal: {formatCurrency(quotation.subtotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Quotation Preview */}
        <QuotationPreview
          quotationNumber={quotation.quotationNumber}
          customerInfo={{
            name: quotation.customer.name,
            email: quotation.customer.email || '',
            phone: quotation.customer.phone || '',
            address: quotation.customer.address || '',
            gstNumber: quotation.customer.gstNumber || ''
          }}
          items={quotation.items.map(item => ({
            id: item.id,
            product: {
              name: item.product.name,
              description: item.product.description,
              unit: item.product.unit,
              category: item.product.category
            },
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal
          }))}
          subtotal={quotation.subtotal}
          gstRate={quotation.gstRate}
          gstAmount={quotation.gstAmount}
          totalAmount={quotation.totalAmount}
          title={quotation.title}
          description={quotation.description}
          notes={quotation.notes}
          onDownloadPDF={handleDownloadPDF}
          onPrint={handlePrint}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
