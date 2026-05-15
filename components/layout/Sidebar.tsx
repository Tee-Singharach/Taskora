'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import Icon from '@/components/ui/Icon'
import Avatar from '@/components/ui/Avatar'
import { ROLE_INFO, deptById } from '@/lib/utils'
import type { Role } from '@/lib/types'

type NavItem = { id: string; label: string; icon: string; href: string; badge?: number }

function getNav(role: Role, counts: { myOpen: number; assigned: number; pendingApproval: number; openQueue: number }): NavItem[] {
  if (role === 'staff') return [
    { id: 'requests', label: 'คำร้องของฉัน',    icon: 'list',        href: '/requests',      badge: counts.myOpen },
    { id: 'new',      label: 'สร้างคำร้องใหม่',   icon: 'plus',        href: '/requests/new' },
  ]
  if (role === 'officer') return [
    { id: 'inbox',    label: 'กล่องงาน',         icon: 'inbox',       href: '/officer/inbox',  badge: counts.openQueue },
    { id: 'requests', label: 'คำร้องทั้งหมด',      icon: 'list',        href: '/requests',      badge: counts.assigned },
  ]
  if (role === 'manager') return [
    { id: 'dashboard', label: 'แดชบอร์ด',         icon: 'chart',       href: '/dashboard' },
    { id: 'approvals', label: 'รออนุมัติ',         icon: 'check-circle',href: '/approval',      badge: counts.pendingApproval },
    { id: 'requests',  label: 'คำร้องทั้งหมด',      icon: 'list',        href: '/requests' },
  ]
  // admin
  return [
    { id: 'dashboard', label: 'แดชบอร์ด',         icon: 'chart',       href: '/dashboard' },
    { id: 'users',     label: 'ผู้ใช้และบทบาท',     icon: 'users',       href: '/admin/users' },
    { id: 'audit',     label: 'Audit log',         icon: 'shield',      href: '/admin/audit' },
    { id: 'requests',  label: 'คำร้องทั้งหมด',      icon: 'list',        href: '/requests' },
  ]
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { store, currentUser } = useApp()

  if (!currentUser) return null

  const role = currentUser.role
  const counts = {
    myOpen: store.requests.filter(r => r.requesterId === currentUser.id && r.status === 'open').length,
    assigned: store.requests.filter(r => r.assigneeId === currentUser.id && r.status === 'in_progress').length,
    pendingApproval: store.requests.filter(r => r.status === 'waiting_approval').length,
    openQueue: store.requests.filter((r: { status: string; assigneeId: string | null }) => r.status === 'open' && !r.assigneeId).length,
  }
  const items = getNav(role, counts)
  const dept = deptById(currentUser.dept)

  return (
    <div className="w-[232px] flex-shrink-0 bg-slate-50 border-r border-gray-200 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2.5 p-4 pb-4 border-b border-gray-200 flex-shrink-0">
        <div className="w-[30px] h-[30px] bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M5 4h6a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H5z" fill="white" opacity="0.95"/>
            <path d="M5 12h7a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H5z" fill="white" opacity="0.7"/>
            <circle cx="18" cy="6" r="2.5" fill="white" opacity="0.9"/>
          </svg>
        </div>
        <div className="text-[15px] font-semibold text-gray-900 tracking-tighter">
          MojiFlow
          <span className="font-normal text-gray-500 text-[11px] block leading-tight mt-[1px]">ระบบจัดการคำร้อง</span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-1.5 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">เมนูหลัก</div>
      <nav className="px-2 flex-1 overflow-y-auto">
        {items.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href) && item.href !== '/')
          return (
            <button
              key={item.id}
              className={`flex items-center gap-2.5 p-2 rounded-md text-[13px] transition-colors my-[1px] w-full text-left ${active ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
              onClick={() => router.push(item.href)}
            >
              <Icon name={item.icon} size={16}/>
              <span>{item.label}</span>
              {item.badge ? <span className={`ml-auto text-[11px] px-[7px] py-[1px] rounded-full font-medium ${active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{item.badge}</span> : null}
            </button>
          )
        })}
      </nav>

      <div className="px-4 pt-4 pb-1.5 text-[10px] font-semibold text-gray-400 tracking-widest uppercase">ทั่วไป</div>
      <div className="p-2">
        <button className="flex items-center gap-2.5 p-2 rounded-md text-[13px] text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors w-full text-left">
          <Icon name="settings" size={16}/>
          <span>การตั้งค่า</span>
        </button>
      </div>

      <div className="p-3 border-t border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2.5 p-1.5 rounded-md">
          <Avatar name={currentUser.name} size="sm"/>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-gray-900 truncate">
              {currentUser.name}
            </div>
            <div className="text-[11px] text-gray-500">{ROLE_INFO[role].th} · {dept?.short ?? currentUser.dept}</div>
          </div>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="ออกจากระบบ"
            onClick={() => router.push('/login')}
          >
            <Icon name="logout" size={14}/>
          </button>
        </div>
      </div>
    </div>
  )
}
