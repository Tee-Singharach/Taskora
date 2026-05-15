'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import type { AppStore, User, Request, RequestStatus, RequestPriority, ToastItem, AuditEntry } from '@/lib/types'
import { loadStore, saveStore } from '@/lib/store'
import { genId, fmtDate } from '@/lib/utils'

interface AppContextType {
  store: AppStore
  currentUser: User | undefined
  setCurrentUserId: (id: string) => void
  addRequest: (data: Omit<Request, 'id' | 'createdAt' | 'events'>) => Request
  updateRequest: (id: string, patch: Partial<Pick<Request, 'title' | 'description' | 'department' | 'priority' | 'dueAt' | 'attachments'>>) => void
  takeRequest: (id: string) => void
  reassignRequest: (id: string, assigneeId: string, note: string) => void
  changeStatus: (id: string, status: RequestStatus, note: string) => void
  updateProgress: (id: string, progress: number, note: string) => void
  submitForApproval: (id: string) => void
  approveRequest: (id: string, note: string) => void
  rejectRequest: (id: string, note: string) => void
  addComment: (id: string, msg: string) => void
  addUser: (data: Omit<User, 'id'>) => void
  updateUser: (id: string, patch: Partial<User>) => void
  toasts: ToastItem[]
  showToast: (type: ToastItem['type'], message: string) => void
  removeToast: (id: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<AppStore>({ users: [], requests: [], auditLog: [], currentUserId: 'u01', schemaVersion: 2 })
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setStore(loadStore()); setMounted(true) }, [])
  useEffect(() => { if (mounted) saveStore(store) }, [store, mounted])

  const showToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = genId('toast')
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const setCurrentUserId = useCallback((id: string) => {
    setStore(prev => ({ ...prev, currentUserId: id }))
  }, [])

  const pushAudit = useCallback((store: AppStore, action: string, target: string, detail: string, cat: AuditEntry['cat']): AuditEntry => ({
    id: genId('a'),
    time: new Date().toISOString(),
    actor: store.currentUserId,
    action,
    target,
    detail,
    cat,
  }), [])

  const addRequest = useCallback((data: Omit<Request, 'id' | 'createdAt' | 'events'>) => {
    const now = new Date().toISOString()
    const req: Request = {
      ...data,
      id: `REQ-${Date.now()}`,
      createdAt: now,
      events: [{ kind: 'system', actorId: data.requesterId, time: now, msg: 'สร้างคำร้องและส่งเข้าระบบ' }],
    }
    setStore(prev => ({
      ...prev,
      requests: [...prev.requests, req],
      auditLog: [...prev.auditLog, pushAudit(prev, 'สร้างคำร้องใหม่', req.id, req.title, 'workflow')],
    }))
    return req
  }, [pushAudit])

  const updateRequest = useCallback((id: string, patch: Partial<Pick<Request, 'title' | 'description' | 'department' | 'priority' | 'dueAt' | 'attachments'>>) => {
    setStore(prev => ({
      ...prev,
      requests: prev.requests.map(r => r.id === id ? { ...r, ...patch } : r),
    }))
    showToast('success', 'บันทึกการแก้ไขเรียบร้อย')
  }, [showToast])

  const addEvent = useCallback((id: string, kind: 'system' | 'comment' | 'approve' | 'reject', msg: string) => {
    const ev = { kind, actorId: '' as string, time: new Date().toISOString(), msg }
    setStore(prev => {
      ev.actorId = prev.currentUserId
      return {
        ...prev,
        requests: prev.requests.map(r => r.id === id ? { ...r, events: [...r.events, ev] } : r),
      }
    })
  }, [])

  const takeRequest = useCallback((id: string) => {
    setStore(prev => {
      const req = prev.requests.find(r => r.id === id)
      if (!req) return prev
      const u = prev.users.find(u => u.id === prev.currentUserId)
      const now = new Date().toISOString()
      const ev = { kind: 'system' as const, actorId: prev.currentUserId, time: now, msg: `${u?.name ?? '—'} รับงานและเริ่มดำเนินการ` }
      return {
        ...prev,
        requests: prev.requests.map(r => r.id === id
          ? { ...r, status: 'in_progress', assigneeId: prev.currentUserId, events: [...r.events, ev] }
          : r),
        auditLog: [...prev.auditLog, pushAudit(prev, 'รับงาน', id, 'เริ่มดำเนินการ', 'workflow')],
      }
    })
    showToast('success', 'รับงานเรียบร้อย เริ่มดำเนินการได้เลย')
  }, [showToast, pushAudit])

  const reassignRequest = useCallback((id: string, assigneeId: string, note: string) => {
    setStore(prev => {
      const assignee = prev.users.find(u => u.id === assigneeId)
      const now = new Date().toISOString()
      const ev = { kind: 'system' as const, actorId: prev.currentUserId, time: now, msg: `มอบหมายงานให้ ${assignee?.name ?? assigneeId}${note ? ' — ' + note : ''}` }
      return {
        ...prev,
        requests: prev.requests.map(r => r.id === id
          ? { ...r, assigneeId, events: [...r.events, ev] }
          : r),
        auditLog: [...prev.auditLog, pushAudit(prev, 'มอบหมายงาน', id, `ส่งต่อให้ ${assignee?.name}`, 'workflow')],
      }
    })
    showToast('success', 'มอบหมายงานเรียบร้อย')
  }, [showToast, pushAudit])

  const changeStatus = useCallback((id: string, status: RequestStatus, note: string) => {
    setStore(prev => {
      const now = new Date().toISOString()
      const ev = { kind: 'system' as const, actorId: prev.currentUserId, time: now, msg: note || `เปลี่ยนสถานะงาน` }
      return {
        ...prev,
        requests: prev.requests.map(r => r.id === id
          ? { ...r, status, events: [...r.events, ev] }
          : r),
        auditLog: [...prev.auditLog, pushAudit(prev, 'เปลี่ยนสถานะ', id, status, 'workflow')],
      }
    })
    showToast('success', 'อัปเดตสถานะเรียบร้อย')
  }, [showToast, pushAudit])

  const updateProgress = useCallback((id: string, progress: number, note: string) => {
    setStore(prev => {
      const now = new Date().toISOString()
      const ev = { kind: 'system' as const, actorId: prev.currentUserId, time: now, msg: `อัปเดตความคืบหน้า ${progress}% — ${note}` }
      return {
        ...prev,
        requests: prev.requests.map(r => r.id === id
          ? { ...r, progress, events: [...r.events, ev] }
          : r),
      }
    })
    showToast('success', `บันทึกความคืบหน้า ${progress}% เรียบร้อย`)
  }, [showToast])

  const submitForApproval = useCallback((id: string) => {
    setStore(prev => {
      const now = new Date().toISOString()
      const approver = prev.requests.find(r => r.id === id)?.approverId
      const approverName = prev.users.find(u => u.id === approver)?.name ?? 'หัวหน้างาน'
      const ev = { kind: 'system' as const, actorId: prev.currentUserId, time: now, msg: `ส่งเรื่องให้ ${approverName} พิจารณาอนุมัติ` }
      return {
        ...prev,
        requests: prev.requests.map(r => r.id === id
          ? { ...r, status: 'waiting_approval', progress: 95, events: [...r.events, ev] }
          : r),
        auditLog: [...prev.auditLog, pushAudit(prev, 'ส่งอนุมัติ', id, 'รออนุมัติ', 'workflow')],
      }
    })
    showToast('success', 'ส่งให้พิจารณาอนุมัติเรียบร้อย')
  }, [showToast, pushAudit])

  const approveRequest = useCallback((id: string, note: string) => {
    setStore(prev => {
      const now = new Date().toISOString()
      const ev = { kind: 'approve' as const, actorId: prev.currentUserId, time: now, msg: note || 'อนุมัติเรียบร้อย' }
      return {
        ...prev,
        requests: prev.requests.map(r => r.id === id
          ? { ...r, status: 'completed', progress: 100, events: [...r.events, ev] }
          : r),
        auditLog: [...prev.auditLog, pushAudit(prev, 'อนุมัติคำร้อง', id, note || 'อนุมัติ', 'workflow')],
      }
    })
    showToast('success', 'อนุมัติคำร้องเรียบร้อย')
  }, [showToast, pushAudit])

  const rejectRequest = useCallback((id: string, note: string) => {
    setStore(prev => {
      const now = new Date().toISOString()
      const ev = { kind: 'reject' as const, actorId: prev.currentUserId, time: now, msg: note }
      return {
        ...prev,
        requests: prev.requests.map(r => r.id === id
          ? { ...r, status: 'rejected', events: [...r.events, ev] }
          : r),
        auditLog: [...prev.auditLog, pushAudit(prev, 'ปฏิเสธคำร้อง', id, note, 'workflow')],
      }
    })
    showToast('warning', 'ปฏิเสธคำร้องแล้ว')
  }, [showToast, pushAudit])

  const addComment = useCallback((id: string, msg: string) => {
    setStore(prev => {
      const now = new Date().toISOString()
      const ev = { kind: 'comment' as const, actorId: prev.currentUserId, time: now, msg }
      return {
        ...prev,
        requests: prev.requests.map(r => r.id === id
          ? { ...r, events: [...r.events, ev] }
          : r),
      }
    })
    showToast('success', 'เพิ่มความคิดเห็นแล้ว')
  }, [showToast])

  const addUser = useCallback((data: Omit<User, 'id'>) => {
    setStore(prev => ({
      ...prev,
      users: [...prev.users, { ...data, id: genId('u') }],
      auditLog: [...prev.auditLog, pushAudit(prev, 'สร้างผู้ใช้ใหม่', data.name, `${data.email}`, 'user')],
    }))
    showToast('success', 'เพิ่มผู้ใช้เรียบร้อย')
  }, [showToast, pushAudit])

  const updateUser = useCallback((id: string, patch: Partial<User>) => {
    setStore(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === id ? { ...u, ...patch } : u),
      auditLog: [...prev.auditLog, pushAudit(prev, 'อัปเดตข้อมูลผู้ใช้', id, '', 'user')],
    }))
    showToast('success', 'อัปเดตข้อมูลผู้ใช้แล้ว')
  }, [showToast, pushAudit])

  const currentUser = useMemo(() => store.users.find(u => u.id === store.currentUserId), [store.users, store.currentUserId])

  return (
    <AppContext.Provider value={{
      store, currentUser, setCurrentUserId,
      addRequest, updateRequest, takeRequest, reassignRequest,
      changeStatus, updateProgress, submitForApproval,
      approveRequest, rejectRequest, addComment,
      addUser, updateUser,
      toasts, showToast, removeToast,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
