'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import ToastContainer from '@/components/ui/ToastContainer'
import Icon from '@/components/ui/Icon'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile menu backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 lg:hidden z-[100]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-[110] lg:z-auto w-[232px] lg:w-auto transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex items-center lg:hidden px-4 h-[56px] border-b border-gray-200 bg-white flex-shrink-0 gap-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600"
            title="เปิดเมนู"
          >
            <Icon name="menu" size={18} />
          </button>
        </div>
        <Topbar />
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
      <ToastContainer />
    </div>
  )
}
