import { NextResponse } from 'next/server'
import { checkIfDatabaseNeedsSeeding, seedDatabase } from '@/lib/seed'

export async function POST() {
  try {
    // First check if seeding is needed
    const needsSeeding = await checkIfDatabaseNeedsSeeding()
    
    if (!needsSeeding) {
      return NextResponse.json({ 
        message: 'Database already contains data, skipping seeding',
        seeded: false 
      })
    }
    
    // Perform seeding
    const result = await seedDatabase()
    
    if (result.success) {
      return NextResponse.json({ 
        message: result.message,
        seeded: true 
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to seed database', details: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in auto-seed route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
