import { useState } from 'react'
import BaseModal from '@/components/ui/BaseModal'
import Avatar from '@/components/ui/Avatar'
import { ROLE_INFO, fullName, formalName } from '@/lib/utils'
import type { User } from '@/lib/types'

interface Props {
  officers: User[]
  currentAssigneeId: string | null
  onClose: () => void
  onConfirm: (assigneeId: string, note: string) => void
}

export default function AssignModal({ officers, currentAssigneeId, onClose, onConfirm }: Props) {
  const [assigneeId, setAssigneeId] = useState(currentAssigneeId ?? '')
  const [note, setNote] = useState('')
  return (
    <BaseModal
      title="มอบหมายงาน"
      onClose={onClose}
      footer={
        <>
          <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={onClose}>ยกเลิก</button>
          <button className="px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" onClick={() => onConfirm(assigneeId, note)} disabled={!assigneeId}>
            บันทึก
          </button>
        </>
      }
    >
      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">เลือกผู้รับผิดชอบ</div>
      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
        {officers.map(u => (
          <label key={u.id} className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${assigneeId === u.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-200'}`}>
            <input type="radio" name="assignee" value={u.id} checked={assigneeId === u.id} onChange={() => setAssigneeId(u.id)}/>
            <Avatar name={fullName(u)} size="sm"/>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-gray-900">{formalName(u)}</div>
              <div className="text-[11px] text-gray-400">{ROLE_INFO[u.role].th}</div>
            </div>
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-[12px] font-medium text-gray-500">หมายเหตุ</label>
        <input className="w-full bg-white border border-gray-200 rounded-md p-2 text-[14px] outline-none focus:border-indigo-500" type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="เหตุผลการมอบหมาย..."/>
      </div>
    </BaseModal>
  )
}
