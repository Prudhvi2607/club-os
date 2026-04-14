'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

interface Props {
  isBoard: boolean
  showPayments: boolean
  fullName: string
  avatarUrl?: string | null
  latestAnnouncementAt?: string | null
  children: React.ReactNode
}

export function AppShell({ isBoard, showPayments, fullName, avatarUrl, latestAnnouncementAt, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 transition-transform duration-200 md:static md:translate-x-0 md:flex ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar isBoard={isBoard} showPayments={showPayments} latestAnnouncementAt={latestAnnouncementAt} onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          fullName={fullName}
          avatarUrl={avatarUrl}
          onMenuClick={() => setSidebarOpen((o) => !o)}
        />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
