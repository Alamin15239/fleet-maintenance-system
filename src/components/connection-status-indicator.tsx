'use client'

import { Wifi, WifiOff, RefreshCw, Database, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ConnectionStatusIndicatorProps {
  connectionStatus: {
    isConnected: boolean
    connectionType: 'websocket' | 'polling' | 'offline'
    lastConnected: Date | null
    retryCount: number
  }
  onReconnect?: () => void
  showDetails?: boolean
}

export function ConnectionStatusIndicator({ 
  connectionStatus, 
  onReconnect, 
  showDetails = false 
}: ConnectionStatusIndicatorProps) {
  const { isConnected, connectionType, lastConnected, retryCount } = connectionStatus

  const getStatusInfo = () => {
    if (!isConnected && connectionType === 'offline') {
      return {
        icon: WifiOff,
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        label: 'Offline',
        description: 'No network connection available'
      }
    }
    
    if (connectionType === 'websocket') {
      return {
        icon: Wifi,
        color: 'text-green-500',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        label: 'Live',
        description: 'Real-time WebSocket connection active'
      }
    }
    
    if (connectionType === 'polling') {
      return {
        icon: RefreshCw,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        label: 'Polling',
        description: 'Using HTTP polling for updates'
      }
    }
    
    return {
      icon: AlertCircle,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      label: 'Unknown',
      description: 'Connection status unknown'
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  const formatLastConnected = () => {
    if (!lastConnected) return 'Never'
    
    const now = new Date()
    const diffMs = now.getTime() - lastConnected.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (showDetails) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor}`}>
              {statusInfo.label}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Connection Type:</span>
              <span className="font-medium capitalize">{connectionType}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span>Last Connected:</span>
              <span className="font-medium">{formatLastConnected()}</span>
            </div>
            
            {retryCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span>Retry Attempts:</span>
                <span className="font-medium">{retryCount}</span>
              </div>
            )}
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-3">
              {statusInfo.description}
            </p>
            
            {connectionType !== 'websocket' && onReconnect && (
              <Button 
                onClick={onReconnect} 
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Real-time Connection
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 text-sm">
            <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
            <Badge className={`${statusInfo.bgColor} ${statusInfo.textColor} text-xs`}>
              {statusInfo.label}
            </Badge>
            {connectionType === 'polling' && (
              <RefreshCw className="h-3 w-3 text-yellow-500 animate-spin" />
            )}
            {connectionType === 'offline' && onReconnect && (
              <Button
                onClick={onReconnect}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{statusInfo.description}</p>
            {lastConnected && (
              <p className="text-xs text-muted-foreground">
                Last connected: {formatLastConnected()}
              </p>
            )}
            {retryCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Retry attempts: {retryCount}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Connection status with additional features
export function EnhancedConnectionStatus({ 
  connectionStatus, 
  onReconnect 
}: ConnectionStatusIndicatorProps) {
  const { isConnected, connectionType, lastConnected } = connectionStatus

  return (
    <div className="flex items-center gap-4">
      <ConnectionStatusIndicator 
        connectionStatus={connectionStatus} 
        onReconnect={onReconnect}
      />
      
      {/* Additional status indicators */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {connectionType === 'websocket' && (
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>Real-time</span>
          </div>
        )}
        
        {connectionType === 'polling' && (
          <div className="flex items-center gap-1">
            <Database className="h-3 w-3 text-yellow-500" />
            <span>Auto-sync</span>
          </div>
        )}
        
        {connectionType === 'offline' && (
          <div className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <span>Offline mode</span>
          </div>
        )}
      </div>
    </div>
  )
}