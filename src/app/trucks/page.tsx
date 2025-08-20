'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Truck, Plus, Edit, Eye, Search, Filter, Paperclip, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { FileUpload } from '@/components/file-upload'
import { usePermissions } from '@/contexts/permissions-context'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

interface Truck {
  id: string
  vin: string
  make: string
  model: string
  year: number
  licensePlate: string
  currentMileage: number
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
  image?: string
  documents?: any[]
  createdAt: string
  updatedAt: string
}

export default function TrucksPage() {
  const { canAccess, canCreate, canUpdate, canDelete, loading: permissionsLoading } = usePermissions()
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isFilesDialogOpen, setIsFilesDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null)
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null)
  const [truckDocuments, setTruckDocuments] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    vin: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    currentMileage: 0,
    status: 'ACTIVE' as const
  })
  const [validationErrors, setValidationErrors] = useState({
    vin: '',
    licensePlate: ''
  })

  useEffect(() => {
    fetchTrucks()
  }, [])

  const validateField = (field: string, value: string) => {
    let error = ''
    
    if (field === 'vin') {
      if (value.length > 0) {
        // Check for duplicate VIN, excluding the current truck being edited
        const existingTruck = trucks.find(truck => 
          truck.vin.toLowerCase() === value.toLowerCase() && 
          truck.id !== editingTruck?.id
        )
        if (existingTruck) {
          error = `VIN ${value} already exists`
        }
      }
    }
    
    if (field === 'licensePlate') {
      if (value.length > 0) {
        // Check for duplicate license plate, excluding the current truck being edited
        const existingTruck = trucks.find(truck => 
          truck.licensePlate.toLowerCase() === value.toLowerCase() && 
          truck.id !== editingTruck?.id
        )
        if (existingTruck) {
          error = `License plate ${value} already exists`
        }
      }
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }))
    
    return error === ''
  }

  const fetchTrucks = async () => {
    try {
      const response = await apiGet('/api/trucks')
      if (response.ok) {
        const data = await response.json()
        setTrucks(data)
      } else {
        toast.error('Failed to fetch trucks')
      }
    } catch (error) {
      console.error('Error fetching trucks:', error)
      toast.error('Failed to fetch trucks')
    } finally {
      setLoading(false)
    }
  }

  const filteredTrucks = trucks.filter(truck => {
    const matchesSearch = truck.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         truck.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         truck.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         truck.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || truck.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'MAINTENANCE': return 'bg-yellow-100 text-yellow-800'
      case 'INACTIVE': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields before submission
    const isVinValid = validateField('vin', formData.vin)
    const isLicensePlateValid = validateField('licensePlate', formData.licensePlate)
    
    if (!isVinValid || !isLicensePlateValid) {
      toast.error('Please fix the validation errors before submitting')
      return
    }
    
    try {
      const url = editingTruck ? `/api/trucks/${editingTruck.id}` : '/api/trucks'
      const method = editingTruck ? apiPut : apiPost
      
      const response = await method(url, formData)

      if (response.ok) {
        if (editingTruck) {
          toast.success('Truck updated successfully')
        } else {
          toast.success('Truck added successfully')
        }
        setIsDialogOpen(false)
        resetForm()
        fetchTrucks() // Refresh the list
      } else {
        const errorData = await response.json()
        if (errorData.error && errorData.error.includes('already exists')) {
          toast.error(errorData.error)
        } else {
          toast.error(errorData.error || 'Failed to save truck')
        }
      }
    } catch (error) {
      console.error('Error saving truck:', error)
      toast.error('Failed to save truck')
    }
  }

  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck)
    setFormData({
      vin: truck.vin,
      make: truck.make,
      model: truck.model,
      year: truck.year,
      licensePlate: truck.licensePlate,
      currentMileage: truck.currentMileage,
      status: truck.status
    })
    setIsDialogOpen(true)
  }

  const resetForm = () => {
    setEditingTruck(null)
    setFormData({
      vin: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      licensePlate: '',
      currentMileage: 0,
      status: 'ACTIVE'
    })
    setValidationErrors({
      vin: '',
      licensePlate: ''
    })
  }

  const handleDelete = async (truckId: string) => {
    if (confirm('Are you sure you want to delete this truck?')) {
      try {
        const response = await apiDelete(`/api/trucks/${truckId}`)

        if (response.ok) {
          toast.success('Truck deleted successfully')
          fetchTrucks() // Refresh the list
        } else {
          const errorData = await response.json()
          toast.error(errorData.error || 'Failed to delete truck')
        }
      } catch (error) {
        console.error('Error deleting truck:', error)
        toast.error('Failed to delete truck')
      }
    }
  }

  const handleManageFiles = (truck: Truck) => {
    setSelectedTruck(truck)
    setTruckDocuments(truck.documents || [])
    setIsFilesDialogOpen(true)
  }

  const handleViewTruck = (truck: Truck) => {
    setSelectedTruck(truck)
    setIsViewDialogOpen(true)
  }

  const handleFilesChange = (files: any[]) => {
    setTruckDocuments(files)
    if (selectedTruck) {
      const updatedTrucks = trucks.map(truck =>
        truck.id === selectedTruck.id
          ? { ...truck, documents: files }
          : truck
      )
      setTrucks(updatedTrucks)
    }
  }

  if (permissionsLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!canAccess('trucks')) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <Truck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access truck management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Truck Management</h1>
          <p className="text-muted-foreground">Manage your fleet of vehicles</p>
        </div>
        {canCreate('trucks') && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Truck
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingTruck ? 'Edit Truck' : 'Add New Truck'}
              </DialogTitle>
              <DialogDescription>
                {editingTruck ? 'Update the truck information below.' : 'Enter the details for the new truck.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vin" className="text-right">
                  VIN
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="vin"
                    value={formData.vin}
                    onChange={(e) => {
                      setFormData({...formData, vin: e.target.value})
                      validateField('vin', e.target.value)
                    }}
                    className={validationErrors.vin ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.vin && (
                    <p className="text-sm text-red-500">{validationErrors.vin}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="make" className="text-right">
                  Make
                </Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({...formData, make: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="model" className="text-right">
                  Model
                </Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="year" className="text-right">
                  Year
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="licensePlate" className="text-right">
                  License Plate
                </Label>
                <div className="col-span-3 space-y-1">
                  <Input
                    id="licensePlate"
                    value={formData.licensePlate}
                    onChange={(e) => {
                      setFormData({...formData, licensePlate: e.target.value})
                      validateField('licensePlate', e.target.value)
                    }}
                    className={validationErrors.licensePlate ? 'border-red-500' : ''}
                    required
                  />
                  {validationErrors.licensePlate && (
                    <p className="text-sm text-red-500">{validationErrors.licensePlate}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="currentMileage" className="text-right">
                  Mileage
                </Label>
                <Input
                  id="currentMileage"
                  type="number"
                  value={formData.currentMileage}
                  onChange={(e) => setFormData({...formData, currentMileage: parseInt(e.target.value)})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value as any})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={!!validationErrors.vin || !!validationErrors.licensePlate}
                >
                  {editingTruck ? 'Update Truck' : 'Add Truck'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Files Management Dialog */}
      <Dialog open={isFilesDialogOpen} onOpenChange={setIsFilesDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage Files - {selectedTruck?.year} {selectedTruck?.make} {selectedTruck?.model}
            </DialogTitle>
            <DialogDescription>
              Upload and manage documents for this truck
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTruck && (
              <FileUpload
                type="truck"
                entityId={selectedTruck.id}
                existingFiles={truckDocuments}
                onFilesChange={handleFilesChange}
                multiple={true}
                maxFiles={20}
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsFilesDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Truck Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Truck Details - {selectedTruck?.licensePlate}
            </DialogTitle>
            <DialogDescription>
              View detailed information about this truck
            </DialogDescription>
          </DialogHeader>
          {selectedTruck && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">VIN</Label>
                  <p className="text-lg font-semibold">{selectedTruck.vin}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">License Plate</Label>
                  <p className="text-lg font-semibold">{selectedTruck.licensePlate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Make</Label>
                  <p className="text-lg font-semibold">{selectedTruck.make}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Model</Label>
                  <p className="text-lg font-semibold">{selectedTruck.model}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Year</Label>
                  <p className="text-lg font-semibold">{selectedTruck.year}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Mileage</Label>
                  <p className="text-lg font-semibold">{selectedTruck.currentMileage.toLocaleString()} miles</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Status</Label>
                <Badge className={`mt-1 ${getStatusColor(selectedTruck.status)}`}>
                  {selectedTruck.status}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Documents</Label>
                <p className="text-sm text-gray-600">
                  {selectedTruck.documents && selectedTruck.documents.length > 0 
                    ? `${selectedTruck.documents.length} document${selectedTruck.documents.length > 1 ? 's' : ''} attached`
                    : 'No documents attached'
                  }
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Created</Label>
                  <p className="text-sm">{new Date(selectedTruck.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="text-sm">{new Date(selectedTruck.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {canUpdate('trucks') && selectedTruck && (
              <Button onClick={() => {
                setIsViewDialogOpen(false)
                handleEdit(selectedTruck)
              }}>
                Edit Truck
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trucks by VIN, make, model, or license plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trucks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
          <CardDescription>
            Showing {filteredTrucks.length} of {trucks.length} trucks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VIN</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Mileage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrucks.map((truck) => (
                  <TableRow key={truck.id}>
                    <TableCell className="font-medium">{truck.vin}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{truck.year} {truck.make} {truck.model}</div>
                        <div className="text-sm text-muted-foreground">
                          Added {new Date(truck.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{truck.licensePlate}</TableCell>
                    <TableCell>{truck.currentMileage.toLocaleString()} miles</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(truck.status)}>
                        {truck.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewTruck(truck)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleManageFiles(truck)}
                          className="relative"
                        >
                          <Paperclip className="h-4 w-4" />
                          {truck.documents && truck.documents.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {truck.documents.length}
                            </span>
                          )}
                        </Button>
                        {canUpdate('trucks') && (
                          <Button variant="outline" size="sm" onClick={() => handleEdit(truck)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete('trucks') && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDelete(truck.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}