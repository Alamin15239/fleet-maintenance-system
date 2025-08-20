'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/contexts/sidebar-context'
import { useAuth } from '@/contexts/auth-context'
import { Menu, Bell, Search, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Notification {
  id: string
  type: 'success' | 'warning' | 'info'
  title: string
  message: string
  time: string
  read: boolean
}

export function Header() {
  const { toggleSidebar, isSidebarOpen } = useSidebar()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'success',
      title: 'Maintenance Completed',
      message: 'Oil change completed for Truck TRK-001',
      time: '2 minutes ago',
      read: false
    },
    {
      id: '2',
      type: 'warning',
      title: 'Maintenance Due',
      message: 'Truck TRK-003 is due for tire rotation',
      time: '1 hour ago',
      read: false
    },
    {
      id: '3',
      type: 'info',
      title: 'New Report Available',
      message: 'Monthly fleet report is now available',
      time: '3 hours ago',
      read: false
    }
  ])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Sidebar Toggle Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="p-2 h-9 w-9"
        >
          <Menu className="h-4 w-4" />
        </Button>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search..."
            className="pl-10 w-64"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative p-2 h-9 w-9">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs h-6"
                >
                  Mark all read
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <ScrollArea className="h-80">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="flex-col items-start p-4 cursor-pointer"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3 w-full">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="h-2 w-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className={`text-xs ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </ScrollArea>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center justify-center text-sm text-blue-600">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Info */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role || 'USER'}
            </p>
          </div>
          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}