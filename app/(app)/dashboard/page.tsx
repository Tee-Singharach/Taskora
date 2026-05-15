'use client'

import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import { STATUS_INFO, PRIORITY_INFO, DEPARTMENTS, fmtDate, fmtRelative, statusBadgeClass, deptById } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'

export default function DashboardPage() {
  const { store, currentUser } = useApp()
  const router = useRouter()
  const { requests, users } = store

  const now = Date.now()

  const openCount        = requests.filter(r => r.status === 'open').length
  const inProgressCount  = requests.filter(r => r.status === 'in_progress').length
  const waitingCount     = requests.filter(r => r.status === 'waiting_approval').length
  const completedCount   = requests.filter(r => r.status === 'completed').length
  const overdueCount     = requests.filter(r =>
    !['completed','rejected'].includes(r.status) &&
    new Date(r.dueAt).getTime() < now
  ).length

  const totalActive = openCount + inProgressCount + waitingCount
  const slaRate = completedCount + overdueCount > 0
    ? Math.round((completedCount / (completedCount + overdueCount)) * 100)
    : 100

  const stats = [
    { label: 'คำร้องเปิดใหม่',    value: openCount,      color: 'var(--sky-text)',     bg: 'var(--sky-bg)' },
    { label: 'เกินกำหนด',         value: overdueCount,   color: 'var(--rose-text)',    bg: 'var(--rose-bg)' },
    { label: 'รออนุมัติ',          value: waitingCount,   color: 'var(--violet-text)',  bg: 'var(--violet-bg)' },
    { label: 'SLA (%)',            value: `${slaRate}%`,  color: 'var(--emerald-text)', bg: 'var(--emerald-bg)' },
  ]

  const recent = [...requests]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)

  // Dept workload
  const deptWorkload: Record<string, number> = {}
  requests.filter(r => !['completed','rejected'].includes(r.status)).forEach(r => {
    deptWorkload[r.department] = (deptWorkload[r.department] ?? 0) + 1
  })
  const deptData = Object.entries(deptWorkload)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxDept = Math.max(...deptData.map(d => d[1]), 1)

  return (
    <div className="p-7 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tighter m-0">แดชบอร์ด</h1>
          <div className="text-[13px] text-gray-500 mt-1">สวัสดี {currentUser?.name} · ภาพรวมระบบคำร้องทั้งหมด</div>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-[13px] bg-indigo-600 text-white hover:bg-indigo-700 transition-colors" onClick={() => router.push('/requests/new')}>
          + สร้างคำร้องใหม่
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <div className="bg-white border border-gray-200 rounded-lg p-5" key={s.label}>
            <div className="text-[12px] text-gray-500 font-medium">{s.label}</div>
            <div className="text-[28px] font-semibold tracking-tighter mt-1.5 leading-[1.1]" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
        {/* Recent requests */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <div className="text-[15px] font-semibold text-gray-900 tracking-tighter">คำร้องล่าสุด</div>
              <div className="text-[12px] text-gray-500 mt-0.5">{requests.length} รายการทั้งหมด</div>
            </div>
            <button className="bg-transparent border-none text-gray-500 hover:text-gray-900 text-[13px] cursor-pointer" onClick={() => router.push('/requests')}>ดูทั้งหมด →</button>
          </div>
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">คำร้อง</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">สถานะ</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">ผู้ยื่น</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">กำหนด</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(r => {
                const requester = users.find(u => u.id === r.requesterId)
                const overdue = new Date(r.dueAt).getTime() < now && !['completed','rejected'].includes(r.status)
                return (
                  <tr key={r.id} className="cursor-pointer transition-colors hover:bg-gray-50" onClick={() => router.push(`/requests/${r.id}`)}>
                    <td className="px-4 py-3.5 border-b border-gray-200 text-gray-900">
                      <div className="font-medium max-w-[320px] truncate">{r.title}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 font-mono">{r.id} · {deptById(r.department)?.short ?? r.department}</div>
                    </td>
                    <td className="px-4 py-3.5 border-b border-gray-200"><span className={statusBadgeClass(r.status)}>{STATUS_INFO[r.status].label}</span></td>
                    <td className="px-4 py-3.5 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <Avatar name={requester?.name ?? '?'} size="sm"/>
                        <span className="text-[12px] text-gray-500">{requester?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 border-b border-gray-200 text-[12px] whitespace-nowrap ${overdue ? 'text-red-500' : 'text-gray-500'}`}>
                      {fmtDate(r.dueAt)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Right col */}
        <div className="flex flex-col gap-4">
          {/* Dept workload */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="text-[15px] font-semibold text-gray-900 tracking-tighter">ภาระงานตามฝ่าย</div>
            </div>
            <div className="p-5">
              {deptData.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-gray-500 text-center"><div className="text-[12px]">ไม่มีงานค้างอยู่</div></div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {deptData.map(([deptId, count]) => {
                    const dept = deptById(deptId)
                    return (
                      <div key={deptId}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-[12px] text-gray-900">{dept?.short ?? deptId}</span>
                          <span className="text-[12px] font-semibold">{count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${(count / maxDept) * 100}%` }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Status summary */}
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <div className="text-[15px] font-semibold text-gray-900 tracking-tighter">สรุปตามสถานะ</div>
            </div>
            <div className="p-5">
              <div className="flex flex-col gap-2.5">
                {(['open','in_progress','waiting_approval','completed','rejected'] as const).map(s => {
                  const cnt = requests.filter(r => r.status === s).length
                  const pct = requests.length ? Math.round((cnt / requests.length) * 100) : 0
                  return (
                    <div key={s}>
                      <div className="flex justify-between mb-1">
                        <span className={statusBadgeClass(s)}>{STATUS_INFO[s].label}</span>
                        <span className="text-[12px] text-gray-500">{cnt}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${pct}%` }}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
