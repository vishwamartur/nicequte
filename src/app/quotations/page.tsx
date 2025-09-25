'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Printer,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  DollarSign,
  FileText,
  CheckSquare,
  Loader2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { generateQuotationPDF, printElement } from '@/lib/pdf-generator'
import { apiClient } from '@/lib/api-client'
import { useAsyncCallback, useDebouncedAsyncOperation } from '@/hooks/useAsyncOperation'
import Link from 'next/link'

interface Quotation {
  id: string
  quotationNumber: string
  title: string | null
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  totalAmount: number
  createdAt: string
  validUntil: string | null
  customer: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    gstNumber: string | null
  }
  company: {
    id: string
    name: string
  }
  _count: {
    items: number
  }
}

interface QuotationsResponse {
  quotations: Quotation[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  summary: {
    statusCounts: Record<string, number>
    totalValue: number
  }
}

export default function QuotationsPage() {
  const { toasts, removeToast, showSuccess, showError } = useToast()

  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedQuotations, setSelectedQuotations] = useState<string[]>([])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; quotationId: string | null }>({
    show: false,
    quotationId: null
  })
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })

  const [summary, setSummary] = useState({
    statusCounts: {} as Record<string, number>,
    totalValue: 0
  })

  // Enhanced quotations loading with proper error handling
  // Moved above useEffect hooks to avoid Temporal Dead Zone error
  const {
    execute: loadQuotations,
    isLoading: quotationsLoading,
    error: quotationsError
  } = useAsyncCallback(async (page = 1) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20',
      sortBy,
      sortOrder,
      ...(searchTerm && { search: searchTerm }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(minAmount && { minAmount }),
      ...(maxAmount && { maxAmount })
    })

    const response = await apiClient.get(`/api/quotations?${params}`)
    if (response.success && response.data) {
      setQuotations(response.data.quotations)
      setPagination(response.data.pagination)
      setSummary(response.data.summary)
      return response.data
    } else {
      throw new Error(response.error || 'Failed to load quotations')
    }
  }, {
    onError: (error) => showError('Error', `Failed to load quotations: ${error}`)
  })

  useEffect(() => {
    loadQuotations()
  }, [loadQuotations])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      loadQuotations(1)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, sortBy, sortOrder, dateFrom, dateTo, minAmount, maxAmount, loadQuotations])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadQuotations(page)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handleSelectQuotation = (quotationId: string) => {
    setSelectedQuotations(prev =>
      prev.includes(quotationId)
        ? prev.filter(id => id !== quotationId)
        : [...prev, quotationId]
    )
  }

  const handleSelectAll = () => {
    if (selectedQuotations.length === quotations.length) {
      setSelectedQuotations([])
    } else {
      setSelectedQuotations(quotations.map(q => q.id))
    }
  }

  const handleDeleteQuotation = async (quotationId: string) => {
    try {
      const response = await fetch(`/api/quotations/${quotationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete quotation')
      }

      showSuccess('Success', 'Quotation deleted successfully')
      loadQuotations(currentPage)
    } catch (error) {
      console.error('Error deleting quotation:', error)
      showError('Error', (error instanceof Error ? error.message : 'Failed to delete quotation'))
    }
  }

  const handleBulkPrint = async () => {
    if (selectedQuotations.length === 0) return

    try {
      setBulkActionLoading(true)

      // Fetch full quotation data for each selected quotation
      const quotationPromises = selectedQuotations.map(async (quotationId) => {
        const response = await fetch(`/api/quotations/${quotationId}`)
        if (!response.ok) throw new Error('Failed to fetch quotation')
        return response.json()
      })

      const fullQuotations = await Promise.all(quotationPromises)

      // Use the enhanced print functionality from print-utils
      const { printQuotation } = await import('@/lib/print-utils')

      // Print each quotation with a small delay to prevent browser blocking
      for (let i = 0; i < fullQuotations.length; i++) {
        setTimeout(() => {
          printQuotation(fullQuotations[i])
        }, i * 500) // 500ms delay between each print
      }

      showSuccess('Print Ready', `${selectedQuotations.length} quotations prepared for printing`)
      setSelectedQuotations([]) // Clear selection after bulk action
    } catch (error) {
      console.error('Error bulk printing:', error)
      showError('Print Error', 'Failed to prepare quotations for printing')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkDownload = async () => {
    if (selectedQuotations.length === 0) return

    try {
      setBulkActionLoading(true)

      // Fetch full quotation data for each selected quotation
      const quotationPromises = selectedQuotations.map(async (quotationId) => {
        const response = await fetch(`/api/quotations/${quotationId}`)
        if (!response.ok) throw new Error('Failed to fetch quotation')
        return response.json()
      })

      const fullQuotations = await Promise.all(quotationPromises)

      // Use the enhanced PDF generation functionality
      const { generatePDFFromElement } = await import('@/lib/pdf-generator')

      // Create a temporary container for each quotation and generate PDFs
      for (const quotation of fullQuotations) {
        // Create temporary div with quotation content
        const tempDiv = document.createElement('div')
        tempDiv.id = `temp-quotation-${quotation.id}`
        tempDiv.style.position = 'absolute'
        tempDiv.style.left = '-9999px'
        tempDiv.style.top = '-9999px'
        tempDiv.style.width = '210mm'
        tempDiv.style.padding = '20mm'
        tempDiv.style.backgroundColor = 'white'
        tempDiv.style.fontFamily = 'Arial, sans-serif'
        tempDiv.style.fontSize = '12px'
        tempDiv.style.lineHeight = '1.4'

        // Add quotation HTML content (you would need to create this HTML structure)
        tempDiv.innerHTML = createQuotationHTML(quotation)
        document.body.appendChild(tempDiv)

        try {
          await generatePDFFromElement(tempDiv.id, {
            filename: `quotation-${quotation.quotationNumber}.pdf`,
            format: 'a4',
            orientation: 'portrait'
          })
        } finally {
          // Clean up temporary element
          document.body.removeChild(tempDiv)
        }

        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      showSuccess('Download Complete', `${selectedQuotations.length} PDFs downloaded`)
      setSelectedQuotations([]) // Clear selection after bulk action
    } catch (error) {
      console.error('Error bulk downloading:', error)
      showError('Download Error', 'Failed to download quotations')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // Helper function to create quotation HTML for PDF generation
  const createQuotationHTML = (quotation: any): string => {
    const currentDate = new Date().toLocaleDateString()

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <div>
            <h1 style="margin: 0 0 10px 0; font-size: 24px; color: #333;">${quotation.company?.name || 'InvGen Solutions'}</h1>
            <div style="font-size: 12px; color: #666;">
              <p>Professional Quotation Generator</p>
              <p>123 Business Street, Tech City</p>
              <p>Phone: +91 98765 43210</p>
              <p>Email: info@invgen.com</p>
              <p>GST: 29ABCDE1234F1Z5</p>
            </div>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #333;">QUOTATION</h2>
            <p style="font-size: 16px; margin-bottom: 10px;">#${quotation.quotationNumber}</p>
            <div style="font-size: 12px; color: #666;">
              <p>Date: ${new Date(quotation.createdAt).toLocaleDateString()}</p>
              <p>Status: ${quotation.status}</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 14px; margin-bottom: 10px; color: #333;">Bill To:</h3>
          <div style="font-size: 12px;">
            <p><strong>${quotation.customer.name}</strong></p>
            ${quotation.customer.address ? `<p>${quotation.customer.address}</p>` : ''}
            ${quotation.customer.phone ? `<p>Phone: ${quotation.customer.phone}</p>` : ''}
            ${quotation.customer.email ? `<p>Email: ${quotation.customer.email}</p>` : ''}
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin: 30px 0;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Item</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Description</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Qty</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Unit Price</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.items.map((item: any) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.product.name}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${item.product.description || ''}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${item.quantity} ${item.product.unit}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">₹${item.unitPrice.toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">₹${item.lineTotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 30px;">
          <div style="display: inline-block; min-width: 300px;">
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;">
              <span>Subtotal:</span>
              <span>₹${quotation.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;">
              <span>GST (${quotation.gstRate}%):</span>
              <span>₹${quotation.gstAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #333; font-weight: bold; font-size: 14px;">
              <span>Total Amount:</span>
              <span>₹${quotation.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
          <p>This quotation was generated on ${currentDate}</p>
          <p>Thank you for your business!</p>
        </div>
      </div>
    `
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
    setMinAmount('')
    setMaxAmount('')
    setSortBy('createdAt')
    setSortOrder('desc')
  }

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quotations</h1>
            <p className="mt-2 text-gray-600">
              Manage and track all your quotations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedQuotations.length > 0 && (
              <>
                <button
                  onClick={handleBulkPrint}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Printer className="h-4 w-4" />
                  )}
                  <span>Print ({selectedQuotations.length})</span>
                </button>
                <button
                  onClick={handleBulkDownload}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {bulkActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Download ({selectedQuotations.length})</span>
                </button>
              </>
            )}
            <Link
              href="/quotations/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Quotation</span>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Quotations</p>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalValue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckSquare className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Accepted</p>
                <p className="text-2xl font-bold text-gray-900">{summary.statusCounts.ACCEPTED || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(summary.statusCounts.DRAFT || 0) + (summary.statusCounts.SENT || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {/* Basic Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
              {/* Search */}
              <div className="flex-1 lg:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search quotations, customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="lg:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Advanced</span>
              </button>

              {/* Clear Filters */}
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Amount</label>
                  <input
                    type="number"
                    placeholder="999999.99"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quotations List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {quotationsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : quotations.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quotations found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first quotation.'}
              </p>
              <Link
                href="/quotations/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Quotation
              </Link>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedQuotations.length === quotations.length}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('quotationNumber')}
                          className="flex items-center space-x-1 hover:text-gray-700"
                        >
                          <span>Quotation</span>
                          {getSortIcon('quotationNumber')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('customerName')}
                          className="flex items-center space-x-1 hover:text-gray-700"
                        >
                          <span>Customer</span>
                          {getSortIcon('customerName')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center space-x-1 hover:text-gray-700"
                        >
                          <span>Status</span>
                          {getSortIcon('status')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('totalAmount')}
                          className="flex items-center space-x-1 hover:text-gray-700"
                        >
                          <span>Amount</span>
                          {getSortIcon('totalAmount')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('createdAt')}
                          className="flex items-center space-x-1 hover:text-gray-700"
                        >
                          <span>Date</span>
                          {getSortIcon('createdAt')}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quotations.map((quotation) => (
                      <tr key={quotation.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedQuotations.includes(quotation.id)}
                            onChange={() => handleSelectQuotation(quotation.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              #{quotation.quotationNumber}
                            </div>
                            {quotation.title && (
                              <div className="text-sm text-gray-500">
                                {quotation.title}
                              </div>
                            )}
                            <div className="text-xs text-gray-400">
                              {quotation._count.items} item{quotation._count.items !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {quotation.customer.name}
                            </div>
                            {quotation.customer.email && (
                              <div className="text-sm text-gray-500">
                                {quotation.customer.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(quotation.status)}`}>
                            {quotation.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(quotation.totalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            {formatDate(new Date(quotation.createdAt))}
                          </div>
                          {quotation.validUntil && (
                            <div className="text-xs text-gray-400">
                              Valid until {formatDate(new Date(quotation.validUntil))}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              href={`/quotations/${quotation.id}`}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/quotations/${quotation.id}/edit`}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => printElement(`quotation-${quotation.id}`)}
                              className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                              title="Print"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => generateQuotationPDF(quotation)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ show: true, quotationId: quotation.id })}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(currentPage - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pagination.limit, pagination.total)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.total}</span>{' '}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.min(pagination.pages, 10) }, (_, i) => {
                          const page = i + 1
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                page === currentPage
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        })}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === pagination.pages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.show}
          onClose={() => setDeleteConfirm({ show: false, quotationId: null })}
          onConfirm={() => {
            if (deleteConfirm.quotationId) {
              handleDeleteQuotation(deleteConfirm.quotationId)
              setDeleteConfirm({ show: false, quotationId: null })
            }
          }}
          title="Delete Quotation"
          message="Are you sure you want to delete this quotation? This action cannot be undone."
          type="danger"
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
