import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with pending approval status
    const newUser = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'USER',
        isActive: true,
        isApproved: false // Requires admin approval
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isApproved: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      message: 'Registration successful. Please wait for admin approval.',
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        isApproved: newUser.isApproved
      }
    }, { status: 201 })
  } catch (error) {
    console.error('Error during registration:', error)
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}