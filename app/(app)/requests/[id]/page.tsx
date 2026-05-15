'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import {
  STATUS_INFO, PRIORITY_INFO, ROLE_INFO, fmtDate, fmtDateTime, fmtRelative,
  statusBadgeClass, deptById, avatarColor, avatarInitials,
} from '@/lib/utils'
import Icon from '@/components/ui/Icon'
import Avatar from '@/components/ui/Avatar'
import type { RequestStatus } from '@/lib/types'

const WF_STEPS: { key: RequestStatus; label: string }[] = [
  { key: 'open',             label: 'เปิดใหม่' },
  { key: 'in_progress',      label: 'กำลังดำเนินการ' },
  { key: 'waiting_approval', label: 'รออนุมัติ' },
  { key: 'completed',        label: 'เสร็จสิ้น' },
]
const WF_ORDER = WF_STEPS.map(s => s.key)

type ModalKind = null | 'approve' | 'reject' | 'assign' | 'progress' | 'status'

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const {
    store, currentUser,
    takeRequest, reassignRequest, changeStatus,
    updateProgress, submitForApproval,
    approveRequest, rejectRequest, addComment,
  } = useApp()
  const router = useRouter()

  const request = store.requests.find(r => r.id === id)

  const [modal, setModal]       = useState<ModalKind>(null)
  const [note, setNote]         = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [newStatus, setNewStatus]   = useState<RequestStatus>('open')
  const [progress, setProgress]     = useState(request?.progress ?? 0)
  const [comment, setComment]       = useState('')

  if (!request) {
    return (
      <div className="p-7 max-w-[1400px] mx-auto">
        <div className="text-center py-20">
          <div className="text-[16px] font-semibold">ไม่พบคำร้องนี้</div>
          <button className="px-4 py-2 mt-4 text-[13px] border rounded-md hover:bg-gray-50" onClick={() => router.push('/requests')}>← กลับรายการ</button>
        </div>
      </div>
    )
  }

  const requester = store.users.find(u => u.id === request.requesterId)
  const assignee  = store.users.find(u => u.id === request.assigneeId)
  const approver  = store.users.find(u => u.id === request.approverId)
  const officers  = store.users.filter(u => ['officer','manager','admin'].includes(u.role))

  const now = Date.now()
  const overdue = new Date(request.dueAt).getTime() < now && !['completed','rejected'].includes(request.status)
  const role = currentUser?.role ?? 'staff'

  const canOfficerAct = ['officer','admin'].includes(role)
  const canManagerAct = ['manager','admin'].includes(role) && request.status === 'waiting_approval'
  const canEdit = (currentUser?.id === request.requesterId && request.status === 'open') || role === 'admin'

  const currentWfIdx = WF_ORDER.indexOf(request.status)
  const isRejected = request.status === 'rejected'

  function openModal(kind: ModalKind) {
    setNote('')
    if (kind === 'assign') setAssigneeId(request!.assigneeId ?? '')
    if (kind === 'status') setNewStatus(request!.status)
    if (kind === 'progress') setProgress(request!.progress)
    setModal(kind)
  }
  function closeModal() { setModal(null) }

  function confirmApprove() {
    approveRequest(id, note)
    closeModal()
  }
  function confirmReject() {
    if (!note.trim()) return
    rejectRequest(id, note)
    closeModal()
  }
  function confirmAssign() {
    if (!assigneeId) return
    reassignRequest(id, assigneeId, note)
    closeModal()
  }
  function confirmProgress() {
    updateProgress(id, progress, note || `อัปเดตความคืบหน้า ${progress}%`)
    closeModal()
  }
  function confirmStatus() {
    changeStatus(id, newStatus, note)
    closeModal()
  }
  function handleComment() {
    if (!comment.trim()) return
    addComment(id, comment.trim())
    setComment('')
  }

  return (
    <div className="p-7 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="min-w-0">
          <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[13px] mb-2" onClick={() => router.back()}>
            ← ย้อนกลับ
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[12px] text-gray-400 font-mono">{request.id}</span>
            <span className={statusBadgeClass(request.status)}>{STATUS_INFO[request.status].label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[11px] border ${PRIORITY_INFO[request.priority].color === 'rose' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>{PRIORITY_INFO[request.priority].label}</span>
            {overdue && <span className="px-2 py-0.5 rounded-full text-[11px] border bg-red-50 text-red-700 border-red-200">⚠ เกินกำหนด</span>}
          </div>
          <h1 className="text-[20px] font-semibold mt-2 leading-tight tracking-tight">{request.title}</h1>
        </div>
        {canEdit && (
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50 flex-shrink-0" onClick={() => router.push(`/requests/${id}/edit`)}>
            <Icon name="edit" size={14}/> แก้ไข
          </button>
        )}
      </div>

      {!isRejected && (
        <div className="flex items-center gap-0 p-5 bg-slate-50 rounded-lg mb-5 flex-wrap">
          {WF_STEPS.map((step, i) => {
            const stepIdx = WF_ORDER.indexOf(step.key)
            const done    = stepIdx < currentWfIdx
            const current = stepIdx === currentWfIdx
            return (
              <div key={step.key} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-white text-gray-400 border border-gray-300'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-[13px] font-medium ${current ? 'text-gray-900 font-semibold' : done ? 'text-gray-900' : 'text-gray-500'}`}>{step.label}</span>
                {i < WF_STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 flex-shrink-0 ${done ? 'bg-emerald-500' : 'bg-gray-300'}`}/>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-[14px] text-gray-900 leading-relaxed mb-5">{request.description}</p>
            <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-[13px]">
              <dt className="text-gray-500 text-[12px]">ผู้ยื่น</dt>
              <dd className="m-0 flex items-center gap-2">
                <Avatar name={requester?.name ?? '?'} size="sm"/>
                <span className="text-gray-900">{requester?.name ?? '—'}</span>
              </dd>
              <dt className="text-gray-500 text-[12px]">ผู้รับผิดชอบ</dt>
              <dd className="m-0 flex items-center gap-2">
                {assignee ? (
                  <>
                    <Avatar name={assignee.name} size="sm"/>
                    <span className="text-gray-900">{assignee.name}</span>
                  </>
                ) : <span className="text-gray-400">ยังไม่มอบหมาย</span>}
              </dd>
              <dt className="text-gray-500 text-[12px]">ผู้อนุมัติ</dt>
              <dd className="m-0 text-gray-900">{approver?.name ?? '—'}</dd>
              <dt className="text-gray-500 text-[12px]">ฝ่าย</dt>
              <dd className="m-0 text-gray-900">{deptById(request.department)?.name ?? request.department}</dd>
              <dt className="text-gray-500 text-[12px]">วันที่สร้าง</dt>
              <dd className="m-0 text-gray-900">{fmtDate(request.createdAt)}</dd>
              <dt className="text-gray-500 text-[12px]">วันกำหนด</dt>
              <dd className={`m-0 ${overdue ? 'text-red-500' : 'text-gray-900'}`}>{fmtDate(request.dueAt)}</dd>
            </dl>

            <div className="mt-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-[12px] text-gray-500">ความคืบหน้า</span>
                <span className="text-[13px] font-semibold text-indigo-600">{request.progress}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all" style={{ width: `${request.progress}%` }}/>
              </div>
            </div>
          </div>

          {request.attachments.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-5 py-4 border-b border-gray-200 font-semibold text-[15px]">เอกสารแนบ ({request.attachments.length})</div>
              <div className="p-5 flex flex-col gap-2">
                {request.attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-gray-200 rounded-md text-[13px]">
                    <Icon name="paperclip" size={14} className="text-gray-400"/>
                    <span className="flex-1 truncate text-gray-900">{a.name}</span>
                    <span className="text-[11px] text-gray-400 font-mono">{a.size}</span>
                    <button className="text-gray-500 hover:text-indigo-600"><Icon name="download" size={13}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-5 py-4 border-b border-gray-200 font-semibold text-[15px]">ประวัติการดำเนินการ</div>
            <div className="p-5">
              <div className="flex flex-col gap-4">
                {request.events.map((ev, i) => {
                  const actor = store.users.find(u => u.id === ev.actorId)
                  return (
                    <div key={i} className="flex gap-3">
                      <Avatar name={actor?.name ?? 'ระบบ'} size="sm"/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-[13px] font-semibold text-gray-900">{actor?.name ?? 'ระบบ'}</span>
                          <span className="text-[11px] text-gray-400">{fmtRelative(ev.time)}</span>
                        </div>
                        <div className={`p-2.5 px-3 rounded-md text-[13px] border ${ev.kind === 'approve' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : ev.kind === 'reject' ? 'bg-red-50 text-red-800 border-red-100' : 'bg-gray-50 border-gray-100 text-gray-800'}`}>
                          {ev.msg}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-5 border-t border-gray-200 pt-5 flex flex-col gap-2">
                <textarea
                  className="w-full bg-white border border-gray-200 rounded-md p-3 text-[13px] outline-none focus:border-indigo-500"
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="เขียนความคิดเห็น..."
                />
                <div className="flex justify-end">
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-[14px] bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    onClick={handleComment}
                    disabled={!comment.trim()}
                  >
                    <Icon name="send" size={14}/> ส่งความคิดเห็น
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {canOfficerAct && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-[15px] text-gray-900">การดำเนินการ</div>
                <span className="text-[12px] text-indigo-700 font-medium bg-indigo-100 px-2 py-0.5 rounded">{ROLE_INFO[role].th}</span>
              </div>
              <div className="bg-white p-3 border border-indigo-100 rounded-md mb-4 flex items-center gap-3">
                <span className="text-[12px] text-gray-500 font-medium">ความคืบหน้า</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${request.progress}%` }}/>
                </div>
                <span className="text-[13px] font-semibold text-indigo-600 w-9 text-right">{request.progress}%</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-md hover:border-indigo-500 transition-colors disabled:opacity-50" disabled={request.status !== 'open'} onClick={() => takeRequest(id)}>
                  <Icon name="play" size={16} className="text-indigo-600"/>
                  <span className="text-[12px] font-semibold">รับงาน</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-md hover:border-indigo-500 transition-colors" onClick={() => openModal('assign')}>
                  <Icon name="users" size={16} className="text-indigo-600"/>
                  <span className="text-[12px] font-semibold">มอบหมาย</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-md hover:border-indigo-500 transition-colors disabled:opacity-50" disabled={request.status === 'open' || request.status === 'completed' || request.status === 'rejected'} onClick={() => openModal('progress')}>
                  <Icon name="zap" size={16} className="text-indigo-600"/>
                  <span className="text-[12px] font-semibold">ความคืบหน้า</span>
                </button>
              </div>

              <button className="w-full flex items-center justify-between p-3 mt-4 bg-white border border-dashed border-indigo-400 rounded-md text-[12px] text-gray-700 hover:bg-indigo-50" onClick={() => openModal('status')}>
                เปลี่ยนสถานะ
                <Icon name="shuffle" size={13}/>
              </button>
            </div>
          )}

          {canManagerAct && (
            <div className="bg-white border border-violet-200 rounded-lg p-5">
              <div className="mb-4">
                <div className="font-semibold text-[15px] text-gray-900">การอนุมัติ</div>
                <div className="text-[12px] text-gray-500 mt-0.5">รอการพิจารณาจากคุณ</div>
              </div>
              <div className="flex flex-col gap-2">
                <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-[14px] font-medium" onClick={() => openModal('approve')}>
                  <Icon name="check" size={14}/> อนุมัติคำร้อง
                </button>
                <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-[14px] font-medium" onClick={() => openModal('reject')}>
                  <Icon name="x" size={14}/> ปฏิเสธคำร้อง
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal === 'approve' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-[440px] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="text-[16px] font-semibold">อนุมัติคำร้อง</div>
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100" onClick={closeModal}><Icon name="x" size={16}/></button>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-gray-500">หมายเหตุ (ถ้ามี)</label>
                <textarea className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="ข้อความถึงผู้ยื่น..."/>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={closeModal}>ยกเลิก</button>
              <button className="px-4 py-2 text-[14px] rounded-md bg-emerald-600 text-white hover:bg-emerald-700" onClick={confirmApprove}>
                <Icon name="check" size={14}/> ยืนยันอนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'reject' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-[440px] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="text-[16px] font-semibold">ปฏิเสธคำร้อง</div>
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100" onClick={closeModal}><Icon name="x" size={16}/></button>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-gray-500">เหตุผลการปฏิเสธ <span className="text-red-500">*</span></label>
                <textarea className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500" rows={4} value={note} onChange={e => setNote(e.target.value)} placeholder="ระบุเหตุผลให้ชัดเจน..."/>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={closeModal}>ยกเลิก</button>
              <button className="px-4 py-2 text-[14px] rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" onClick={confirmReject} disabled={!note.trim()}>
                <Icon name="x" size={14}/> ยืนยันปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'assign' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-[440px] flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="text-[16px] font-semibold">มอบหมายงาน</div>
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100" onClick={closeModal}><Icon name="x" size={16}/></button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">เลือกผู้รับผิดชอบ</div>
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                {officers.map(u => (
                  <label key={u.id} className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${assigneeId === u.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-200'}`}>
                    <input type="radio" name="assignee" value={u.id} checked={assigneeId === u.id} onChange={() => setAssigneeId(u.id)}/>
                    <Avatar name={u.name} size="sm"/>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-900">{u.name}</div>
                      <div className="text-[11px] text-gray-400">{ROLE_INFO[u.role].th}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-1.5 mt-4">
                <label className="text-[12px] font-medium text-gray-500">หมายเหตุ</label>
                <input className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500" type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="เหตุผลการมอบหมาย..."/>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={closeModal}>ยกเลิก</button>
              <button className="px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" onClick={confirmAssign} disabled={!assigneeId}>
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'progress' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-[440px] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="text-[16px] font-semibold">อัปเดตความคืบหน้า</div>
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100" onClick={closeModal}><Icon name="x" size={16}/></button>
            </div>
            <div className="p-6">
              <div className="p-4 bg-slate-50 border border-gray-200 rounded-md flex flex-col gap-3.5 mb-4">
                <div className="text-[48px] font-bold text-indigo-600 flex items-baseline justify-center leading-[1]">
                  {progress}<span className="text-[22px] text-gray-400 font-medium ml-1">%</span>
                </div>
                <div className="relative h-[14px] flex items-center">
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }}/>
                  </div>
                  <input
                    type="range" min={0} max={100} step={5}
                    value={progress}
                    onChange={e => setProgress(Number(e.target.value))}
                    className="absolute w-full opacity-0 cursor-pointer h-full"
                  />
                </div>
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {[0,10,25,50,75,90,100].map(v => (
                    <button key={v} className={`px-3 py-1 rounded-full text-[12px] border transition-all ${progress === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-200 text-gray-900 hover:border-indigo-600'}`} onClick={() => setProgress(v)}>
                      {v}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-gray-500">หมายเหตุ</label>
                <input className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500" type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="รายละเอียดความคืบหน้า..."/>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={closeModal}>ยกเลิก</button>
              <button className="px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={confirmProgress}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'status' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-[440px] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="text-[16px] font-semibold">เปลี่ยนสถานะ</div>
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100" onClick={closeModal}><Icon name="x" size={16}/></button>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-2">
                {(['open','in_progress','waiting_approval','completed','rejected'] as const).map(s => {
                  const info = STATUS_INFO[s]
                  const isCurrent = s === request.status
                  return (
                    <label
                      key={s}
                      className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${newStatus === s ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : 'border-gray-200 hover:bg-gray-50'} ${isCurrent ? 'opacity-60' : ''}`}
                    >
                      <input type="radio" name="status" value={s} checked={newStatus === s} onChange={() => setNewStatus(s)}/>
                      <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <span className={`${statusBadgeClass(s)} !text-[10px]`}>{info.label}</span>
                      </div>
                      <span className="text-[13px]">{info.label}</span>
                      {isCurrent && <span className="ml-auto text-[10px] text-gray-400">ปัจจุบัน</span>}
                    </label>
                  )
                })}
              </div>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
                <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={closeModal}>ยกเลิก</button>
                <button className="px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={confirmStatus}>บันทึก</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
