import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const quotation = await prisma.quotation.findUnique({
      where: { id },
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

    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('Error fetching quotation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotation' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customerInfo, items, subtotal, gstAmount, gstRate, totalAmount, title, description, notes, validUntil } = body

    // Validate required fields
    if (!customerInfo?.name || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer name and at least one item are required' },
        { status: 400 }
      )
    }

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true }
    })

    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update or create customer
      let customer = await tx.customer.findFirst({
        where: {
          name: customerInfo.name,
          email: customerInfo.email || null
        }
      })

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            name: customerInfo.name,
            email: customerInfo.email || null,
            phone: customerInfo.phone || null,
            address: customerInfo.address || null,
            gstNumber: customerInfo.gstNumber || null,
          }
        })
      } else {
        // Update existing customer
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            name: customerInfo.name,
            email: customerInfo.email || null,
            phone: customerInfo.phone || null,
            address: customerInfo.address || null,
            gstNumber: customerInfo.gstNumber || null,
          }
        })
      }

      // Delete existing quotation items
      await tx.quotationItem.deleteMany({
        where: { quotationId: id }
      })

      // Create new quotation items
      const quotationItems = await Promise.all(
        items.map(async (item: any) => {
          return tx.quotationItem.create({
            data: {
              quotationId: id,
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              description: item.description || null,
            }
          })
        })
      )

      // Update quotation
      const updatedQuotation = await tx.quotation.update({
        where: { id },
        data: {
          customerId: customer.id,
          title: title || null,
          description: description || null,
          subtotal,
          gstAmount,
          gstRate,
          totalAmount,
          notes: notes || null,
          validUntil: validUntil ? new Date(validUntil) : null,
          updatedAt: new Date(),
        },
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

      return updatedQuotation
    })

    return NextResponse.json({
      message: 'Quotation updated successfully',
      quotation: result
    })
  } catch (error) {
    console.error('Error updating quotation:', error)
    return NextResponse.json(
      { error: 'Failed to update quotation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const quotation = await prisma.quotation.findUnique({
      where: { id }
    })

    if (!quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    await prisma.quotation.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Quotation deleted successfully' })
  } catch (error) {
    console.error('Error deleting quotation:', error)
    return NextResponse.json(
      { error: 'Failed to delete quotation' },
      { status: 500 }
    )
  }
}
