'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { AdminUser, Page } from '@/lib/types'
import LoginPage from '@/components/pages/LoginPage'
import DashboardPage from '@/components/pages/DashboardPage'
import SalonsPage from '@/components/pages/SalonsPage'
import BookingsPage from '@/components/pages/BookingsPage'
import CustomersPage from '@/components/pages/CustomersPage'
import StaffPage from '@/components/pages/StaffPage'
import ReportsPage from '@/components/pages/ReportsPage'
import AnnouncementsPage from '@/components/pages/AnnouncementsPage'
import AdminsPage from '@/components/pages/AdminsPage'

export default function AppShell() {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null)
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!currentUser) {
    return (
      <LoginPage onLogin={(user) => {
        setCurrentUser(user)
        setCurrentPage('dashboard')
      }} />
    )
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':     return <DashboardPage     />
      case 'salons':        return <SalonsPage        />
      case 'bookings':      return <BookingsPage      />
      case 'customers':     return <CustomersPage     />
      case 'staff':         return <StaffPage         />
      case 'reports':       return <ReportsPage       />
      case 'announcements': return <AnnouncementsPage />
      case 'admins':        return <AdminsPage        />
      default:              return null
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        currentPage={currentPage}
        name={currentUser.name}
        email={currentUser.email}
        initials={currentUser.initials}
        isOpen={sidebarOpen}
        onNavigate={setCurrentPage}
        onLogout={() => {
          setCurrentUser(null)
          setCurrentPage('dashboard')
        }}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:ml-60 flex flex-col min-h-screen">
        <Header
          currentPage={currentPage}
          initials={currentUser.initials}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}