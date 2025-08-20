'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'MANAGER' | 'USER'
  isActive: boolean
  isApproved: boolean
  permissions?: any
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
  isAdmin: boolean
  isManager: boolean
  isMechanic: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing auth state on mount
    const savedToken = localStorage.getItem('authToken')
    const savedUser = localStorage.getItem('user')

    const initializeAuth = async () => {
      if (savedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser)
          
          // Verify token is still valid by checking with server
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${savedToken}`
            }
          })

          if (response.ok) {
            setToken(savedToken)
            setUser(parsedUser)
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('authToken')
            localStorage.removeItem('user')
            setToken(null)
            setUser(null)
          }
        } catch (error) {
          console.error('Error validating saved auth:', error)
          // Clear invalid data
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        return true
      }
      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }

  const logout = async (): Promise<void> => {
    try {
      // Call logout API to log the activity
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout API error:', error)
      // Continue with local logout even if API fails
    } finally {
      // Clear local state regardless of API call success
      setToken(null)
      setUser(null)
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      
      // Redirect to login page
      window.location.href = '/login'
    }
  }

  const hasRole = (role: string): boolean => {
    return user?.role === role
  }

  const isAuthenticated = !!user && !!token
  const isAdmin = hasRole('ADMIN')
  const isManager = hasRole('MANAGER') || isAdmin
  const isMechanic = false // Mechanics are no longer users, they are separate entities

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated,
    hasRole,
    isAdmin,
    isManager,
    isMechanic
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallback 
}: { 
  children: React.ReactNode
  requiredRole?: string
  fallback?: React.ReactNode 
}) {
  const { isAuthenticated, isLoading, hasRole } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }
    window.location.href = '/login'
    return null
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}