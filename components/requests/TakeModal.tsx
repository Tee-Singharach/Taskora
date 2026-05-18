import BaseModal from '@/components/ui/BaseModal'
import Icon from '@/components/ui/Icon'

interface Props {
  requestTitle: string
  onClose: () => void
  onConfirm: () => void
}

export default function TakeModal({ requestTitle, onClose, onConfirm }: Props) {
  return (
    <BaseModal
      title="ยืนยันการรับงาน"
      onClose={onClose}
      maxWidth={400}
      footer={
        <>
          <button className="px-4 py-2 text-[14px] rounded-md border border-gray-200 hover:bg-gray-50" onClick={onClose}>ยกเลิก</button>
          <button className="flex items-center gap-1.5 px-4 py-2 text-[14px] rounded-md bg-indigo-600 text-white hover:bg-indigo-700" onClick={onConfirm}>
            <Icon name="play" size={13}/> ยืนยันรับงาน
          </button>
        </>
      }
    >
      <p className="text-[13px] text-gray-600 leading-relaxed">
        คุณต้องการรับงาน <strong className="text-gray-900">"{requestTitle}"</strong> และเริ่มดำเนินการใช่หรือไม่?
      </p>
      <p className="text-[12px] text-amber-600 mt-3 bg-amber-50 border border-amber-100 rounded-md p-2.5">
        เมื่อรับงานแล้ว สถานะจะเปลี่ยนเป็น "กำลังดำเนินการ" และงานจะถูกมอบหมายให้คุณ
      </p>
    </BaseModal>
  )
}
