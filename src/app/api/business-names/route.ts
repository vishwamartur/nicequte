import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/business-names - Get all business names
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const businessNames = await prisma.businessName.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [
        { isDefault: 'desc' }, // Default business name first
        { name: 'asc' }
      ]
    })

    return NextResponse.json(businessNames)
  } catch (error) {
    console.error('Error fetching business names:', error)
    return NextResponse.json(
      { error: 'Failed to fetch business names' },
      { status: 500 }
    )
  }
}

// POST /api/business-names - Create a new business name
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      address,
      phone,
      email,
      gstNumber,
      isDefault
    } = body

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      )
    }

    // Check if business name already exists
    const existingBusinessName = await prisma.businessName.findUnique({
      where: { name: name.trim() }
    })

    if (existingBusinessName) {
      return NextResponse.json(
        { error: 'Business name already exists' },
        { status: 400 }
      )
    }

    // If this is set as default, unset all other defaults
    if (isDefault) {
      await prisma.businessName.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      })
    }

    const businessName = await prisma.businessName.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        address: address?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        gstNumber: gstNumber?.trim() || null,
        isDefault: Boolean(isDefault),
        isActive: true
      }
    })

    return NextResponse.json(businessName, { status: 201 })
  } catch (error) {
    console.error('Error creating business name:', error)
    return NextResponse.json(
      { error: 'Failed to create business name' },
      { status: 500 }
    )
  }
}

// PUT /api/business-names - Update default business name
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { defaultBusinessNameId } = body

    if (!defaultBusinessNameId) {
      return NextResponse.json(
        { error: 'Business name ID is required' },
        { status: 400 }
      )
    }

    // Check if business name exists
    const businessName = await prisma.businessName.findUnique({
      where: { id: defaultBusinessNameId }
    })

    if (!businessName) {
      return NextResponse.json(
        { error: 'Business name not found' },
        { status: 404 }
      )
    }

    // Unset all defaults first
    await prisma.businessName.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    })

    // Set the new default
    const updatedBusinessName = await prisma.businessName.update({
      where: { id: defaultBusinessNameId },
      data: { isDefault: true }
    })

    return NextResponse.json(updatedBusinessName)
  } catch (error) {
    console.error('Error updating default business name:', error)
    return NextResponse.json(
      { error: 'Failed to update default business name' },
      { status: 500 }
    )
  }
}
