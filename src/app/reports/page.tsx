'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Download, Calendar as CalendarIcon, Filter, RotateCcw, Search, Truck, Wrench } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import * as XLSX from 'xlsx'

interface ReportFilters {
  startDate: Date | undefined
  endDate: Date | undefined
  reportType: 'trucks' | 'maintenance' | 'costs' | 'overview'
  format: 'pdf' | 'excel'
  includeCharts: boolean
  includeDetails: boolean
  selectedTrucks: string[]
  selectedMaintenance: string[]
  selectedUsers: string[]
}

interface User {
  id: string
  email: string
  name?: string
  role: string
  isActive: boolean
}

interface Truck {
  id: string
  vin: string
  make: string
  model: string
  year: number
  licensePlate: string
  currentMileage: number
  status: string
  createdAt: string
}

interface MaintenanceRecord {
  id: string
  truckId: string
  serviceType: string
  description: string | null
  datePerformed: string
  partsCost: number
  laborCost: number
  totalCost: number
  status: string
  createdById?: string
  createdBy?: {
    id: string
    name?: string
    email: string
    role: string
  }
  truck: Truck
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: undefined,
    endDate: undefined,
    reportType: 'overview',
    format: 'pdf',
    includeCharts: true,
    includeDetails: true,
    selectedTrucks: [],
    selectedMaintenance: [],
    selectedUsers: []
  })
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null)
  const [truckSearchOpen, setTruckSearchOpen] = useState(false)
  const [maintenanceSearchOpen, setMaintenanceSearchOpen] = useState(false)
  const [userSearchOpen, setUserSearchOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [trucksRes, maintenanceRes, usersRes] = await Promise.all([
        fetch('/api/trucks'),
        fetch('/api/maintenance'),
        fetch('/api/users')
      ])

      if (trucksRes.ok) {
        const trucksData = await trucksRes.json()
        setTrucks(trucksData)
      }

      if (maintenanceRes.ok) {
        const maintenanceData = await maintenanceRes.json()
        setMaintenance(maintenanceData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data for reports')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      const filteredData = getFilteredData()
      
      if (filters.format === 'pdf') {
        await generatePDFReport(filteredData)
      } else {
        await generateExcelReport(filteredData)
      }
      
      toast.success(`Report generated successfully as ${filters.format.toUpperCase()}`)
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const getFilteredData = () => {
    let filteredMaintenance = [...maintenance]
    let filteredTrucks = [...trucks]
    
    // Filter by selected trucks
    if (filters.selectedTrucks.length > 0) {
      filteredTrucks = filteredTrucks.filter(truck => filters.selectedTrucks.includes(truck.id))
      filteredMaintenance = filteredMaintenance.filter(record => filters.selectedTrucks.includes(record.truckId))
    }
    
    // Filter by selected maintenance records
    if (filters.selectedMaintenance.length > 0) {
      filteredMaintenance = filteredMaintenance.filter(record => filters.selectedMaintenance.includes(record.id))
    }
    
    // Filter by selected users (filter maintenance records created by selected users)
    if (filters.selectedUsers.length > 0) {
      filteredMaintenance = filteredMaintenance.filter(record => 
        record.createdById && filters.selectedUsers.includes(record.createdById)
      )
    }
    
    // Filter by date range
    if (filters.startDate) {
      filteredMaintenance = filteredMaintenance.filter(record => 
        new Date(record.datePerformed) >= filters.startDate!
      )
    }
    
    if (filters.endDate) {
      filteredMaintenance = filteredMaintenance.filter(record => 
        new Date(record.datePerformed) <= filters.endDate!
      )
    }

    return {
      trucks: filteredTrucks,
      maintenance: filteredMaintenance,
      users: users.filter(user => filters.selectedUsers.length === 0 || filters.selectedUsers.includes(user.id)),
      filters
    }
  }

  const generatePDFReport = async (data: any) => {
    try {
      // Simple PDF generation using browser's print functionality
      const printContent = generateReportHTML(data)
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.print()
        
        // Generate filename
        const filename = `fleet-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
        
        // Show success message with filename
        toast.success(`Report generated: ${filename}`)
      }
    } catch (error) {
      console.error('Error generating PDF report:', error)
      throw new Error('Failed to generate PDF report')
    }
  }

  const generateReportHTML = (data: any) => {
    const { trucks, maintenance, filters } = data
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fleet Maintenance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Fleet Maintenance Report</h1>
            <p>Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
            <p>Period: ${filters.startDate && filters.endDate ? 
              `${format(filters.startDate, 'MMM dd, yyyy')} - ${format(filters.endDate, 'MMM dd, yyyy')}` : 
              'All Time'}</p>
          </div>

          <div class="section">
            <div class="summary">
              <h2>Fleet Overview</h2>
              <p><strong>Total Trucks:</strong> ${trucks.length}</p>
              <p><strong>Active Trucks:</strong> ${trucks.filter(t => t.status === 'ACTIVE').length}</p>
              <p><strong>Trucks in Maintenance:</strong> ${trucks.filter(t => t.status === 'MAINTENANCE').length}</p>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Maintenance Summary</h2>
            <div class="summary">
              <p><strong>Total Maintenance Records:</strong> ${maintenance.length}</p>
              <p><strong>Total Maintenance Cost:</strong> ${maintenance.reduce((sum: number, record: any) => sum + record.totalCost, 0).toFixed(2)}</p>
              <p><strong>Average Cost per Maintenance:</strong> ${maintenance.length > 0 ? (maintenance.reduce((sum: number, record: any) => sum + record.totalCost, 0) / maintenance.length).toFixed(2) : 0}</p>
            </div>
          </div>

          ${filters.includeDetails ? `
          <div class="section">
            <h2 class="section-title">Truck Details</h2>
            <table>
              <thead>
                <tr>
                  <th>License Plate</th>
                  <th>Make</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Status</th>
                  <th>Current Mileage</th>
                </tr>
              </thead>
              <tbody>
                ${trucks.map(truck => `
                  <tr>
                    <td>${truck.licensePlate}</td>
                    <td>${truck.make}</td>
                    <td>${truck.model}</td>
                    <td>${truck.year}</td>
                    <td>${truck.status}</td>
                    <td>${truck.currentMileage.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2 class="section-title">Maintenance Records</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Truck</th>
                  <th>Service Type</th>
                  <th>Description</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${maintenance.slice(0, 50).map(record => `
                  <tr>
                    <td>${format(new Date(record.datePerformed), 'MMM dd, yyyy')}</td>
                    <td>${record.truck.licensePlate}</td>
                    <td>${record.serviceType}</td>
                    <td>${record.description || 'N/A'}</td>
                    <td>${record.totalCost.toFixed(2)}</td>
                    <td>${record.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${maintenance.length > 50 ? `<p><em>Showing first 50 of ${maintenance.length} records</em></p>` : ''}
          </div>
          ` : ''}
        </body>
      </html>
    `
  }

  const generateExcelReport = async (data: any) => {
    try {
      const { trucks, maintenance, filters, users } = data
      
      // Create a new workbook
      const wb = XLSX.utils.book_new()
      
      // 1. Create Summary Sheet
      const summaryData = [
        ['Fleet Maintenance Report'],
        [''],
        ['Report Information'],
        ['Generated:', format(new Date(), 'MMM dd, yyyy HH:mm')],
        ['Period:', filters.startDate && filters.endDate ? 
          `${format(filters.startDate, 'MMM dd, yyyy')} - ${format(filters.endDate, 'MMM dd, yyyy')}` : 
          'All Time'],
        ['Report Type:', filters.reportType.toUpperCase()],
        [''],
        ['Fleet Overview'],
        ['Total Trucks:', trucks.length],
        ['Active Trucks:', trucks.filter(t => t.status === 'ACTIVE').length],
        ['Trucks in Maintenance:', trucks.filter(t => t.status === 'MAINTENANCE').length],
        ['Inactive Trucks:', trucks.filter(t => t.status === 'INACTIVE').length],
        [''],
        ['Maintenance Summary'],
        ['Total Maintenance Records:', maintenance.length],
        ['Total Maintenance Cost:', maintenance.reduce((sum: number, record: any) => sum + record.totalCost, 0)],
        ['Average Cost per Maintenance:', maintenance.length > 0 ? 
          maintenance.reduce((sum: number, record: any) => sum + record.totalCost, 0) / maintenance.length : 0],
        ['Total Parts Cost:', maintenance.reduce((sum: number, record: any) => sum + record.partsCost, 0)],
        ['Total Labor Cost:', maintenance.reduce((sum: number, record: any) => sum + record.laborCost, 0)],
        [''],
        ['Maintenance by Status'],
        ['Completed:', maintenance.filter(r => r.status === 'COMPLETED').length],
        ['In Progress:', maintenance.filter(r => r.status === 'IN_PROGRESS').length],
        ['Scheduled:', maintenance.filter(r => r.status === 'SCHEDULED').length],
        ['Cancelled:', maintenance.filter(r => r.status === 'CANCELLED').length],
      ]
      
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData)
      
      // Style the summary sheet
      const summaryStyle = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'center' },
        fill: { fgColor: { rgb: "4472C4" } }
      }
      
      // Apply styles to summary sheet
      for (let i = 0; i < summaryData.length; i++) {
        for (let j = 0; j < summaryData[i].length; j++) {
          const cellAddress = XLSX.utils.encode_cell({ r: i, c: j })
          if (!summaryWs[cellAddress]) continue
          
          if (i === 0) {
            // Title
            summaryWs[cellAddress].s = {
              font: { bold: true, sz: 16 },
              alignment: { horizontal: 'center' },
              fill: { fgColor: { rgb: "4472C4" } }
            }
          } else if (summaryData[i][j] && typeof summaryData[i][j] === 'string' && 
                     (summaryData[i][j].includes('Overview') || summaryData[i][j].includes('Summary') || summaryData[i][j].includes('Information'))) {
            // Section headers
            summaryWs[cellAddress].s = {
              font: { bold: true, sz: 12 },
              fill: { fgColor: { rgb: "D9E1F2" } }
            }
          } else if (j === 0 && summaryData[i][j] && summaryData[i][j].endsWith(':')) {
            // Labels
            summaryWs[cellAddress].s = {
              font: { bold: true }
            }
          }
        }
      }
      
      // Set column widths for summary
      summaryWs['!cols'] = [{ wch: 25 }, { wch: 20 }]
      
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary")
      
      // 2. Create Trucks Sheet
      if (filters.includeDetails) {
        const trucksData = [
          ['License Plate', 'VIN', 'Make', 'Model', 'Year', 'Status', 'Current Mileage', 'Created Date'],
          ...trucks.map(truck => [
            truck.licensePlate,
            truck.vin,
            truck.make,
            truck.model,
            truck.year,
            truck.status,
            truck.currentMileage,
            format(new Date(truck.createdAt), 'MMM dd, yyyy')
          ])
        ]
        
        const trucksWs = XLSX.utils.aoa_to_sheet(trucksData)
        
        // Style header row
        for (let i = 0; i < trucksData[0].length; i++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i })
          trucksWs[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: 'center' }
          }
        }
        
        // Set column widths for trucks
        trucksWs['!cols'] = [
          { wch: 15 }, // License Plate
          { wch: 20 }, // VIN
          { wch: 15 }, // Make
          { wch: 15 }, // Model
          { wch: 8 },  // Year
          { wch: 12 }, // Status
          { wch: 15 }, // Current Mileage
          { wch: 15 }  // Created Date
        ]
        
        XLSX.utils.book_append_sheet(wb, trucksWs, "Trucks")
        
        // 3. Create Maintenance Records Sheet
        const maintenanceData = [
          ['Date', 'Truck', 'License Plate', 'Service Type', 'Description', 'Parts Cost', 'Labor Cost', 'Total Cost', 'Status', 'Created By'],
          ...maintenance.map(record => [
            format(new Date(record.datePerformed), 'MMM dd, yyyy'),
            `${record.truck.make} ${record.truck.model}`,
            record.truck.licensePlate,
            record.serviceType,
            record.description || 'N/A',
            record.partsCost,
            record.laborCost,
            record.totalCost,
            record.status,
            record.createdBy?.name || record.createdBy?.email || 'N/A'
          ])
        ]
        
        const maintenanceWs = XLSX.utils.aoa_to_sheet(maintenanceData)
        
        // Style header row
        for (let i = 0; i < maintenanceData[0].length; i++) {
          const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i })
          maintenanceWs[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: 'center' }
          }
        }
        
        // Format currency columns
        for (let i = 1; i < maintenanceData.length; i++) {
          // Parts Cost column (index 5)
          const partsCostCell = XLSX.utils.encode_cell({ r: i, c: 5 })
          if (maintenanceWs[partsCostCell]) {
            maintenanceWs[partsCostCell].s = {
              numFmt: '$#,##0.00'
            }
          }
          
          // Labor Cost column (index 6)
          const laborCostCell = XLSX.utils.encode_cell({ r: i, c: 6 })
          if (maintenanceWs[laborCostCell]) {
            maintenanceWs[laborCostCell].s = {
              numFmt: '$#,##0.00'
            }
          }
          
          // Total Cost column (index 7)
          const totalCostCell = XLSX.utils.encode_cell({ r: i, c: 7 })
          if (maintenanceWs[totalCostCell]) {
            maintenanceWs[totalCostCell].s = {
              numFmt: '$#,##0.00'
            }
          }
        }
        
        // Set column widths for maintenance
        maintenanceWs['!cols'] = [
          { wch: 15 }, // Date
          { wch: 20 }, // Truck
          { wch: 15 }, // License Plate
          { wch: 20 }, // Service Type
          { wch: 30 }, // Description
          { wch: 12 }, // Parts Cost
          { wch: 12 }, // Labor Cost
          { wch: 12 }, // Total Cost
          { wch: 12 }, // Status
          { wch: 20 }  // Created By
        ]
        
        XLSX.utils.book_append_sheet(wb, maintenanceWs, "Maintenance")
        
        // 4. Create Maintenance Analysis Sheet
        const serviceTypes = [...new Set(maintenance.map(r => r.serviceType))]
        const analysisData = [
          ['Maintenance Analysis by Service Type'],
          [''],
          ['Service Type', 'Count', 'Total Cost', 'Average Cost', 'Min Cost', 'Max Cost'],
          ...serviceTypes.map(type => {
            const typeRecords = maintenance.filter(r => r.serviceType === type)
            const costs = typeRecords.map(r => r.totalCost)
            return [
              type,
              typeRecords.length,
              costs.reduce((sum, cost) => sum + cost, 0),
              costs.length > 0 ? costs.reduce((sum, cost) => sum + cost, 0) / costs.length : 0,
              Math.min(...costs),
              Math.max(...costs)
            ]
          }),
          [''],
          ['Monthly Maintenance Trend'],
          ['Month', 'Total Cost', 'Number of Records']
        ]
        
        // Add monthly trend data
        const monthlyData = {}
        maintenance.forEach(record => {
          const month = format(new Date(record.datePerformed), 'MMM yyyy')
          if (!monthlyData[month]) {
            monthlyData[month] = { totalCost: 0, count: 0 }
          }
          monthlyData[month].totalCost += record.totalCost
          monthlyData[month].count += 1
        })
        
        Object.entries(monthlyData).forEach(([month, data]) => {
          analysisData.push([month, data.totalCost, data.count])
        })
        
        const analysisWs = XLSX.utils.aoa_to_sheet(analysisData)
        
        // Style header rows
        for (let i = 0; i < analysisData.length; i++) {
          if (i === 0 || (i === 2 && analysisData[i][0] === 'Service Type') || 
              (i > 0 && analysisData[i][0] === 'Month')) {
            for (let j = 0; j < analysisData[i].length; j++) {
              const cellAddress = XLSX.utils.encode_cell({ r: i, c: j })
              if (analysisWs[cellAddress]) {
                analysisWs[cellAddress].s = {
                  font: { bold: true },
                  fill: { fgColor: { rgb: "4472C4" } },
                  alignment: { horizontal: 'center' }
                }
              }
            }
          }
        }
        
        // Format currency columns in analysis
        for (let i = 3; i < 3 + serviceTypes.length; i++) {
          // Total Cost column (index 2)
          const totalCostCell = XLSX.utils.encode_cell({ r: i, c: 2 })
          if (analysisWs[totalCostCell]) {
            analysisWs[totalCostCell].s = {
              numFmt: '$#,##0.00'
            }
          }
          
          // Average Cost column (index 3)
          const avgCostCell = XLSX.utils.encode_cell({ r: i, c: 3 })
          if (analysisWs[avgCostCell]) {
            analysisWs[avgCostCell].s = {
              numFmt: '$#,##0.00'
            }
          }
          
          // Min Cost column (index 4)
          const minCostCell = XLSX.utils.encode_cell({ r: i, c: 4 })
          if (analysisWs[minCostCell]) {
            analysisWs[minCostCell].s = {
              numFmt: '$#,##0.00'
            }
          }
          
          // Max Cost column (index 5)
          const maxCostCell = XLSX.utils.encode_cell({ r: i, c: 5 })
          if (analysisWs[maxCostCell]) {
            analysisWs[maxCostCell].s = {
              numFmt: '$#,##0.00'
            }
          }
        }
        
        // Format monthly trend currency
        for (let i = 4 + serviceTypes.length; i < analysisData.length; i++) {
          const totalCostCell = XLSX.utils.encode_cell({ r: i, c: 1 })
          if (analysisWs[totalCostCell]) {
            analysisWs[totalCostCell].s = {
              numFmt: '$#,##0.00'
            }
          }
        }
        
        // Set column widths for analysis
        analysisWs['!cols'] = [
          { wch: 20 }, // Service Type / Month
          { wch: 12 }, // Count
          { wch: 12 }, // Total Cost
          { wch: 12 }, // Average Cost
          { wch: 10 }, // Min Cost
          { wch: 10 }, // Max Cost
          { wch: 15 }  // Number of Records
        ]
        
        XLSX.utils.book_append_sheet(wb, analysisWs, "Analysis")
        
        // 5. Create Users Sheet if users are selected
        if (filters.selectedUsers.length > 0) {
          const usersData = [
            ['User Information'],
            [''],
            ['Name', 'Email', 'Role', 'Status', 'Maintenance Records Created'],
            ...users.map(user => {
              const userMaintenanceCount = maintenance.filter(r => r.createdById === user.id).length
              return [
                user.name || 'N/A',
                user.email,
                user.role,
                user.isActive ? 'Active' : 'Inactive',
                userMaintenanceCount
              ]
            })
          ]
          
          const usersWs = XLSX.utils.aoa_to_sheet(usersData)
          
          // Style headers
          for (let i = 0; i < usersData.length; i++) {
            if (i === 0 || i === 2) {
              for (let j = 0; j < usersData[i].length; j++) {
                const cellAddress = XLSX.utils.encode_cell({ r: i, c: j })
                if (usersWs[cellAddress]) {
                  usersWs[cellAddress].s = {
                    font: { bold: true },
                    fill: { fgColor: { rgb: "4472C4" } },
                    alignment: { horizontal: 'center' }
                  }
                }
              }
            }
          }
          
          usersWs['!cols'] = [
            { wch: 20 }, // Name
            { wch: 25 }, // Email
            { wch: 15 }, // Role
            { wch: 10 }, // Status
            { wch: 25 }  // Maintenance Records Created
          ]
          
          XLSX.utils.book_append_sheet(wb, usersWs, "Users")
        }
      }
      
      // Generate filename
      const filename = `fleet-maintenance-report-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.xlsx`
      
      // Save the file
      XLSX.writeFile(wb, filename)
      
      toast.success(`Professional Excel report generated: ${filename}`)
    } catch (error) {
      console.error('Error generating Excel report:', error)
      throw new Error('Failed to generate Excel report')
    }
  }

  const resetFilters = () => {
    setFilters({
      startDate: undefined,
      endDate: undefined,
      reportType: 'overview',
      format: 'pdf',
      includeCharts: true,
      includeDetails: true,
      selectedTrucks: [],
      selectedMaintenance: [],
      selectedUsers: []
    })
  }

  const toggleTruckSelection = (truckId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTrucks: prev.selectedTrucks.includes(truckId)
        ? prev.selectedTrucks.filter(id => id !== truckId)
        : [...prev.selectedTrucks, truckId]
    }))
  }

  const toggleMaintenanceSelection = (maintenanceId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedMaintenance: prev.selectedMaintenance.includes(maintenanceId)
        ? prev.selectedMaintenance.filter(id => id !== maintenanceId)
        : [...prev.selectedMaintenance, maintenanceId]
    }))
  }

  const toggleUserSelection = (userId: string) => {
    setFilters(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.includes(userId)
        ? prev.selectedUsers.filter(id => id !== userId)
        : [...prev.selectedUsers, userId]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate and export fleet maintenance reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetFilters}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
          <Button onClick={generateReport} disabled={generating}>
            <Download className="h-4 w-4 mr-2" />
            {generating ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>Configure your report settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select 
                value={filters.reportType} 
                onValueChange={(value: any) => setFilters({ ...filters, reportType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Fleet Overview</SelectItem>
                  <SelectItem value="trucks">Trucks Only</SelectItem>
                  <SelectItem value="maintenance">Maintenance Only</SelectItem>
                  <SelectItem value="costs">Cost Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select 
                value={filters.format} 
                onValueChange={(value: any) => setFilters({ ...filters, format: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeCharts"
                  checked={filters.includeCharts}
                  onCheckedChange={(checked) => setFilters({ ...filters, includeCharts: !!checked })}
                />
                <Label htmlFor="includeCharts">Include Charts</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeDetails"
                  checked={filters.includeDetails}
                  onCheckedChange={(checked) => setFilters({ ...filters, includeDetails: !!checked })}
                />
                <Label htmlFor="includeDetails">Include Detailed Records</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date Range */}
        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
            <CardDescription>Filter reports by date range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => setShowCalendar('start')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? format(filters.startDate, 'PPP') : 'Select start date'}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                onClick={() => setShowCalendar('end')}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? format(filters.endDate, 'PPP') : 'Select end date'}
              </Button>
            </div>

            {showCalendar && (
              <div className="absolute z-10 mt-2 bg-white border rounded-lg shadow-lg">
                <Calendar
                  mode="single"
                  selected={showCalendar === 'start' ? filters.startDate : filters.endDate}
                  onSelect={(date) => {
                    if (showCalendar === 'start') {
                      setFilters({ ...filters, startDate: date })
                    } else {
                      setFilters({ ...filters, endDate: date })
                    }
                    setShowCalendar(null)
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Truck & Maintenance Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Data Selection</CardTitle>
            <CardDescription>Select specific trucks and maintenance records</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Truck Selection */}
            <div className="space-y-2">
              <Label>Selected Trucks ({filters.selectedTrucks.length})</Label>
              <Dialog open={truckSearchOpen} onOpenChange={setTruckSearchOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Truck className="mr-2 h-4 w-4" />
                    {filters.selectedTrucks.length > 0 
                      ? `${filters.selectedTrucks.length} truck${filters.selectedTrucks.length > 1 ? 's' : ''} selected`
                      : 'Select trucks...'
                    }
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Select Trucks</DialogTitle>
                    <DialogDescription>
                      Choose specific trucks to include in the report
                    </DialogDescription>
                  </DialogHeader>
                  <Command>
                    <CommandInput placeholder="Search trucks..." />
                    <CommandList>
                      <CommandEmpty>No trucks found.</CommandEmpty>
                      <CommandGroup>
                        {trucks.map((truck) => (
                          <CommandItem
                            key={truck.id}
                            onSelect={() => toggleTruckSelection(truck.id)}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={filters.selectedTrucks.includes(truck.id)}
                                readOnly
                              />
                              <div>
                                <p className="font-medium">{truck.licensePlate}</p>
                                <p className="text-sm text-muted-foreground">
                                  {truck.year} {truck.make} {truck.model}
                                </p>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={() => setFilters(prev => ({ ...prev, selectedTrucks: [] }))}>
                      Clear All
                    </Button>
                    <Button onClick={() => setTruckSearchOpen(false)}>
                      Done ({filters.selectedTrucks.length} selected)
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Maintenance Selection */}
            <div className="space-y-2">
              <Label>Selected Maintenance ({filters.selectedMaintenance.length})</Label>
              <Dialog open={maintenanceSearchOpen} onOpenChange={setMaintenanceSearchOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Wrench className="mr-2 h-4 w-4" />
                    {filters.selectedMaintenance.length > 0 
                      ? `${filters.selectedMaintenance.length} record${filters.selectedMaintenance.length > 1 ? 's' : ''} selected`
                      : 'Select maintenance records...'
                    }
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Select Maintenance Records</DialogTitle>
                    <DialogDescription>
                      Choose specific maintenance records to include in the report
                    </DialogDescription>
                  </DialogHeader>
                  <Command>
                    <CommandInput placeholder="Search maintenance records..." />
                    <CommandList>
                      <CommandEmpty>No maintenance records found.</CommandEmpty>
                      <CommandGroup>
                        {maintenance.slice(0, 50).map((record) => (
                          <CommandItem
                            key={record.id}
                            onSelect={() => toggleMaintenanceSelection(record.id)}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={filters.selectedMaintenance.includes(record.id)}
                                readOnly
                              />
                              <div className="flex-1">
                                <p className="font-medium">{record.serviceType}</p>
                                <p className="text-sm text-muted-foreground">
                                  {record.truck.licensePlate} • {format(new Date(record.datePerformed), 'MMM dd, yyyy')} • ${record.totalCost.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={() => setFilters(prev => ({ ...prev, selectedMaintenance: [] }))}>
                      Clear All
                    </Button>
                    <Button onClick={() => setMaintenanceSearchOpen(false)}>
                      Done ({filters.selectedMaintenance.length} selected)
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* User Selection */}
            <div className="space-y-2">
              <Label>Selected Users ({filters.selectedUsers.length})</Label>
              <Dialog open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Search className="mr-2 h-4 w-4" />
                    {filters.selectedUsers.length > 0 
                      ? `${filters.selectedUsers.length} user${filters.selectedUsers.length > 1 ? 's' : ''} selected`
                      : 'Select users...'
                    }
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Select Users</DialogTitle>
                    <DialogDescription>
                      Choose specific users to include in the report
                    </DialogDescription>
                  </DialogHeader>
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandList>
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {users.map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => toggleUserSelection(user.id)}
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                checked={filters.selectedUsers.includes(user.id)}
                                readOnly
                              />
                              <div>
                                <p className="font-medium">{user.name || user.email}</p>
                                <p className="text-sm text-muted-foreground">
                                  {user.role} {user.isActive ? '• Active' : '• Inactive'}
                                </p>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  <div className="flex justify-between mt-4">
                    <Button variant="outline" onClick={() => setFilters(prev => ({ ...prev, selectedUsers: [] }))}>
                      Clear All
                    </Button>
                    <Button onClick={() => setUserSearchOpen(false)}>
                      Done ({filters.selectedUsers.length} selected)
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
          <CardDescription>Current data available for reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Trucks</span>
              <Badge variant="secondary">{trucks.length}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Active Trucks</span>
              <Badge variant="default">{trucks.filter(t => t.status === 'ACTIVE').length}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Maintenance Records</span>
              <Badge variant="secondary">{maintenance.length}</Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Filtered Records</span>
              <Badge variant="outline">{getFilteredData().maintenance.length}</Badge>
            </div>
          </div>
          
          {filters.selectedTrucks.length > 0 && (
            <Alert>
              <AlertDescription>
                <strong>Selected Trucks:</strong> {filters.selectedTrucks.length} truck{filters.selectedTrucks.length > 1 ? 's' : ''} selected
              </AlertDescription>
            </Alert>
          )}
          
          {filters.selectedMaintenance.length > 0 && (
            <Alert>
              <AlertDescription>
                <strong>Selected Maintenance Records:</strong> {filters.selectedMaintenance.length} record{filters.selectedMaintenance.length > 1 ? 's' : ''} selected
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}