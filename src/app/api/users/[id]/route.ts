import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = requireAdmin(request)
    
    const userData = await db.user.findUnique({
      where: { id, isDeleted: false },
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

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(userData)
  } catch (error) {
    console.error('Error fetching user:', error)
    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message === 'Insufficient permissions') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = requireAdmin(request)
    const body = await request.json()
    const { email, name, role, password, isActive, isApproved, permissions } = body

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await db.user.findUnique({
        where: { email }
      })

      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email is already taken by another user' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      email: email || existingUser.email,
      name: name !== undefined ? name : existingUser.name,
      role: role || existingUser.role,
      isActive: isActive !== undefined ? isActive : existingUser.isActive,
      isApproved: isApproved !== undefined ? isApproved : existingUser.isApproved
    }

    // Update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Update permissions if provided
    if (permissions !== undefined) {
      updateData.permissions = permissions
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
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
      }
    })

    return NextResponse.json({
      message: 'User updated successfully',
      data: updatedUser
    })
  } catch (error) {
    console.error('Error updating user:', error)
    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message === 'Insufficient permissions') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = requireAdmin(request)
    
    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent self-deletion
    if (id === user.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Soft delete user
    await db.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.userId
      }
    })

    return NextResponse.json({ message: 'User moved to trash successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    if (error instanceof Error) {
      if (error.message === 'Unauthorized' || error.message === 'Insufficient permissions') {
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        )
      }
    }
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}