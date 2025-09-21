import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
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
    const {
      name,
      description,
      specifications,
      unitPrice,
      unit,
      sku,
      categoryId,
      isActive
    } = body

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Validation
    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }

    if (unitPrice !== undefined && (isNaN(parseFloat(unitPrice)) || parseFloat(unitPrice) <= 0)) {
      return NextResponse.json(
        { error: 'Valid unit price is required' },
        { status: 400 }
      )
    }

    // Check if category exists if categoryId is provided
    if (categoryId && categoryId !== existingProduct.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId }
      })

      if (!category) {
        return NextResponse.json(
          { error: 'Invalid category selected' },
          { status: 400 }
        )
      }
    }

    // Check for duplicate SKU if provided and different from current
    if (sku && sku.trim() && sku.trim() !== existingProduct.sku) {
      const duplicateProduct = await prisma.product.findUnique({
        where: { sku: sku.trim() }
      })

      if (duplicateProduct) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        )
      }
    }

    // Validate specifications if provided
    let parsedSpecifications = undefined
    if (specifications !== undefined) {
      if (specifications === null || specifications === '') {
        parsedSpecifications = null
      } else {
        try {
          if (typeof specifications === 'string') {
            parsedSpecifications = JSON.stringify(JSON.parse(specifications))
          } else {
            parsedSpecifications = JSON.stringify(specifications)
          }
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid specifications format' },
            { status: 400 }
          )
        }
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (specifications !== undefined) updateData.specifications = parsedSpecifications
    if (unitPrice !== undefined) updateData.unitPrice = parseFloat(unitPrice)
    if (unit !== undefined) updateData.unit = unit?.trim() || 'piece'
    if (sku !== undefined) updateData.sku = sku?.trim() || null
    if (categoryId !== undefined) updateData.categoryId = categoryId
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    
    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update product' },
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
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product is used in any quotations
    const quotationItemsCount = await prisma.quotationItem.count({
      where: { productId: id }
    })

    if (quotationItemsCount > 0 && !force) {
      return NextResponse.json(
        { 
          error: 'Cannot delete product that is used in quotations',
          quotationItemsCount,
          canSoftDelete: true
        },
        { status: 400 }
      )
    }

    if (force && quotationItemsCount > 0) {
      // Soft delete - mark as inactive
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { isActive: false },
        include: {
          category: true,
        },
      })

      return NextResponse.json({
        message: 'Product marked as inactive',
        product: updatedProduct,
        softDeleted: true
      })
    } else {
      // Hard delete
      await prisma.product.delete({
        where: { id }
      })

      return NextResponse.json({
        message: 'Product deleted successfully',
        hardDeleted: true
      })
    }
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
