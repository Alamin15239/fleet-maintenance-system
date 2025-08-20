import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = requireAdmin(request)
    
    const users = await db.user.findMany({
      where: {
        isDeleted: false // Only show non-deleted users
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isApproved: true,
        permissions: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message === 'Insufficient permissions') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAdmin(request)
    const body = await request.json()
    const { email, name, role, password, isActive, isApproved } = body

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Email, password, and role are required' },
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

    // Create user
    const newUser = await db.user.create({
      data: {
        email,
        name,
        role,
        password: hashedPassword,
        isActive: isActive !== undefined ? isActive : true,
        isApproved: isApproved !== undefined ? isApproved : false
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
      message: 'User created successfully',
      data: newUser
    })
  } catch (error) {
    console.error('Error creating user:', error)
    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message === 'Insufficient permissions') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}