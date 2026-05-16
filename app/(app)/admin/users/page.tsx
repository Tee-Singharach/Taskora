'use client'

import { useState } from 'react'
import { useApp } from '@/components/providers/AppProvider'
import { ROLE_INFO, ROLE_ORDER, avatarInitials, deptById } from '@/lib/utils'
import Icon from '@/components/ui/Icon'
import Avatar from '@/components/ui/Avatar'
import type { Role, User } from '@/lib/types'

interface UserForm {
  name: string
  email: string
  role: Role
  dept: string
}

const EMPTY_FORM: UserForm = { name: '', email: '', role: 'staff', dept: '' }

export default function AdminUsersPage() {
  const { store, currentUser, addUser, updateUser, deleteUser, showToast } = useApp()
  const departments = store.departments
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null)

  if (currentUser?.role !== 'admin') {
    return (
      <div className="page">
        <div className="empty" style={{ paddingTop: 80 }}>
          <div className="ic"><Icon name="shield" size={40}/></div>
          <div className="title">เฉพาะผู้ดูแลระบบ</div>
          <div className="sub">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</div>
        </div>
      </div>
    )
  }

  const filtered = store.users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  function openCreate() {
    setForm({ ...EMPTY_FORM, dept: departments[0]?.id ?? '' })
    setErrors({})
    setEditId(null)
    setShowModal(true)
  }

  function openEdit(id: string) {
    const u = store.users.find(u => u.id === id)
    if (!u) return
    setForm({ name: u.name, email: u.email, role: u.role, dept: u.dept })
    setErrors({})
    setEditId(id)
    setShowModal(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())  e.name  = 'กรุณากรอกชื่อ'
    if (!form.email.trim()) e.email = 'กรุณากรอกอีเมล'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    if (editId) {
      updateUser(editId, form)
    } else {
      addUser(form)
    }
    setShowModal(false)
  }

  // Role counts
  const roleCounts = ROLE_ORDER.reduce((acc, r) => {
    acc[r] = store.users.filter(u => u.role === r).length
    return acc
  }, {} as Record<Role, number>)

  return (
    <div className="p-7 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tighter m-0">ผู้ใช้และบทบาท</h1>
          <div className="text-[13px] text-gray-500 mt-1">{store.users.length} บัญชีทั้งหมด</div>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-md font-medium text-[13px] bg-indigo-600 text-white hover:bg-indigo-700 transition-colors" onClick={openCreate}>
          <Icon name="plus" size={14}/> เพิ่มผู้ใช้
        </button>
      </div>

      {/* Role stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {ROLE_ORDER.map(r => (
          <div key={r} className="bg-white border border-gray-200 rounded-lg p-5 cursor-pointer hover:border-indigo-300 transition-colors" onClick={() => setRoleFilter(r === roleFilter ? 'all' : r)}>
            <div className="text-[12px] text-gray-500 font-medium">{ROLE_INFO[r].th}</div>
            <div className="text-[24px] font-semibold tracking-tighter mt-1.5">{roleCounts[r]}</div>
            <div className="text-[12px] text-gray-400 mt-2">{ROLE_INFO[r].desc}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2.5 p-3 bg-white border border-gray-200 rounded-t-lg flex-wrap">
        <div className="flex gap-2 flex-wrap flex-1">
          <button className={`px-3 py-1.5 rounded-md text-[12px] border border-gray-200 transition-all ${roleFilter === 'all' ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-white text-gray-900 hover:bg-gray-50'}`} onClick={() => setRoleFilter('all')}>ทุกบทบาท</button>
          {ROLE_ORDER.map(r => (
            <button key={r} className={`px-3 py-1.5 rounded-md text-[12px] border border-gray-200 transition-all ${roleFilter === r ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : 'bg-white text-gray-900 hover:bg-gray-50'}`} onClick={() => setRoleFilter(roleFilter === r ? 'all' : r)}>
              {ROLE_INFO[r].th}
            </button>
          ))}
        </div>
        <div className="relative w-[240px]">
          <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาผู้ใช้..." className="w-full bg-white border border-gray-200 rounded-md py-1.5 pl-8 pr-3 text-[13px] focus:border-indigo-500 outline-none"/>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-b-lg border-t-0">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-[14px]">ไม่พบผู้ใช้</div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-left">
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">ผู้ใช้</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">บทบาท</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">ฝ่าย</th>
                <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 tracking-wider uppercase">อีเมล</th>
                <th className="px-4 py-3 w-[80px]"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name}/>
                      <div>
                        <div className="font-medium text-gray-900">{u.name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] border bg-${ROLE_INFO[u.role].color}-50 text-${ROLE_INFO[u.role].color}-700 border-${ROLE_INFO[u.role].color}-200`}>{ROLE_INFO[u.role].th}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {deptById(u.dept, departments)?.name ?? u.dept}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 transition-colors" onClick={() => openEdit(u.id)}>
                        <Icon name="edit" size={13}/> แก้ไข
                      </button>
                      {u.id !== currentUser?.id && (
                        <button className="flex items-center gap-1.5 text-gray-400 hover:text-red-600 transition-colors" onClick={() => setConfirmDeleteUser(u)}>
                          <Icon name="trash" size={13}/> ลบ
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-[440px] flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="text-[16px] font-semibold">{editId ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</div>
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100" onClick={() => setShowModal(false)}><Icon name="x" size={16}/></button>
            </div>
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-gray-500">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                <input className={`w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500 ${errors.name ? 'border-red-500' : ''}`} type="text" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}/>
                {errors.name && <div className="text-[11px] text-red-500">{errors.name}</div>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-gray-500">อีเมล <span className="text-red-500">*</span></label>
                <input className={`w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500 ${errors.email ? 'border-red-500' : ''}`} type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}/>
                {errors.email && <div className="text-[11px] text-red-500">{errors.email}</div>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-gray-500">บทบาท</label>
                  <select className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500" value={form.role}
                    onChange={e => setForm(p => ({ ...p, role: e.target.value as Role }))}>
                    {ROLE_ORDER.map(r => <option key={r} value={r}>{ROLE_INFO[r].th}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-gray-500">ฝ่าย</label>
                  <select className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500" value={form.dept}
                    onChange={e => setForm(p => ({ ...p, dept: e.target.value }))}>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button className="px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={handleSave}>
                {editId ? 'บันทึก' : 'เพิ่มผู้ใช้'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete user confirmation modal */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setConfirmDeleteUser(null) }}>
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full max-w-[400px] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <Icon name="trash" size={16} className="text-red-600"/>
                </div>
                <div className="text-[16px] font-semibold">ยืนยันการลบผู้ใช้</div>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100" onClick={() => setConfirmDeleteUser(null)}>
                <Icon name="x" size={16}/>
              </button>
            </div>
            <div className="p-6">
              <p className="text-[13px] text-gray-600 leading-relaxed">
                คุณต้องการลบบัญชีผู้ใช้ <strong className="text-gray-900">"{confirmDeleteUser.name}"</strong> ({confirmDeleteUser.email}) ออกจากระบบใช่หรือไม่?
              </p>
              <p className="text-[12px] text-red-600 mt-3 bg-red-50 border border-red-100 rounded-md p-2.5">
                การลบไม่สามารถย้อนกลับได้ และข้อมูลผู้ใช้จะถูกลบออกอย่างถาวร
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200">
              <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={() => setConfirmDeleteUser(null)}>ยกเลิก</button>
              <button
                className="flex items-center gap-1.5 px-4 py-2 text-[14px] rounded-md bg-red-600 text-white hover:bg-red-700"
                onClick={() => { deleteUser(confirmDeleteUser.id); setConfirmDeleteUser(null) }}
              >
                <Icon name="trash" size={13}/> ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
