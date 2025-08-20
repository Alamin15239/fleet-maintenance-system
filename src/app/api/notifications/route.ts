import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'oil_change', 'upcoming_maintenance', 'overdue'
    const userId = searchParams.get('userId')

    let whereClause: any = {}
    
    if (type) {
      whereClause.type = type
    }
    
    if (userId) {
      whereClause.userId = userId
    }

    const notifications = await db.notification.findMany({
      where: whereClause,
      include: {
        truck: {
          select: {
            id: true,
            vin: true,
            make: true,
            model: true,
            licensePlate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 notifications
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, title, message, truckId, userId, metadata } = body

    const notification = await db.notification.create({
      data: {
        type,
        title,
        message,
        truckId,
        userId,
        metadata: metadata || {},
        isRead: false
      },
      include: {
        truck: {
          select: {
            id: true,
            vin: true,
            make: true,
            model: true,
            licensePlate: true
          }
        }
      }
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}