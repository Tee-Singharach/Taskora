'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/AppProvider'
import { ROLE_INFO, ROLE_ORDER } from '@/lib/utils'
import type { Role } from '@/lib/types'

export default function LoginPage() {
  const { store, setCurrentUserId } = useApp()
  const [email, setEmail] = useState('somchai.r@mojiflow.co')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const login = (userId: string) => {
    const user = store.users.find(u => u.id === userId)
    const home = user?.role === 'officer' ? '/officer/inbox'
               : user?.role === 'manager' ? '/dashboard'
               : user?.role === 'admin'   ? '/admin/users'
               : '/requests'
    startTransition(() => {
      setCurrentUserId(userId)
      router.push(home)
    })
  }

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!email) { setErr('กรุณากรอกอีเมล'); return }
    const user = store.users.find(u => u.email === email) || store.users[0]
    if (!user) { setErr('ไม่พบบัญชีนี้ในระบบ'); return }
    login(user.id)
  }

  const quickLogin = (role: Role) => {
    const u = store.users.find(x => x.role === role)
    if (!u) return
    setEmail(u.email)
    login(u.id)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-[400px] bg-white border border-gray-200 rounded-xl shadow-lg p-9">
        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-[36px] h-[36px] bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path d="M5 4h6a4 4 0 0 1 4 4v0a4 4 0 0 1-4 4H5z" fill="white" opacity="0.95"/>
              <path d="M5 12h7a4 4 0 0 1 4 4v0a4 0 0 1-4 4H5z" fill="white" opacity="0.7"/>
              <circle cx="18" cy="6" r="2.5" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <div className="text-[18px] font-semibold tracking-tighter">
            MojiFlow
            <span className="block text-[11px] font-normal leading-[1] text-gray-500">ระบบบริหารคำร้อง</span>
          </div>
        </div>

        {!showReset ? (
          <>
            <div className="text-[22px] font-semibold tracking-tighter mb-1.5">เข้าสู่ระบบ</div>
            <div className="text-[13px] text-gray-500 mb-6">ยินดีต้อนรับกลับ — ลงชื่อเข้าใช้เพื่อจัดการคำร้องของคุณ</div>

            <form className="flex flex-col gap-3.5" onSubmit={submit}>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-gray-500">อีเมล</label>
                <input className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] text-gray-900 outline-none transition-all focus:border-indigo-600 focus:shadow-[0_0_0_3px_rgba(79,108,247,0.2)] placeholder:text-gray-400" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@mojiflow.co"/>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-medium text-gray-500">รหัสผ่าน</label>
                  <span className="text-[11px] text-indigo-600 font-medium cursor-pointer" onClick={() => setShowReset(true)}>
                    ลืมรหัสผ่าน?
                  </span>
                </div>
                <input className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] text-gray-900 outline-none transition-all focus:border-indigo-600 focus:shadow-[0_0_0_3px_rgba(79,108,247,0.2)] placeholder:text-gray-400" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"/>
              </div>
              {err && <div className="text-[11px] text-red-500">{err}</div>}
              <button type="submit" className="w-full flex items-center justify-center gap-1.5 rounded-md font-medium text-[14px] p-2.5 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors mt-1">
                เข้าสู่ระบบ
              </button>
            </form>

            <div className="flex flex-col gap-1.5 mt-4 p-3.5 bg-slate-50 rounded-md">
              <div className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mb-1">ทดลองในแต่ละบทบาท</div>
              <div className="flex gap-1.5 flex-wrap">
                {ROLE_ORDER.map(r => (
                  <span key={r} className="px-2.5 py-1 rounded-full text-[11px] font-medium cursor-pointer border border-gray-200 bg-white text-gray-900 transition-all hover:border-indigo-600 hover:text-indigo-600" onClick={() => quickLogin(r)}>
                    {ROLE_INFO[r].th}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-[22px] font-semibold tracking-tighter mb-1.5">รีเซ็ตรหัสผ่าน</div>
            <div className="text-[13px] text-gray-500 mb-6">กรอกอีเมลของคุณ ระบบจะส่งลิงก์รีเซ็ตให้</div>
            {!resetSent ? (
              <form className="flex flex-col gap-3.5" onSubmit={e => { e.preventDefault(); setResetSent(true) }}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-gray-500">อีเมล</label>
                  <input className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] text-gray-900 outline-none transition-all focus:border-indigo-600 focus:shadow-[0_0_0_3px_rgba(79,108,247,0.2)] placeholder:text-gray-400" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="name@mojiflow.co" required/>
                </div>
                <button type="submit" className="w-full flex items-center justify-center gap-1.5 rounded-md font-medium text-[14px] p-2.5 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">ส่งลิงก์รีเซ็ต</button>
                <button type="button" className="w-full flex items-center justify-center gap-1.5 rounded-md font-medium text-[14px] p-2.5 bg-transparent text-gray-500 hover:bg-slate-50 transition-colors" onClick={() => setShowReset(false)}>กลับเข้าสู่ระบบ</button>
              </form>
            ) : (
              <div className="py-5">
                <div className="flex gap-2.5 items-start p-3.5 bg-emerald-50 border border-emerald-100 rounded-md text-emerald-800">
                  <div className="text-[14px]">✓</div>
                  <div>
                    <div className="font-semibold text-[13px]">ส่งลิงก์เรียบร้อย</div>
                    <div className="mt-1 text-[13px]">โปรดตรวจสอบกล่องจดหมายของ <strong>{resetEmail}</strong></div>
                  </div>
                </div>
                <button className="w-full flex items-center justify-center gap-1.5 rounded-md font-medium text-[14px] p-2.5 bg-transparent text-gray-500 hover:bg-slate-50 transition-colors mt-4" onClick={() => { setShowReset(false); setResetSent(false) }}>
                  กลับเข้าสู่ระบบ
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
