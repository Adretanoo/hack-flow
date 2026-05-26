import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { UpcomingSessionAlert } from '@/components/shared/UpcomingSessionAlert'

export function AppCabinetLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-muted/20 min-w-0">
          <div className="container mx-auto px-4 py-6 md:py-8 md:px-8 max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
      <UpcomingSessionAlert />
    </div>
  )
}
