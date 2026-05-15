'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import { useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { currentUser } = useApp()
  const role = currentUser?.role

  useEffect(() => {
    if (!role) return

    const isOfficerPath = pathname.startsWith('/officer')
    const isAdminPath = pathname.startsWith('/admin')
    const isApprovalPath = pathname === '/approval'
    const isDashboardPath = pathname === '/dashboard'

    // Officer can't access admin or approval or dashboard
    if (role === 'officer' && (isAdminPath || isApprovalPath || isDashboardPath)) {
      router.replace('/officer/inbox')
      return
    }

    // Manager can't create requests
    if (role === 'manager' && pathname === '/requests/new') {
      router.replace('/dashboard')
      return
    }

    // Officer path access guard
    if (role !== 'officer' && isOfficerPath) {
      router.replace('/dashboard')
      return
    }

    // Admin-only access
    if (role !== 'admin' && isAdminPath) {
      router.replace('/dashboard')
      return
    }

    // Approval access (manager/admin only)
    if (!['manager', 'admin'].includes(role) && isApprovalPath) {
      router.replace('/requests')
      return
    }
  }, [role, pathname, router])

  return <AppLayout>{children}</AppLayout>
}
