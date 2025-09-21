'use client'

import Layout from '@/components/layout/Layout'
import { useState, useEffect } from 'react'
import { Plus, Minus, Search, Calculator, Save, Eye } from 'lucide-react'
import { formatCurrency, calculateGST, generateQuotationNumber } from '@/lib/utils'

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
  product: Product | null // null for custom products
  customProduct?: {
    name: string
    description: string | null
    unit: string
  }
  quantity: number
  unitPrice: number
  lineTotal: number
  isCustom: boolean
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
  gstNumber: string
}

interface BusinessName {
  id: string
  name: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  gstNumber: string | null
  isDefault: boolean
  isActive: boolean
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  gstNumber: string | null
}

export default function NewQuotationPage() {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: ''
  })

  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [businessNames, setBusinessNames] = useState<BusinessName[]>([])
  const [selectedBusinessNameId, setSelectedBusinessNameId] = useState<string>('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [customerSelectionMode, setCustomerSelectionMode] = useState<'select' | 'manual'>('select')
  const [saveCustomer, setSaveCustomer] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [showCustomProductForm, setShowCustomProductForm] = useState(false)
  const [customProductForm, setCustomProductForm] = useState({
    name: '',
    description: '',
    unit: 'piece',
    unitPrice: '',
    quantity: '1'
  })
  const [gstRate, setGstRate] = useState(18)
  const [quotationNumber, setQuotationNumber] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

  // Load products for search
  const loadProducts = async (search = '') => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        ...(search && { search })
      })

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      setProducts(data.products)
    } catch (error) {
      console.error('Error loading products:', error)
    }
  }

  // Load business names
  const loadBusinessNames = async () => {
    try {
      const response = await fetch('/api/business-names')
      const data = await response.json()
      setBusinessNames(data)

      // Set default business name if available
      const defaultBusinessName = data.find((bn: BusinessName) => bn.isDefault)
      if (defaultBusinessName) {
        setSelectedBusinessNameId(defaultBusinessName.id)
      }
    } catch (error) {
      console.error('Error loading business names:', error)
    }
  }

  // Load customers
  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=100')
      const data = await response.json()
      setCustomers(data.customers)
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  useEffect(() => {
    // Generate quotation number on client side only to avoid hydration mismatch
    setQuotationNumber(generateQuotationNumber())
    loadProducts()
    loadBusinessNames()
    loadCustomers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      loadProducts(searchTerm)
    }
  }, [searchTerm])

  // Handle customer selection
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setCustomerInfo({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        gstNumber: customer.gstNumber || ''
      })
      setSelectedCustomerId(customerId)
    }
  }

  // Clear customer selection
  const clearCustomerSelection = () => {
    setSelectedCustomerId('')
    setCustomerInfo({
      name: '',
      email: '',
      phone: '',
      address: '',
      gstNumber: ''
    })
  }

  // Add custom product to quotation
  const addCustomProduct = () => {
    if (!customProductForm.name.trim() || !customProductForm.unitPrice || !customProductForm.quantity) {
      alert('Please fill in all required fields for the custom product.')
      return
    }

    const unitPrice = parseFloat(customProductForm.unitPrice)
    const quantity = parseFloat(customProductForm.quantity)

    if (isNaN(unitPrice) || unitPrice <= 0) {
      alert('Please enter a valid unit price.')
      return
    }

    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity.')
      return
    }

    const newItem: QuotationItem = {
      id: `custom-${Date.now()}-${Math.random()}`,
      product: null,
      customProduct: {
        name: customProductForm.name.trim(),
        description: customProductForm.description.trim() || null,
        unit: customProductForm.unit
      },
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      isCustom: true
    }

    setQuotationItems(items => [...items, newItem])

    // Reset form
    setCustomProductForm({
      name: '',
      description: '',
      unit: 'piece',
      unitPrice: '',
      quantity: '1'
    })
    setShowCustomProductForm(false)
  }

  // Add product to quotation
  const addProduct = (product: Product) => {
    const existingItem = quotationItems.find(item =>
      !item.isCustom && item.product?.id === product.id
    )

    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1)
    } else {
      const newItem: QuotationItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        product,
        quantity: 1,
        unitPrice: product.unitPrice,
        lineTotal: product.unitPrice,
        isCustom: false
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

    if (!quotationNumber) {
      alert('Please wait for the quotation number to be generated.')
      return
    }

    if (!customerInfo.name || quotationItems.length === 0 || !selectedBusinessNameId) {
      alert('Please fill in customer name, select a business name, and add at least one product.')
      return
    }

    try {
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 30) // Valid for 30 days

      const quotationData = {
        customerInfo,
        businessNameId: selectedBusinessNameId,
        items: quotationItems,
        subtotal,
        gstAmount,
        gstRate,
        totalAmount,
        title: title || null,
        description: description || null,
        notes: notes || null,
        validUntil: validUntil.toISOString(),
        saveCustomer: customerSelectionMode === 'manual' ? saveCustomer : false,
        selectedCustomerId: customerSelectionMode === 'select' ? selectedCustomerId : null
      }

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quotationData),
      })

      if (!response.ok) {
        throw new Error('Failed to create quotation')
      }

      const result = await response.json()
      alert('Quotation created successfully!')

      // Redirect to quotations list or preview
      window.location.href = '/quotations'
    } catch (error) {
      console.error('Error creating quotation:', error)
      alert('Error creating quotation. Please try again.')
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Quotation</h1>
            <p className="text-gray-600 mt-2">
              {quotationNumber ? (
                <>Quotation #{quotationNumber} <span className="text-sm">(Preview)</span></>
              ) : (
                'Generating quotation number...'
              )}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={!quotationNumber}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                quotationNumber
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              <Save className="h-4 w-4" />
              <span>{quotationNumber ? 'Save Quotation' : 'Generating...'}</span>
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

          {/* Business Name Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Business Name *
              </label>
              <select
                required
                value={selectedBusinessNameId}
                onChange={(e) => setSelectedBusinessNameId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a business name...</option>
                {businessNames.map((businessName) => (
                  <option key={businessName.id} value={businessName.id}>
                    {businessName.name}
                    {businessName.isDefault ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
              {businessNames.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No business names available.
                  <a href="/business-names" className="text-blue-600 hover:text-blue-800 ml-1">
                    Create one here
                  </a>
                </p>
              )}
              {selectedBusinessNameId && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  {(() => {
                    const selectedBusiness = businessNames.find(bn => bn.id === selectedBusinessNameId)
                    if (!selectedBusiness) return null
                    return (
                      <div className="text-sm text-gray-600">
                        <p className="font-medium text-gray-900">{selectedBusiness.name}</p>
                        {selectedBusiness.description && (
                          <p className="mt-1">{selectedBusiness.description}</p>
                        )}
                        {selectedBusiness.address && (
                          <p className="mt-1">📍 {selectedBusiness.address}</p>
                        )}
                        <div className="flex space-x-4 mt-1">
                          {selectedBusiness.phone && (
                            <span>📞 {selectedBusiness.phone}</span>
                          )}
                          {selectedBusiness.email && (
                            <span>✉️ {selectedBusiness.email}</span>
                          )}
                        </div>
                        {selectedBusiness.gstNumber && (
                          <p className="mt-1">GST: {selectedBusiness.gstNumber}</p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>

            {/* Customer Selection Mode */}
            <div className="mb-6">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="customerMode"
                    value="select"
                    checked={customerSelectionMode === 'select'}
                    onChange={(e) => setCustomerSelectionMode(e.target.value as 'select' | 'manual')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Select existing customer</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="customerMode"
                    value="manual"
                    checked={customerSelectionMode === 'manual'}
                    onChange={(e) => setCustomerSelectionMode(e.target.value as 'select' | 'manual')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Enter customer details manually</span>
                </label>
              </div>
            </div>

            {/* Customer Selection Dropdown */}
            {customerSelectionMode === 'select' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer *
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  required={customerSelectionMode === 'select'}
                >
                  <option value="">Choose a customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.email ? `(${customer.email})` : ''}
                    </option>
                  ))}
                </select>
                {customers.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No customers available.
                    <a href="/customers" className="text-blue-600 hover:text-blue-800 ml-1">
                      Create one here
                    </a>
                  </p>
                )}
                {selectedCustomerId && (
                  <button
                    type="button"
                    onClick={clearCustomerSelection}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear selection and enter manually
                  </button>
                )}
              </div>
            )}

            {/* Manual Customer Entry or Selected Customer Display */}
            {(customerSelectionMode === 'manual' || selectedCustomerId) && (
              <>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      disabled={customerSelectionMode === 'select' && selectedCustomerId !== ''}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      disabled={customerSelectionMode === 'select' && selectedCustomerId !== ''}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      disabled={customerSelectionMode === 'select' && selectedCustomerId !== ''}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      disabled={customerSelectionMode === 'select' && selectedCustomerId !== ''}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    disabled={customerSelectionMode === 'select' && selectedCustomerId !== ''}
                  />
                </div>

                {/* Save Customer Option for Manual Entry */}
                {customerSelectionMode === 'manual' && (
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={saveCustomer}
                        onChange={(e) => setSaveCustomer(e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Save this customer for future use</span>
                    </label>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Products Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Products & Services</h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductSearch(!showProductSearch)
                    setShowCustomProductForm(false)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomProductForm(!showCustomProductForm)
                    setShowProductSearch(false)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Custom Product</span>
                </button>
              </div>
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

            {/* Custom Product Form */}
            {showCustomProductForm && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Custom Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={customProductForm.name}
                      onChange={(e) => setCustomProductForm({...customProductForm, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit of Measurement
                    </label>
                    <select
                      value={customProductForm.unit}
                      onChange={(e) => setCustomProductForm({...customProductForm, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="piece">Piece</option>
                      <option value="meter">Meter</option>
                      <option value="kg">Kilogram</option>
                      <option value="liter">Liter</option>
                      <option value="hour">Hour</option>
                      <option value="day">Day</option>
                      <option value="set">Set</option>
                      <option value="box">Box</option>
                      <option value="roll">Roll</option>
                      <option value="sheet">Sheet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price (₹) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customProductForm.unitPrice}
                      onChange={(e) => setCustomProductForm({...customProductForm, unitPrice: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          const qty = Math.max(1, parseFloat(customProductForm.quantity) - 1)
                          setCustomProductForm({...customProductForm, quantity: qty.toString()})
                        }}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={customProductForm.quantity}
                        onChange={(e) => setCustomProductForm({...customProductForm, quantity: e.target.value})}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const qty = parseFloat(customProductForm.quantity) + 1
                          setCustomProductForm({...customProductForm, quantity: qty.toString()})
                        }}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-900"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={customProductForm.description}
                    onChange={(e) => setCustomProductForm({...customProductForm, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Enter product description"
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowCustomProductForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addCustomProduct}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Custom Product
                  </button>
                </div>
              </div>
            )}

            {/* Selected Products */}
            <div className="space-y-4">
              {quotationItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No products added yet. Click &quot;Add Product&quot; to get started.</p>
                </div>
              ) : (
                quotationItems.map((item) => (
                  <div key={item.id} className={`flex items-center space-x-4 p-4 border rounded-lg ${
                    item.isCustom ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {item.isCustom ? item.customProduct?.name : item.product?.name}
                        </h4>
                        {item.isCustom && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.isCustom ? 'Custom Product' : item.product?.category.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(item.unitPrice)} per {item.isCustom ? item.customProduct?.unit : item.product?.unit}
                      </p>
                      {item.isCustom && item.customProduct?.description && (
                        <p className="text-xs text-gray-500 mt-1">{item.customProduct.description}</p>
                      )}
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
                      <Minus className="h-4 w-4" />
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
      </div>
    </Layout>
  )
}
