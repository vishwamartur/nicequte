// Test script for CRUD operations

export interface TestProduct {
  name: string
  description: string
  specifications: any
  unitPrice: number
  unit: string
  sku: string
  categoryId: string
  isActive: boolean
}

export async function testProductCRUD() {
  console.log('🧪 Starting Product CRUD Tests...')
  
  try {
    // Get categories first
    const categoriesResponse = await fetch('/api/categories')
    const categories = await categoriesResponse.json()
    
    if (!categories || categories.length === 0) {
      throw new Error('No categories found. Please seed the database first.')
    }

    const testProduct: TestProduct = {
      name: 'Test Product - CRUD',
      description: 'This is a test product for CRUD operations',
      specifications: {
        material: 'Test Material',
        size: '10mm',
        color: 'Blue',
        warranty: '1 year'
      },
      unitPrice: 99.99,
      unit: 'piece',
      sku: 'TEST-CRUD-001',
      categoryId: categories[0].id,
      isActive: true
    }

    // Test 1: CREATE
    console.log('📝 Testing CREATE operation...')
    const createResponse = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProduct),
    })

    if (!createResponse.ok) {
      const error = await createResponse.json()
      throw new Error(`CREATE failed: ${error.error}`)
    }

    const createdProduct = await createResponse.json()
    console.log('✅ CREATE successful:', createdProduct.name)

    // Test 2: READ
    console.log('📖 Testing READ operation...')
    const readResponse = await fetch(`/api/products/${createdProduct.id}`)
    
    if (!readResponse.ok) {
      throw new Error('READ failed')
    }

    const readProduct = await readResponse.json()
    console.log('✅ READ successful:', readProduct.name)

    // Test 3: UPDATE
    console.log('✏️ Testing UPDATE operation...')
    const updatedData = {
      ...testProduct,
      name: 'Updated Test Product - CRUD',
      unitPrice: 149.99,
      description: 'This product has been updated via CRUD test'
    }

    const updateResponse = await fetch(`/api/products/${createdProduct.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedData),
    })

    if (!updateResponse.ok) {
      const error = await updateResponse.json()
      throw new Error(`UPDATE failed: ${error.error}`)
    }

    const updatedProduct = await updateResponse.json()
    console.log('✅ UPDATE successful:', updatedProduct.name)

    // Test 4: DELETE (Hard delete since no quotations use this product)
    console.log('🗑️ Testing DELETE operation...')
    const deleteResponse = await fetch(`/api/products/${createdProduct.id}`, {
      method: 'DELETE',
    })

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json()
      throw new Error(`DELETE failed: ${error.error}`)
    }

    const deleteResult = await deleteResponse.json()
    console.log('✅ DELETE successful:', deleteResult.message)

    // Test 5: Verify deletion
    console.log('🔍 Verifying deletion...')
    const verifyResponse = await fetch(`/api/products/${createdProduct.id}`)
    
    if (verifyResponse.ok) {
      throw new Error('Product still exists after deletion')
    }

    console.log('✅ Deletion verified - product no longer exists')

    console.log('🎉 All CRUD tests passed successfully!')
    return { success: true, message: 'All CRUD operations working correctly' }

  } catch (error) {
    console.error('❌ CRUD test failed:', error)
    return { success: false, error: error.message }
  }
}

export async function testValidation() {
  console.log('🧪 Starting Validation Tests...')
  
  try {
    // Test 1: Missing required fields
    console.log('📝 Testing validation for missing required fields...')
    const invalidProduct = {
      description: 'Product without name and price'
    }

    const response1 = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidProduct),
    })

    if (response1.ok) {
      throw new Error('Validation should have failed for missing required fields')
    }

    const error1 = await response1.json()
    console.log('✅ Validation correctly rejected missing fields:', error1.error)

    // Test 2: Invalid price
    console.log('📝 Testing validation for invalid price...')
    const invalidPriceProduct = {
      name: 'Test Product',
      unitPrice: -10,
      categoryId: 'some-id'
    }

    const response2 = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidPriceProduct),
    })

    if (response2.ok) {
      throw new Error('Validation should have failed for invalid price')
    }

    const error2 = await response2.json()
    console.log('✅ Validation correctly rejected invalid price:', error2.error)

    // Test 3: Invalid JSON specifications
    console.log('📝 Testing validation for invalid JSON specifications...')
    const categoriesResponse = await fetch('/api/categories')
    const categories = await categoriesResponse.json()

    const invalidSpecsProduct = {
      name: 'Test Product',
      unitPrice: 100,
      categoryId: categories[0]?.id,
      specifications: 'invalid json string'
    }

    const response3 = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidSpecsProduct),
    })

    if (response3.ok) {
      throw new Error('Validation should have failed for invalid JSON')
    }

    const error3 = await response3.json()
    console.log('✅ Validation correctly rejected invalid JSON:', error3.error)

    console.log('🎉 All validation tests passed!')
    return { success: true, message: 'All validation tests working correctly' }

  } catch (error) {
    console.error('❌ Validation test failed:', error)
    return { success: false, error: error.message }
  }
}

export async function runAllTests() {
  console.log('🚀 Starting comprehensive CRUD tests...')
  
  const crudResult = await testProductCRUD()
  const validationResult = await testValidation()
  
  const allPassed = crudResult.success && validationResult.success
  
  console.log('\n📊 Test Results Summary:')
  console.log('CRUD Operations:', crudResult.success ? '✅ PASSED' : '❌ FAILED')
  console.log('Validation Tests:', validationResult.success ? '✅ PASSED' : '❌ FAILED')
  console.log('Overall Result:', allPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED')
  
  return {
    success: allPassed,
    results: {
      crud: crudResult,
      validation: validationResult
    }
  }
}
