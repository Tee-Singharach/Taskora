'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import {
  STATUS_INFO, PRIORITY_INFO, ROLE_INFO, fmtDate, fmtRelative,
  statusBadgeClass, deptById, fullName, formalName,
} from '@/lib/utils'
import { canViewRequest, canApprove, canDelete, sameDeptOfficers } from '@/lib/access'
import Icon from '@/components/ui/Icon'
import Avatar from '@/components/ui/Avatar'
import TakeModal from '@/components/requests/TakeModal'
import ApproveModal from '@/components/requests/ApproveModal'
import RejectModal from '@/components/requests/RejectModal'
import AssignModal from '@/components/requests/AssignModal'
import ProgressModal from '@/components/requests/ProgressModal'
import StatusModal from '@/components/requests/StatusModal'
import type { RequestStatus } from '@/lib/types'

const WF_STEPS: { key: RequestStatus; label: string }[] = [
  { key: 'open',             label: 'คำร้องใหม่' },
  { key: 'in_progress',      label: 'กำลังดำเนินการ' },
  { key: 'waiting_approval', label: 'รออนุมัติ' },
  { key: 'completed',        label: 'เสร็จสิ้น' },
]
const WF_ORDER = WF_STEPS.map(s => s.key)

type ModalKind = null | 'approve' | 'reject' | 'assign' | 'progress' | 'status' | 'take'

export default function RequestDetailPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ from?: string, ev?: string }> }) {
  const { id } = use(params)
  const { from, ev } = use(searchParams)
  const {
    store, currentUser,
    takeRequest, reassignRequest, changeStatus,
    updateProgress, deleteRequest,
    approveRequest, rejectRequest, addComment, showToast,
  } = useApp()
  const router = useRouter()

  const backPath = from || '/requests'

  const request = store.requests.find(r => r.id === id)

  const [modal, setModal]           = useState<ModalKind>(null)
  const [comment, setComment]       = useState('')
  const [commentFiles, setCommentFiles] = useState<File[]>([])
  const [sendingComment, setSendingComment] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]     = useState(false)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null)

  const eventCount = request?.events.length ?? 0
  useEffect(() => {
    if (ev == null || !request) return
    const idx = Number(ev)
    if (Number.isNaN(idx)) return
    const t = setTimeout(() => {
      const el = document.getElementById(`ev-${idx}`)
      if (!el) return
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setHighlightIdx(idx)
      setTimeout(() => setHighlightIdx(null), 1200)
    }, 150)
    return () => clearTimeout(t)
  }, [ev, request?.id, eventCount])

  if (!request) {
    return (
      <div className="p-7 max-w-[1400px] mx-auto">
        <div className="text-center py-20">
          <div className="text-[16px] font-semibold">ไม่พบคำร้องนี้</div>
          <button className="px-4 py-2 mt-4 text-[13px] border rounded-md hover:bg-gray-50" onClick={() => router.push(backPath)}>← กลับรายการ</button>
        </div>
      </div>
    )
  }

  if (!canViewRequest(currentUser, request)) {
    return (
      <div className="p-7 max-w-[1400px] mx-auto">
        <div className="text-center py-20">
          <div className="text-[16px] font-semibold">ไม่มีสิทธิ์เข้าถึงคำร้องนี้</div>
          <div className="text-[13px] text-gray-500 mt-1">คำร้องนี้ไม่ได้อยู่ในแผนกของคุณ</div>
          <button className="px-4 py-2 mt-4 text-[13px] border rounded-md hover:bg-gray-50" onClick={() => router.push(backPath)}>← กลับรายการ</button>
        </div>
      </div>
    )
  }

  const requester = store.users.find(u => u.id === request.requesterId)
  const assignee  = store.users.find(u => u.id === request.assigneeId)
  const approver  = store.users.find(u => u.id === request.approverId)
  const officers  = sameDeptOfficers(store.users, request.department)

  const now = Date.now()
  const overdue = new Date(request.dueAt).getTime() < now && !['completed','rejected'].includes(request.status)
  const role = currentUser?.role ?? 'staff'

  const canOfficerAct = ['officer','admin'].includes(role)
  const canManagerAct = canApprove(currentUser, request)
  const canEdit = (currentUser?.id === request.requesterId && request.status === 'open') || role === 'admin'
  const canDeleteThis = canDelete(currentUser, request)

  const currentWfIdx = WF_ORDER.indexOf(request.status)
  const isRejected = request.status === 'rejected'

  function closeModal() { setModal(null) }

  async function handleDelete() {
    setDeleting(true)
    await deleteRequest(id)
    router.push(backPath)
  }

  async function handleComment() {
    if (!comment.trim() && commentFiles.length === 0) return
    if (sendingComment) return
    setSendingComment(true)
    try {
      const uploaded = await Promise.all(
        commentFiles.map(async f => {
          const fd = new FormData()
          fd.append('file', f)
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          if (!res.ok) throw new Error(`อัปโหลด "${f.name}" ไม่สำเร็จ`)
          return res.json() as Promise<{ name: string; url: string }>
        })
      )
      const msg = uploaded.length > 0
        ? `${comment.trim()}|||${JSON.stringify(uploaded)}`
        : comment.trim()
      await addComment(id, msg)
      setComment('')
      setCommentFiles([])
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'ส่งความคิดเห็นไม่สำเร็จ')
    } finally {
      setSendingComment(false)
    }
  }

  return (
    <div className="p-4 lg:p-7 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="min-w-0">
          <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[13px] mb-2" onClick={() => router.push(backPath)}>
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
        <div className="flex items-center gap-2 flex-shrink-0">
          {canEdit && (
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-gray-200 text-[13px] font-medium text-gray-700 hover:bg-gray-50" onClick={() => router.push(`/requests/${id}/edit${from ? `?from=${encodeURIComponent(from)}` : ''}`)}>
              <Icon name="edit" size={14}/> แก้ไข
            </button>
          )}
          {canDeleteThis && (
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-red-200 text-[13px] font-medium text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(true)}>
              <Icon name="trash-2" size={14}/> ลบ
            </button>
          )}
        </div>
      </div>

      {!isRejected && (
        <div className="overflow-x-auto mb-5">
          <div className="flex items-start p-4 sm:p-5 bg-slate-50 rounded-lg min-w-[340px]">
            {WF_STEPS.map((step, i) => {
              const stepIdx = WF_ORDER.indexOf(step.key)
              const done    = stepIdx < currentWfIdx
              const current = stepIdx === currentWfIdx
              const isLast  = i === WF_STEPS.length - 1
              return (
                <div key={step.key} className={`flex items-start ${!isLast ? 'flex-1 min-w-0' : 'flex-shrink-0'}`}>
                  <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all ${done ? 'bg-emerald-500 text-white' : current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-white text-gray-400 border-2 border-gray-300'}`}>
                      {done ? '✓' : i + 1}
                    </div>
                    <span className={`text-[11px] font-medium whitespace-nowrap ${current ? 'text-indigo-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {!isLast && (
                    <div className={`flex-1 h-0.5 mt-3.5 mx-2 ${done ? 'bg-emerald-400' : 'bg-gray-300'}`}/>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <p className="text-[14px] text-gray-900 leading-relaxed mb-5">{request.description}</p>
            <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-[13px]">
              <dt className="text-gray-500 text-[12px]">ผู้ยื่น</dt>
              <dd className="m-0 flex items-center gap-2">
                <Avatar name={requester ? fullName(requester) : '?'} size="sm"/>
                <span className="text-gray-900">{requester ? formalName(requester) : '—'}</span>
              </dd>
              <dt className="text-gray-500 text-[12px]">ผู้รับผิดชอบ</dt>
              <dd className="m-0 flex items-center gap-2">
                {assignee ? (
                  <>
                    <Avatar name={fullName(assignee)} size="sm"/>
                    <span className="text-gray-900">{formalName(assignee)}</span>
                  </>
                ) : <span className="text-gray-400">ยังไม่มอบหมาย</span>}
              </dd>
              <dt className="text-gray-500 text-[12px]">ผู้อนุมัติ</dt>
              <dd className="m-0 text-gray-900">{approver ? formalName(approver) : '—'}</dd>
              <dt className="text-gray-500 text-[12px]">ฝ่าย</dt>
              <dd className="m-0 text-gray-900">{deptById(request.department, store.departments)?.name ?? request.department}</dd>
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
                {request.attachments.map((a, i) => {
                  const canPreview = a.url && /\.(pdf|png|jpe?g)$/i.test(a.name)
                  return (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 bg-slate-50 border border-gray-200 rounded-md text-[13px]">
                    <Icon name="paperclip" size={14} className="text-gray-400 flex-shrink-0"/>
                    <button
                      className={`flex-1 truncate text-left ${canPreview ? 'text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer' : 'text-gray-900 cursor-default'}`}
                      onClick={() => canPreview && setPreviewFile({ url: a.url!, name: a.name })}
                      title={canPreview ? 'คลิกเพื่อดูตัวอย่าง' : a.name}
                    >
                      {a.name}
                    </button>
                    <span className="text-[11px] text-gray-400 font-mono flex-shrink-0">{a.size}</span>
                    {a.url ? (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {canPreview && (
                          <button onClick={() => setPreviewFile({ url: a.url!, name: a.name })} className="text-indigo-600 hover:text-indigo-800 transition-colors" title="ดูตัวอย่าง">
                            <Icon name="eye" size={13}/>
                          </button>
                        )}
                        <a href={a.url} download={a.name} className="text-gray-400 hover:text-gray-700 transition-colors" title="ดาวน์โหลด">
                          <Icon name="download" size={13}/>
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-300 cursor-not-allowed flex-shrink-0"><Icon name="download" size={13}/></span>
                    )}
                  </div>
                  )
                })}
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
                    <div
                      key={i}
                      id={`ev-${i}`}
                      className={`flex gap-3 transition-all duration-300 ${highlightIdx === i ? 'ring-2 ring-indigo-400 bg-indigo-50/60 rounded-lg -m-1.5 p-1.5' : ''}`}
                    >
                      <Avatar name={actor ? fullName(actor) : 'ระบบ'} size="sm"/>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-[13px] font-semibold text-gray-900">{actor ? formalName(actor) : 'ระบบ'}</span>
                          <span className="text-[11px] text-gray-400">{fmtRelative(ev.time)}</span>
                        </div>
                        <div className={`p-2.5 px-3 rounded-md text-[13px] border ${ev.kind === 'approve' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : ev.kind === 'reject' ? 'bg-red-50 text-red-800 border-red-100' : 'bg-gray-50 border-gray-100 text-gray-800'}`}>
                          {(() => {
                            const [text, filesPart] = ev.msg.split('|||')
                            const files: { name: string; url: string }[] = filesPart ? JSON.parse(filesPart) : []
                            return (
                              <>
                                {text && <p className="m-0 whitespace-pre-wrap">{text}</p>}
                                {files.length > 0 && (
                                  <div className={`flex flex-col gap-1 ${text ? 'mt-2 pt-2 border-t border-current/10' : ''}`}>
                                    {files.map((f, fi) => {
                                      const canPrev = /\.(pdf|png|jpe?g)$/i.test(f.name)
                                      return (
                                        <div key={fi} className="flex items-center gap-1.5">
                                          <Icon name="paperclip" size={11} className="flex-shrink-0 opacity-60"/>
                                          {canPrev ? (
                                            <button className="text-left underline underline-offset-2 opacity-80 hover:opacity-100 truncate max-w-[200px]" onClick={() => setPreviewFile({ url: f.url, name: f.name })}>
                                              {f.name}
                                            </button>
                                          ) : (
                                            <a href={f.url} download={f.name} className="underline underline-offset-2 opacity-80 hover:opacity-100 truncate max-w-[200px]">{f.name}</a>
                                          )}
                                          <a href={f.url} download={f.name} className="opacity-50 hover:opacity-100 flex-shrink-0" title="ดาวน์โหลด">
                                            <Icon name="download" size={11}/>
                                          </a>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </>
                            )
                          })()}
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
                {commentFiles.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {commentFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-md text-[12px]">
                        <Icon name="paperclip" size={12} className="text-indigo-400 flex-shrink-0"/>
                        <span className="flex-1 truncate text-gray-700">{f.name}</span>
                        <span className="text-gray-400">({(f.size/1024).toFixed(1)} KB)</span>
                        <button onClick={() => setCommentFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 transition-colors">
                          <Icon name="x" size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-[12px] text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors">
                    <Icon name="paperclip" size={13}/>
                    แนบไฟล์
                    <input type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={e => { if (e.target.files) setCommentFiles(prev => [...prev, ...Array.from(e.target.files!)]) }}
                    />
                  </label>
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-[13px] bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    onClick={handleComment}
                    disabled={(!comment.trim() && commentFiles.length === 0) || sendingComment}
                  >
                    <Icon name="send" size={13}/> {sendingComment ? 'กำลังส่ง...' : 'ส่ง'}
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
                <button className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-md hover:border-indigo-500 transition-colors disabled:opacity-50" disabled={request.status !== 'open'} onClick={() => setModal('take')}>
                  <Icon name="play" size={16} className="text-indigo-600"/>
                  <span className="text-[12px] font-semibold">รับงาน</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-md hover:border-indigo-500 transition-colors" onClick={() => setModal('assign')}>
                  <Icon name="users" size={16} className="text-indigo-600"/>
                  <span className="text-[12px] font-semibold">มอบหมาย</span>
                </button>
                <button className="flex flex-col items-center gap-1.5 p-3 bg-white border border-gray-200 rounded-md hover:border-indigo-500 transition-colors disabled:opacity-50" disabled={request.status === 'open' || request.status === 'completed' || request.status === 'rejected'} onClick={() => setModal('progress')}>
                  <Icon name="zap" size={16} className="text-indigo-600"/>
                  <span className="text-[12px] font-semibold">ความคืบหน้า</span>
                </button>
              </div>

              <button className="w-full flex items-center justify-between p-3 mt-4 bg-white border border-dashed border-indigo-400 rounded-md text-[12px] text-gray-700 hover:bg-indigo-50" onClick={() => setModal('status')}>
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
                <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-[14px] font-medium" onClick={() => setModal('approve')}>
                  <Icon name="check" size={14}/> อนุมัติคำร้อง
                </button>
                <button className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 text-[14px] font-medium" onClick={() => setModal('reject')}>
                  <Icon name="x" size={14}/> ปฏิเสธคำร้อง
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal === 'take' && (
        <TakeModal
          requestTitle={request.title}
          onClose={closeModal}
          onConfirm={() => { takeRequest(id); closeModal() }}
        />
      )}

      {modal === 'approve' && (
        <ApproveModal
          onClose={closeModal}
          onConfirm={note => { approveRequest(id, note); closeModal() }}
        />
      )}

      {modal === 'reject' && (
        <RejectModal
          onClose={closeModal}
          onConfirm={note => { rejectRequest(id, note); closeModal() }}
        />
      )}

      {modal === 'assign' && (
        <AssignModal
          officers={officers}
          currentAssigneeId={request.assigneeId}
          onClose={closeModal}
          onConfirm={(assigneeId, note) => { reassignRequest(id, assigneeId, note); closeModal() }}
        />
      )}

      {modal === 'progress' && (
        <ProgressModal
          initialProgress={request.progress}
          onClose={closeModal}
          onConfirm={(progress, note) => { updateProgress(id, progress, note || `อัปเดตความคืบหน้า ${progress}%`); closeModal() }}
        />
      )}

      {modal === 'status' && (
        <StatusModal
          currentStatus={request.status}
          onClose={closeModal}
          onConfirm={status => { changeStatus(id, status, ''); closeModal() }}
        />
      )}

      {previewFile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4" onClick={() => setPreviewFile(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[900px] flex flex-col overflow-hidden" style={{ height: '88vh' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Icon name="paperclip" size={14} className="text-gray-400 flex-shrink-0"/>
                <span className="text-[14px] font-medium text-gray-900 truncate">{previewFile.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <a href={previewFile.url} download={previewFile.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50 transition-colors">
                  <Icon name="download" size={13}/> ดาวน์โหลด
                </a>
                <button onClick={() => setPreviewFile(null)} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 transition-colors">
                  <Icon name="x" size={16}/>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100">
              {/\.(png|jpe?g)$/i.test(previewFile.name) ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-md shadow"/>
                </div>
              ) : (
                <iframe src={previewFile.url} className="w-full h-full border-0" title={previewFile.name}/>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[400px] overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="text-[16px] font-semibold text-gray-900">ยืนยันการลบคำร้อง</div>
            </div>
            <div className="px-6 py-5">
              <p className="text-[14px] text-gray-600 leading-relaxed">
                คำร้อง <span className="font-semibold text-gray-900">"{request.title}"</span> จะถูกซ่อนออกจากระบบ
              </p>
              <p className="text-[12px] text-gray-400 mt-2">ข้อมูลยังคงอยู่ในฐานข้อมูลและสามารถตรวจสอบได้จาก Audit Log</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-2">
              <button className="px-4 py-2 text-[13px] rounded-md border border-gray-200 hover:bg-white" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                ยกเลิก
              </button>
              <button className="px-4 py-2 text-[13px] rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
