'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import Icon from '@/components/ui/Icon'
import { DEPARTMENTS } from '@/lib/utils'
import type { RequestPriority } from '@/lib/types'

export default function NewRequestPage() {
  const { addRequest, store, showToast } = useApp()
  const router = useRouter()

  const currentUser = store.users.find(u => u.id === store.currentUserId)
  const firstManager = store.users.find(u => u.role === 'manager')

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'normal' as RequestPriority,
    department: currentUser?.dept ?? DEPARTMENTS[0].id,
    dueAt: '',
    attachments: [] as File[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      set('attachments', [...form.attachments, ...newFiles])
    }
  }

  function removeFile(index: number) {
    set('attachments', form.attachments.filter((_, i) => i !== index))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim())       e.title = 'กรุณากรอกชื่อคำร้อง'
    if (!form.description.trim()) e.description = 'กรุณากรอกรายละเอียด'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    if (saving) return
    setSaving(true)
    try {
      const req = addRequest({
        title: form.title.trim(),
        description: form.description.trim(),
        department: form.department,
        priority: form.priority,
        status: 'open',
        progress: 0,
        requesterId: store.currentUserId,
        assigneeId: null,
        approverId: firstManager?.id ?? store.currentUserId,
        dueAt: form.dueAt || new Date(Date.now() + 14 * 86400000).toISOString(),
        attachments: form.attachments.map(f => ({ name: f.name, size: `${(f.size / 1024).toFixed(1)} KB` })),
      })
      showToast('success', 'ยื่นคำร้องเรียบร้อยแล้ว')
      router.push(`/requests/${req.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-7 max-w-[680px] mx-auto">
      <div className="mb-6">
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[13px] mb-2" onClick={() => router.back()}>
          ← ย้อนกลับ
        </button>
        <h1 className="text-[22px] font-semibold tracking-tighter m-0">สร้างคำร้องใหม่</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">ชื่อคำร้อง <span className="text-red-500">*</span></label>
            <input
              className={`w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500 ${errors.title ? 'border-red-500' : ''}`}
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="ระบุหัวข้อคำร้องให้ชัดเจน"
            />
            {errors.title && <div className="text-[11px] text-red-500">{errors.title}</div>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">รายละเอียด <span className="text-red-500">*</span></label>
            <textarea
              className={`w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500 ${errors.description ? 'border-red-500' : ''}`}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={5}
              placeholder="อธิบายรายละเอียดของคำร้องให้ครบถ้วน"
            />
            {errors.description && <div className="text-[11px] text-red-500">{errors.description}</div>}
          </div>

          {/* Priority + Dept */}
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
                {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          {/* DueAt */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">วันที่ต้องการ (ถ้ามี)</label>
            <input
              className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500"
              type="date"
              value={form.dueAt ? form.dueAt.split('T')[0] : ''}
              onChange={e => set('dueAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
            />
          </div>

          {/* Attachment */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">เอกสารแนบ</label>
            <div className="border-2 border-dashed border-gray-200 rounded-md p-4 bg-gray-50">
              <input type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-gray-200 text-[13px] font-medium cursor-pointer hover:bg-gray-50 w-fit" style={{ marginBottom: 12 }}>
                <Icon name="paperclip" size={14}/> เลือกไฟล์...
              </label>
              {form.attachments.length > 0 && (
                <div className="flex flex-col gap-2">
                  {form.attachments.map((file, i) => (
                    <div key={i} className="flex items-center justify-between text-[13px] bg-white p-2 border border-gray-200 rounded">
                      <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                      <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700">ลบ</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-6">
        <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={() => router.back()}>
          ยกเลิก
        </button>
        <button className="px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={handleSubmit} disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'ยื่นคำร้อง'}
        </button>
      </div>
    </div>
  )
}
