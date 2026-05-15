import { PRIORITY_INFO, priorityBadgeClass } from '@/lib/utils'
import type { RequestPriority } from '@/lib/types'

interface PriorityBadgeProps {
  priority: RequestPriority
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] border ${priorityBadgeClass(priority)}`}>
      {PRIORITY_INFO[priority].label}
    </span>
  )
}
