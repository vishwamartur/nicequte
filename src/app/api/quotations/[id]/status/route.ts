import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: ' + validStatuses.join(', ') },
        { status: 400 }
      )
    }

    // Check if quotation exists
    const existingQuotation = await prisma.quotation.findUnique({
      where: { id: params.id }
    })

    if (!existingQuotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      )
    }

    // Update quotation status
    const updatedQuotation = await prisma.quotation.update({
      where: { id: params.id },
      data: { 
        status,
        updatedAt: new Date()
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

    return NextResponse.json({
      message: 'Quotation status updated successfully',
      quotation: updatedQuotation
    })
  } catch (error) {
    console.error('Error updating quotation status:', error)
    return NextResponse.json(
      { error: 'Failed to update quotation status' },
      { status: 500 }
    )
  }
}
