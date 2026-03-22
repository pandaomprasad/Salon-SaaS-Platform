'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import LoginPage from '@/components/pages/LoginPage'
import DashboardPage from '@/components/pages/DashboardPage'
import BookingsPage from '@/components/pages/BookingsPage'
import CustomersPage from '@/components/pages/CustomersPage'
import ServicesPage from '@/components/pages/ServicesPage'
import SchedulePage from '@/components/pages/SchedulePage'
import ReportsPage from '@/components/pages/ReportsPage'
import NotificationsPage from '@/components/pages/NotificationsPage'
import { User, Page } from '@/lib/types'

export default function AppShell() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  // ── Not logged in ────────────────────────────────────────────
  if (!currentUser) {
    return <LoginPage onLogin={(user) => {
      setCurrentUser(user)
      setCurrentPage('dashboard')
    }} />
  }

  // ── Page renderer ────────────────────────────────────────────
  function renderPage() {
    switch (currentPage) {
      case 'dashboard':     return <DashboardPage      user={currentUser!} />
      case 'bookings':      return <BookingsPage        user={currentUser!} />
      case 'customers':     return <CustomersPage       user={currentUser!} />
      case 'services':      return <ServicesPage        user={currentUser!} />
      case 'schedule':      return <SchedulePage        user={currentUser!} />
      case 'reports':       return <ReportsPage         user={currentUser!} />
      case 'notifications': return <NotificationsPage />
      default:              return null
    }
  }

  return (
    <div className="min-h-screen bg-paper">

      <Sidebar
        currentPage={currentPage}
        role={currentUser.role}
        name={currentUser.name}
        email={currentUser.email}
        initials={currentUser.initials}
        onNavigate={setCurrentPage}
        onLogout={() => {
          setCurrentUser(null)
          setCurrentPage('dashboard')
        }}
      />

      <div className="ml-60 flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          initials={currentUser.initials}
          onNavigate={setCurrentPage}
        />
        <main className="flex-1 p-8">
          {renderPage()}
        </main>
      </div>

    </div>
  )
}