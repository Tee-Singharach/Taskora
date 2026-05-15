'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import { STATUS_INFO, PRIORITY_INFO, fmtDate, fmtRelative, statusBadgeClass, deptById } from '@/lib/utils'
import Icon from '@/components/ui/Icon'
import Avatar from '@/components/ui/Avatar'
import type { RequestStatus, RequestPriority } from '@/lib/types'

const STATUS_PILLS: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all',              label: 'ทั้งหมด' },
  { value: 'open',             label: STATUS_INFO.open.label },
  { value: 'in_progress',      label: STATUS_INFO.in_progress.label },
  { value: 'waiting_approval', label: STATUS_INFO.waiting_approval.label },
  { value: 'completed',        label: STATUS_INFO.completed.label },
  { value: 'rejected',         label: STATUS_INFO.rejected.label },
]

export default function RequestsPage() {
  const { store, currentUser } = useApp()
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState<RequestPriority | 'all'>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'dueAt' | 'priority'>('createdAt')

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

  const filtered = useMemo(() => {
    let list = [...store.requests]

    if (currentUser?.role === 'staff') {
      list = list.filter(r => r.requesterId === store.currentUserId)
    }

    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter)
    if (deptFilter !== 'all')   list = list.filter(r => r.department === deptFilter)
    if (priorityFilter !== 'all') list = list.filter(r => r.priority === priorityFilter)

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => {
      if (sortBy === 'priority') return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
      return b[sortBy].localeCompare(a[sortBy])
    })

    return list
  }, [store.requests, store.currentUserId, currentUser, statusFilter, deptFilter, priorityFilter, search, sortBy])

  const now = Date.now()

  return (
    <div className="p-7 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tighter m-0">
            {currentUser?.role === 'staff' ? 'คำร้องของฉัน' : 'คำร้องทั้งหมด'}
          </h1>
          <div className="text-[13px] text-gray-500 mt-1">{filtered.length} รายการ</div>
        </div>
        {currentUser?.role === 'staff' && (
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-[13px] bg-indigo-600 text-white hover:bg-indigo-700 transition-colors" onClick={() => router.push('/requests/new')}>
            + สร้างคำร้องใหม่
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2.5 p-3 bg-white border border-gray-200 rounded-t-lg flex-wrap">
        <div className="flex gap-2 flex-wrap flex-1">
          {STATUS_PILLS.map(p => (
            <button
              key={p.value}
              className={`px-3 py-1.5 rounded-md text-[12px] border border-gray-200 transition-all ${statusFilter === p.value ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-white text-gray-900 hover:bg-gray-50'}`}
              onClick={() => setStatusFilter(p.value)}
            >
              {p.label}
              {p.value !== 'all' && (
                <span className="text-[11px] opacity-70 ml-1.5">
                  {store.requests.filter(r => r.status === p.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-[240px]">
          <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา..."
            className="w-full bg-white border border-gray-200 rounded-md py-1.5 pl-8 pr-3 text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        <select className="bg-white border border-gray-200 rounded-md py-1.5 px-3 text-[13px] focus:border-indigo-500 outline-none" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="all">ทุกฝ่าย</option>
          {store.departments.map(d => <option key={d.id} value={d.id}>{d.short}</option>)}
        </select>

        <select className="bg-white border border-gray-200 rounded-md py-1.5 px-3 text-[13px] focus:border-indigo-500 outline-none" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as RequestPriority | 'all')}>
          <option value="all">ทุกความสำคัญ</option>
          {(['urgent','high','normal','low'] as const).map(p => (
            <option key={p} value={p}>{PRIORITY_INFO[p].label}</option>
          ))}
        </select>

        <select className="bg-white border border-gray-200 rounded-md py-1.5 px-3 text-[13px] focus:border-indigo-500 outline-none" value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
          <option value="createdAt">วันที่สร้าง</option>
          <option value="dueAt">วันกำหนด</option>
          <option value="priority">ความสำคัญ</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-b-lg border-t-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-center gap-2">
            <Icon name="inbox" size={32} className="text-gray-300"/>
            <div className="text-[14px] font-semibold text-gray-900">ไม่พบคำร้อง</div>
            <div className="text-[12px] text-gray-500">ลองปรับตัวกรองหรือค้นหาใหม่</div>
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase w-[120px]">เลขที่</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">ชื่อคำร้อง</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">สถานะ</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">ความสำคัญ</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">ผู้ยื่น</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">กำหนด</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">ความคืบหน้า</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const requester = store.users.find(u => u.id === r.requesterId)
                const overdue = new Date(r.dueAt).getTime() < now && !['completed','rejected'].includes(r.status)
                return (
                  <tr key={r.id} className="cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-b-0" onClick={() => router.push(`/requests/${r.id}`)}>
                    <td className="px-4 py-3 font-mono text-[12px] text-gray-500">{r.id}</td>
                    <td className="px-4 py-3 text-gray-900">
                      <div className="font-medium truncate max-w-[340px]">{r.title}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{deptById(r.department, store.departments)?.name ?? r.department}</div>
                    </td>
                    <td className="px-4 py-3"><span className={statusBadgeClass(r.status)}>{STATUS_INFO[r.status].label}</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] border ${PRIORITY_INFO[r.priority].color === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {PRIORITY_INFO[r.priority].label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={requester?.name ?? '?'} size="sm"/>
                        <span className="text-[12px] text-gray-600">{requester?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3 text-[12px] whitespace-nowrap ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                      {overdue && <span className="mr-1">⚠</span>}
                      {fmtDate(r.dueAt)}
                    </td>
                    <td className="px-4 py-3 min-w-[100px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${r.progress}%` }}/>
                        </div>
                        <span className="text-[11px] text-gray-500 w-[28px] text-right">{r.progress}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
