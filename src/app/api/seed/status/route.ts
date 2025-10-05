import { NextResponse } from 'next/server'
import { checkIfDatabaseNeedsSeeding } from '@/lib/seed'

export async function GET() {
  try {
    const needsSeeding = await checkIfDatabaseNeedsSeeding()
    
    return NextResponse.json({ 
      needsSeeding,
      message: needsSeeding ? 'Database needs seeding' : 'Database already seeded'
    })
  } catch (error) {
    console.error('Error checking seed status:', error)
    return NextResponse.json(
      { error: 'Failed to check seed status' },
      { status: 500 }
    )
  }
}
