import { prisma } from './prisma'
import { CategoryType } from '@prisma/client'

export async function checkIfDatabaseNeedsSeeding(): Promise<boolean> {
  try {
    // Check if we have any products, categories, or companies
    const [productCount, categoryCount, companyCount] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.company.count()
    ])

    // Database needs seeding if any of these are empty
    return productCount === 0 || categoryCount === 0 || companyCount === 0
  } catch (error) {
    console.error('Error checking database status:', error)
    // If we can't check, assume it needs seeding
    return true
  }
}

export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // Check if seeding is actually needed
    const needsSeeding = await checkIfDatabaseNeedsSeeding()
    if (!needsSeeding) {
      console.log('✅ Database already contains data, skipping seeding')
      return { success: true, message: 'Database already seeded' }
    }

    // Create default company
    const company = await prisma.company.upsert({
      where: { id: 'default-company' },
      update: {},
      create: {
        id: 'default-company',
        name: 'Professional Services Ltd.',
        address: '123 Business Street, City, State 12345',
        phone: '+91 98765 43210',
        email: 'info@professionalservices.com',
        gstNumber: '29ABCDE1234F1Z5',
        gstRate: 18.0,
      },
    })

    // Create default business names
    const businessNames = [
      {
        name: 'Professional Services Ltd.',
        description: 'Main business entity for professional plumbing and electrical services',
        address: '123 Business Street, City, State 12345',
        phone: '+91 98765 43210',
        email: 'info@professionalservices.com',
        gstNumber: '29ABCDE1234F1Z5',
        isDefault: true,
        isActive: true
      },
      {
        name: 'Elite Plumbing Solutions',
        description: 'Specialized plumbing services division',
        address: '456 Service Avenue, City, State 12346',
        phone: '+91 98765 43211',
        email: 'plumbing@elitesolutions.com',
        gstNumber: '29BCDEF2345G2A6',
        isDefault: false,
        isActive: true
      },
      {
        name: 'PowerTech Electrical',
        description: 'Professional electrical installation and maintenance',
        address: '789 Electric Lane, City, State 12347',
        phone: '+91 98765 43212',
        email: 'electrical@powertech.com',
        gstNumber: '29CDEFG3456H3B7',
        isDefault: false,
        isActive: true
      }
    ]

    for (const businessData of businessNames) {
      await prisma.businessName.upsert({
        where: { name: businessData.name },
        update: {},
        create: businessData
      })
    }

    // Create categories
    const plumbingCategory = await prisma.category.upsert({
      where: { name: 'Plumbing Materials' },
      update: {},
      create: {
        name: 'Plumbing Materials',
        description: 'Pipes, fittings, fixtures, and plumbing accessories',
        type: CategoryType.PLUMBING,
      },
    })

    const electricalCategory = await prisma.category.upsert({
      where: { name: 'Electrical Materials' },
      update: {},
      create: {
        name: 'Electrical Materials',
        description: 'Wires, switches, outlets, breakers, and electrical components',
        type: CategoryType.ELECTRICAL,
      },
    })

    // Plumbing products
    const plumbingProducts = [
      {
        name: 'PVC Pipe 4 inch',
        description: 'High-quality PVC pipe for drainage systems',
        specifications: JSON.stringify({
          diameter: '4 inch',
          material: 'PVC',
          pressure: '6 kg/cm²',
          length: '6 meters'
        }),
        unitPrice: 450.00,
        unit: 'piece',
        sku: 'PVC-4IN-6M',
        categoryId: plumbingCategory.id,
      },
      {
        name: 'PVC Pipe 2 inch',
        description: 'Standard PVC pipe for water supply',
        specifications: JSON.stringify({
          diameter: '2 inch',
          material: 'PVC',
          pressure: '10 kg/cm²',
          length: '6 meters'
        }),
        unitPrice: 280.00,
        unit: 'piece',
        sku: 'PVC-2IN-6M',
        categoryId: plumbingCategory.id,
      },
      {
        name: 'PVC Elbow 90°',
        description: '90-degree elbow fitting for PVC pipes',
        specifications: JSON.stringify({
          angle: '90 degrees',
          material: 'PVC',
          sizes: ['1/2 inch', '3/4 inch', '1 inch']
        }),
        unitPrice: 25.00,
        unit: 'piece',
        sku: 'PVC-ELB-90',
        categoryId: plumbingCategory.id,
      },
      {
        name: 'Water Tap - Chrome',
        description: 'Chrome-plated water tap with ceramic disc',
        specifications: JSON.stringify({
          material: 'Brass with chrome plating',
          type: 'Single lever',
          warranty: '5 years'
        }),
        unitPrice: 1250.00,
        unit: 'piece',
        sku: 'TAP-CHR-SL',
        categoryId: plumbingCategory.id,
      },
      {
        name: 'Toilet Seat - Standard',
        description: 'Standard toilet seat with soft-close mechanism',
        specifications: JSON.stringify({
          material: 'Plastic',
          color: 'White',
          features: ['Soft-close', 'Quick-release']
        }),
        unitPrice: 850.00,
        unit: 'piece',
        sku: 'TS-STD-WHT',
        categoryId: plumbingCategory.id,
      },
    ]

    // Electrical products
    const electricalProducts = [
      {
        name: 'Copper Wire 2.5mm²',
        description: 'Single core copper wire for electrical installations',
        specifications: JSON.stringify({
          core: 'Single',
          material: 'Copper',
          insulation: 'PVC',
          current: '20A'
        }),
        unitPrice: 85.00,
        unit: 'meter',
        sku: 'CU-WIRE-2.5',
        categoryId: electricalCategory.id,
      },
      {
        name: 'Copper Wire 4mm²',
        description: 'Single core copper wire for heavy-duty applications',
        specifications: JSON.stringify({
          core: 'Single',
          material: 'Copper',
          insulation: 'PVC',
          current: '32A'
        }),
        unitPrice: 125.00,
        unit: 'meter',
        sku: 'CU-WIRE-4',
        categoryId: electricalCategory.id,
      },
      {
        name: 'MCB 16A Single Pole',
        description: 'Miniature Circuit Breaker for overload protection',
        specifications: JSON.stringify({
          current: '16A',
          poles: '1',
          breaking_capacity: '6kA',
          standard: 'IS 13947'
        }),
        unitPrice: 180.00,
        unit: 'piece',
        sku: 'MCB-16A-1P',
        categoryId: electricalCategory.id,
      },
      {
        name: 'LED Bulb 9W',
        description: 'Energy-efficient LED bulb with warm white light',
        specifications: JSON.stringify({
          wattage: '9W',
          lumens: '900lm',
          color_temperature: '3000K',
          base: 'B22'
        }),
        unitPrice: 120.00,
        unit: 'piece',
        sku: 'LED-9W-WW',
        categoryId: electricalCategory.id,
      },
      {
        name: 'Switch Socket 5A',
        description: '5A switch socket with indicator',
        specifications: JSON.stringify({
          current: '5A',
          voltage: '240V',
          material: 'Polycarbonate',
          color: 'White'
        }),
        unitPrice: 95.00,
        unit: 'piece',
        sku: 'SW-SOC-5A',
        categoryId: electricalCategory.id,
      },
    ]

    // Insert products
    for (const product of [...plumbingProducts, ...electricalProducts]) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: product,
        create: product,
      })
    }

    console.log('🎉 Database seeded successfully!')
    console.log(`✅ Created ${plumbingProducts.length + electricalProducts.length} products`)
    console.log('✅ Created 2 categories (Plumbing & Electrical)')
    console.log('✅ Created 3 business names')
    console.log('✅ Created default company')

    return { success: true, message: 'Database seeded successfully with sample data!' }
  } catch (error) {
    console.error('Error seeding database:', error)
    return { success: false, error: error }
  }
}
