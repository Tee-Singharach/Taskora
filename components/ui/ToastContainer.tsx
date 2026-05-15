'use client'

import { useApp } from '@/components/providers/AppProvider'
import Icon from './Icon'

export default function ToastContainer() {
  const { toasts, removeToast } = useApp()
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[300] pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md text-[13px] font-medium shadow-xl pointer-events-auto min-w-[240px] text-white ${t.type === 'success' ? 'bg-emerald-500' : t.type === 'warning' ? 'bg-amber-500' : t.type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>
          {t.type === 'success' && <Icon name="check" size={14}/>}
          {t.type === 'warning' && <Icon name="alert" size={14}/>}
          {t.type === 'error' && <Icon name="x" size={14}/>}
          {t.type === 'info' && <Icon name="info" size={14}/>}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="bg-transparent border-none text-inherit cursor-pointer opacity-70 p-0">
            <Icon name="x" size={13}/>
          </button>
        </div>
      ))}
    </div>
  )
}
