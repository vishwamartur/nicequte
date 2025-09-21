'use client'

import Layout from '@/components/layout/Layout'
import ProductForm from '@/components/products/ProductForm'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { useState, useEffect } from 'react'
import { Search, Filter, Package, Plus, Wrench, Zap, Edit, Trash2, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Category {
  id: string
  name: string
  type: 'PLUMBING' | 'ELECTRICAL'
  _count: {
    products: number
  }
}

interface Product {
  id: string
  name: string
  description: string | null
  specifications: string | null
  unitPrice: number
  unit: string
  sku: string | null
  category: Category
}

interface ProductsResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Form and dialog states
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Toast notifications
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast()

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadProducts = async (page = 1, search = '', categoryId = '', status = 'active') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(categoryId && { categoryId }),
        ...(status !== 'all' && { isActive: status === 'active' ? 'true' : 'false' })
      })

      const response = await fetch(`/api/products?${params}`)
      const data: ProductsResponse = await response.json()

      setProducts(data.products)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      loadProducts(1, searchTerm, selectedCategory, statusFilter)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, selectedCategory, statusFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadProducts(page, searchTerm, selectedCategory, statusFilter)
  }

  // CRUD operations
  const handleAddProduct = () => {
    setEditingProduct(null)
    setShowProductForm(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowProductForm(true)
  }

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product)
    setShowDeleteDialog(true)
  }

  const handleSaveProduct = async (productData: any) => {
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products'

      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save product')
      }

      const savedProduct = await response.json()

      if (editingProduct) {
        setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p))
        showSuccess('Product Updated', 'Product has been updated successfully.')
      } else {
        setProducts(prev => [savedProduct, ...prev])
        showSuccess('Product Added', 'New product has been added successfully.')
      }

      setShowProductForm(false)
      setEditingProduct(null)
    } catch (error) {
      console.error('Error saving product:', error)
      showError('Error', error.message || 'Failed to save product')
      throw error
    }
  }

  const confirmDeleteProduct = async () => {
    if (!deletingProduct) return

    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/products/${deletingProduct.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()

        if (error.canSoftDelete) {
          // Product is used in quotations, offer soft delete
          const forceResponse = await fetch(`/api/products/${deletingProduct.id}?force=true`, {
            method: 'DELETE',
          })

          if (forceResponse.ok) {
            const result = await forceResponse.json()
            if (result.softDeleted) {
              setProducts(prev => prev.map(p =>
                p.id === deletingProduct.id ? { ...p, isActive: false } : p
              ))
              showWarning('Product Deactivated', 'Product has been marked as inactive because it is used in existing quotations.')
            }
          } else {
            throw new Error('Failed to deactivate product')
          }
        } else {
          throw new Error(error.error || 'Failed to delete product')
        }
      } else {
        const result = await response.json()
        if (result.hardDeleted) {
          setProducts(prev => prev.filter(p => p.id !== deletingProduct.id))
          showSuccess('Product Deleted', 'Product has been permanently deleted.')
        }
      }

      setShowDeleteDialog(false)
      setDeletingProduct(null)
    } catch (error) {
      console.error('Error deleting product:', error)
      showError('Error', error.message || 'Failed to delete product')
    } finally {
      setDeleteLoading(false)
    }
  }

  const getCategoryIcon = (type: string) => {
    return type === 'PLUMBING' ? Wrench : Zap
  }

  const getCategoryColor = (type: string) => {
    return type === 'PLUMBING' 
      ? 'text-blue-600 bg-blue-100' 
      : 'text-yellow-600 bg-yellow-100'
  }

  const parseSpecifications = (specs: string | null) => {
    if (!specs) return null
    try {
      return JSON.parse(specs)
    } catch {
      return null
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products Catalog</h1>
            <p className="mt-2 text-gray-600">
              Browse plumbing and electrical materials for your quotations
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleAddProduct}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category._count.products})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active Products</option>
                <option value="inactive">Inactive Products</option>
                <option value="all">All Products</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const Icon = getCategoryIcon(product.category.type)
                const specifications = parseSpecifications(product.specifications)
                
                return (
                  <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Product Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getCategoryColor(product.category.type)}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className={`font-semibold ${product.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                {product.name}
                              </h3>
                              {!product.isActive && (
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{product.category.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${product.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                            {formatCurrency(product.unitPrice)}
                          </p>
                          <p className="text-sm text-gray-500">per {product.unit}</p>
                        </div>
                      </div>

                      {/* Description */}
                      {product.description && (
                        <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                      )}

                      {/* Specifications */}
                      {specifications && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Specifications:</h4>
                          <div className="space-y-1">
                            {Object.entries(specifications).slice(0, 3).map(([key, value]) => (
                              <div key={key} className="flex justify-between text-sm">
                                <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                                <span className="text-gray-900">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SKU */}
                      {product.sku && (
                        <p className="text-xs text-gray-500 mb-4">SKU: {product.sku}</p>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                          Add to Quotation
                        </button>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}

            {/* Results Summary */}
            <div className="text-center text-sm text-gray-600">
              Showing {products.length} of {pagination.total} products
            </div>
          </>
        )}

        {/* Product Form Modal */}
        <ProductForm
          product={editingProduct}
          isOpen={showProductForm}
          onClose={() => {
            setShowProductForm(false)
            setEditingProduct(null)
          }}
          onSave={handleSaveProduct}
          title={editingProduct ? 'Edit Product' : 'Add New Product'}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => {
            setShowDeleteDialog(false)
            setDeletingProduct(null)
          }}
          onConfirm={confirmDeleteProduct}
          title="Delete Product"
          message={`Are you sure you want to delete "${deletingProduct?.name}"?\n\nThis action cannot be undone. If the product is used in existing quotations, it will be marked as inactive instead.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          loading={deleteLoading}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
