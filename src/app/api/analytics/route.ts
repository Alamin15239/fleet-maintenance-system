import { NextRequest, NextResponse } from 'next/server'
import { AdvancedAnalyticsEngine } from '@/lib/advanced-analytics'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const reportType = searchParams.get('reportType') || 'comprehensive'

    const parsedStartDate = startDate ? new Date(startDate) : undefined
    const parsedEndDate = endDate ? new Date(endDate) : undefined

    let result

    switch (reportType) {
      case 'maintenance':
        result = await AdvancedAnalyticsEngine.getMaintenanceAnalytics(parsedStartDate, parsedEndDate)
        break
      case 'fleet':
        result = await AdvancedAnalyticsEngine.getFleetAnalytics()
        break
      case 'financial':
        result = await AdvancedAnalyticsEngine.getFinancialAnalytics(parsedStartDate, parsedEndDate)
        break
      case 'comprehensive':
      default:
        result = await AdvancedAnalyticsEngine.generateComprehensiveReport(parsedStartDate, parsedEndDate)
        break
    }

    return NextResponse.json({
      success: true,
      data: result,
      reportType,
      period: {
        startDate: parsedStartDate?.toISOString() || null,
        endDate: parsedEndDate?.toISOString() || null
      },
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating analytics:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}