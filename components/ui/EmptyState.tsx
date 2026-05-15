import Icon from './Icon'

interface EmptyStateProps {
  icon: string
  title: string
  subtitle?: string
}

export default function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-16 text-center text-gray-500">
      <div className="flex justify-center mb-4 text-gray-300">
        <Icon name={icon} size={40} />
      </div>
      <div className="text-[16px] font-semibold text-gray-900">{title}</div>
      {subtitle && <div className="text-[13px] mt-1 text-gray-500">{subtitle}</div>}
    </div>
  )
}
