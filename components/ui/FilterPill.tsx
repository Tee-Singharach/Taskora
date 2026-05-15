interface FilterPillProps {
  value: string
  label: string
  active: boolean
  onClick: () => void
  count?: number
}

export default function FilterPill({ value, label, active, onClick, count }: FilterPillProps) {
  return (
    <button
      className={`px-3 py-1.5 rounded-md text-[12px] border border-gray-200 transition-all ${
        active
          ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
          : 'bg-white text-gray-900 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      {label}
      {count !== undefined && (
        <span className="text-[11px] opacity-70 ml-1.5">
          {count}
        </span>
      )}
    </button>
  )
}
