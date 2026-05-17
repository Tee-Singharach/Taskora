'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import type { RequestPriority } from '@/lib/types'

export default function EditRequestPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ from?: string }> }) {
  const { id } = use(params)
  const { from } = use(searchParams)
  const { store, updateRequest, showToast } = useApp()
  const departments = store.departments
  const router = useRouter()

  const backPath = from ? `/requests/${id}?from=${encodeURIComponent(from)}` : `/requests/${id}`

  const request = store.requests.find(r => r.id === id)

  const [form, setForm] = useState({
    title: request?.title ?? '',
    description: request?.description ?? '',
    priority: (request?.priority ?? 'normal') as RequestPriority,
    department: request?.department ?? '',
    dueAt: request?.dueAt ? request.dueAt.split('T')[0] : '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!request) {
    return (
      <div className="page">
        <div className="empty" style={{ paddingTop: 80 }}>
          <div className="title">ไม่พบคำร้องนี้</div>
          <button className="btn btn-ghost btn-md mt-4" onClick={() => router.push('/requests')}>← กลับรายการ</button>
        </div>
      </div>
    )
  }

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim())       e.title = 'กรุณากรอกชื่อคำร้อง'
    if (!form.description.trim()) e.description = 'กรุณากรอกรายละเอียด'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    updateRequest(id, {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      department: form.department,
      dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : request!.dueAt,
    })
    router.push(backPath)
  }

  return (
    <div className="p-4 lg:p-7 max-w-[680px] mx-auto">
      <div className="mb-6">
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[13px] mb-2" onClick={() => router.push(backPath)}>
          ← ย้อนกลับ
        </button>
        <h1 className="text-[22px] font-semibold tracking-tighter m-0">แก้ไขคำร้อง</h1>
        <div className="text-[12px] text-gray-400 font-mono mt-1">{id}</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">ชื่อคำร้อง <span className="text-red-500">*</span></label>
            <input className={`w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500 ${errors.title ? 'border-red-500' : ''}`} type="text" value={form.title} onChange={e => set('title', e.target.value)}/>
            {errors.title && <div className="text-[11px] text-red-500">{errors.title}</div>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">รายละเอียด <span className="text-red-500">*</span></label>
            <textarea className={`w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500 ${errors.description ? 'border-red-500' : ''}`} value={form.description} onChange={e => set('description', e.target.value)} rows={5}/>
            {errors.description && <div className="text-[11px] text-red-500">{errors.description}</div>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-gray-500">ความสำคัญ</label>
              <select className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500" value={form.priority} onChange={e => set('priority', e.target.value as RequestPriority)}>
                <option value="low">ต่ำ</option>
                <option value="normal">ปกติ</option>
                <option value="high">สูง</option>
                <option value="urgent">เร่งด่วน</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-gray-500">ฝ่าย / แผนก</label>
              <select className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500" value={form.department} onChange={e => set('department', e.target.value)}>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">วันกำหนด</label>
            <input className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500" type="date" value={form.dueAt} onChange={e => set('dueAt', e.target.value)}/>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-6">
        <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={() => router.push(backPath)}>ยกเลิก</button>
        <button className="px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={handleSave}>บันทึกการแก้ไข</button>
      </div>
    </div>
  )
}
