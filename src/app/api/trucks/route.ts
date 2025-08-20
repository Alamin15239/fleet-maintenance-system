import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logEntityChange } from '@/lib/audit-logging'
import { requireAuth } from '@/lib/auth'
import { getServer } from '@/lib/socket-server'
import { broadcastTruckUpdate } from '@/lib/socket'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    let whereClause = {
      isDeleted: false // Only show non-deleted trucks
    }
    
    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { vin: { contains: search, mode: 'insensitive' } },
          { make: { contains: search, mode: 'insensitive' } },
          { model: { contains: search, mode: 'insensitive' } },
          { licensePlate: { contains: search, mode: 'insensitive' } }
        ]
      }
    }
    
    if (status && status !== 'all') {
      whereClause = {
        ...whereClause,
        status: status
      }
    }

    const trucks = await db.truck.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(trucks)
  } catch (error) {
    console.error('Error fetching trucks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trucks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    
    const body = await request.json()
    const { vin, make, model, year, licensePlate, currentMileage, status } = body

    // Check if truck with VIN already exists
    const existingTruckByVin = await db.truck.findUnique({
      where: { vin }
    })

    if (existingTruckByVin) {
      return NextResponse.json(
        { error: `Truck with VIN ${vin} already exists` },
        { status: 400 }
      )
    }

    // Check if truck with license plate already exists
    const existingTruckByPlate = await db.truck.findFirst({
      where: { 
        licensePlate: licensePlate,
        isDeleted: false
      }
    })

    if (existingTruckByPlate) {
      return NextResponse.json(
        { error: `Truck with license plate ${licensePlate} already exists` },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!vin || !make || !model || !year || !licensePlate || currentMileage === undefined || !status) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate year is reasonable
    const currentYear = new Date().getFullYear()
    if (year < 1900 || year > currentYear + 1) {
      return NextResponse.json(
        { error: `Year must be between 1900 and ${currentYear + 1}` },
        { status: 400 }
      )
    }

    // Validate mileage is not negative
    if (currentMileage < 0) {
      return NextResponse.json(
        { error: 'Mileage cannot be negative' },
        { status: 400 }
      )
    }

    const truckData = {
      vin,
      make,
      model,
      year: parseInt(year),
      licensePlate,
      currentMileage: parseInt(currentMileage),
      status
    }

    const truck = await db.truck.create({
      data: truckData
    })

    // Log the creation
    await logEntityChange(
      'CREATE',
      'TRUCK',
      truck.id,
      user.userId,
      null,
      truckData,
      request
    )

    // Broadcast real-time update
    const io = getServer()
    if (io) {
      broadcastTruckUpdate(io, 'created', truck)
    }

    return NextResponse.json({
      message: 'Truck created successfully',
      data: truck
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating truck:', error)
    return NextResponse.json(
      { error: 'Failed to create truck' },
      { status: 500 }
    )
  }
}