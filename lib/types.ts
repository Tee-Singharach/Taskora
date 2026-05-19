export type Role = 'staff' | 'officer' | 'manager' | 'admin'

export interface Department {
  id: string
  name: string
  short: string
  color: string
}
export type RequestStatus = 'open' | 'in_progress' | 'waiting_approval' | 'completed' | 'rejected'
export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent'
export type RequestType = 'repair' | 'budget' | 'equipment' | 'staffing' | 'general'
export type AuditCategory = 'workflow' | 'user' | 'security' | 'system'
export type EventKind = 'system' | 'comment' | 'approve' | 'reject'

export type UserTitle = 'นาย' | 'นาง' | 'นางสาว' | 'ดร' | 'รศ' | 'ศ'

export interface User {
  id: string
  title: UserTitle
  firstName: string
  lastName: string
  email: string
  role: Role
  dept: string
}

export interface RequestEvent {
  kind: EventKind
  actorId: string
  time: string
  msg: string
}

export interface RequestAttachment {
  name: string
  size: string
  url?: string
}

export interface Request {
  id: string
  title: string
  description: string
  department: string
  type: RequestType
  priority: RequestPriority
  status: RequestStatus
  progress: number
  requesterId: string
  assigneeId: string | null
  approverId: string
  createdAt: string
  dueAt: string
  attachments: RequestAttachment[]
  events: RequestEvent[]
}

export interface AuditEntry {
  id: string
  time: string
  actor: string
  action: string
  target: string
  detail: string
  cat: AuditCategory
}

export interface AppStore {
  users: User[]
  departments: Department[]
  requests: Request[]
  auditLog: AuditEntry[]
  currentUserId: string
  schemaVersion: number
}

export interface ToastItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}
