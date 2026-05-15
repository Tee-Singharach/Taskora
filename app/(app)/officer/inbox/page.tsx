'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import { PRIORITY_INFO, fmtDate, fmtRelative, deptById, statusBadgeClass, PRIORITY_ORDER, isOverdue } from '@/lib/utils'
import Icon from '@/components/ui/Icon'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import ProgressBar from '@/components/ui/ProgressBar'
import PriorityBadge from '@/components/ui/PriorityBadge'

type TabKind = 'pending' | 'assigned'

export default function OfficerInboxPage() {
  const { store, currentUser, takeRequest } = useApp()
  const router = useRouter()
  const [tab, setTab] = useState<TabKind>('pending')

  if (!['officer', 'admin'].includes(currentUser?.role ?? '')) {
    return (
      <div className="p-7 max-w-[1400px] mx-auto">
        <div className="text-center py-20">
          <div className="text-[16px] font-semibold text-gray-500">เฉพาะเจ้าหน้าที่ดำเนินการ</div>
        </div>
      </div>
    )
  }

  const pendingQueue = store.requests
    .filter(r => r.status === 'open' && !r.assigneeId)
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))

  const assignedQueue = store.requests
    .filter(r => r.assigneeId === currentUser?.id && !['completed', 'rejected'].includes(r.status))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const now = Date.now()

  function handleTakeRequest(id: string) {
    takeRequest(id)
  }

  return (
    <div className="p-7 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tighter m-0">กล่องงาน</h1>
        <div className="text-[13px] text-gray-500 mt-1">สวัสดี {currentUser?.name} · บริหารงานของคุณ</div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
            tab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          งานรอรับ
          <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-semibold">
            {pendingQueue.length}
          </span>
        </button>
        <button
          onClick={() => setTab('assigned')}
          className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
            tab === 'assigned'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          งานของฉัน
          <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
            {assignedQueue.length}
          </span>
        </button>
      </div>

      {/* Pending Queue */}
      {tab === 'pending' && (
        <div className="flex flex-col gap-4">
          {pendingQueue.length === 0 ? (
            <EmptyState icon="inbox" title="ไม่มีงานรอรับ" subtitle="งานทั้งหมดถูกรับแล้ว" />
          ) : (
            pendingQueue.map(r => {
              const requester = store.users.find(u => u.id === r.requesterId)
              const overdue = new Date(r.dueAt).getTime() < now
              return (
                <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-300 transition-colors cursor-pointer group" onClick={() => router.push(`/requests/${r.id}`)}>
                  <div className="flex gap-5 items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[11px] text-gray-400 font-mono">{r.id}</span>
                        <PriorityBadge priority={r.priority} />
                        {overdue && <span className="px-2 py-0.5 rounded-full text-[11px] border bg-red-50 text-red-700 border-red-200">⚠ เกินกำหนด</span>}
                      </div>
                      <h3 className="text-[15px] font-semibold m-0 mb-1.5 leading-tight tracking-tight line-clamp-2">
                        {r.title}
                      </h3>
                      <p className="text-[13px] text-gray-600 m-0 line-clamp-2 leading-relaxed">
                        {r.description}
                      </p>

                      <div className="flex gap-4 mt-4 flex-wrap text-[12px] text-gray-500">
                        {requester && (
                          <div className="flex items-center gap-2">
                            <Avatar name={requester.name} size="sm" />
                            <span>{requester.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Icon name="calendar" size={12} />
                          {fmtDate(r.dueAt)}
                        </div>
                        <div>{deptById(r.department)?.name ?? r.department}</div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleTakeRequest(r.id); }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 text-[13px] font-medium transition-colors whitespace-nowrap"
                      >
                        <Icon name="play" size={14} />
                        รับงาน
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Assigned Queue */}
      {tab === 'assigned' && (
        <div className="flex flex-col gap-4">
          {assignedQueue.length === 0 ? (
            <EmptyState icon="check-circle" title="ยังไม่มีงานที่ลงมือทำ" subtitle='ไปรับงานจากแท็บ "งานรอรับ" ได้' />
          ) : (
            assignedQueue.map(r => {
              const requester = store.users.find(u => u.id === r.requesterId)
              const overdue = new Date(r.dueAt).getTime() < now && !['completed', 'rejected'].includes(r.status)

              return (
                <div
                  key={r.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-300 transition-colors cursor-pointer"
                  onClick={() => router.push(`/requests/${r.id}`)}
                >
                  <div className="flex gap-5 items-start">
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-gray-400 font-mono mb-2">{r.id}</div>
                      <h3 className="text-[15px] font-semibold m-0 mb-1.5 leading-tight tracking-tight line-clamp-2">
                        {r.title}
                      </h3>

                      <div className="flex gap-4 mt-4 flex-wrap text-[12px] text-gray-500">
                        {requester && (
                          <div className="flex items-center gap-2">
                            <Avatar name={requester.name} size="sm" />
                            <span>{requester.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Icon name="calendar" size={12} />
                          {fmtDate(r.dueAt)}
                        </div>
                        <div>{deptById(r.department)?.name ?? r.department}</div>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1">
                          <ProgressBar value={r.progress} />
                        </div>
                        <span className="text-[12px] text-gray-500 w-10 text-right">{r.progress}%</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className={statusBadgeClass(r.status)}>
                          {r.status === 'open' ? 'เปิดใหม่' : r.status === 'in_progress' ? 'กำลังดำเนินการ' : r.status === 'waiting_approval' ? 'รออนุมัติ' : 'เสร็จสิ้น'}
                        </span>
                        <Icon name="chevron-right" size={20} className="text-gray-300" />
                      </div>
                      {overdue && <span className="px-2 py-0.5 rounded-full text-[11px] border bg-red-50 text-red-700 border-red-200">⚠ เกินกำหนด</span>}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
