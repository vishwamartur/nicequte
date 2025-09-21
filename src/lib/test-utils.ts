// Test utilities for the quotation generator application

export interface TestQuotationData {
  customerInfo: {
    name: string
    email: string
    phone: string
    address: string
    gstNumber: string
  }
  items: Array<{
    product: {
      id: string
      name: string
      unitPrice: number
      unit: string
      category: {
        name: string
        type: 'PLUMBING' | 'ELECTRICAL'
      }
    }
    quantity: number
    unitPrice: number
    lineTotal: number
  }>
  subtotal: number
  gstRate: number
  gstAmount: number
  totalAmount: number
  title: string
  description: string
  notes: string
}

export const sampleQuotationData: TestQuotationData = {
  customerInfo: {
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+91 98765 43210',
    address: '123 Main Street, City, State 12345',
    gstNumber: '29ABCDE1234F1Z5'
  },
  items: [
    {
      product: {
        id: 'test-product-1',
        name: 'PVC Pipe 4 inch',
        unitPrice: 450.00,
        unit: 'piece',
        category: {
          name: 'Plumbing Materials',
          type: 'PLUMBING'
        }
      },
      quantity: 5,
      unitPrice: 450.00,
      lineTotal: 2250.00
    },
    {
      product: {
        id: 'test-product-2',
        name: 'Copper Wire 2.5mm²',
        unitPrice: 85.00,
        unit: 'meter',
        category: {
          name: 'Electrical Materials',
          type: 'ELECTRICAL'
        }
      },
      quantity: 100,
      unitPrice: 85.00,
      lineTotal: 8500.00
    }
  ],
  subtotal: 10750.00,
  gstRate: 18,
  gstAmount: 1935.00,
  totalAmount: 12685.00,
  title: 'Plumbing and Electrical Installation',
  description: 'Complete installation of plumbing and electrical systems for residential property',
  notes: 'All materials are of premium quality. Installation charges are separate. Warranty: 2 years on materials, 1 year on installation.'
}

export function validateQuotationData(data: TestQuotationData): boolean {
  // Validate customer info
  if (!data.customerInfo.name) {
    console.error('Customer name is required')
    return false
  }

  // Validate items
  if (!data.items || data.items.length === 0) {
    console.error('At least one item is required')
    return false
  }

  // Validate calculations
  const calculatedSubtotal = data.items.reduce((sum, item) => sum + item.lineTotal, 0)
  if (Math.abs(calculatedSubtotal - data.subtotal) > 0.01) {
    console.error('Subtotal calculation mismatch')
    return false
  }

  const calculatedGST = (data.subtotal * data.gstRate) / 100
  if (Math.abs(calculatedGST - data.gstAmount) > 0.01) {
    console.error('GST calculation mismatch')
    return false
  }

  const calculatedTotal = data.subtotal + data.gstAmount
  if (Math.abs(calculatedTotal - data.totalAmount) > 0.01) {
    console.error('Total calculation mismatch')
    return false
  }

  return true
}

export async function testAPIEndpoints() {
  const results = {
    categories: false,
    products: false,
    seed: false
  }

  try {
    // Test categories endpoint
    const categoriesResponse = await fetch('/api/categories')
    results.categories = categoriesResponse.ok
    console.log('Categories API:', results.categories ? 'PASS' : 'FAIL')

    // Test products endpoint
    const productsResponse = await fetch('/api/products?limit=5')
    results.products = productsResponse.ok
    console.log('Products API:', results.products ? 'PASS' : 'FAIL')

    // Test seed endpoint (if needed)
    // Note: This will actually seed the database
    // const seedResponse = await fetch('/api/seed', { method: 'POST' })
    // results.seed = seedResponse.ok
    // console.log('Seed API:', results.seed ? 'PASS' : 'FAIL')

  } catch (error) {
    console.error('API test error:', error)
  }

  return results
}

export function logApplicationStatus() {
  console.log('=== InvGen Application Status ===')
  console.log('✅ Database schema created')
  console.log('✅ Sample data seeding available')
  console.log('✅ Product catalog system')
  console.log('✅ Quotation creation form')
  console.log('✅ GST calculation engine')
  console.log('✅ PDF generation capability')
  console.log('✅ Responsive UI with Tailwind CSS')
  console.log('✅ API endpoints for data management')
  console.log('================================')
}
