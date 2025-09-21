'use client'

import Layout from '@/components/layout/Layout'
import Link from 'next/link'
import {
  FileText,
  Package,
  Calculator,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react'
import { useState, useEffect } from 'react'

interface DashboardStats {
  totalQuotations: number
  totalProducts: number
  monthlyRevenue: number
  pendingQuotations: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotations: 0,
    totalProducts: 0,
    monthlyRevenue: 0,
    pendingQuotations: 0
  })
  const [isSeeded, setIsSeeded] = useState(false)

  const seedDatabase = async () => {
    try {
      const response = await fetch('/api/seed', { method: 'POST' })
      if (response.ok) {
        setIsSeeded(true)
        // Refresh stats after seeding
        loadStats()
      }
    } catch (error) {
      console.error('Error seeding database:', error)
    }
  }

  const loadStats = async () => {
    try {
      // Load products count
      const productsResponse = await fetch('/api/products?limit=1')
      const productsData = await productsResponse.json()

      setStats(prev => ({
        ...prev,
        totalProducts: productsData.pagination?.total || 0
      }))
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const quickActions = [
    {
      name: 'Create New Quotation',
      description: 'Generate a professional quotation',
      href: '/quotations/new',
      icon: FileText,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Browse Products',
      description: 'View plumbing & electrical materials',
      href: '/products',
      icon: Package,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'View Quotations',
      description: 'Manage existing quotations',
      href: '/quotations',
      icon: Calculator,
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ]

  const statCards = [
    {
      name: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      name: 'Total Quotations',
      value: stats.totalQuotations,
      icon: FileText,
      color: 'text-green-600 bg-green-100'
    },
    {
      name: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-purple-600 bg-purple-100'
    },
    {
      name: 'Pending Quotations',
      value: stats.pendingQuotations,
      icon: TrendingUp,
      color: 'text-orange-600 bg-orange-100'
    }
  ]

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome to InvGen - Professional Quotation Generator
          </p>
        </div>

        {/* Seed Database Button */}
        {!isSeeded && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Initialize Sample Data
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Click to populate the database with sample products and categories.
                </p>
              </div>
              <button
                onClick={seedDatabase}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors"
              >
                Seed Database
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.name}
                  href={action.href}
                  className="group bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg text-white ${action.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {action.name}
                      </h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Initialize Sample Data</h3>
                <p className="text-sm text-gray-600">
                  Click the &quot;Seed Database&quot; button above to populate your catalog with sample plumbing and electrical products.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Browse Products</h3>
                <p className="text-sm text-gray-600">
                  Explore the product catalog to see available plumbing and electrical materials with their specifications and prices.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Create Your First Quotation</h3>
                <p className="text-sm text-gray-600">
                  Use the &quot;Create New Quotation&quot; action to generate your first professional quotation with automatic GST calculations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
