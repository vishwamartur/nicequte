'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/layout/Layout'
import BusinessNameForm from '@/components/business/BusinessNameForm'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { ToastContainer, useToast } from '@/components/ui/Toast'
import { 
  Plus, 
  Building, 
  Edit, 
  Trash2, 
  Star, 
  StarOff,
  Mail,
  Phone,
  MapPin,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react'

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
  createdAt: string
  updatedAt: string
}

export default function BusinessNamesPage() {
  const [businessNames, setBusinessNames] = useState<BusinessName[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBusinessName, setEditingBusinessName] = useState<BusinessName | undefined>()
  const [showInactive, setShowInactive] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean
    businessName: BusinessName | null
  }>({ isOpen: false, businessName: null })

  const { toasts, removeToast, showSuccess, showError } = useToast()

  useEffect(() => {
    fetchBusinessNames()
  }, [showInactive])

  const fetchBusinessNames = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/business-names?includeInactive=${showInactive}`)
      if (response.ok) {
        const data = await response.json()
        setBusinessNames(data)
      } else {
        showError('Error', 'Failed to fetch business names')
      }
    } catch (error) {
      console.error('Error fetching business names:', error)
      showError('Error', 'Failed to fetch business names')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (businessNameData: Omit<BusinessName, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>) => {
    try {
      const url = editingBusinessName 
        ? `/api/business-names/${editingBusinessName.id}`
        : '/api/business-names'
      
      const method = editingBusinessName ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessNameData),
      })

      if (response.ok) {
        showSuccess(
          editingBusinessName ? 'Business Name Updated' : 'Business Name Created',
          editingBusinessName 
            ? 'Business name has been updated successfully'
            : 'New business name has been created successfully'
        )
        fetchBusinessNames()
        setShowForm(false)
        setEditingBusinessName(undefined)
      } else {
        const error = await response.json()
        showError('Error', error.error || 'Failed to save business name')
      }
    } catch (error) {
      console.error('Error saving business name:', error)
      showError('Error', 'Failed to save business name')
    }
  }

  const handleEdit = (businessName: BusinessName) => {
    setEditingBusinessName(businessName)
    setShowForm(true)
  }

  const handleDelete = async (businessName: BusinessName) => {
    try {
      const response = await fetch(`/api/business-names/${businessName.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const result = await response.json()
        showSuccess('Success', result.message)
        fetchBusinessNames()
      } else {
        const error = await response.json()
        showError('Error', error.error || 'Failed to delete business name')
      }
    } catch (error) {
      console.error('Error deleting business name:', error)
      showError('Error', 'Failed to delete business name')
    }
    setDeleteConfirm({ isOpen: false, businessName: null })
  }

  const handleSetDefault = async (businessName: BusinessName) => {
    try {
      const response = await fetch('/api/business-names', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ defaultBusinessNameId: businessName.id }),
      })

      if (response.ok) {
        showSuccess('Default Updated', `${businessName.name} is now the default business name`)
        fetchBusinessNames()
      } else {
        const error = await response.json()
        showError('Error', error.error || 'Failed to update default business name')
      }
    } catch (error) {
      console.error('Error setting default business name:', error)
      showError('Error', 'Failed to update default business name')
    }
  }

  const activeBusinessNames = businessNames.filter(bn => bn.isActive)
  const inactiveBusinessNames = businessNames.filter(bn => !bn.isActive)

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Names</h1>
            <p className="text-gray-600 mt-2">
              Manage your business names for quick selection in quotations
            </p>
          </div>
          <button
            onClick={() => {
              setEditingBusinessName(undefined)
              setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Business Name</span>
          </button>
        </div>

        {/* Toggle for showing inactive */}
        <div className="mb-6">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
          >
            {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span>{showInactive ? 'Hide' : 'Show'} inactive business names</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading business names...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Business Names */}
            {activeBusinessNames.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Business Names</h2>
                <div className="grid gap-4">
                  {activeBusinessNames.map((businessName) => (
                    <div
                      key={businessName.id}
                      className={`bg-white rounded-lg shadow-sm border p-6 ${
                        businessName.isDefault ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Building className="h-5 w-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">
                              {businessName.name}
                            </h3>
                            {businessName.isDefault && (
                              <Star className="h-5 w-5 text-yellow-500 fill-current" />
                            )}
                          </div>
                          
                          {businessName.description && (
                            <p className="text-gray-600 mb-3">{businessName.description}</p>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                            {businessName.address && (
                              <div className="flex items-start space-x-2">
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                <span>{businessName.address}</span>
                              </div>
                            )}
                            {businessName.phone && (
                              <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4" />
                                <span>{businessName.phone}</span>
                              </div>
                            )}
                            {businessName.email && (
                              <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4" />
                                <span>{businessName.email}</span>
                              </div>
                            )}
                            {businessName.gstNumber && (
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span>GST: {businessName.gstNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {!businessName.isDefault && (
                            <button
                              onClick={() => handleSetDefault(businessName)}
                              className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                              title="Set as default"
                            >
                              <StarOff className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(businessName)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ isOpen: true, businessName })}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive Business Names */}
            {showInactive && inactiveBusinessNames.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Inactive Business Names</h2>
                <div className="grid gap-4">
                  {inactiveBusinessNames.map((businessName) => (
                    <div
                      key={businessName.id}
                      className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-6 opacity-75"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Building className="h-5 w-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-600">
                              {businessName.name}
                            </h3>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                              Inactive
                            </span>
                          </div>
                          
                          {businessName.description && (
                            <p className="text-gray-500 mb-3">{businessName.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(businessName)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {activeBusinessNames.length === 0 && (
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No business names yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first business name to streamline quotation creation
                </p>
                <button
                  onClick={() => {
                    setEditingBusinessName(undefined)
                    setShowForm(true)
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Business Name
                </button>
              </div>
            )}
          </div>
        )}

        {/* Business Name Form Modal */}
        <BusinessNameForm
          businessName={editingBusinessName}
          isOpen={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingBusinessName(undefined)
          }}
          onSave={handleSave}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteConfirm.isOpen}
          title="Delete Business Name"
          message={`Are you sure you want to delete "${deleteConfirm.businessName?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onClose={() => setDeleteConfirm({ isOpen: false, businessName: null })}
          onConfirm={() => deleteConfirm.businessName ? handleDelete(deleteConfirm.businessName) : Promise.resolve()}
          onCancel={() => setDeleteConfirm({ isOpen: false, businessName: null })}
          type="danger"
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </Layout>
  )
}
