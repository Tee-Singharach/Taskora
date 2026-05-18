import { useState } from 'react'
import BaseModal from '@/components/ui/BaseModal'
import { STATUS_INFO, statusBadgeClass } from '@/lib/utils'
import type { RequestStatus } from '@/lib/types'

const STATUSES: RequestStatus[] = ['open', 'in_progress', 'waiting_approval', 'completed', 'rejected']

interface Props {
  currentStatus: RequestStatus
  onClose: () => void
  onConfirm: (status: RequestStatus) => void
}

export default function StatusModal({ currentStatus, onClose, onConfirm }: Props) {
  const [newStatus, setNewStatus] = useState<RequestStatus>(currentStatus)
  return (
    <BaseModal
      title="เปลี่ยนสถานะ"
      onClose={onClose}
      footer={
        <>
          <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={onClose}>ยกเลิก</button>
          <button className="px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={() => onConfirm(newStatus)}>บันทึก</button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        {STATUSES.map(s => {
          const info = STATUS_INFO[s]
          const isCurrent = s === currentStatus
          return (
            <label
              key={s}
              className={`flex items-center gap-3 p-3 border rounded-md cursor-pointer transition-colors ${newStatus === s ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100' : 'border-gray-200 hover:bg-gray-50'} ${isCurrent ? 'opacity-60' : ''}`}
            >
              <input type="radio" name="status" value={s} checked={newStatus === s} onChange={() => setNewStatus(s)}/>
              <span className={statusBadgeClass(s)}>{info.label}</span>
              {isCurrent && <span className="ml-auto text-[10px] text-gray-400">ปัจจุบัน</span>}
            </label>
          )
        })}
      </div>
    </BaseModal>
  )
}
