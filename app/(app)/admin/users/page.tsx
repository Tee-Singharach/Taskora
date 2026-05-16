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
  password: string
  passwordConfirm: string
}

const EMPTY_FORM: UserForm = { name: '', email: '', role: 'staff', dept: '', password: '', passwordConfirm: '' }

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
    setForm({ name: u.name, email: u.email, role: u.role, dept: u.dept, password: '', passwordConfirm: '' })
    setErrors({})
    setEditId(id)
    setShowModal(true)
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())  e.name  = 'กรุณากรอกชื่อ'
    if (!form.email.trim()) e.email = 'กรุณากรอกอีเมล'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    if (!editId && !form.password.trim()) e.password = 'กรุณากรอกรหัสผ่าน'
    if (!editId && form.password.length < 6) e.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    if (!editId && !form.passwordConfirm.trim()) e.passwordConfirm = 'กรุณายืนยันรหัสผ่าน'
    if (!editId && form.password !== form.passwordConfirm) e.passwordConfirm = 'รหัสผ่านไม่ตรงกัน'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    if (editId) {
      updateUser(editId, { name: form.name, email: form.email, role: form.role, dept: form.dept })
    } else {
      addUser({ name: form.name, email: form.email, role: form.role, dept: form.dept, password: form.password })
    }
    setShowModal(false)
  }

  // Role counts
  const roleCounts = ROLE_ORDER.reduce((acc, r) => {
    acc[r] = store.users.filter(u => u.role === r).length
    return acc
  }, {} as Record<Role, number>)

  return (
    <div className="p-4 lg:p-7 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Icon name="users" size={20} className="text-white"/>
            </div>
            <h1 className="text-[24px] font-bold tracking-tighter m-0 text-gray-900">ผู้ใช้และบทบาท</h1>
          </div>
          <p className="text-[13px] text-gray-500 mt-1">จัดการบัญชีผู้ใช้และบทบาทในระบบ</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-[13px] bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md" onClick={openCreate}>
          <Icon name="plus" size={16}/> เพิ่มผู้ใช้
        </button>
      </div>

      {/* Role stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {ROLE_ORDER.map(r => {
          const icons: Record<Role, string> = {
            'staff': 'users',
            'officer': 'inbox',
            'manager': 'chart',
            'admin': 'shield'
          }
          const colors: Record<Role, { bg: string; text: string; icon: string }> = {
            'staff': { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-400' },
            'officer': { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-400' },
            'manager': { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'text-violet-400' },
            'admin': { bg: 'bg-rose-50', text: 'text-rose-600', icon: 'text-rose-400' },
          }
          const color = colors[r]
          return (
            <div key={r} className={`${color.bg} border border-gray-100 rounded-lg p-5 cursor-pointer hover:shadow-md transition-all group`} onClick={() => setRoleFilter(r === roleFilter ? 'all' : r)}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 ${color.bg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon name={icons[r]} size={18} className={color.icon}/>
                </div>
                {roleFilter === r && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
              </div>
              <div className={`${color.text} text-[11px] font-semibold uppercase tracking-wider`}>{ROLE_INFO[r].th}</div>
              <div className="text-[28px] font-bold tracking-tighter mt-1.5">{roleCounts[r]}</div>
              <div className="text-[12px] text-gray-500 mt-2">{ROLE_INFO[r].desc}</div>
            </div>
          )
        })}
      </div>

      {/* Search and filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 md:max-w-xs">
          <Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ หรืออีเมล..."
            className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-10 pr-4 text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-2 rounded-lg text-[12px] font-medium border transition-all ${
              roleFilter === 'all'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
            }`}
            onClick={() => setRoleFilter('all')}
          >
            ทั้งหมด
          </button>
          {ROLE_ORDER.map(r => (
            <button
              key={r}
              className={`px-3 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                roleFilter === r
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
              onClick={() => setRoleFilter(roleFilter === r ? 'all' : r)}
            >
              {ROLE_INFO[r].th}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-[40px] mb-3">👤</div>
            <div className="text-gray-500 text-[14px] font-medium">ไม่พบผู้ใช้</div>
            <div className="text-gray-400 text-[12px] mt-1">ลองปรับการค้นหาหรือเพิ่มผู้ใช้ใหม่</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] md:text-[13px]">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-50 border-b border-gray-200">
                  <th className="px-4 py-4 text-left text-[11px] font-semibold text-gray-600 tracking-wider uppercase">ผู้ใช้</th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold text-gray-600 tracking-wider uppercase hidden md:table-cell">บทบาท</th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold text-gray-600 tracking-wider uppercase hidden lg:table-cell">ฝ่าย</th>
                  <th className="px-4 py-4 text-left text-[11px] font-semibold text-gray-600 tracking-wider uppercase hidden md:table-cell">อีเมล</th>
                  <th className="px-4 py-4 text-right text-[11px] font-semibold text-gray-600 tracking-wider uppercase">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <tr key={u.id} className={`border-b border-gray-100 hover:bg-indigo-50/50 transition-colors ${idx === filtered.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name}/>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{u.name}</div>
                          <div className="text-[11px] text-gray-400 font-mono truncate">{u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold inline-flex items-center gap-1
                        ${u.role === 'admin' ? 'bg-rose-100 text-rose-700' :
                          u.role === 'manager' ? 'bg-violet-100 text-violet-700' :
                          u.role === 'officer' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'}`}
                      >
                        {ROLE_INFO[u.role].th}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-600 hidden lg:table-cell">
                      <span className="text-[12px]">{deptById(u.dept, departments)?.name ?? u.dept}</span>
                    </td>
                    <td className="px-4 py-4 text-gray-500 hidden md:table-cell text-[12px] truncate">
                      {u.email}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 rounded-md text-gray-500 hover:bg-indigo-100 hover:text-indigo-600 transition-colors" title="แก้ไข" onClick={() => openEdit(u.id)}>
                          <Icon name="edit" size={14}/>
                        </button>
                        {u.id !== currentUser?.id && (
                          <button className="p-2 rounded-md text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors" title="ลบ" onClick={() => setConfirmDeleteUser(u)}>
                            <Icon name="trash" size={14}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[500px] flex flex-col max-h-[90vh] border border-gray-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
              <div>
                <h3 className="text-[18px] font-bold text-gray-900">{editId ? '✏️ แก้ไขผู้ใช้' : '➕ เพิ่มผู้ใช้ใหม่'}</h3>
                <p className="text-[12px] text-gray-500 mt-1">{editId ? 'อัปเดตข้อมูลผู้ใช้' : 'สร้างบัญชีผู้ใช้ใหม่'}</p>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 transition-colors" onClick={() => setShowModal(false)}><Icon name="x" size={18}/></button>
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
              {!editId && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-gray-500">รหัสผ่าน <span className="text-red-500">*</span></label>
                    <input className={`w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500 ${errors.password ? 'border-red-500' : ''}`} type="password" value={form.password} placeholder="อย่างน้อย 6 ตัวอักษร"
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}/>
                    {errors.password && <div className="text-[11px] text-red-500">{errors.password}</div>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-gray-500">ยืนยันรหัสผ่าน <span className="text-red-500">*</span></label>
                    <input className={`w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500 ${errors.passwordConfirm ? 'border-red-500' : ''}`} type="password" value={form.passwordConfirm} placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                      onChange={e => setForm(p => ({ ...p, passwordConfirm: e.target.value }))}/>
                    {errors.passwordConfirm && <div className="text-[11px] text-red-500">{errors.passwordConfirm}</div>}
                  </div>
                </>
              )}
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
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button className="px-4 py-2.5 text-[14px] rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors font-medium" onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button className="px-6 py-2.5 text-[14px] rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:shadow-lg transition-all font-medium" onClick={handleSave}>
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
