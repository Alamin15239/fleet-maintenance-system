import { db } from './db'

export class AdvancedAnalyticsEngine {
  static async getMaintenanceAnalytics(startDate?: Date, endDate?: Date) {
    const baseWhere: any = {}
    
    if (startDate && endDate) {
      baseWhere.datePerformed = {
        gte: startDate,
        lte: endDate
      }
    }

    // Get maintenance costs by month
    const monthlyCosts = await db.maintenanceRecord.groupBy({
      by: ['datePerformed'],
      where: baseWhere,
      _sum: {
        totalCost: true
      },
      _count: {
        id: true
      },
      orderBy: {
        datePerformed: 'asc'
      }
    })

    // Get maintenance types distribution
    const maintenanceTypes = await db.maintenanceRecord.groupBy({
      by: ['serviceType'],
      where: baseWhere,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get maintenance status distribution
    const statusDistribution = await db.maintenanceRecord.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: {
        id: true
      }
    })

    return {
      monthlyCosts: monthlyCosts.map(item => ({
        month: new Date(item.datePerformed).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        totalCost: item._sum.totalCost || 0,
        count: item._count.id
      })),
      maintenanceTypes: maintenanceTypes.map(item => ({
        serviceType: item.serviceType,
        count: item._count.id
      })),
      statusDistribution: statusDistribution.map(item => ({
        status: item.status,
        count: item._count.id
      }))
    }
  }

  static async getFleetAnalytics() {
    // Get truck status distribution
    const truckStatusDistribution = await db.truck.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    })

    // Get trucks by make
    const trucksByMake = await db.truck.groupBy({
      by: ['make'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    })

    // Get average mileage by make
    const avgMileageByMake = await db.truck.groupBy({
      by: ['make'],
      _avg: {
        currentMileage: true
      }
    })

    // Get maintenance frequency by truck
    const maintenanceFrequency = await db.maintenanceRecord.groupBy({
      by: ['truckId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })

    return {
      truckStatusDistribution: truckStatusDistribution.map(item => ({
        status: item.status,
        count: item._count.id
      })),
      trucksByMake: trucksByMake.map(item => ({
        make: item.make,
        count: item._count.id
      })),
      avgMileageByMake: avgMileageByMake.map(item => ({
        make: item.make,
        avgMileage: Math.round(item._avg.currentMileage || 0)
      })),
      maintenanceFrequency: maintenanceFrequency.map(item => ({
        truckId: item.truckId,
        maintenanceCount: item._count.id
      }))
    }
  }

  static async getFinancialAnalytics(startDate?: Date, endDate?: Date) {
    const baseWhere: any = {}
    
    if (startDate && endDate) {
      baseWhere.datePerformed = {
        gte: startDate,
        lte: endDate
      }
    }

    // Get total costs by category
    const costsByCategory = await db.maintenanceRecord.groupBy({
      by: ['serviceType'],
      where: baseWhere,
      _sum: {
        partsCost: true,
        laborCost: true,
        totalCost: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          totalCost: 'desc'
        }
      }
    })

    // Get monthly financial trends
    const monthlyFinancials = await db.maintenanceRecord.groupBy({
      by: ['datePerformed'],
      where: baseWhere,
      _sum: {
        partsCost: true,
        laborCost: true,
        totalCost: true
      },
      orderBy: {
        datePerformed: 'asc'
      }
    })

    // Calculate financial metrics
    const totalCosts = await db.maintenanceRecord.aggregate({
      where: baseWhere,
      _sum: {
        partsCost: true,
        laborCost: true,
        totalCost: true
      },
      _avg: {
        partsCost: true,
        laborCost: true,
        totalCost: true
      },
      _count: {
        id: true
      }
    })

    return {
      costsByCategory: costsByCategory.map(item => ({
        serviceType: item.serviceType,
        partsCost: item._sum.partsCost || 0,
        laborCost: item._sum.laborCost || 0,
        totalCost: item._sum.totalCost || 0,
        count: item._count.id
      })),
      monthlyFinancials: monthlyFinancials.map(item => ({
        month: new Date(item.datePerformed).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        partsCost: item._sum.partsCost || 0,
        laborCost: item._sum.laborCost || 0,
        totalCost: item._sum.totalCost || 0
      })),
      summary: {
        totalPartsCost: totalCosts._sum.partsCost || 0,
        totalLaborCost: totalCosts._sum.laborCost || 0,
        totalCost: totalCosts._sum.totalCost || 0,
        averageCostPerService: totalCosts._avg.totalCost || 0,
        totalServices: totalCosts._count.id
      }
    }
  }

  static async generateComprehensiveReport(startDate?: Date, endDate?: Date) {
    const [maintenanceAnalytics, fleetAnalytics, financialAnalytics] = await Promise.all([
      this.getMaintenanceAnalytics(startDate, endDate),
      this.getFleetAnalytics(),
      this.getFinancialAnalytics(startDate, endDate)
    ])

    return {
      maintenance: maintenanceAnalytics,
      fleet: fleetAnalytics,
      financial: financialAnalytics,
      generatedAt: new Date().toISOString(),
      period: {
        startDate: startDate?.toISOString() || null,
        endDate: endDate?.toISOString() || null
      }
    }
  }
}