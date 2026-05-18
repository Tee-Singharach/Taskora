import Icon from './Icon'

interface BaseModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: number
}

export default function BaseModal({ title, onClose, children, footer, maxWidth = 440 }: BaseModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-6 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl w-full flex flex-col max-h-[90vh] overflow-hidden" style={{ maxWidth }}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
          <div className="text-[16px] font-semibold">{title}</div>
          <button className="w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
