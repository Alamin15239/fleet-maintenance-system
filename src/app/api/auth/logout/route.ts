import { NextRequest, NextResponse } from 'next/server'
import { logUserLogout } from '@/lib/activity-tracking'
import { verifyToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = verifyToken(request)
    
    if (user?.userId) {
      // Log user logout
      try {
        await logUserLogout(user.userId)
      } catch (logoutError) {
        console.error('Failed to log user logout:', logoutError)
        // Don't fail the logout if logging fails
      }
    }

    return NextResponse.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}