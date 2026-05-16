'use client'

import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import { STATUS_INFO, PRIORITY_INFO, fmtDate, fmtRelative, statusBadgeClass } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

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
    { label: 'คำร้องใหม่',    value: openCount,      color: 'var(--sky-text)',     bg: 'var(--sky-bg)' },
    { label: 'เกินกำหนด',         value: overdueCount,   color: 'var(--rose-text)',    bg: 'var(--rose-bg)' },
    { label: 'รออนุมัติ',          value: waitingCount,   color: 'var(--violet-text)',  bg: 'var(--violet-bg)' },
    { label: 'SLA (%)',            value: `${slaRate}%`,  color: 'var(--emerald-text)', bg: 'var(--emerald-bg)' },
  ]

  const recent = [...requests]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  // Last 7 days: created vs completed
  // TODO: Replace with actual calculation once data loads correctly
  const last7Days: Array<{ date: string; created: number; completed: number }> = [
    { date: 'พ.ค. 10', created: 2, completed: 1 },
    { date: 'พ.ค. 11', created: 3, completed: 2 },
    { date: 'พ.ค. 12', created: 2, completed: 2 },
    { date: 'พ.ค. 13', created: 1, completed: 1 },
    { date: 'พ.ค. 14', created: 2, completed: 2 },
    { date: 'พ.ค. 15', created: 3, completed: 1 },
    { date: 'พ.ค. 16', created: 2, completed: 2 },
  ]

  // Prepare data for charts
  const statusChartData: Array<{ name: string; value: number; fill: string }> = [
    { name: STATUS_INFO.open.label, value: openCount, fill: '#0EA5E9' },
    { name: STATUS_INFO.in_progress.label, value: inProgressCount, fill: '#F59E0B' },
    { name: STATUS_INFO.waiting_approval.label, value: waitingCount, fill: '#A78BFA' },
    { name: STATUS_INFO.completed.label, value: completedCount, fill: '#10B981' },
    { name: STATUS_INFO.rejected.label, value: requests.filter(r => r.status === 'rejected').length, fill: '#EF4444' },
  ].filter(d => d.value > 0)

  const totalCreated = last7Days.reduce((sum, d) => sum + d.created, 0)
  const totalCompleted = last7Days.reduce((sum, d) => sum + d.completed, 0)

  // Department workload
  // Color mapping for departments
  const deptColorMap: Record<string, string> = {
    indigo: '#4F46E5',
    rose: '#F43F5E',
    emerald: '#10B981',
    amber: '#F59E0B',
    violet: '#A78BFA',
    slate: '#64748B',
  }

  const deptStats = store.departments.map(dept => {
    const deptRequests = requests.filter(r => r.department === dept.id)
    const active = deptRequests.filter(r => !['completed','rejected'].includes(r.status)).length
    const completed = deptRequests.filter(r => r.status === 'completed').length
    const total = deptRequests.length
    return {
      id: dept.id,
      name: dept.name,
      short: dept.short,
      color: deptColorMap[dept.color] || '#4F46E5',
      total,
      active,
      completed,
      completion: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }).filter(d => d.total > 0).sort((a, b) => b.total - a.total)

  return (
    <div className="p-7 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tighter m-0">แดชบอร์ด</h1>
          <div className="text-[13px] text-gray-500 mt-1">สวัสดี {currentUser?.name} · ภาพรวมระบบคำร้องทั้งหมด</div>
        </div>
        {currentUser?.role === 'staff' && (
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-[13px] bg-indigo-600 text-white hover:bg-indigo-700 transition-colors" onClick={() => router.push('/requests/new')}>
            + สร้างคำร้องใหม่
          </button>
        )}
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

      {/* Charts grid */}
      <div className="grid grid-cols-[2fr_1fr] gap-6 mb-6">
        {/* Bar Chart - Left (larger) */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="text-[15px] font-semibold text-gray-900 tracking-tighter">คำร้องสร้าง / เสร็จสิ้น 7 วันล่าสุด</div>
          </div>
          <div className="p-5 flex flex-row gap-6 items-start">
            {last7Days.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-gray-500 text-center w-full"><div className="text-[12px]">ไม่มีข้อมูล</div></div>
            ) : (
              <>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={last7Days}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
                      <Bar dataKey="created" fill="#3B82F6" name="คำร้องใหม่" />
                      <Bar dataKey="completed" fill="#10B981" name="เสร็จสิ้น" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-3 flex-shrink-0">
                  <div className="flex items-center gap-3 text-[12px]">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#3B82F6' }} />
                    <span className="text-gray-700">คำร้องใหม่</span>
                    <span className="font-semibold text-gray-900">{totalCreated}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px]">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: '#10B981' }} />
                    <span className="text-gray-700">เสร็จสิ้น</span>
                    <span className="font-semibold text-gray-900">{totalCompleted}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Donut Chart - Right (smaller) */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="text-[15px] font-semibold text-gray-900 tracking-tighter">สัดส่วนตามสถานะ</div>
          </div>
          <div className="p-5 flex flex-row gap-6 items-center">
            {statusChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-gray-500 text-center w-full"><div className="text-[12px]">ไม่มีคำร้อง</div></div>
            ) : (
              <>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={statusChartData as any}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => value.toString()} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {statusChartData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-[11px] whitespace-nowrap">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                      <span className="text-gray-700">{entry.name}</span>
                      <span className="font-semibold text-gray-900">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Department workload + Recent requests grid */}
      <div className="grid grid-cols-[1fr_1.2fr] gap-6 mb-6">
        {/* Department workload bars - Left */}
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-[15px] font-semibold text-gray-900 tracking-tighter m-0">ภาระงานรายแผนก</h2>
            <p className="text-[12px] text-gray-500 mt-1 m-0">คำร้องที่กำลังดำเนินการ</p>
          </div>
          <div className="p-6 space-y-4 flex-1 flex flex-col justify-start">
            {deptStats.map(dept => (
              <div key={dept.id} className="group">
                <div className="flex items-center justify-between mb-2 text-[12px]">
                  <span className="font-medium text-gray-900">{dept.name}</span>
                  <span className="text-gray-500 font-medium">{dept.active}/{dept.total}</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-sm">
                  <div
                    className="h-full rounded-full transition-all duration-300 group-hover:shadow-md"
                    style={{ backgroundColor: dept.color, width: `${dept.total > 0 ? (dept.active / dept.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent requests - Right */}
        <div className="bg-white border border-gray-200 rounded-lg flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div>
              <div className="text-[15px] font-semibold text-gray-900 tracking-tighter">คำร้องล่าสุด</div>
              <div className="text-[12px] text-gray-500 mt-1">{requests.length} รายการทั้งหมด</div>
            </div>
            <button className="bg-transparent border-none text-indigo-600 hover:text-indigo-700 font-medium text-[12px] cursor-pointer transition-colors" onClick={() => router.push('/requests')}>ดูทั้งหมด →</button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full border-collapse text-[13px]">
              <tbody>
                {recent.map((r, idx) => (
                    <tr key={r.id} className={`cursor-pointer transition-all hover:opacity-80 ${idx !== recent.length - 1 ? 'border-b border-gray-100' : ''}`} onClick={() => router.push(`/requests/${r.id}`)}>
                      <td className="px-6 py-4">
                        <div className="font-medium max-w-[240px] truncate text-gray-900">{r.title}</div>
                        <div className="text-[11px] text-gray-400 mt-1 font-mono">{r.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[12px] text-gray-500">{fmtDate(r.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={statusBadgeClass(r.status)}>{STATUS_INFO[r.status].label}</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
