'use client'

import { useState } from 'react'
import Layout from '@/components/layout/Layout'
import { Database, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{
    needsSeeding: boolean
    message: string
  } | null>(null)
  const [result, setResult] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const checkStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/seed/status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error checking status:', error)
      setResult({ type: 'error', message: 'Failed to check database status' })
    } finally {
      setLoading(false)
    }
  }

  const forceSeed = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/seed', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        setResult({ type: 'success', message: data.message })
        // Refresh status
        await checkStatus()
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to seed database' })
      }
    } catch (error) {
      console.error('Error seeding:', error)
      setResult({ type: 'error', message: 'Failed to seed database' })
    } finally {
      setLoading(false)
    }
  }

  const autoSeed = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/seed/auto', { method: 'POST' })
      const data = await response.json()
      
      if (response.ok) {
        setResult({ 
          type: 'success', 
          message: data.seeded ? data.message : 'Database already seeded' 
        })
        // Refresh status
        await checkStatus()
      } else {
        setResult({ type: 'error', message: data.error || 'Failed to auto-seed database' })
      }
    } catch (error) {
      console.error('Error auto-seeding:', error)
      setResult({ type: 'error', message: 'Failed to auto-seed database' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">
            Development tools for database management
          </p>
        </div>

        {/* Database Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Database Status</h2>
            <button
              onClick={checkStatus}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Check Status</span>
            </button>
          </div>

          {status && (
            <div className={`p-4 rounded-lg ${status.needsSeeding ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center space-x-2">
                {status.needsSeeding ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
                <span className={status.needsSeeding ? 'text-yellow-800' : 'text-green-800'}>
                  {status.message}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Seeding Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Seeding</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Auto Seed (Recommended)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Automatically seeds the database only if it's empty. Safe to run multiple times.
              </p>
              <button
                onClick={autoSeed}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Database className="h-4 w-4" />
                <span>Auto Seed</span>
              </button>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Force Seed</h3>
              <p className="text-sm text-gray-600 mb-4">
                Forces seeding regardless of existing data. Use with caution in development.
              </p>
              <button
                onClick={forceSeed}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <AlertTriangle className="h-4 w-4" />
                <span>Force Seed</span>
              </button>
            </div>
          </div>
        </div>

        {/* Result Display */}
        {result && (
          <div className={`p-4 rounded-lg ${result.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center space-x-2">
              {result.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span className={result.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {result.message}
              </span>
            </div>
          </div>
        )}

        {/* Development Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">Development Tool</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This admin panel is for development purposes only. In production, database seeding should be handled automatically or through deployment scripts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
