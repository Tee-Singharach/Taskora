import type { RequestStatus, RequestPriority, Role, Request, Department } from './types'

/* ── Date helpers ────────────────────────────────── */
const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${String(d.getFullYear() + 543).slice(-2)}`
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${fmtDate(iso)} ${hh}:${mm}`
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const now = Date.now()
  const diff = (now - new Date(iso).getTime()) / 60000
  if (diff < 1) return 'เมื่อสักครู่'
  if (diff < 60) return `${Math.floor(diff)} นาทีที่แล้ว`
  if (diff < 60 * 24) return `${Math.floor(diff / 60)} ชั่วโมงที่แล้ว`
  if (diff < 60 * 24 * 7) return `${Math.floor(diff / 60 / 24)} วันที่แล้ว`
  return fmtDate(iso)
}

export function daysFromNow(iso: string | null | undefined): number {
  if (!iso) return 0
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const due = new Date(iso); due.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/* ── Status ──────────────────────────────────────── */
export const TERMINAL_STATUSES: RequestStatus[] = ['completed', 'rejected']

export const STATUS_INFO: Record<RequestStatus, { label: string; color: string; order: number }> = {
  open:             { label: 'คำร้องใหม่',          color: 'sky',     order: 0 },
  in_progress:      { label: 'กำลังดำเนินการ',     color: 'amber',   order: 1 },
  waiting_approval: { label: 'รออนุมัติ',           color: 'violet',  order: 2 },
  completed:        { label: 'เสร็จสิ้น',           color: 'emerald', order: 3 },
  rejected:         { label: 'ปฏิเสธ',             color: 'rose',    order: 3 },
}

export function statusBadgeClass(status: RequestStatus): string {
  return `badge badge-${STATUS_INFO[status]?.color ?? 'slate'}`
}

export function isOverdue(request: Request): boolean {
  return new Date(request.dueAt).getTime() < Date.now() && !TERMINAL_STATUSES.includes(request.status)
}

/* ── Priority ────────────────────────────────────── */
export const PRIORITY_ORDER: Record<RequestPriority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

export const PRIORITY_INFO: Record<RequestPriority, { label: string; color: string }> = {
  low:    { label: 'ต่ำ',      color: 'slate' },
  normal: { label: 'ปกติ',     color: 'sky' },
  high:   { label: 'สูง',      color: 'amber' },
  urgent: { label: 'เร่งด่วน', color: 'rose' },
}

export function priorityBadgeClass(priority: RequestPriority): string {
  const color = PRIORITY_INFO[priority].color
  return color === 'rose'
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : 'bg-gray-50 text-gray-700 border-gray-200'
}

/* ── Role ────────────────────────────────────────── */
export const ROLE_INFO: Record<Role, { th: string; label: string; desc: string; color: string }> = {
  staff:   { th: 'พนักงาน',      label: 'Staff',   desc: 'สร้างและติดตามคำร้องของตน',        color: 'slate' },
  officer: { th: 'เจ้าหน้าที่',   label: 'Officer', desc: 'รับงาน อัปเดตความคืบหน้า',          color: 'sky' },
  manager: { th: 'หัวหน้างาน',    label: 'Manager', desc: 'อนุมัติคำร้อง ดู Dashboard',         color: 'violet' },
  admin:   { th: 'ผู้ดูแลระบบ',   label: 'Admin',   desc: 'จัดการผู้ใช้ บทบาท และ Audit log',  color: 'rose' },
}

export const ROLE_ORDER: Role[] = ['staff', 'officer', 'manager', 'admin']

/* ── Department ──────────────────────────────────── */
export const DEPARTMENTS = [
  { id: 'it',    name: 'ฝ่ายเทคโนโลยีสารสนเทศ', short: 'IT',       color: 'indigo' },
  { id: 'hr',    name: 'ฝ่ายบุคคล',               short: 'HR',       color: 'rose' },
  { id: 'fin',   name: 'ฝ่ายการเงิน',              short: 'Finance',  color: 'emerald' },
  { id: 'proc',  name: 'ฝ่ายจัดซื้อ',              short: 'Procure',  color: 'amber' },
  { id: 'mkt',   name: 'ฝ่ายการตลาด',              short: 'Marketing',color: 'violet' },
  { id: 'admin', name: 'ฝ่ายธุรการ',               short: 'Admin',    color: 'sky' },
]

export function deptById(id: string, departments: Department[] = DEPARTMENTS) {
  return departments.find(d => d.id === id)
}

/* ── Avatar color ────────────────────────────────── */
const AVATAR_COLORS = ['#4F6CF7','#10B981','#F59E0B','#EF4444','#8B5CF6','#0EA5E9','#F97316']
export function avatarColor(name: string): string {
  const idx = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}
export function avatarInitials(name: string): string {
  return (name || '?').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/* ── Generate ID ─────────────────────────────────── */
export function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}
