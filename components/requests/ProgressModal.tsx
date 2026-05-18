import { useState } from 'react'
import BaseModal from '@/components/ui/BaseModal'

interface Props {
  initialProgress: number
  onClose: () => void
  onConfirm: (progress: number, note: string) => void
}

export default function ProgressModal({ initialProgress, onClose, onConfirm }: Props) {
  const [progress, setProgress] = useState(initialProgress)
  const [note, setNote] = useState('')
  return (
    <BaseModal
      title="อัปเดตความคืบหน้า"
      onClose={onClose}
      footer={
        <>
          <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={onClose}>ยกเลิก</button>
          <button className="px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => onConfirm(progress, note)}>บันทึก</button>
        </>
      }
    >
      <div className="p-4 bg-slate-50 border border-gray-200 rounded-md flex flex-col gap-3.5 mb-4">
        <div className="text-[48px] font-bold text-indigo-600 flex items-baseline justify-center leading-[1]">
          {progress}<span className="text-[22px] text-gray-400 font-medium ml-1">%</span>
        </div>
        <div className="relative h-[14px] flex items-center">
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${progress}%` }}/>
          </div>
          <input
            type="range" min={0} max={100} step={5}
            value={progress}
            onChange={e => setProgress(Number(e.target.value))}
            className="absolute w-full opacity-0 cursor-pointer h-full"
          />
        </div>
        <div className="flex gap-1.5 justify-center flex-wrap">
          {[0,10,25,50,75,90,100].map(v => (
            <button key={v} className={`px-3 py-1 rounded-full text-[12px] border transition-all ${progress === v ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-200 text-gray-900 hover:border-indigo-600'}`} onClick={() => setProgress(v)}>
              {v}%
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-gray-500">หมายเหตุ</label>
        <input className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500" type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="รายละเอียดความคืบหน้า..."/>
      </div>
    </BaseModal>
  )
}
