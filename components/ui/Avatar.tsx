import { avatarColor, avatarInitials } from '@/lib/utils'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  style?: React.CSSProperties
}

export default function Avatar({ name, size = 'md', style }: AvatarProps) {
  const sizeClasses = size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 ${sizeClasses}`}
      style={{ background: avatarColor(name || '?'), ...style }}
      title={name}
    >
      {avatarInitials(name || '?')}
    </div>
  )
}
