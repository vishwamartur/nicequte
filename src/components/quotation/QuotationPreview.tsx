'use client'

import { formatCurrency, formatDate, calculateGSTBreakdown } from '@/lib/utils'
import { Download, Printer } from 'lucide-react'

interface QuotationItem {
  id: string
  product: {
    name: string
    description: string | null
    unit: string
    category: {
      name: string
    }
  }
  quantity: number
  unitPrice: number
  lineTotal: number
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
  gstNumber: string
}

interface QuotationPreviewProps {
  quotationNumber: string
  customerInfo: CustomerInfo
  items: QuotationItem[]
  subtotal: number
  gstRate: number
  gstAmount: number
  totalAmount: number
  title?: string
  description?: string
  notes?: string
  onDownloadPDF?: () => void
  onPrint?: () => void
}

export default function QuotationPreview({
  quotationNumber,
  customerInfo,
  items,
  subtotal,
  gstRate,
  gstAmount,
  totalAmount,
  title,
  description,
  notes,
  onDownloadPDF,
  onPrint
}: QuotationPreviewProps) {
  const currentDate = new Date()
  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + 30) // Valid for 30 days

  const gstBreakdown = calculateGSTBreakdown(subtotal, gstRate)

  const companyInfo = {
    name: 'Professional Services Ltd.',
    address: '123 Business Street, City, State 12345',
    phone: '+91 98765 43210',
    email: 'info@professionalservices.com',
    gstNumber: '29ABCDE1234F1Z5'
  }

  return (
    <div className="bg-white">
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mb-6 print:hidden">
        <button
          onClick={onPrint}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <Printer className="h-4 w-4" />
          <span>Print</span>
        </button>
        <button
          onClick={onDownloadPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Download PDF</span>
        </button>
      </div>

      {/* Quotation Document */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none" id="quotation-preview">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 print-header">
            <div className="company-info">
              {/* Company Logo Placeholder */}
              <div className="mb-4">
                <div className="w-32 h-16 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center company-logo print:border-solid print:border-gray-400">
                  <span className="text-xs text-gray-500 print:text-gray-700">Company Logo</span>
                </div>
              </div>
              <h2 className="text-xl font-bold text-blue-600 mb-2 print:text-black">{companyInfo.name}</h2>
              <div className="text-sm text-gray-600 space-y-1 print:text-black">
                <p>{companyInfo.address}</p>
                <p>Phone: {companyInfo.phone}</p>
                <p>Email: {companyInfo.email}</p>
                <p>GST No: {companyInfo.gstNumber}</p>
                <p>Website: www.invgen.com</p>
              </div>
            </div>
            <div className="text-right quotation-details">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 quotation-number print:text-black">QUOTATION</h1>
              <p className="text-lg text-gray-600 mb-4 print:text-black">#{quotationNumber}</p>
              <div className="text-sm text-gray-600 space-y-1 print:text-black">
                <p><span className="font-medium info-label">Date:</span> {formatDate(currentDate)}</p>
                <p><span className="font-medium info-label">Valid Until:</span> {formatDate(validUntil)}</p>
                <div className="mt-3">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 status-badge print:bg-gray-100 print:text-gray-800 print:border">
                    DRAFT
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quotation Info */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p className="font-medium">{customerInfo.name}</p>
                {customerInfo.address && <p>{customerInfo.address}</p>}
                {customerInfo.phone && <p>Phone: {customerInfo.phone}</p>}
                {customerInfo.email && <p>Email: {customerInfo.email}</p>}
                {customerInfo.gstNumber && <p>GST No: {customerInfo.gstNumber}</p>}
              </div>
            </div>
            <div>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formatDate(currentDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valid Until:</span>
                  <span className="font-medium">{formatDate(validUntil)}</span>
                </div>
                {title && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subject:</span>
                    <span className="font-medium">{title}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {description && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Description:</h3>
              <p className="text-gray-700">{description}</p>
            </div>
          )}

          {/* Items Table */}
          <div className="mb-8 avoid-break">
            <table className="w-full border-collapse border border-gray-300 items-table">
              <thead>
                <tr className="bg-gray-50 print:bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 print:text-black">
                    #
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold text-gray-900 print:text-black">
                    Description
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900 print:text-black">
                    Qty
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-900 print:text-black">
                    Unit
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900 print:text-black">
                    Rate
                  </th>
                  <th className="border border-gray-300 px-4 py-3 text-right text-sm font-semibold text-gray-900 print:text-black">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="avoid-break">
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 print:text-black">
                      {index + 1}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 print:text-black">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-gray-600 text-xs print:text-gray-700">{item.product.category.name}</p>
                        {item.product.description && (
                          <p className="text-gray-500 text-xs mt-1 print:text-gray-600">{item.product.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 text-center print:text-black">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 text-center print:text-black">
                      {item.product.unit}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 text-right print:text-black">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-sm text-gray-900 text-right font-medium print:text-black">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-8 total-section">
            <div className="w-80">
              <div className="space-y-2">
                <div className="flex justify-between py-2 total-row">
                  <span className="text-gray-600 print:text-black">Subtotal:</span>
                  <span className="font-medium print:text-black">{formatCurrency(subtotal)}</span>
                </div>

                {/* GST Breakdown */}
                <div className="flex justify-between py-2 total-row">
                  <span className="text-gray-600 print:text-black">CGST ({gstBreakdown.cgst.rate}%):</span>
                  <span className="font-medium print:text-black">{formatCurrency(gstBreakdown.cgst.amount)}</span>
                </div>
                <div className="flex justify-between py-2 total-row">
                  <span className="text-gray-600 print:text-black">SGST ({gstBreakdown.sgst.rate}%):</span>
                  <span className="font-medium print:text-black">{formatCurrency(gstBreakdown.sgst.amount)}</span>
                </div>

                <div className="border-t border-gray-300 pt-2 print:border-black">
                  <div className="flex justify-between py-2 text-lg font-bold total-row final">
                    <span className="print:text-black">Total Amount:</span>
                    <span className="text-blue-600 print:text-black">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="mb-8 notes-section">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 print:text-black">Terms & Conditions:</h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap print:text-black">{notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-300 pt-6 print-footer print:border-black">
            <div className="text-center text-sm text-gray-600 print:text-black">
              <p>Thank you for your business!</p>
              <p className="mt-2">This quotation is valid for 30 days from the date of issue.</p>
              <div className="mt-4 print-only hidden print:block">
                <p>Generated on {formatDate(new Date())} by InvGen Quotation Generator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
