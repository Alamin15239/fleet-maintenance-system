import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { logUserLogin } from '@/lib/activity-tracking'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email }
    })

    if (!user || !user.isActive || user.isDeleted) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if user is approved
    if (!user.isApproved) {
      return NextResponse.json(
        { error: 'Your account is pending approval. Please contact an administrator.' },
        { status: 403 }
      )
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create JWT token with extended expiration
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Extended from 24h to 7 days
    )

    // Return user data without password
    const { password: _, ...userWithoutPassword } = user

    // Log user login
    try {
      await logUserLogin(user.id, request)
    } catch (loginError) {
      console.error('Failed to log user login:', loginError)
      // Don't fail the login if logging fails
    }

    return NextResponse.json({
      token,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}