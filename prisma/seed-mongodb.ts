import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting MongoDB database seeding...')

  // Create default company
  let company = await prisma.company.findFirst({
    where: { name: 'InvGen Solutions' }
  })

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'InvGen Solutions',
        address: '123 Business Street, Tech City, State 12345, India',
        phone: '+91 98765 43210',
        email: 'info@invgen.com',
        gstNumber: '29INVGEN1234F1Z5',
        gstRate: 18.0,
      },
    })
  }
  console.log('✅ Created company:', company.name)

  // Create categories
  let plumbingCategory = await prisma.category.findFirst({
    where: { name: 'Plumbing Materials' }
  })

  if (!plumbingCategory) {
    plumbingCategory = await prisma.category.create({
      data: {
        name: 'Plumbing Materials',
        description: 'Pipes, fittings, fixtures, and plumbing accessories',
        type: 'PLUMBING',
      },
    })
  }

  let electricalCategory = await prisma.category.findFirst({
    where: { name: 'Electrical Materials' }
  })

  if (!electricalCategory) {
    electricalCategory = await prisma.category.create({
      data: {
        name: 'Electrical Materials',
        description: 'Wires, switches, fixtures, and electrical components',
        type: 'ELECTRICAL',
      },
    })
  }
  console.log('✅ Created categories:', plumbingCategory.name, electricalCategory.name)

  // Create plumbing products
  const plumbingProducts = [
    {
      name: 'PVC Pipe 4 inch',
      description: 'High-quality PVC pipe for drainage and sewage systems',
      unitPrice: 250.0,
      unit: 'meter',
      sku: 'PVC-4IN-001',
      specifications: JSON.stringify({
        diameter: '4 inches',
        material: 'PVC',
        pressure_rating: '6 kg/cm²',
        length: '6 meters',
        color: 'White'
      }),
    },
    {
      name: 'PVC Pipe 2 inch',
      description: 'Standard PVC pipe for water supply and drainage',
      unitPrice: 150.0,
      unit: 'meter',
      sku: 'PVC-2IN-001',
      specifications: JSON.stringify({
        diameter: '2 inches',
        material: 'PVC',
        pressure_rating: '10 kg/cm²',
        length: '6 meters',
        color: 'White'
      }),
    },
    {
      name: 'PVC Elbow 90°',
      description: '90-degree elbow fitting for PVC pipes',
      unitPrice: 25.0,
      unit: 'piece',
      sku: 'PVC-ELB-90',
      specifications: JSON.stringify({
        angle: '90 degrees',
        material: 'PVC',
        sizes: ['1/2", 3/4", 1", 2", 4"'],
        color: 'White'
      }),
    },
    {
      name: 'Water Tap - Premium',
      description: 'Premium quality brass water tap with chrome finish',
      unitPrice: 850.0,
      unit: 'piece',
      sku: 'TAP-PREM-001',
      specifications: JSON.stringify({
        material: 'Brass',
        finish: 'Chrome',
        type: 'Single handle',
        warranty: '2 years'
      }),
    },
    {
      name: 'Toilet Seat - Standard',
      description: 'Standard plastic toilet seat with soft-close mechanism',
      unitPrice: 1200.0,
      unit: 'piece',
      sku: 'TOILET-STD-001',
      specifications: JSON.stringify({
        material: 'Plastic',
        color: 'White',
        features: ['Soft-close', 'Quick-release'],
        warranty: '1 year'
      }),
    }
  ]

  for (const product of plumbingProducts) {
    const existingProduct = await prisma.product.findUnique({
      where: { sku: product.sku }
    })

    if (!existingProduct) {
      await prisma.product.create({
        data: {
          ...product,
          categoryId: plumbingCategory.id,
        },
      })
    }
  }
  console.log('✅ Created plumbing products')

  // Create electrical products
  const electricalProducts = [
    {
      name: 'Copper Wire 2.5mm²',
      description: 'High-grade copper wire for electrical installations',
      unitPrice: 180.0,
      unit: 'meter',
      sku: 'WIRE-CU-2.5',
      specifications: JSON.stringify({
        conductor: 'Copper',
        size: '2.5mm²',
        insulation: 'PVC',
        voltage_rating: '1100V',
        color: 'Red/Black/Blue'
      }),
    },
    {
      name: 'MCB 16A Single Pole',
      description: 'Miniature Circuit Breaker for electrical protection',
      unitPrice: 320.0,
      unit: 'piece',
      sku: 'MCB-16A-SP',
      specifications: JSON.stringify({
        current_rating: '16A',
        poles: 'Single',
        breaking_capacity: '6kA',
        standard: 'IS 8828'
      }),
    },
    {
      name: 'LED Bulb 9W',
      description: 'Energy-efficient LED bulb with warm white light',
      unitPrice: 150.0,
      unit: 'piece',
      sku: 'LED-9W-WW',
      specifications: JSON.stringify({
        wattage: '9W',
        lumens: '900lm',
        color_temperature: '3000K',
        base: 'B22',
        lifespan: '25000 hours'
      }),
    },
    {
      name: 'Switch Socket 5A',
      description: '5A switch socket with indicator',
      unitPrice: 85.0,
      unit: 'piece',
      sku: 'SWITCH-5A-001',
      specifications: JSON.stringify({
        current_rating: '5A',
        voltage: '240V',
        features: ['Indicator light', 'Child safety'],
        color: 'White'
      }),
    },
    {
      name: 'Ceiling Fan 48 inch',
      description: 'High-speed ceiling fan with decorative design',
      unitPrice: 2500.0,
      unit: 'piece',
      sku: 'FAN-48IN-001',
      specifications: JSON.stringify({
        sweep: '48 inches',
        speed: '350 RPM',
        power: '75W',
        material: 'Metal',
        warranty: '2 years'
      }),
    }
  ]

  for (const product of electricalProducts) {
    const existingProduct = await prisma.product.findUnique({
      where: { sku: product.sku }
    })

    if (!existingProduct) {
      await prisma.product.create({
        data: {
          ...product,
          categoryId: electricalCategory.id,
        },
      })
    }
  }
  console.log('✅ Created electrical products')

  // Create sample customer
  let customer = await prisma.customer.findFirst({
    where: { name: 'ABC Construction Ltd.' }
  })

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: 'ABC Construction Ltd.',
        email: 'contact@abcconstruction.com',
        phone: '+91 87654 32109',
        address: '456 Construction Avenue, Builder City, State 54321, India',
        gstNumber: '29ABCCON1234F1Z5',
      },
    })
  }
  console.log('✅ Created sample customer:', customer.name)

  // Create sample quotation
  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2024-001',
      customerId: customer.id,
      companyId: company.id,
      title: 'Plumbing and Electrical Materials for Office Building',
      description: 'Complete plumbing and electrical materials required for new office building construction',
      subtotal: 5000.0,
      gstAmount: 900.0,
      gstRate: 18.0,
      totalAmount: 5900.0,
      status: 'DRAFT',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: 'All materials are of premium quality and come with manufacturer warranty. Installation support available on request.',
    },
  })

  // Get some products for quotation items
  const pvcPipe = await prisma.product.findFirst({ where: { sku: 'PVC-4IN-001' } })
  const ledBulb = await prisma.product.findFirst({ where: { sku: 'LED-9W-WW' } })
  const mcb = await prisma.product.findFirst({ where: { sku: 'MCB-16A-SP' } })

  if (pvcPipe && ledBulb && mcb) {
    // Create quotation items
    await prisma.quotationItem.createMany({
      data: [
        {
          quotationId: quotation.id,
          productId: pvcPipe.id,
          quantity: 10,
          unitPrice: pvcPipe.unitPrice,
          lineTotal: 10 * pvcPipe.unitPrice,
          description: 'PVC pipes for main drainage system',
        },
        {
          quotationId: quotation.id,
          productId: ledBulb.id,
          quantity: 20,
          unitPrice: ledBulb.unitPrice,
          lineTotal: 20 * ledBulb.unitPrice,
          description: 'LED bulbs for office lighting',
        },
        {
          quotationId: quotation.id,
          productId: mcb.id,
          quantity: 5,
          unitPrice: mcb.unitPrice,
          lineTotal: 5 * mcb.unitPrice,
          description: 'Circuit breakers for electrical panel',
        },
      ],
    })
    console.log('✅ Created sample quotation with items')
  }

  console.log('🎉 MongoDB database seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
