'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import Icon from '@/components/ui/Icon'
import Avatar from '@/components/ui/Avatar'
import { ROLE_INFO, deptById, fullName, formalName } from '@/lib/utils'
import type { UserTitle } from '@/lib/types'

const TITLES: UserTitle[] = ['นาย', 'นาง', 'นางสาว', 'ดร.', 'รศ.', 'ศ.']

export default function SettingsPage() {
  const { store, currentUser, showToast, updateUser } = useApp()
  const router = useRouter()
  const [editProfile, setEditProfile] = useState(false)
  const [editTitle, setEditTitle] = useState<UserTitle>(currentUser?.title || 'นาย')
  const [editFirstName, setEditFirstName] = useState(currentUser?.firstName || '')
  const [editLastName, setEditLastName] = useState(currentUser?.lastName || '')
  const [editEmail, setEditEmail] = useState(currentUser?.email || '')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notif, setNotif] = useState({ email: true, line: false, inApp: true })
  const [lineToken, setLineToken] = useState('')

  if (!currentUser) return null

  const dept = deptById(currentUser.dept)

  const handleSaveProfile = () => {
    if (!editFirstName.trim()) {
      showToast('error', 'กรุณากรอกชื่อ')
      return
    }
    if (!editLastName.trim()) {
      showToast('error', 'กรุณากรอกนามสกุล')
      return
    }
    if (!editEmail.trim() || !editEmail.includes('@')) {
      showToast('error', 'กรุณากรอกอีเมลให้ถูกต้อง')
      return
    }
    updateUser(currentUser!.id, { title: editTitle, firstName: editFirstName.trim(), lastName: editLastName.trim(), email: editEmail.trim() })
    showToast('success', 'บันทึกข้อมูลสำเร็จ')
    setEditProfile(false)
  }

  const handleChangePassword = () => {
    if (!password || !newPassword || !confirmPassword) {
      showToast('error', 'กรุณากรอกข้อมูลให้ครบ')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }
    if (newPassword.length < 6) {
      showToast('error', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร')
      return
    }
    showToast('success', 'เปลี่ยนรหัสผ่านสำเร็จ')
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleSaveNotifications = () => {
    showToast('success', 'บันทึกตั้งค่าแจ้งเตือนสำเร็จ')
  }

  const handleLogout = () => {
    showToast('success', 'ออกจากระบบสำเร็จ')
    router.push('/login')
  }

  return (
    <div className="p-4 lg:p-7 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Icon name="settings" size={24} className="text-white"/>
          </div>
          <div>
            <h1 className="text-[28px] font-bold tracking-tighter m-0">การตั้งค่า</h1>
            <p className="text-[13px] text-gray-500 mt-1">จัดการข้อมูลส่วนตัวและค่ากำหนด</p>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon name="user" size={18} className="text-indigo-600"/>
            <h2 className="text-[15px] font-semibold text-gray-900 m-0">ข้อมูลส่วนตัว</h2>
          </div>
          {!editProfile && (
            <button onClick={() => setEditProfile(true)} className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              แก้ไข
            </button>
          )}
        </div>
        <div className="p-6">
          {editProfile ? (
            <div className="space-y-4">
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-2">คำนำหน้า</label>
                <select
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value as UserTitle)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                >
                  {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 block mb-2">ชื่อ</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={e => setEditFirstName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="ชื่อ"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-semibold text-gray-600 block mb-2">นามสกุล</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={e => setEditLastName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="นามสกุล"
                  />
                </div>
              </div>
              <div>
                <label className="text-[12px] font-semibold text-gray-600 block mb-2">อีเมล</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="name@taskora.co"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveProfile} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
                  บันทึก
                </button>
                <button onClick={() => { setEditProfile(false); setEditTitle(currentUser.title); setEditFirstName(currentUser.firstName); setEditLastName(currentUser.lastName); setEditEmail(currentUser.email); }} className="flex-1 bg-gray-100 text-gray-900 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-gray-200 transition-colors">
                  ยกเลิก
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
                <Avatar name={fullName(currentUser)} size="lg" />
                <div className="flex-1">
                  <div className="text-[16px] font-semibold text-gray-900">{formalName(currentUser)}</div>
                  <div className="text-[12px] text-gray-500 mt-1">{currentUser.email}</div>
                  <div className="mt-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {ROLE_INFO[currentUser.role].th}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      {dept?.name ?? currentUser.dept}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">อีเมล</div>
                  <div className="text-[13px] text-gray-900 font-medium mt-2 break-all">{currentUser.email}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">ID</div>
                  <div className="text-[13px] text-gray-900 font-mono mt-2">{currentUser.id}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-50 to-white px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <Icon name="shield" size={18} className="text-rose-600"/>
          <h2 className="text-[15px] font-semibold text-gray-900 m-0">ความปลอดภัย</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-semibold text-gray-600 block mb-2">รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                placeholder="กรอกรหัสผ่านปัจจุบัน"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-gray-600 block mb-2">รหัสผ่านใหม่</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                placeholder="กรอกรหัสผ่านใหม่"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-gray-600 block mb-2">ยืนยันรหัสผ่านใหม่</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-4 text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                placeholder="ยืนยันรหัสผ่านใหม่"
              />
            </div>
            <label className="flex items-center gap-2 text-[12px] cursor-pointer py-2">
              <input type="checkbox" checked={showPassword} onChange={e => setShowPassword(e.target.checked)} className="w-4 h-4 rounded border-gray-300" />
              <span className="text-gray-600 font-medium">แสดงรหัสผ่าน</span>
            </label>
            <button onClick={handleChangePassword} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-colors mt-4">
              เปลี่ยนรหัสผ่าน
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <Icon name="bell" size={18} className="text-blue-600"/>
          <h2 className="text-[15px] font-semibold text-gray-900 m-0">ตั้งค่าแจ้งเตือน</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={notif.email}
                onChange={e => setNotif({ ...notif, email: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 mt-0.5"
              />
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-gray-900">แจ้งเตือนทางอีเมล</div>
                <div className="text-[11px] text-gray-500 mt-1">{currentUser.email}</div>
              </div>
            </label>

            <div className="border-t border-gray-100 pt-4">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors mb-3">
                <input
                  type="checkbox"
                  checked={notif.line}
                  onChange={e => setNotif({ ...notif, line: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 mt-0.5"
                />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-gray-900">แจ้งเตือนทาง LINE</div>
                  <div className="text-[11px] text-gray-500 mt-1">เชื่อมต่อกับ LINE Notify</div>
                </div>
              </label>
              {notif.line && (
                <input
                  type="text"
                  value={lineToken}
                  onChange={e => setLineToken(e.target.value)}
                  placeholder="กรอก LINE Notify Token"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 px-4 text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all ml-8 mb-3"
                />
              )}
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={notif.inApp}
                onChange={e => setNotif({ ...notif, inApp: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 mt-0.5"
              />
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-gray-900">แจ้งเตือนภายในแอป</div>
                <div className="text-[11px] text-gray-500 mt-1">แสดงการแจ้งเตือนภายในระบบ</div>
              </div>
            </label>

            <button onClick={handleSaveNotifications} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-colors mt-4">
              บันทึกตั้งค่า
            </button>
          </div>
        </div>
      </div>

      {/* Logout Section */}
      <div className="bg-white border border-red-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-red-50 to-white px-6 py-4 border-b border-red-100 flex items-center gap-3">
          <Icon name="logout" size={18} className="text-red-600"/>
          <h2 className="text-[15px] font-semibold text-gray-900 m-0">ออกจากระบบ</h2>
        </div>
        <div className="p-6">
          <p className="text-[12px] text-gray-600 mb-4">คุณจะออกจากระบบและกลับไปยังหน้าเข้าสู่ระบบ</p>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white py-2.5 rounded-lg text-[13px] font-semibold hover:bg-red-700 transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  )
}
