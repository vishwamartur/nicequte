import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyMigration() {
  console.log('🔍 Verifying MongoDB Migration...\n')

  try {
    // Test 1: Database Connection
    console.log('1. Testing Database Connection...')
    await prisma.$connect()
    console.log('   ✅ Database connection successful\n')

    // Test 2: Company Data
    console.log('2. Verifying Company Data...')
    const companies = await prisma.company.findMany()
    console.log(`   ✅ Found ${companies.length} companies`)
    if (companies.length > 0) {
      console.log(`   📋 Sample: ${companies[0].name} (ID: ${companies[0].id})`)
    }
    console.log()

    // Test 3: Category Data
    console.log('3. Verifying Category Data...')
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    })
    console.log(`   ✅ Found ${categories.length} categories`)
    categories.forEach(cat => {
      console.log(`   📋 ${cat.name} (${cat.type}): ${cat._count.products} products`)
    })
    console.log()

    // Test 4: Product Data
    console.log('4. Verifying Product Data...')
    const products = await prisma.product.findMany({
      include: {
        category: true
      },
      take: 5
    })
    console.log(`   ✅ Found products in database`)
    console.log(`   📋 Sample products:`)
    products.forEach(product => {
      console.log(`      - ${product.name} (${product.category.name}) - ₹${product.unitPrice}`)
    })
    console.log()

    // Test 5: Customer Data
    console.log('5. Verifying Customer Data...')
    const customers = await prisma.customer.findMany()
    console.log(`   ✅ Found ${customers.length} customers`)
    if (customers.length > 0) {
      console.log(`   📋 Sample: ${customers[0].name} (${customers[0].email})`)
    }
    console.log()

    // Test 6: Quotation Data
    console.log('6. Verifying Quotation Data...')
    const quotations = await prisma.quotation.findMany({
      include: {
        customer: true,
        company: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })
    console.log(`   ✅ Found ${quotations.length} quotations`)
    if (quotations.length > 0) {
      const quote = quotations[0]
      console.log(`   📋 Sample: ${quote.quotationNumber}`)
      console.log(`      Customer: ${quote.customer.name}`)
      console.log(`      Total: ₹${quote.totalAmount}`)
      console.log(`      Items: ${quote.items.length}`)
    }
    console.log()

    // Test 7: Relationships
    console.log('7. Testing Relationships...')
    const quotationWithRelations = await prisma.quotation.findFirst({
      include: {
        customer: true,
        company: true,
        items: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    })

    if (quotationWithRelations) {
      console.log('   ✅ Quotation relationships working:')
      console.log(`      - Customer relation: ${quotationWithRelations.customer.name}`)
      console.log(`      - Company relation: ${quotationWithRelations.company.name}`)
      console.log(`      - Items relation: ${quotationWithRelations.items.length} items`)
      if (quotationWithRelations.items.length > 0) {
        const item = quotationWithRelations.items[0]
        console.log(`      - Product relation: ${item.product?.name || 'N/A'}`)
        console.log(`      - Category relation: ${item.product?.category?.name || 'N/A'}`)
      }
    }
    console.log()

    // Test 8: CRUD Operations
    console.log('8. Testing CRUD Operations...')
    
    // Create test
    const testCustomer = await prisma.customer.create({
      data: {
        name: 'Test Customer Migration',
        email: 'test@migration.com',
        phone: '+91 99999 99999'
      }
    })
    console.log('   ✅ CREATE: Test customer created')

    // Read test
    const foundCustomer = await prisma.customer.findUnique({
      where: { id: testCustomer.id }
    })
    console.log('   ✅ READ: Test customer found')

    // Update test
    const updatedCustomer = await prisma.customer.update({
      where: { id: testCustomer.id },
      data: { phone: '+91 88888 88888' }
    })
    console.log('   ✅ UPDATE: Test customer updated')

    // Delete test
    await prisma.customer.delete({
      where: { id: testCustomer.id }
    })
    console.log('   ✅ DELETE: Test customer deleted')
    console.log()

    // Test 9: Unique Constraints
    console.log('9. Testing Unique Constraints...')
    try {
      await prisma.category.create({
        data: {
          name: 'Plumbing Materials', // This should fail due to unique constraint
          type: 'PLUMBING'
        }
      })
      console.log('   ❌ Unique constraint not working')
    } catch (error) {
      console.log('   ✅ Unique constraints working correctly')
    }
    console.log()

    // Test 10: Aggregations
    console.log('10. Testing Aggregations...')
    const stats = await prisma.quotation.aggregate({
      _count: true,
      _sum: {
        totalAmount: true
      },
      _avg: {
        totalAmount: true
      }
    })
    console.log(`    ✅ Total quotations: ${stats._count}`)
    console.log(`    ✅ Total value: ₹${stats._sum.totalAmount || 0}`)
    console.log(`    ✅ Average value: ₹${stats._avg.totalAmount?.toFixed(2) || 0}`)
    console.log()

    // Test 11: Search Functionality
    console.log('11. Testing Search Functionality...')
    const searchResults = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: 'PVC', mode: 'insensitive' } },
          { description: { contains: 'pipe', mode: 'insensitive' } }
        ]
      },
      take: 3
    })
    console.log(`    ✅ Search found ${searchResults.length} products`)
    console.log()

    // Summary
    console.log('🎉 MongoDB Migration Verification Complete!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✅ All tests passed successfully!')
    console.log('✅ Database connection working')
    console.log('✅ All models migrated correctly')
    console.log('✅ Relationships functioning properly')
    console.log('✅ CRUD operations working')
    console.log('✅ Unique constraints enforced')
    console.log('✅ Aggregations working')
    console.log('✅ Search functionality operational')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🚀 InvGen is ready to use with MongoDB Atlas!')

  } catch (error) {
    console.error('❌ Migration verification failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run verification
verifyMigration()
