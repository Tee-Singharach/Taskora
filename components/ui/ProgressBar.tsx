interface ProgressBarProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
}

export default function ProgressBar({ value, size = 'sm' }: ProgressBarProps) {
  const height =
    size === 'sm' ? 'h-2' : size === 'md' ? 'h-2.5' : 'h-3'

  return (
    <div className={`${height} bg-gray-100 rounded-full overflow-hidden`}>
      <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${value}%` }} />
    </div>
  )
}
