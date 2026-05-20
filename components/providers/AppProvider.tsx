'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import type { AppStore, User, Department, Request, RequestStatus, ToastItem } from '@/lib/types'
import { genId } from '@/lib/utils'
import * as api from '@/app/actions'

interface AppContextType {
  store: AppStore
  currentUser: User | undefined
  loading: boolean
  setCurrentUserId: (id: string) => void
  addRequest: (data: Omit<Request, 'id' | 'createdAt' | 'events'>) => Promise<Request>
  updateRequest: (id: string, patch: Partial<Pick<Request, 'title' | 'description' | 'type' | 'department' | 'priority' | 'dueAt' | 'attachments'>>) => Promise<void>
  takeRequest: (id: string) => Promise<void>
  reassignRequest: (id: string, assigneeId: string, note: string) => Promise<void>
  changeStatus: (id: string, status: RequestStatus, note: string) => Promise<void>
  updateProgress: (id: string, progress: number, note: string) => Promise<void>
  submitForApproval: (id: string) => Promise<void>
  approveRequest: (id: string, note: string) => Promise<void>
  rejectRequest: (id: string, note: string) => Promise<void>
  deleteRequest: (id: string) => Promise<void>
  addComment: (id: string, msg: string) => Promise<void>
  addUser: (data: Omit<User, 'id'>) => Promise<void>
  updateUser: (id: string, patch: Partial<User>) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  addDept: (data: Department) => Promise<void>
  updateDept: (id: string, patch: Partial<Omit<Department, 'id'>>) => Promise<void>
  deleteDept: (id: string) => Promise<void>
  toasts: ToastItem[]
  showToast: (type: ToastItem['type'], message: string) => void
  removeToast: (id: string) => void
}

const AppContext = createContext<AppContextType | null>(null)

const UID_KEY = 'taskora_uid'
const SCHEMA_VERSION = 4

const EMPTY: AppStore = {
  users: [], departments: [], requests: [], auditLog: [],
  currentUserId: 'u01', schemaVersion: SCHEMA_VERSION,
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<AppStore>(EMPTY)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [loading, setLoading] = useState(true)

  const showToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = genId('toast')
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const refresh = useCallback(async () => {
    const data = await api.getStore()
    setStore(prev => ({ ...data, currentUserId: prev.currentUserId, schemaVersion: SCHEMA_VERSION }))
  }, [])

  useEffect(() => {
    const uid = (typeof window !== 'undefined' && localStorage.getItem(UID_KEY)) || 'u01'
    api.getStore()
      .then(data => setStore({ ...data, currentUserId: uid, schemaVersion: SCHEMA_VERSION }))
      .catch(() => showToast('error', 'โหลดข้อมูลจากเซิร์ฟเวอร์ไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [showToast])

  const setCurrentUserId = useCallback((id: string) => {
    if (typeof window !== 'undefined') localStorage.setItem(UID_KEY, id)
    setStore(prev => ({ ...prev, currentUserId: id }))
  }, [])

  // Wrap a server mutation: run it, refetch, toast. Errors surface as an error toast.
  const run = useCallback(async (fn: () => Promise<void>, successMsg: string | null, msgType: ToastItem['type'] = 'success') => {
    try {
      await fn()
      await refresh()
      if (successMsg) showToast(msgType, successMsg)
    } catch {
      showToast('error', 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่')
    }
  }, [refresh, showToast])

  const addRequest = useCallback(async (data: Omit<Request, 'id' | 'createdAt' | 'events'>) => {
    const req = await api.createRequest(data, store.currentUserId)
    await refresh()
    return req
  }, [store.currentUserId, refresh])

  const updateRequest = useCallback((id: string, patch: Partial<Pick<Request, 'title' | 'description' | 'type' | 'department' | 'priority' | 'dueAt' | 'attachments'>>) =>
    run(() => api.editRequest(id, patch), 'บันทึกการแก้ไขเรียบร้อย'), [run])

  const takeRequest = useCallback((id: string) =>
    run(() => api.takeRequest(id, store.currentUserId), 'รับงานเรียบร้อย เริ่มดำเนินการได้เลย'), [run, store.currentUserId])

  const reassignRequest = useCallback((id: string, assigneeId: string, note: string) =>
    run(() => api.reassignRequest(id, assigneeId, store.currentUserId, note), 'มอบหมายงานเรียบร้อย'), [run, store.currentUserId])

  const changeStatus = useCallback((id: string, status: RequestStatus, note: string) =>
    run(() => api.changeStatus(id, status, store.currentUserId, note), 'อัปเดตสถานะเรียบร้อย'), [run, store.currentUserId])

  const updateProgress = useCallback((id: string, progress: number, note: string) =>
    run(() => api.updateProgress(id, progress, store.currentUserId, note), `บันทึกความคืบหน้า ${progress}% เรียบร้อย`), [run, store.currentUserId])

  const submitForApproval = useCallback((id: string) =>
    run(() => api.submitForApproval(id, store.currentUserId), 'ส่งให้พิจารณาอนุมัติเรียบร้อย'), [run, store.currentUserId])

  const approveRequest = useCallback((id: string, note: string) =>
    run(() => api.approveRequest(id, store.currentUserId, note), 'อนุมัติคำร้องเรียบร้อย'), [run, store.currentUserId])

  const rejectRequest = useCallback((id: string, note: string) =>
    run(() => api.rejectRequest(id, store.currentUserId, note), 'ปฏิเสธคำร้องแล้ว', 'warning'), [run, store.currentUserId])

  const deleteRequest = useCallback((id: string) =>
    run(() => api.deleteRequest(id, store.currentUserId), 'ลบคำร้องแล้ว', 'warning'), [run, store.currentUserId])

  const addComment = useCallback((id: string, msg: string) =>
    run(() => api.addComment(id, store.currentUserId, msg), 'เพิ่มความคิดเห็นแล้ว'), [run, store.currentUserId])

  const addUser = useCallback((data: Omit<User, 'id'>) =>
    run(() => api.addUser(data, store.currentUserId), 'เพิ่มผู้ใช้เรียบร้อย'), [run, store.currentUserId])

  const updateUser = useCallback((id: string, patch: Partial<User>) =>
    run(() => api.updateUser(id, patch, store.currentUserId), 'อัปเดตข้อมูลผู้ใช้แล้ว'), [run, store.currentUserId])

  const changePassword = useCallback((currentPassword: string, newPassword: string) =>
    run(() => api.changePassword(store.currentUserId, currentPassword, newPassword, store.currentUserId), 'เปลี่ยนรหัสผ่านเรียบร้อย'), [run, store.currentUserId])

  const deleteUser = useCallback((id: string) =>
    run(() => api.deleteUser(id, store.currentUserId), 'ลบผู้ใช้แล้ว', 'warning'), [run, store.currentUserId])

  const addDept = useCallback((data: Department) =>
    run(() => api.addDept(data, store.currentUserId), 'เพิ่มแผนกเรียบร้อย'), [run, store.currentUserId])

  const updateDept = useCallback((id: string, patch: Partial<Omit<Department, 'id'>>) =>
    run(() => api.updateDept(id, patch, store.currentUserId), 'อัปเดตแผนกแล้ว'), [run, store.currentUserId])

  const deleteDept = useCallback((id: string) =>
    run(() => api.deleteDept(id, store.currentUserId), 'ลบแผนกแล้ว', 'warning'), [run, store.currentUserId])

  const currentUser = useMemo(() => store.users.find(u => u.id === store.currentUserId), [store.users, store.currentUserId])

  return (
    <AppContext.Provider value={{
      store, currentUser, loading, setCurrentUserId,
      addRequest, updateRequest, deleteRequest, takeRequest, reassignRequest,
      changeStatus, updateProgress, submitForApproval,
      approveRequest, rejectRequest, addComment,
      addUser, updateUser, changePassword, deleteUser,
      addDept, updateDept, deleteDept,
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
