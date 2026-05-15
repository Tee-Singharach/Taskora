import Icon from './Icon'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({ value, onChange, placeholder = 'ค้นหา...' }: SearchInputProps) {
  return (
    <div className="relative w-[240px]">
      <Icon name="search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-gray-200 rounded-md py-1.5 pl-8 pr-3 text-[13px] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
      />
    </div>
  )
}
