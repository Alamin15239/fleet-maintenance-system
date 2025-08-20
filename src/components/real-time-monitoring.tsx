'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Thermometer, 
  Battery, 
  Gauge, 
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Satellite
} from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface SensorReading {
  id: string
  truckId: string
  sensorType: string
  value: number
  unit: string
  timestamp: string
  location?: { lat: number; lng: number }
  isAnomaly: boolean
  confidence?: number
  truck: {
    vin: string
    make: string
    model: string
    licensePlate: string
  }
}

interface TruckStatus {
  id: string
  vin: string
  make: string
  model: string
  licensePlate: string
  status: string
  lastUpdate: string
  location?: { lat: number; lng: number }
  healthScore: number
  activeAlerts: number
}

export default function RealTimeMonitoring() {
  const [sensorData, setSensorData] = useState<SensorReading[]>([])
  const [truckStatus, setTruckStatus] = useState<TruckStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null)
  const [realTimeMode, setRealTimeMode] = useState(false)

  useEffect(() => {
    loadMonitoringData()
    
    if (realTimeMode) {
      const interval = setInterval(loadMonitoringData, 5000) // Update every 5 seconds
      return () => clearInterval(interval)
    }
  }, [realTimeMode])

  const loadMonitoringData = async () => {
    try {
      // Load recent sensor data
      const sensorResponse = await fetch('/api/sensor-data?limit=50')
      const sensorData = await sensorResponse.json()
      setSensorData(sensorData.data)

      // Load truck status (mock data for now)
      const mockTruckStatus: TruckStatus[] = [
        {
          id: '1',
          vin: '1HGCM82633A123456',
          make: 'Honda',
          model: 'Accord',
          licensePlate: 'ABC123',
          status: 'ACTIVE',
          lastUpdate: new Date().toISOString(),
          location: { lat: 37.7749, lng: -122.4194 },
          healthScore: 85,
          activeAlerts: 0
        },
        {
          id: '2',
          vin: '2T1BURHE1JC123456',
          make: 'Toyota',
          model: 'Camry',
          licensePlate: 'DEF456',
          status: 'ACTIVE',
          lastUpdate: new Date().toISOString(),
          location: { lat: 37.7849, lng: -122.4094 },
          healthScore: 72,
          activeAlerts: 1
        }
      ]
      setTruckStatus(mockTruckStatus)
    } catch (error) {
      console.error('Error loading monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSensorIcon = (sensorType: string) => {
    switch (sensorType) {
      case 'ENGINE_TEMPERATURE': return <Thermometer className="h-4 w-4" />
      case 'BATTERY_VOLTAGE': return <Battery className="h-4 w-4" />
      case 'OIL_PRESSURE': return <Gauge className="h-4 w-4" />
      case 'FUEL_LEVEL': return <Gauge className="h-4 w-4" />
      case 'TIRE_PRESSURE': return <Gauge className="h-4 w-4" />
      case 'SPEED': return <Gauge className="h-4 w-4" />
      case 'RPM': return <Activity className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const getSensorColor = (sensorType: string, value: number) => {
    switch (sensorType) {
      case 'ENGINE_TEMPERATURE':
        return value > 220 ? 'text-red-600' : value > 200 ? 'text-yellow-600' : 'text-green-600'
      case 'BATTERY_VOLTAGE':
        return value < 12.2 ? 'text-red-600' : value < 12.6 ? 'text-yellow-600' : 'text-green-600'
      case 'OIL_PRESSURE':
        return value < 20 ? 'text-red-600' : value < 30 ? 'text-yellow-600' : 'text-green-600'
      case 'FUEL_LEVEL':
        return value < 20 ? 'text-red-600' : value < 30 ? 'text-yellow-600' : 'text-green-600'
      case 'TIRE_PRESSURE':
        return value < 30 ? 'text-red-600' : value < 32 ? 'text-yellow-600' : 'text-green-600'
      default:
        return 'text-green-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'WARNING': return 'bg-yellow-100 text-yellow-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'OFFLINE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Generate mock time series data for charts
  const generateTimeSeriesData = () => {
    const data = []
    const now = new Date()
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000)
      data.push({
        time: time.getHours() + ':00',
        engineTemp: 180 + Math.random() * 40,
        batteryVoltage: 12.2 + Math.random() * 0.8,
        oilPressure: 25 + Math.random() * 15,
        fuelLevel: 100 - i * 2 + Math.random() * 10
      })
    }
    return data
  }

  const timeSeriesData = generateTimeSeriesData()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Satellite className="h-8 w-8 text-blue-600" />
            Real-Time Monitoring
          </h1>
          <p className="text-muted-foreground">
            Live vehicle telemetry and sensor monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={realTimeMode ? "default" : "outline"}
            onClick={() => setRealTimeMode(!realTimeMode)}
          >
            <Activity className="h-4 w-4 mr-2" />
            {realTimeMode ? 'Stop Real-Time' : 'Start Real-Time'}
          </Button>
          {realTimeMode && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Fleet Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trucks</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {truckStatus.filter(t => t.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {truckStatus.filter(t => t.status === 'WARNING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <Zap className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {truckStatus.filter(t => t.status === 'CRITICAL').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Immediate action required
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sensor Readings</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {sensorData.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="live-data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live-data">Live Data</TabsTrigger>
          <TabsTrigger value="fleet-status">Fleet Status</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="live-data" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Sensor Readings</CardTitle>
                <CardDescription>
                  Latest telemetry data from fleet vehicles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sensorData.slice(0, 20).map((reading) => (
                    <div
                      key={reading.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        reading.isAnomaly ? 'border-red-200 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {getSensorIcon(reading.sensorType)}
                        <div>
                          <p className="font-medium text-sm">
                            {reading.sensorType.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reading.truck.make} {reading.truck.model} ({reading.truck.licensePlate})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getSensorColor(reading.sensorType, reading.value)}`}>
                          {reading.value.toFixed(1)} {reading.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(reading.timestamp).toLocaleTimeString()}
                        </p>
                        {reading.isAnomaly && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Anomaly
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engine Temperature Trend</CardTitle>
                <CardDescription>
                  Last 24 hours temperature monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="engineTemp"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fleet-status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Status Overview</CardTitle>
              <CardDescription>
                Real-time status of all fleet vehicles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {truckStatus.map((truck) => (
                  <div key={truck.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {truck.make} {truck.model}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {truck.licensePlate} • {truck.vin}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <MapPin className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-muted-foreground">
                            {truck.location ? `${truck.location.lat.toFixed(4)}, ${truck.location.lng.toFixed(4)}` : 'Location unavailable'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Health:</span>
                          <span className={`font-bold ${truck.healthScore >= 80 ? 'text-green-600' : truck.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {truck.healthScore}%
                          </span>
                        </div>
                        <Progress value={truck.healthScore} className="w-20" />
                      </div>
                      <Badge className={getStatusColor(truck.status)}>
                        {truck.status}
                      </Badge>
                      {truck.activeAlerts > 0 && (
                        <div className="flex items-center space-x-1">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-bold text-red-600">
                            {truck.activeAlerts}
                          </span>
                        </div>
                      )}
                      <div className="text-right">
                        <Clock className="h-3 w-3 text-gray-500 mx-auto" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(truck.lastUpdate).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Battery Voltage Trend</CardTitle>
                <CardDescription>
                  Battery health monitoring over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="batteryVoltage"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>
                  Real-time system metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Data Processing</span>
                      <span className="text-sm font-medium">98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">API Response Time</span>
                      <span className="text-sm font-medium">45ms</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Anomaly Detection</span>
                      <span className="text-sm font-medium">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">System Uptime</span>
                      <span className="text-sm font-medium">99.9%</span>
                    </div>
                    <Progress value={99.9} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}