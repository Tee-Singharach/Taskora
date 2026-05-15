'use client'

import { useState } from 'react'
import { useApp } from '@/components/providers/AppProvider'
import Icon from '@/components/ui/Icon'
import type { Department } from '@/lib/types'

const COLORS = [
  { id: 'indigo',  hex: '#4F46E5', label: 'Indigo' },
  { id: 'rose',    hex: '#F43F5E', label: 'Rose' },
  { id: 'emerald', hex: '#10B981', label: 'Emerald' },
  { id: 'amber',   hex: '#F59E0B', label: 'Amber' },
  { id: 'violet',  hex: '#8B5CF6', label: 'Violet' },
  { id: 'sky',     hex: '#0EA5E9', label: 'Sky' },
  { id: 'slate',   hex: '#64748B', label: 'Slate' },
  { id: 'orange',  hex: '#F97316', label: 'Orange' },
  { id: 'teal',    hex: '#14B8A6', label: 'Teal' },
]

const COLOR_HEX: Record<string, string> = Object.fromEntries(COLORS.map(c => [c.id, c.hex]))

interface DeptForm {
  id: string
  name: string
  short: string
  color: string
}

const EMPTY_FORM: DeptForm = { id: '', name: '', short: '', color: 'indigo' }

export default function AdminDepartmentsPage() {
  const { store, currentUser, addDept, updateDept, deleteDept } = useApp()
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<DeptForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<Department | null>(null)

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-7 max-w-[1400px] mx-auto">
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
          <Icon name="shield" size={40} className="text-gray-300"/>
          <div className="text-[16px] font-semibold text-gray-900">เฉพาะผู้ดูแลระบบ</div>
          <div className="text-[13px]">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>
        </div>
      </div>
    )
  }

  const reqCountByDept = store.departments.reduce((acc, d) => {
    acc[d.id] = store.requests.filter(r => r.department === d.id).length
    return acc
  }, {} as Record<string, number>)

  const userCountByDept = store.departments.reduce((acc, d) => {
    acc[d.id] = store.users.filter(u => u.dept === d.id).length
    return acc
  }, {} as Record<string, number>)

  function openCreate() {
    setForm(EMPTY_FORM)
    setErrors({})
    setEditId(null)
    setShowModal(true)
  }

  function openEdit(dept: Department) {
    setForm({ id: dept.id, name: dept.name, short: dept.short, color: dept.color })
    setErrors({})
    setEditId(dept.id)
    setShowModal(true)
  }

  function slugify(str: string) {
    return str.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 20)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.id.trim())   e.id   = 'กรุณากรอกรหัสแผนก'
    if (!/^[a-z0-9_]+$/.test(form.id)) e.id = 'ใช้ได้เฉพาะ a-z, 0-9, _ เท่านั้น'
    if (!editId && store.departments.find(d => d.id === form.id)) e.id = 'รหัสนี้ถูกใช้แล้ว'
    if (!form.name.trim()) e.name = 'กรุณากรอกชื่อแผนก'
    if (!form.short.trim()) e.short = 'กรุณากรอกชื่อย่อ'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    if (editId) {
      updateDept(editId, { name: form.name, short: form.short, color: form.color })
    } else {
      addDept({ id: form.id, name: form.name, short: form.short, color: form.color })
    }
    setShowModal(false)
  }

  function handleDelete(dept: Department) {
    const hasRequests = reqCountByDept[dept.id] > 0
    if (hasRequests) {
      setConfirmDelete(dept)
    } else {
      deleteDept(dept.id)
    }
  }

  return (
    <div className="p-7 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tighter m-0">จัดการแผนก</h1>
          <div className="text-[13px] text-gray-500 mt-1">{store.departments.length} แผนกทั้งหมด</div>
        </div>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-[13px] bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          onClick={openCreate}
        >
          <Icon name="plus" size={14}/> เพิ่มแผนก
        </button>
      </div>

      {/* Department grid */}
      <div className="grid grid-cols-3 gap-4">
        {store.departments.map(dept => {
          const hex = COLOR_HEX[dept.color] ?? '#4F46E5'
          const reqs = reqCountByDept[dept.id] ?? 0
          const users = userCountByDept[dept.id] ?? 0
          return (
            <div key={dept.id} className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: hex + '1A' }}>
                    <Icon name="building" size={18} style={{ color: hex }}/>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-gray-900 leading-snug">{dept.name}</div>
                    <div className="text-[12px] text-gray-400 font-mono mt-0.5">{dept.id} · {dept.short}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="แก้ไข"
                    onClick={() => openEdit(dept)}
                  >
                    <Icon name="edit" size={13}/>
                  </button>
                  <button
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="ลบ"
                    onClick={() => handleDelete(dept)}
                  >
                    <Icon name="trash" size={13}/>
                  </button>
                </div>
              </div>

              <div className="flex gap-4 text-center">
                <div className="flex-1 bg-gray-50 rounded-md p-2.5">
                  <div className="text-[18px] font-semibold text-gray-900">{reqs}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">คำร้อง</div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-md p-2.5">
                  <div className="text-[18px] font-semibold text-gray-900">{users}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">ผู้ใช้</div>
                </div>
                <div className="flex-1 bg-gray-50 rounded-md p-2.5">
                  <div className="w-3.5 h-3.5 rounded-full mx-auto" style={{ backgroundColor: hex }}/>
                  <div className="text-[11px] text-gray-500 mt-1.5 capitalize">{dept.color}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-[440px] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="text-[16px] font-semibold">{editId ? 'แก้ไขแผนก' : 'เพิ่มแผนกใหม่'}</div>
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100" onClick={() => setShowModal(false)}>
                <Icon name="x" size={16}/>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              {/* ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-gray-500">
                  รหัสแผนก (ID) <span className="text-red-500">*</span>
                  {editId && <span className="ml-1 text-gray-400 font-normal">(แก้ไขไม่ได้)</span>}
                </label>
                <input
                  className={`w-full bg-white border rounded-md p-2 text-[14px] outline-none focus:border-indigo-500 font-mono ${errors.id ? 'border-red-400' : 'border-gray-200'} ${editId ? 'bg-gray-50 text-gray-400' : ''}`}
                  type="text"
                  value={form.id}
                  readOnly={!!editId}
                  placeholder="เช่น finance, hr, it"
                  onChange={e => setForm(p => ({ ...p, id: slugify(e.target.value) }))}
                />
                {errors.id && <div className="text-[11px] text-red-500">{errors.id}</div>}
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-gray-500">ชื่อแผนก <span className="text-red-500">*</span></label>
                <input
                  className={`w-full bg-white border rounded-md p-2 text-[14px] outline-none focus:border-indigo-500 ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                  type="text"
                  value={form.name}
                  placeholder="เช่น ฝ่ายทรัพยากรบุคคล"
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
                {errors.name && <div className="text-[11px] text-red-500">{errors.name}</div>}
              </div>

              {/* Short */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-gray-500">ชื่อย่อ <span className="text-red-500">*</span></label>
                <input
                  className={`w-full bg-white border rounded-md p-2 text-[14px] outline-none focus:border-indigo-500 ${errors.short ? 'border-red-400' : 'border-gray-200'}`}
                  type="text"
                  value={form.short}
                  placeholder="เช่น HR"
                  onChange={e => setForm(p => ({ ...p, short: e.target.value }))}
                />
                {errors.short && <div className="text-[11px] text-red-500">{errors.short}</div>}
              </div>

              {/* Color */}
              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-medium text-gray-500">สีประจำแผนก</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      title={c.label}
                      className={`w-7 h-7 rounded-full transition-all ${form.color === c.id ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c.hex }}
                      onClick={() => setForm(p => ({ ...p, color: c.id }))}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLOR_HEX[form.color] ?? '#4F46E5' }}/>
                  <span className="text-[12px] text-gray-500 capitalize">{form.color}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={() => setShowModal(false)}>
                ยกเลิก
              </button>
              <button className="px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={handleSave}>
                {editId ? 'บันทึก' : 'เพิ่มแผนก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal (dept has requests) */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-[380px] p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <Icon name="alert" size={18} className="text-red-600"/>
              </div>
              <div>
                <div className="text-[15px] font-semibold text-gray-900">ยืนยันการลบแผนก</div>
                <div className="text-[12px] text-gray-500 mt-0.5">แผนกนี้มีคำร้อง {reqCountByDept[confirmDelete.id]} รายการผูกอยู่</div>
              </div>
            </div>
            <div className="text-[13px] text-gray-600 bg-amber-50 border border-amber-200 rounded-md p-3">
              การลบแผนก <strong>"{confirmDelete.name}"</strong> จะไม่ลบคำร้องที่มีอยู่ แต่คำร้องเหล่านั้นจะไม่แสดงชื่อแผนกอีกต่อไป
            </div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 text-[13px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={() => setConfirmDelete(null)}>
                ยกเลิก
              </button>
              <button
                className="px-4 py-2 text-[13px] rounded-md bg-red-600 text-white hover:bg-red-700"
                onClick={() => { deleteDept(confirmDelete.id); setConfirmDelete(null) }}
              >
                ลบแผนกต่อไป
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
