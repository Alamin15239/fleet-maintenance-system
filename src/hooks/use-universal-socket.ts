'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface ConnectionStatus {
  isConnected: boolean
  connectionType: 'websocket' | 'polling' | 'offline'
  lastConnected: Date | null
  retryCount: number
}

interface UseUniversalSocketProps {
  onDashboardUpdate?: (data: any) => void
  onTruckUpdate?: (data: any) => void
  onMaintenanceUpdate?: (data: any) => void
  onConnectionChange?: (status: ConnectionStatus) => void
  enablePollingFallback?: boolean
  enableOfflineCache?: boolean
  pollingInterval?: number
}

interface CachedData {
  timestamp: Date
  data: any
}

export const useUniversalSocket = ({
  onDashboardUpdate,
  onTruckUpdate,
  onMaintenanceUpdate,
  onConnectionChange,
  enablePollingFallback = true,
  enableOfflineCache = true,
  pollingInterval = 30000
}: UseUniversalSocketProps = {}) => {
  const socketRef = useRef<Socket | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    connectionType: 'offline',
    lastConnected: null,
    retryCount: 0
  })

  // Cache management
  const getCachedData = (key: string): CachedData | null => {
    if (!enableOfflineCache) return null
    
    try {
      const cached = localStorage.getItem(`dashboard_${key}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        // Check if cache is fresh (less than 5 minutes old)
        const now = new Date()
        const cacheTime = new Date(parsed.timestamp)
        const diffMs = now.getTime() - cacheTime.getTime()
        const diffMinutes = diffMs / (1000 * 60)
        
        if (diffMinutes < 5) {
          return parsed
        } else {
          localStorage.removeItem(`dashboard_${key}`)
        }
      }
    } catch (error) {
      console.warn('Error reading from cache:', error)
    }
    return null
  }

  const setCachedData = (key: string, data: any) => {
    if (!enableOfflineCache) return
    
    try {
      const cacheData: CachedData = {
        timestamp: new Date(),
        data
      }
      localStorage.setItem(`dashboard_${key}`, JSON.stringify(cacheData))
    } catch (error) {
      console.warn('Error writing to cache:', error)
    }
  }

  // Network detection
  const isOnline = () => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  const getCurrentOrigin = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return 'http://localhost:3000'
  }

  // Generate possible WebSocket URLs
  const getWebSocketUrls = (): string[] => {
    const urls: string[] = []
    const currentOrigin = getCurrentOrigin()
    
    // Try current domain first
    if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
      urls.push(
        'ws://localhost:3000',
        'ws://127.0.0.1:3000',
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      )
    } else {
      // Production/preview environment
      urls.push(
        currentOrigin.replace('https://', 'wss://'),
        currentOrigin.replace('http://', 'ws://'),
        currentOrigin
      )
    }
    
    // Add environment variable if available
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
      let envUrl = process.env.NEXT_PUBLIC_SOCKET_URL
      if (envUrl.startsWith('https://')) {
        envUrl = envUrl.replace('https://', 'wss://')
      } else if (envUrl.startsWith('http://')) {
        envUrl = envUrl.replace('http://', 'ws://')
      }
      if (!urls.includes(envUrl)) {
        urls.push(envUrl)
      }
    }
    
    return urls
  }

  // Polling fallback
  const startPolling = () => {
    if (!enablePollingFallback) return
    
    console.log('🔄 Starting polling fallback for real-time updates')
    updateConnectionStatus({
      isConnected: true,
      connectionType: 'polling',
      lastConnected: new Date(),
      retryCount: connectionStatus.retryCount
    })

    const pollData = async () => {
      if (!isOnline()) {
        stopPolling()
        updateConnectionStatus({
          isConnected: false,
          connectionType: 'offline',
          lastConnected: connectionStatus.lastConnected,
          retryCount: connectionStatus.retryCount
        })
        return
      }

      try {
        // Poll dashboard stats
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setCachedData('stats', data)
          onDashboardUpdate?.({ type: 'stats', data, source: 'polling' })
        }

        // Poll recent trucks
        const trucksResponse = await fetch('/api/trucks?limit=5')
        if (trucksResponse.ok) {
          const trucksData = await trucksResponse.json()
          setCachedData('trucks', trucksData)
          onTruckUpdate?.({ action: 'poll', data: trucksData, source: 'polling' })
        }

        // Poll recent maintenance
        const maintenanceResponse = await fetch('/api/maintenance?limit=5')
        if (maintenanceResponse.ok) {
          const maintenanceData = await maintenanceResponse.json()
          setCachedData('maintenance', maintenanceData)
          onMaintenanceUpdate?.({ action: 'poll', data: maintenanceData, source: 'polling' })
        }

        updateConnectionStatus({
          ...connectionStatus,
          lastConnected: new Date()
        })
      } catch (error) {
        console.error('🔄 Polling error:', error)
        
        // Try to serve cached data when polling fails
        if (enableOfflineCache) {
          const cachedStats = getCachedData('stats')
          if (cachedStats) {
            onDashboardUpdate?.({ type: 'stats', data: cachedStats.data, source: 'cache' })
          }
        }
      }
    }

    // Initial poll
    pollData()
    
    // Set up regular polling
    pollingIntervalRef.current = setInterval(pollData, pollingInterval)
  }

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    console.log('🛑 Stopped polling')
  }

  const updateConnectionStatus = (newStatus: Partial<ConnectionStatus>) => {
    const updated = { ...connectionStatus, ...newStatus }
    setConnectionStatus(updated)
    onConnectionChange?.(updated)
  }

  // WebSocket connection with multiple URL attempts
  const attemptWebSocketConnection = async () => {
    const urls = getWebSocketUrls()
    let lastError: Error | null = null

    for (const url of urls) {
      try {
        console.log(`🔌 Attempting WebSocket connection to: ${url}`)
        
        if (socketRef.current) {
          socketRef.current.disconnect()
        }

        socketRef.current = io(url, {
          transports: ['websocket', 'polling'],
          path: '/api/socketio',
          withCredentials: false,
          forceNew: true,
          timeout: 8000,
          retries: 0,
          upgrade: true,
          rememberUpgrade: false
        })

        const socket = socketRef.current

        // Return a promise that resolves when connected or rejects on error
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Connection timeout for ${url}`))
          }, 10000)

          socket.on('connect', () => {
            clearTimeout(timeout)
            console.log(`✅ WebSocket connected to: ${url}`)
            resolve()
          })

          socket.on('connect_error', (error) => {
            clearTimeout(timeout)
            console.error(`❌ WebSocket connection error for ${url}:`, error.message)
            reject(error)
          })
        })

        // If we get here, connection was successful
        setupWebSocketHandlers(socket)
        return

      } catch (error) {
        lastError = error as Error
        console.warn(`⚠️ WebSocket connection failed for ${url}:`, error.message)
        
        if (socketRef.current) {
          socketRef.current.disconnect()
          socketRef.current = null
        }
      }
    }

    // All URLs failed
    console.error('🚫 All WebSocket connection attempts failed')
    throw lastError || new Error('All WebSocket connection attempts failed')
  }

  const setupWebSocketHandlers = (socket: Socket) => {
    // Join dashboard room
    socket.emit('join-dashboard')

    // Listen for dashboard updates
    socket.on('dashboard-update', (data) => {
      console.log('📊 Dashboard update received via WebSocket:', data)
      setCachedData('stats', data)
      onDashboardUpdate?.({ ...data, source: 'websocket' })
    })

    // Listen for truck updates
    socket.on('truck-update', (data) => {
      console.log('🚛 Truck update received via WebSocket:', data)
      setCachedData('trucks', data)
      onTruckUpdate?.({ ...data, source: 'websocket' })
    })

    // Listen for maintenance updates
    socket.on('maintenance-update', (data) => {
      console.log('🔧 Maintenance update received via WebSocket:', data)
      setCachedData('maintenance', data)
      onMaintenanceUpdate?.({ ...data, source: 'websocket' })
    })

    // Handle connection events
    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server')
      updateConnectionStatus({
        isConnected: true,
        connectionType: 'websocket',
        lastConnected: new Date(),
        retryCount: 0
      })
      stopPolling()
      socket.emit('join-dashboard')
    })

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason)
      updateConnectionStatus({
        isConnected: false,
        connectionType: 'offline',
        lastConnected: new Date(),
        retryCount: connectionStatus.retryCount
      })
      
      // Start polling fallback
      if (enablePollingFallback) {
        startPolling()
      }
    })

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message)
      updateConnectionStatus({
        isConnected: false,
        connectionType: 'offline',
        lastConnected: connectionStatus.lastConnected,
        retryCount: connectionStatus.retryCount + 1
      })
    })
  }

  // Initialize connection
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null
    let isMounted = true

    const initializeConnection = async () => {
      if (!isMounted) return

      // Check if we're online
      if (!isOnline()) {
        console.log('📵 Browser is offline, serving cached data if available')
        updateConnectionStatus({
          isConnected: false,
          connectionType: 'offline',
          lastConnected: null,
          retryCount: 0
        })
        
        // Serve cached data when offline
        if (enableOfflineCache) {
          const cachedStats = getCachedData('stats')
          if (cachedStats) {
            onDashboardUpdate?.({ type: 'stats', data: cachedStats.data, source: 'cache' })
          }
        }
        return
      }

      try {
        await attemptWebSocketConnection()
      } catch (error) {
        console.warn('⚠️ WebSocket connection failed, falling back to polling')
        
        if (enablePollingFallback && isMounted) {
          startPolling()
        } else {
          updateConnectionStatus({
            isConnected: false,
            connectionType: 'offline',
            lastConnected: null,
            retryCount: 0
          })
        }
      }
    }

    // Start connection attempts
    initializeConnection()

    // Set up online/offline event listeners
    const handleOnline = () => {
      console.log('🌐 Browser came back online')
      if (isMounted) {
        initializeConnection()
      }
    }

    const handleOffline = () => {
      console.log('📵 Browser went offline')
      if (isMounted) {
        stopPolling()
        if (socketRef.current) {
          socketRef.current.disconnect()
        }
        updateConnectionStatus({
          isConnected: false,
          connectionType: 'offline',
          lastConnected: connectionStatus.lastConnected,
          retryCount: connectionStatus.retryCount
        })
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    // Cleanup
    return () => {
      isMounted = false
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
      if (socketRef.current) {
        socketRef.current.emit('leave-dashboard')
        socketRef.current.disconnect()
      }
      stopPolling()
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [onDashboardUpdate, onTruckUpdate, onMaintenanceUpdate, onConnectionChange])

  // Manual reconnect function
  const reconnect = async () => {
    console.log('🔄 Manual reconnect triggered')
    stopPolling()
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    
    try {
      await attemptWebSocketConnection()
    } catch (error) {
      console.warn('⚠️ Manual reconnect failed, starting polling')
      if (enablePollingFallback) {
        startPolling()
      }
    }
  }

  return {
    socket: socketRef.current,
    connectionStatus,
    reconnect,
    isOnline: isOnline(),
    getCachedData,
    setCachedData
  }
}