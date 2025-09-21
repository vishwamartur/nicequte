'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/layout/Layout'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { Plus, Minus, Search, Save, ArrowLeft, Loader2, X } from 'lucide-react'
import { formatCurrency, calculateGST } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string | null
  unitPrice: number
  unit: string
  sku: string | null
  category: {
    name: string
    type: 'PLUMBING' | 'ELECTRICAL'
  }
}

interface QuotationItem {
  id: string
  product: Product
  quantity: number
  unitPrice: number
  lineTotal: number
  description?: string
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
  gstNumber: string
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
  status: string
  validUntil: string | null
  notes: string | null
  customer: {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    gstNumber: string | null
  }
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    lineTotal: number
    description: string | null
    product: Product
  }>
}

export default function EditQuotationPage() {
  const params = useParams()
  const router = useRouter()
  const { toasts, removeToast, showSuccess, showError } = useToast()

  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: ''
  })
  
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [gstRate, setGstRate] = useState(18)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (params.id) {
      loadQuotation(params.id as string)
      loadProducts()
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

      const data: Quotation = await response.json()
      setQuotation(data)
      
      // Populate form data
      setCustomerInfo({
        name: data.customer.name,
        email: data.customer.email || '',
        phone: data.customer.phone || '',
        address: data.customer.address || '',
        gstNumber: data.customer.gstNumber || ''
      })
      
      setQuotationItems(data.items.map(item => ({
        id: item.id,
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        description: item.description || undefined
      })))
      
      setGstRate(data.gstRate)
      setTitle(data.title || '')
      setDescription(data.description || '')
      setNotes(data.notes || '')
      
    } catch (error) {
      console.error('Error loading quotation:', error)
      showError('Error', 'Failed to load quotation')
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async (search = '') => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        isActive: 'true',
        ...(search && { search })
      })
      
      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      setProducts(data.products)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  useEffect(() => {
    if (searchTerm) {
      loadProducts(searchTerm)
    }
  }, [searchTerm])

  // Add product to quotation
  const addProduct = (product: Product) => {
    const existingItem = quotationItems.find(item => item.product.id === product.id)
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1)
    } else {
      const newItem: QuotationItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        product,
        quantity: 1,
        unitPrice: product.unitPrice,
        lineTotal: product.unitPrice
      }
      setQuotationItems([...quotationItems, newItem])
    }
    
    setShowProductSearch(false)
    setSearchTerm('')
  }

  // Update item quantity
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
      return
    }
    
    setQuotationItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity, lineTotal: newQuantity * item.unitPrice }
          : item
      )
    )
  }

  // Update item unit price
  const updateUnitPrice = (itemId: string, newPrice: number) => {
    setQuotationItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, unitPrice: newPrice, lineTotal: item.quantity * newPrice }
          : item
      )
    )
  }

  // Remove item
  const removeItem = (itemId: string) => {
    setQuotationItems(items => items.filter(item => item.id !== itemId))
  }

  // Calculate totals
  const subtotal = quotationItems.reduce((sum, item) => sum + item.lineTotal, 0)
  const gstAmount = calculateGST(subtotal, gstRate)
  const totalAmount = subtotal + gstAmount

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customerInfo.name || quotationItems.length === 0) {
      showError('Validation Error', 'Please fill in customer name and add at least one product.')
      return
    }

    try {
      setSaving(true)
      
      const quotationData = {
        customerInfo,
        items: quotationItems,
        subtotal,
        gstAmount,
        gstRate,
        totalAmount,
        title: title || null,
        description: description || null,
        notes: notes || null,
        validUntil: quotation?.validUntil || null
      }

      const response = await fetch(`/api/quotations/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update quotation')
      }

      showSuccess('Success', 'Quotation updated successfully!')
      router.push(`/quotations/${params.id}`)
    } catch (error) {
      console.error('Error updating quotation:', error)
      showError('Error', (error instanceof Error ? error.message : 'Failed to update quotation'))
    } finally {
      setSaving(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
      <div className="max-w-4xl mx-auto space-y-8">
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
              <h1 className="text-3xl font-bold text-gray-900">Edit Quotation</h1>
              <p className="text-gray-600 mt-2">Quotation #{quotation.quotationNumber}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => router.push(`/quotations/${params.id}`)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Quotation Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quotation Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Plumbing Installation Quote"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of the work to be done..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Number
                </label>
                <input
                  type="text"
                  value={customerInfo.gstNumber}
                  onChange={(e) => setCustomerInfo({...customerInfo, gstNumber: e.target.value})}
                  placeholder="e.g., 29ABCDE1234F1Z5"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Products & Services</h2>
              <button
                type="button"
                onClick={() => setShowProductSearch(!showProductSearch)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Product Search */}
            {showProductSearch && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowProductSearch(false)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => addProduct(product)}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-blue-300 cursor-pointer transition-colors"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">{product.name}</h4>
                        <p className="text-sm text-gray-600">{product.category.name}</p>
                        {product.sku && (
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(product.unitPrice)}
                        </p>
                        <p className="text-sm text-gray-500">per {product.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Products */}
            <div className="space-y-4">
              {quotationItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No products added yet. Click "Add Product" to get started.</p>
                </div>
              ) : (
                quotationItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                      <p className="text-sm text-gray-600">{item.product.category.name}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                        min="1"
                        className="w-16 px-2 py-1 text-center border border-gray-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="w-32">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateUnitPrice(item.id, Number(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1 text-right border border-gray-300 rounded"
                      />
                      <p className="text-xs text-gray-500 text-right">per {item.product.unit}</p>
                    </div>
                    
                    <div className="text-right min-w-[100px]">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.lineTotal)}
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals */}
          {quotationItems.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GST ({gstRate}%):</span>
                  <span className="font-medium">{formatCurrency(gstAmount)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Any additional terms, conditions, or notes..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </form>

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
