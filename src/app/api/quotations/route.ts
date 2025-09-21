import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateQuotationNumber } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const skip = (page - 1) * limit

    const where: any = {}

    // Search functionality
    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
      ]
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        const endDate = new Date(dateTo)
        endDate.setHours(23, 59, 59, 999) // End of day
        where.createdAt.lte = endDate
      }
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      where.totalAmount = {}
      if (minAmount) {
        where.totalAmount.gte = parseFloat(minAmount)
      }
      if (maxAmount) {
        where.totalAmount.lte = parseFloat(maxAmount)
      }
    }

    // Sorting configuration
    const orderBy: any = {}
    switch (sortBy) {
      case 'quotationNumber':
        orderBy.quotationNumber = sortOrder
        break
      case 'customerName':
        orderBy.customer = { name: sortOrder }
        break
      case 'totalAmount':
        orderBy.totalAmount = sortOrder
        break
      case 'status':
        orderBy.status = sortOrder
        break
      case 'validUntil':
        orderBy.validUntil = sortOrder
        break
      default:
        orderBy.createdAt = sortOrder
    }

    const [quotations, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
              gstNumber: true,
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              email: true,
              gstNumber: true,
            }
          },
          businessName: {
            select: {
              id: true,
              name: true,
              address: true,
              phone: true,
              email: true,
              gstNumber: true,
            }
          },
          _count: {
            select: { items: true }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.quotation.count({ where }),
    ])

    // Calculate summary statistics
    const statusCounts = await prisma.quotation.groupBy({
      by: ['status'],
      _count: { status: true },
      where: { ...where, status: undefined }, // Remove status filter for counts
    })

    const totalValue = await prisma.quotation.aggregate({
      _sum: { totalAmount: true },
      where,
    })

    return NextResponse.json({
      quotations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count.status
          return acc
        }, {} as Record<string, number>),
        totalValue: totalValue._sum.totalAmount || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching quotations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerInfo,
      businessNameId,
      items,
      subtotal,
      gstAmount,
      gstRate,
      totalAmount,
      title,
      description,
      notes,
      validUntil,
      saveCustomer,
      selectedCustomerId
    } = body

    if (!customerInfo?.name || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer name and items are required' },
        { status: 400 }
      )
    }

    // Get or create default company
    let company = await prisma.company.findFirst()
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Professional Services Ltd.',
          address: '123 Business Street, City, State 12345',
          phone: '+91 98765 43210',
          email: 'info@professionalservices.com',
          gstNumber: '29ABCDE1234F1Z5',
          gstRate: 18.0,
        }
      })
    }

    // Handle customer creation/selection
    let customer

    if (selectedCustomerId) {
      // Use existing selected customer
      customer = await prisma.customer.findUnique({
        where: { id: selectedCustomerId }
      })

      if (!customer) {
        return NextResponse.json(
          { error: 'Selected customer not found' },
          { status: 400 }
        )
      }
    } else {
      // Handle manual customer entry
      if (saveCustomer) {
        // Check if customer already exists
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            name: customerInfo.name,
            email: customerInfo.email || null
          }
        })

        if (existingCustomer) {
          // Update existing customer
          customer = await prisma.customer.update({
            where: { id: existingCustomer.id },
            data: {
              email: customerInfo.email || existingCustomer.email,
              phone: customerInfo.phone || existingCustomer.phone,
              address: customerInfo.address || existingCustomer.address,
              gstNumber: customerInfo.gstNumber || existingCustomer.gstNumber,
            }
          })
        } else {
          // Create new customer
          customer = await prisma.customer.create({
            data: {
              name: customerInfo.name,
              email: customerInfo.email || null,
              phone: customerInfo.phone || null,
              address: customerInfo.address || null,
              gstNumber: customerInfo.gstNumber || null,
            }
          })
        }
      } else {
        // Create temporary customer (one-time use)
        customer = await prisma.customer.create({
          data: {
            name: customerInfo.name,
            email: customerInfo.email || null,
            phone: customerInfo.phone || null,
            address: customerInfo.address || null,
            gstNumber: customerInfo.gstNumber || null,
          }
        })
      }
    }

    // Generate unique quotation number
    let quotationNumber = generateQuotationNumber()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.quotation.findUnique({
        where: { quotationNumber }
      })
      if (!existing) break
      quotationNumber = generateQuotationNumber()
      attempts++
    }

    // Create quotation
    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: customer.id,
        companyId: company.id,
        businessNameId: businessNameId || null,
        title: title || null,
        description: description || null,
        subtotal: parseFloat(subtotal.toString()),
        gstAmount: parseFloat(gstAmount.toString()),
        gstRate: parseFloat(gstRate.toString()),
        totalAmount: parseFloat(totalAmount.toString()),
        validUntil: validUntil ? new Date(validUntil) : null,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.isCustom ? null : item.product?.id,
            quantity: parseFloat(item.quantity.toString()),
            unitPrice: parseFloat(item.unitPrice.toString()),
            lineTotal: parseFloat(item.lineTotal.toString()),
            description: item.description || null,
            isCustom: item.isCustom || false,
            customName: item.isCustom ? item.customProduct?.name : null,
            customUnit: item.isCustom ? item.customProduct?.unit : null,
            customDescription: item.isCustom ? item.customProduct?.description : null,
          }))
        }
      },
      include: {
        customer: true,
        company: true,
        businessName: true,
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

    return NextResponse.json(quotation, { status: 201 })
  } catch (error) {
    console.error('Error creating quotation:', error)
    return NextResponse.json(
      { error: 'Failed to create quotation' },
      { status: 500 }
    )
  }
}
