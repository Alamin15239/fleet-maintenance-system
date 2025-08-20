'use client'

import { ReactNode } from 'react'
import { Navigation } from './navigation'
import { Header } from './header'
import { useAuth } from '@/contexts/auth-context'
import { useSidebar } from '@/contexts/sidebar-context'

interface LayoutProps {
  children: ReactNode
  userRole?: string
}

export function Layout({ children, userRole = 'MECHANIC' }: LayoutProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const { isSidebarOpen } = useSidebar()

  // If user is authenticated, use their role, otherwise use the default
  const effectiveUserRole = user?.role || userRole

  // Only show navigation and header if user is authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="flex-1">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation userRole={effectiveUserRole} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'ml-0' : 'ml-0'}`}>
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}