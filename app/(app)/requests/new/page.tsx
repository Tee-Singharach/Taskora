'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import Icon from '@/components/ui/Icon'
import type { RequestPriority } from '@/lib/types'

export default function NewRequestPage() {
  const { addRequest, store, showToast } = useApp()
  const router = useRouter()

  const currentUser = store.users.find(u => u.id === store.currentUserId)
  const departments = store.departments

  if (currentUser?.role === 'officer') {
    router.replace('/officer/inbox')
    return null
  }

  if (currentUser?.role === 'manager') {
    router.replace('/dashboard')
    return null
  }

  const firstManager = store.users.find(u => u.role === 'manager')

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'normal' as RequestPriority,
    department: currentUser?.dept ?? departments[0]?.id ?? '',
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

  async function handleSubmit() {
    if (!validate()) return
    if (saving) return
    setSaving(true)
    try {
      const req = await addRequest({
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
    <div className="p-4 lg:p-7 max-w-[680px] mx-auto">
      <div className="mb-6">
        <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-[13px] mb-2" onClick={() => router.push('/requests')}>
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
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
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
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50 flex flex-col items-center gap-3">
              <input type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"/>
              <Icon name="paperclip" size={28} className="text-gray-300"/>
              <label htmlFor="file-upload" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-[13px] font-medium cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                <Icon name="paperclip" size={14}/> เลือกไฟล์...
              </label>
              <p className="text-[11px] text-gray-400 text-center">
                PDF, Word, Excel, รูปภาพ · ขนาดสูงสุด <span className="font-medium text-gray-500">10 MB</span> ต่อไฟล์
              </p>
              {form.attachments.length > 0 && (
                <div className="w-full flex flex-col gap-2 mt-1">
                  {form.attachments.map((file, i) => (
                    <div key={i} className="flex items-center justify-between text-[13px] bg-white p-2.5 border border-gray-200 rounded-md">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon name="paperclip" size={13} className="text-gray-400 flex-shrink-0"/>
                        <span className="truncate text-gray-700">{file.name}</span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0">ลบ</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-6">
        <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={() => router.push('/requests')}>
          ยกเลิก
        </button>
        <button className="px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={handleSubmit} disabled={saving}>
          {saving ? 'กำลังบันทึก...' : 'ยื่นคำร้อง'}
        </button>
      </div>
    </div>
  )
}
