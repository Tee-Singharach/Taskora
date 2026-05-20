import { useState } from 'react'
import BaseModal from '@/components/ui/BaseModal'
import Icon from '@/components/ui/Icon'

interface Props {
  onClose: () => void
  onConfirm: (note: string) => void
}

export default function RejectModal({ onClose, onConfirm }: Props) {
  const [note, setNote] = useState('')
  return (
    <BaseModal
      title="ปฏิเสธคำร้อง"
      onClose={onClose}
      footer={
        <>
          <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={onClose}>ยกเลิก</button>
          <button className="flex items-center gap-1.5 px-4 py-2 text-[14px] rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" onClick={() => onConfirm(note)} disabled={!note.trim()}>
            <Icon name="x" size={14}/> ยืนยันปฏิเสธ
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-gray-500">เหตุผลการปฏิเสธ <span className="text-red-500">*</span></label>
        <textarea className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500" rows={4} value={note} onChange={e => setNote(e.target.value)} placeholder="ระบุเหตุผลให้ชัดเจน..."/>
      </div>
    </BaseModal>
  )
}
