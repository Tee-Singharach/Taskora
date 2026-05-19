'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import Icon from '@/components/ui/Icon'
import { REQUEST_TYPE_INFO } from '@/lib/utils'
import type { RequestPriority, RequestType, RequestAttachment } from '@/lib/types'

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
    type: (request?.type ?? 'general') as RequestType,
    priority: (request?.priority ?? 'normal') as RequestPriority,
    department: request?.department ?? '',
    dueAt: request?.dueAt ? request.dueAt.split('T')[0] : '',
    existingAttachments: (request?.attachments ?? []) as RequestAttachment[],
    newFiles: [] as File[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  if (!request) {
    return (
      <div className="p-7 max-w-[680px] mx-auto">
        <div className="text-center py-20">
          <div className="text-[16px] font-semibold">ไม่พบคำร้องนี้</div>
          <button className="px-4 py-2 mt-4 text-[13px] border rounded-md hover:bg-gray-50" onClick={() => router.push('/requests')}>← กลับรายการ</button>
        </div>
      </div>
    )
  }

  function set<K extends keyof typeof form>(key: K, val: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: val }))
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      set('newFiles', [...form.newFiles, ...Array.from(e.target.files)])
    }
  }

  function removeExisting(index: number) {
    set('existingAttachments', form.existingAttachments.filter((_, i) => i !== index))
  }

  function removeNew(index: number) {
    set('newFiles', form.newFiles.filter((_, i) => i !== index))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim())       e.title = 'กรุณากรอกชื่อคำร้อง'
    if (!form.description.trim()) e.description = 'กรุณากรอกรายละเอียด'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) return
    if (saving) return
    setSaving(true)
    try {
      const uploaded = await Promise.all(
        form.newFiles.map(async (f) => {
          const fd = new FormData()
          fd.append('file', f)
          const res = await fetch('/api/upload', { method: 'POST', body: fd })
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(`อัปโหลด "${f.name}" ล้มเหลว: ${body.error ?? res.status}`)
          }
          return res.json() as Promise<{ name: string; size: string; url: string }>
        })
      )
      await updateRequest(id, {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        priority: form.priority,
        department: form.department,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : request!.dueAt,
        attachments: [...form.existingAttachments, ...uploaded],
      })
      router.push(backPath)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
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
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">ชื่อคำร้อง <span className="text-red-500">*</span></label>
            <input
              className={`w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500 ${errors.title ? 'border-red-500' : ''}`}
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
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
            />
            {errors.description && <div className="text-[11px] text-red-500">{errors.description}</div>}
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">ประเภทคำร้อง</label>
            <select
              className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500"
              value={form.type}
              onChange={e => set('type', e.target.value as RequestType)}
            >
              {(Object.keys(REQUEST_TYPE_INFO) as RequestType[]).map(t => (
                <option key={t} value={t}>{REQUEST_TYPE_INFO[t].label}</option>
              ))}
            </select>
          </div>

          {/* Priority + Dept */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-gray-500">ความสำคัญ</label>
              <select
                className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500"
                value={form.priority}
                onChange={e => set('priority', e.target.value as RequestPriority)}
              >
                <option value="low">ต่ำ</option>
                <option value="normal">ปกติ</option>
                <option value="high">สูง</option>
                <option value="urgent">เร่งด่วน</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-gray-500">ส่งไปยังแผนก</label>
              <select
                className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500"
                value={form.department}
                onChange={e => set('department', e.target.value)}
              >
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          {/* DueAt */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">วันกำหนด</label>
            <input
              className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500"
              type="date"
              value={form.dueAt}
              onChange={e => set('dueAt', e.target.value)}
            />
          </div>

          {/* Attachments */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-gray-500">เอกสารแนบ</label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 bg-gray-50 flex flex-col items-center gap-3">
              <input type="file" multiple onChange={handleFileChange} className="hidden" id="file-upload-edit" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"/>
              <Icon name="paperclip" size={24} className="text-gray-300"/>
              <label htmlFor="file-upload-edit" className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-[13px] font-medium cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                <Icon name="paperclip" size={14}/> เพิ่มไฟล์...
              </label>
              <p className="text-[11px] text-gray-400">PDF, Word, Excel, รูปภาพ · สูงสุด <span className="font-medium text-gray-500">10 MB</span> ต่อไฟล์</p>

              {(form.existingAttachments.length > 0 || form.newFiles.length > 0) && (
                <div className="w-full flex flex-col gap-2 mt-1">
                  {form.existingAttachments.map((a, i) => (
                    <div key={`ex-${i}`} className="flex items-center justify-between text-[13px] bg-white p-2.5 border border-gray-200 rounded-md">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon name="paperclip" size={13} className="text-gray-400 flex-shrink-0"/>
                        <span className="truncate text-gray-700">{a.name}</span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">({a.size})</span>
                      </div>
                      <button type="button" onClick={() => removeExisting(i)} className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0">ลบ</button>
                    </div>
                  ))}
                  {form.newFiles.map((f, i) => (
                    <div key={`new-${i}`} className="flex items-center justify-between text-[13px] bg-indigo-50 p-2.5 border border-indigo-200 rounded-md">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon name="paperclip" size={13} className="text-indigo-400 flex-shrink-0"/>
                        <span className="truncate text-gray-700">{f.name}</span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">({(f.size / 1024).toFixed(1)} KB)</span>
                        <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded flex-shrink-0">ใหม่</span>
                      </div>
                      <button type="button" onClick={() => removeNew(i)} className="text-gray-400 hover:text-red-500 transition-colors ml-2 flex-shrink-0">ลบ</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-6">
        <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={() => router.push(backPath)}>
          ยกเลิก
        </button>
        <button
          className="px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
        </button>
      </div>
    </div>
  )
}
