'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import CustomerForm from '@/components/customers/CustomerForm'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { 
  Plus, 
  User, 
  Edit, 
  Trash2, 
  Mail,
  Phone,
  MapPin,
  FileText,
  Search,
  Users
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  gstNumber: string | null
  createdAt: string
  updatedAt: string
  _count: {
    quotations: number
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    customer: Customer | null
  }>({ isOpen: false, customer: null })

  const { toasts, removeToast, showSuccess, showError } = useToast()

  useEffect(() => {
    fetchCustomers()
  }, [searchTerm])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/customers?${params}`)
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers)
      } else {
        showError('Error', 'Failed to fetch customers')
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      showError('Error', 'Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (customerData: Omit<Customer, 'id' | '_count' | 'createdAt' | 'updatedAt'>) => {
    try {
      const url = editingCustomer 
        ? `/api/customers/${editingCustomer.id}`
        : '/api/customers'
      
      const method = editingCustomer ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      })

      if (response.ok) {
        showSuccess(
          editingCustomer ? 'Customer Updated' : 'Customer Created',
          editingCustomer 
            ? 'Customer has been updated successfully'
            : 'New customer has been created successfully'
        )
        fetchCustomers()
        setShowForm(false)
        setEditingCustomer(undefined)
      } else {
        const error = await response.json()
        showError('Error', error.error || 'Failed to save customer')
      }
    } catch (error) {
      console.error('Error saving customer:', error)
      showError('Error', 'Failed to save customer')
    }
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setShowForm(true)
  }

  const handleDelete = async (customer: Customer) => {
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        showSuccess('Success', 'Customer deleted successfully')
        fetchCustomers()
      } else {
        const error = await response.json()
        showError('Error', error.error || 'Failed to delete customer')
      }
    } catch (error) {
      console.error('Error deleting customer:', error)
      showError('Error', 'Failed to delete customer')
    }
    setDeleteConfirm({ isOpen: false, customer: null })
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-2">
              Manage your customer database for quick quotation creation
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCustomer(undefined)
              setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading customers...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customers.length > 0 ? (
              <div className="grid gap-4">
                {customers.map((customer) => (
                  <div
                    key={customer.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="h-5 w-5 text-gray-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {customer.name}
                          </h3>
                          {customer._count.quotations > 0 && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {customer._count.quotations} quotation{customer._count.quotations !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          {customer.email && (
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.address && (
                            <div className="flex items-start space-x-2">
                              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{customer.address}</span>
                            </div>
                          )}
                          {customer.gstNumber && (
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4" />
                              <span>GST: {customer.gstNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, customer })}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                          disabled={customer._count.quotations > 0}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No customers found' : 'No customers yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'Try adjusting your search terms'
                    : 'Create your first customer to streamline quotation creation'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={() => {
                      setEditingCustomer(undefined)
                      setShowForm(true)
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Customer
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Customer Form Modal */}
        <CustomerForm
          customer={editingCustomer}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingCustomer(undefined)
          }}
          onSave={handleSave}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          title="Delete Customer"
          message={`Are you sure you want to delete "${deleteConfirm.customer?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onClose={() => setDeleteConfirm({ isOpen: false, customer: null })}
          onConfirm={() => deleteConfirm.customer ? handleDelete(deleteConfirm.customer) : Promise.resolve()}
          onCancel={() => setDeleteConfirm({ isOpen: false, customer: null })}
          type="danger"
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
