'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import Icon from '@/components/ui/Icon'

const BREADCRUMBS: Record<string, string[]> = {
  '/dashboard':       ['แดชบอร์ด'],
  '/requests':        ['คำร้องทั้งหมด'],
  '/requests/new':    ['คำร้องทั้งหมด', 'สร้างใหม่'],
  '/approval':        ['รออนุมัติ'],
  '/admin/users':     ['ผู้ดูแลระบบ', 'ผู้ใช้และบทบาท'],
  '/admin/audit':     ['ผู้ดูแลระบบ', 'Audit Log'],
}

export default function Topbar() {
  const { store } = useApp()
  const [search, setSearch] = useState('')
  const [showNotif, setShowNotif] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const unread = 3

  const crumbs = BREADCRUMBS[pathname] ??
    (pathname.startsWith('/requests/') ? ['คำร้องทั้งหมด', 'รายละเอียดคำร้อง'] : [])

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div className="h-[56px] border-b border-gray-200 flex items-center px-4 lg:px-6 gap-2 lg:gap-4 flex-shrink-0 bg-white relative">
      {/* Breadcrumb */}
      <div className="hidden sm:flex items-center gap-2 min-w-0 flex-[0_1_auto]">
        {crumbs.length > 0 && (
          <div className="flex items-center gap-2 text-[12px] lg:text-[13px] text-gray-500">
            {crumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <Icon name="chevR" size={12} className="text-gray-400"/>}
                <span className={`${i === crumbs.length - 1 ? 'text-gray-900 font-medium' : ''} truncate`}>{b}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1"/>

      {/* Search - hide on mobile */}
      <div className="hidden md:flex flex-[1] max-w-[360px] relative">
        <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาคำร้อง, ผู้ใช้, แผนก..."
          onKeyDown={e => { if (e.key === 'Enter' && search.trim()) router.push(`/requests?q=${encodeURIComponent(search.trim())}`) }}
          className="w-full bg-slate-50 border border-transparent rounded-md py-1.5 pl-9 pr-3 text-[13px] text-gray-900 outline-none transition-all focus:bg-white focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(79,108,247,0.2)] placeholder:text-gray-400"
        />
      </div>

      {/* Bell */}
      <div className="relative" ref={notifRef}>
        <button className="w-[34px] h-[34px] rounded-md border-none bg-transparent text-gray-500 flex items-center justify-center cursor-pointer transition-all hover:bg-gray-100 hover:text-gray-900 relative" onClick={() => setShowNotif(v => !v)} title="การแจ้งเตือน">
          <Icon name="bell" size={17}/>
          {unread > 0 && <span className="absolute top-[7px] right-[8px] w-[7px] h-[7px] bg-red-500 rounded-full border-2 border-white"/>}
        </button>
        {showNotif && (
          <div className="absolute top-[calc(100%+4px)] right-0 w-[320px] md:w-[360px] bg-white border border-gray-200 rounded-lg shadow-xl z-[150] overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-200 flex items-center justify-between">
              <span className="text-[13px] font-semibold">การแจ้งเตือน</span>
              <button className="text-gray-500 hover:text-gray-900 text-[11px] bg-transparent border-none">อ่านทั้งหมด</button>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {[
                { title: 'คำร้องรออนุมัติ', time: '2 นาทีที่แล้ว', unread: true },
                { title: 'ได้รับมอบหมายงานใหม่', time: '1 ชั่วโมงที่แล้ว', unread: true },
                { title: 'คำร้องของคุณเสร็จสิ้น', time: '3 ชั่วโมงที่แล้ว', unread: false },
              ].map((n, i) => (
                <div key={i} className={`px-4 py-3 flex gap-2.5 cursor-pointer border-b border-gray-200 transition-colors hover:bg-gray-50 ${n.unread ? 'bg-indigo-50' : ''}`}>
                  {n.unread && <div className="w-[6px] h-[6px] rounded-full bg-indigo-600 flex-shrink-0 mt-[7px]"/>}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-900">{n.title}</div>
                    <div className="text-[11px] text-gray-400 mt-[2px]">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
