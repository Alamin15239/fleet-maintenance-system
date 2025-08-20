'use client'

import { useState, useEffect } from 'react'

interface NetworkStatus {
  isOnline: boolean
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown' | 'none'
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
  downlink: number
  rtt: number
  lastChanged: Date | null
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    lastChanged: new Date()
  })

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      
      const newStatus: NetworkStatus = {
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        lastChanged: new Date()
      }

      setNetworkStatus(newStatus)
    }

    // Initial update
    updateNetworkStatus()

    // Listen for online/offline events
    const handleOnline = () => updateNetworkStatus()
    const handleOffline = () => updateNetworkStatus()

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for connection changes if available
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus)
    }

    // Periodic status check (every 30 seconds)
    const interval = setInterval(updateNetworkStatus, 30000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus)
      }
      
      clearInterval(interval)
    }
  }, [])

  return networkStatus
}

// Utility function to check if a URL is reachable
export async function checkUrlReachable(url: string, timeout = 5000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors'
    })

    clearTimeout(timeoutId)
    return true
  } catch (error) {
    return false
  }
}

// Utility function to get the best WebSocket URL based on current environment
export function getBestWebSocketUrl(customUrls?: string[]): string[] {
  const urls: string[] = []

  // Add custom URLs if provided
  if (customUrls) {
    urls.push(...customUrls)
  }

  // Try environment variable
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    let envUrl = process.env.NEXT_PUBLIC_SOCKET_URL
    if (envUrl.startsWith('https://')) {
      envUrl = envUrl.replace('https://', 'wss://')
    } else if (envUrl.startsWith('http://')) {
      envUrl = envUrl.replace('http://', 'ws://')
    }
    urls.push(envUrl)
  }

  // Try current origin
  if (typeof window !== 'undefined') {
    const origin = window.location.origin
    urls.push(
      origin.replace('https://', 'wss://'),
      origin.replace('http://', 'ws://'),
      origin
    )
  }

  // Fallback to localhost
  urls.push(
    'ws://localhost:3000',
    'ws://127.0.0.1:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  )

  // Remove duplicates and return
  return [...new Set(urls)]
}