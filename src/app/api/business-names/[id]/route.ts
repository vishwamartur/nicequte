import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/business-names/[id] - Get a specific business name
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const businessName = await prisma.businessName.findUnique({
      where: { id }
    })

    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(businessName)
  } catch (error) {
    console.error('Error fetching business name:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business name' },
      { status: 500 }
    )
  }
}

// PUT /api/business-names/[id] - Update a business name
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      name,
      description,
      address,
      phone,
      email,
      gstNumber,
      isDefault,
      isActive
    } = body

    // Check if business name exists
    const existingBusinessName = await prisma.businessName.findUnique({
      where: { id }
    })

    if (!existingBusinessName) {
      return NextResponse.json(
        { error: 'Business name not found' },
        { status: 404 }
      )
    }

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      )
    }

    // Check if another business name with the same name exists
    if (name.trim() !== existingBusinessName.name) {
      const duplicateBusinessName = await prisma.businessName.findUnique({
        where: { name: name.trim() }
      })

      if (duplicateBusinessName) {
        return NextResponse.json(
          { error: 'Business name already exists' },
          { status: 400 }
        )
      }
    }

    // If this is set as default, unset all other defaults
    if (isDefault && !existingBusinessName.isDefault) {
      await prisma.businessName.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    const updatedBusinessName = await prisma.businessName.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
        isDefault: Boolean(isDefault),
        isActive: isActive !== undefined ? Boolean(isActive) : existingBusinessName.isActive
      }
    })

    return NextResponse.json(updatedBusinessName)
  } catch (error) {
    console.error('Error updating business name:', error)
    return NextResponse.json(
      { error: 'Failed to update business name' },
      { status: 500 }
    )
  }
}

// DELETE /api/business-names/[id] - Delete a business name
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if business name exists
    const businessName = await prisma.businessName.findUnique({
      where: { id },
      include: {
        _count: {
          select: { quotations: true }
        }
      }
    })

    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name not found' },
        { status: 404 }
      )
    }

    // Check if business name is used in quotations
    if (businessName._count.quotations > 0) {
      // Soft delete - mark as inactive instead of deleting
      const updatedBusinessName = await prisma.businessName.update({
        where: { id },
        data: { 
          isActive: false,
          isDefault: false // Remove default status when deactivating
        }
      })

      return NextResponse.json({
        message: 'Business name deactivated (used in existing quotations)',
        businessName: updatedBusinessName
      })
    }

    // Hard delete if not used in quotations
    await prisma.businessName.delete({
      where: { id }
    })

    return NextResponse.json({
      message: 'Business name deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting business name:', error)
    return NextResponse.json(
      { error: 'Failed to delete business name' },
      { status: 500 }
    )
  }
}
