'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import { PRIORITY_INFO, fmtDate, fmtRelative, deptById, fullName, formalName } from '@/lib/utils'
import Icon from '@/components/ui/Icon'
import Avatar from '@/components/ui/Avatar'

export default function ApprovalPage() {
  const { store, currentUser, approveRequest, rejectRequest } = useApp()
  const router = useRouter()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [confirmKind, setConfirmKind] = useState<'approve' | 'reject'>('approve')
  const [note, setNote] = useState('')

  if (currentUser?.role !== 'manager') {
    return (
      <div className="page">
        <div className="empty" style={{ paddingTop: 80 }}>
          <div className="ic"><Icon name="shield" size={40}/></div>
          <div className="title">ไม่มีสิทธิ์เข้าถึง</div>
          <div className="sub">เฉพาะหัวหน้างานและผู้ดูแลระบบเท่านั้น</div>
        </div>
      </div>
    )
  }

  const queue = [...store.requests]
    .filter(r => r.status === 'waiting_approval')
    .sort((a, b) => {
      const order: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
      return (order[a.priority] ?? 9) - (order[b.priority] ?? 9)
    })

  const now = Date.now()

  function openConfirm(id: string, kind: 'approve' | 'reject') {
    setConfirmId(id)
    setConfirmKind(kind)
    setNote('')
  }
  function closeConfirm() { setConfirmId(null) }
  function confirm() {
    if (!confirmId) return
    if (confirmKind === 'approve') approveRequest(confirmId, note || 'อนุมัติเรียบร้อย')
    else rejectRequest(confirmId, note)
    closeConfirm()
  }

  return (
    <div className="p-4 lg:p-7 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tighter m-0">คิวรออนุมัติ</h1>
        <div className="text-[13px] text-gray-500 mt-1">
          {queue.length === 0 ? 'ไม่มีรายการรออนุมัติ' : `${queue.length} รายการรอการพิจารณา`}
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-16 text-center text-gray-500">
          <div className="flex justify-center mb-4 text-gray-300"><Icon name="check-circle" size={40}/></div>
          <div className="text-[16px] font-semibold text-gray-900">คิวว่างทั้งหมด</div>
          <div className="text-[13px] mt-1">ยังไม่มีคำร้องรออนุมัติในขณะนี้</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {queue.map(r => {
            const requester = store.users.find(u => u.id === r.requesterId)
            const overdue = new Date(r.dueAt).getTime() < now

            return (
              <div key={r.id} className="bg-white border border-violet-200 rounded-lg p-5">
                <div className="flex gap-5 items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-[11px] text-gray-400 font-mono">{r.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] border ${PRIORITY_INFO[r.priority].color === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>{PRIORITY_INFO[r.priority].label}</span>
                      {overdue && <span className="px-2 py-0.5 rounded-full text-[11px] border bg-red-50 text-red-700 border-red-200">⚠ เกินกำหนด</span>}
                    </div>
                    <h3 className="text-[15px] font-semibold m-0 mb-1.5 leading-tight tracking-tight">{r.title}</h3>
                    <p className="text-[13px] text-gray-600 m-0 line-clamp-2 leading-relaxed">
                      {r.description}
                    </p>

                    <div className="flex gap-4 mt-4 flex-wrap text-[12px] text-gray-500">
                      {requester && (
                        <div className="flex items-center gap-2">
                          <Avatar name={fullName(requester)} size="sm"/>
                          <span>{formalName(requester)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Icon name="calendar" size={12}/>
                        {fmtDate(r.dueAt)}
                      </div>
                      <div>{deptById(r.department, store.departments)?.name ?? r.department}</div>
                      <div className="text-gray-400">ยื่น {fmtRelative(r.createdAt)}</div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${r.progress}%` }}/>
                      </div>
                      <span className="text-[12px] text-gray-500 w-8 text-right">{r.progress}%</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => router.push(`/requests/${r.id}?from=/approval`)}>
                      <Icon name="eye" size={13}/> ดูรายละเอียด
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-[13px] font-medium transition-colors" onClick={() => openConfirm(r.id, 'approve')}>
                      <Icon name="check" size={13}/> อนุมัติ
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 text-[13px] font-medium transition-colors" onClick={() => openConfirm(r.id, 'reject')}>
                      <Icon name="x" size={13}/> ปฏิเสธ
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm modal */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeConfirm() }}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-[440px] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="text-[16px] font-semibold">
                {confirmKind === 'approve' ? 'ยืนยันการอนุมัติ' : 'ยืนยันการปฏิเสธ'}
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100" onClick={closeConfirm}><Icon name="x" size={16}/></button>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-gray-500">
                  {confirmKind === 'approve' ? 'หมายเหตุ (ถ้ามี)' : 'เหตุผลการปฏิเสธ'}
                  {confirmKind === 'reject' && <span className="text-red-500"> *</span>}
                </label>
                <textarea
                  className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500"
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder={confirmKind === 'approve' ? 'ข้อความถึงผู้ยื่น...' : 'ระบุเหตุผลให้ชัดเจน...'}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={closeConfirm}>ยกเลิก</button>
              <button
                className={`px-4 py-2 text-[14px] rounded-md text-white font-medium ${confirmKind === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
                onClick={confirm}
                disabled={confirmKind === 'reject' && !note.trim()}
              >
                {confirmKind === 'approve' ? (
                  <><Icon name="check" size={13}/> ยืนยันอนุมัติ</>
                ) : (
                  <><Icon name="x" size={13}/> ยืนยันปฏิเสธ</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
