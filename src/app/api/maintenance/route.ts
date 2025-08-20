import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logEntityChange } from '@/lib/audit-logging'
import { requireAuth } from '@/lib/auth'
import { getServer } from '@/lib/socket-server'
import { broadcastMaintenanceUpdate } from '@/lib/socket'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const truckId = searchParams.get('truckId')

    let whereClause = {}
    
    if (search) {
      whereClause = {
        OR: [
          { serviceType: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { truck: { 
            OR: [
              { make: { contains: search, mode: 'insensitive' } },
              { model: { contains: search, mode: 'insensitive' } },
              { licensePlate: { contains: search, mode: 'insensitive' } }
            ]
          }}
        ]
      }
    }
    
    if (status && status !== 'all') {
      whereClause = {
        ...whereClause,
        status: status
      }
    }
    
    if (truckId && truckId !== 'all') {
      whereClause = {
        ...whereClause,
        truckId: truckId
      }
    }

    const maintenanceRecords = await db.maintenanceRecord.findMany({
      where: whereClause,
      include: {
        truck: true,
        mechanic: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        maintenanceJob: {
          select: {
            id: true,
            name: true,
            category: true,
            parts: true,
            notes: true
          }
        }
      },
      orderBy: { datePerformed: 'desc' }
    })

    return NextResponse.json(maintenanceRecords)
  } catch (error) {
    console.error('Error fetching maintenance records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    
    const body = await request.json()
    const { 
      truckId, 
      serviceType, 
      description, 
      datePerformed, 
      partsCost, 
      laborCost, 
      mechanicId, 
      nextServiceDue, 
      status, 
      notes,
      isOilChange,
      oilChangeInterval,
      currentMileage,
      maintenanceJobId
    } = body

    // Check if truck exists
    const truck = await db.truck.findUnique({
      where: { id: truckId }
    })

    if (!truck) {
      return NextResponse.json(
        { error: 'Truck not found' },
        { status: 404 }
      )
    }

    // Calculate total cost
    const totalCost = (parseFloat(partsCost) || 0) + (parseFloat(laborCost) || 0)

    const maintenanceRecordData = {
      truckId,
      serviceType,
      description,
      datePerformed: new Date(datePerformed),
      partsCost: parseFloat(partsCost) || 0,
      laborCost: parseFloat(laborCost) || 0,
      totalCost,
      mechanicId,
      nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : null,
      status,
      notes,
      isOilChange: isOilChange || false,
      oilChangeInterval: isOilChange ? (oilChangeInterval || 5000) : null,
      currentMileage: isOilChange ? (currentMileage || 0) : null,
      maintenanceJobId,
      createdById: user.userId
    }

    // Create maintenance record
    const maintenanceRecord = await db.maintenanceRecord.create({
      data: maintenanceRecordData,
      include: {
        truck: true,
        mechanic: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        maintenanceJob: {
          select: {
            id: true,
            name: true,
            category: true,
            parts: true,
            notes: true
          }
        }
      }
    })

    // Log the creation
    await logEntityChange(
      'CREATE',
      'MAINTENANCE_RECORD',
      maintenanceRecord.id,
      user.userId,
      null,
      maintenanceRecordData,
      request
    )

    // Broadcast real-time update
    const io = getServer()
    if (io) {
      broadcastMaintenanceUpdate(io, 'created', maintenanceRecord)
    }

    // Create oil change notification if this is an oil change service
    if (isOilChange && nextServiceDue) {
      try {
        await db.notification.create({
          data: {
            type: 'oil_change',
            title: 'Next Oil Change Due',
            message: `Next oil change due for ${truck.make} ${truck.model} (${truck.licensePlate}) on ${new Date(nextServiceDue).toLocaleDateString()}`,
            truckId: truck.id,
            metadata: {
              maintenanceRecordId: maintenanceRecord.id,
              nextServiceDue: nextServiceDue,
              currentMileage: currentMileage,
              oilChangeInterval: oilChangeInterval
            },
            isRead: false
          }
        })
      } catch (notificationError) {
        console.error('Error creating oil change notification:', notificationError)
        // Don't fail the whole request if notification creation fails
      }
    }

    return NextResponse.json(maintenanceRecord, { status: 201 })
  } catch (error) {
    console.error('Error creating maintenance record:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance record' },
      { status: 500 }
    )
  }
}