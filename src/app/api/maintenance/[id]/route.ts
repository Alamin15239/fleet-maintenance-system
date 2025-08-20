import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logEntityChange } from '@/lib/audit-logging'
import { requireAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const maintenanceRecord = await db.maintenanceRecord.findUnique({
      where: { id: params.id },
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

    if (!maintenanceRecord) {
      return NextResponse.json(
        { error: 'Maintenance record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(maintenanceRecord)
  } catch (error) {
    console.error('Error fetching maintenance record:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance record' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request)
    if (!user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Check if maintenance record exists
    const existingRecord = await db.maintenanceRecord.findUnique({
      where: { id: params.id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Maintenance record not found' },
        { status: 404 }
      )
    }

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
      maintenanceJobId
    }

    const maintenanceRecord = await db.maintenanceRecord.update({
      where: { id: params.id },
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

    // Log the update
    await logEntityChange(
      'UPDATE',
      'MAINTENANCE_RECORD',
      params.id,
      user.userId,
      existingRecord,
      maintenanceRecordData,
      request
    )

    return NextResponse.json(maintenanceRecord)
  } catch (error) {
    console.error('Error updating maintenance record:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance record' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = requireAuth(request)
    if (!user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if maintenance record exists
    const existingRecord = await db.maintenanceRecord.findUnique({
      where: { id: params.id }
    })

    if (!existingRecord) {
      return NextResponse.json(
        { error: 'Maintenance record not found' },
        { status: 404 }
      )
    }

    // Delete the maintenance record
    await db.maintenanceRecord.delete({
      where: { id: params.id }
    })

    // Log the deletion
    await logEntityChange(
      'DELETE',
      'MAINTENANCE_RECORD',
      params.id,
      user.userId,
      existingRecord,
      null,
      request
    )

    return NextResponse.json({ message: 'Maintenance record deleted successfully' })
  } catch (error) {
    console.error('Error deleting maintenance record:', error)
    return NextResponse.json(
      { error: 'Failed to delete maintenance record' },
      { status: 500 }
    )
  }
}