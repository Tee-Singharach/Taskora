'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import { fmtRelative, formalName } from '@/lib/utils'
import Icon from '@/components/ui/Icon'

const NOTIF_READ_KEY = 'taskora_notif_read'

const KIND_LABEL: Record<string, string> = {
  comment: 'แสดงความคิดเห็นใหม่',
  approve: 'อนุมัติคำร้อง',
  reject:  'ปฏิเสธคำร้อง',
  system:  'อัปเดตคำร้อง',
}

const BREADCRUMBS: Record<string, string[]> = {
  '/dashboard':       ['แดชบอร์ด'],
  '/requests':        ['คำร้องทั้งหมด'],
  '/requests/new':    ['คำร้องทั้งหมด', 'สร้างใหม่'],
  '/approval':        ['รออนุมัติ'],
  '/settings':        ['การตั้งค่า'],
  '/admin/users':     ['ผู้ดูแลระบบ', 'ผู้ใช้และบทบาท'],
  '/admin/audit':     ['ผู้ดูแลระบบ', 'Audit Log'],
}

export default function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { store, currentUser } = useApp()
  const [search, setSearch] = useState('')
  const [showNotif, setShowNotif] = useState(false)
  const [readKeys, setReadKeys] = useState<string[]>([])
  const notifRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const me = currentUser?.id

  const notifications = useMemo(() => {
    if (!me) return []
    const list: { key: string; reqId: string; evIdx: number; reqTitle: string; kind: string; actorName: string; time: string }[] = []
    for (const r of store.requests) {
      const involved = r.requesterId === me || r.assigneeId === me || r.approverId === me
      if (!involved) continue
      r.events.forEach((ev, idx) => {
        if (ev.actorId === me) return
        const actor = store.users.find(u => u.id === ev.actorId)
        list.push({
          key: `${r.id}-${idx}`,
          reqId: r.id,
          evIdx: idx,
          reqTitle: r.title,
          kind: ev.kind,
          actorName: actor ? formalName(actor) : 'ระบบ',
          time: ev.time,
        })
      })
    }
    return list.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 15)
  }, [store.requests, store.users, me])

  const unread = useMemo(
    () => notifications.filter(n => !readKeys.includes(n.key)).length,
    [notifications, readKeys],
  )

  const crumbs = BREADCRUMBS[pathname] ??
    (pathname.startsWith('/requests/') ? ['คำร้องทั้งหมด', 'รายละเอียดคำร้อง'] : [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_READ_KEY)
      if (raw) setReadKeys(JSON.parse(raw) as string[])
    } catch { /* ignore corrupt value */ }
  }, [])

  function persistRead(keys: string[]) {
    setReadKeys(keys)
    localStorage.setItem(NOTIF_READ_KEY, JSON.stringify(keys))
  }

  function openNotif(key: string, reqId: string, evIdx: number) {
    if (!readKeys.includes(key)) persistRead([...readKeys, key])
    setShowNotif(false)
    router.push(`/requests/${reqId}?from=${encodeURIComponent(pathname)}&ev=${evIdx}`)
  }

  function markAllRead() {
    persistRead(Array.from(new Set([...readKeys, ...notifications.map(n => n.key)])))
  }

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
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-600 flex-shrink-0"
        title="เปิดเมนู"
      >
        <Icon name="menu" size={18} />
      </button>

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

      <div className="hidden sm:flex flex-1"/>

      {/* Mobile spacer - push bell and menu to the right */}
      <div className="lg:hidden flex-1"/>

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
              {unread > 0 && (
                <button className="text-gray-500 hover:text-gray-900 text-[11px] bg-transparent border-none" onClick={markAllRead}>อ่านทั้งหมด</button>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-10 text-center text-[12px] text-gray-400">ไม่มีการแจ้งเตือน</div>
              ) : notifications.map(n => {
                const isUnread = !readKeys.includes(n.key)
                return (
                  <button
                    key={n.key}
                    onClick={() => openNotif(n.key, n.reqId, n.evIdx)}
                    className={`w-full text-left px-4 py-3 flex gap-2.5 cursor-pointer border-b border-gray-200 transition-colors hover:bg-gray-50 ${isUnread ? 'bg-indigo-50' : 'opacity-60'}`}
                  >
                    {isUnread
                      ? <div className="w-[6px] h-[6px] rounded-full bg-indigo-600 flex-shrink-0 mt-[7px]"/>
                      : <div className="w-[6px] flex-shrink-0"/>}
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] ${isUnread ? 'text-gray-900' : 'text-gray-500'}`}>
                        <span className={isUnread ? 'font-semibold' : 'font-medium'}>{n.actorName}</span> {KIND_LABEL[n.kind] ?? 'อัปเดตคำร้อง'}
                      </div>
                      <div className={`text-[12px] truncate mt-[1px] ${isUnread ? 'text-gray-600' : 'text-gray-400'}`}>{n.reqTitle}</div>
                      <div className="text-[11px] text-gray-400 mt-[2px]">{fmtRelative(n.time)}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
