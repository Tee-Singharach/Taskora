'use server'

import { db } from '@/lib/db'
import { canApprove } from '@/lib/access'
import type {
  AppStore, User, Department, Request, RequestStatus, RequestPriority,
} from '@/lib/types'

type NewRequest = Omit<Request, 'id' | 'createdAt' | 'events'>
type EventKind = 'system' | 'comment' | 'approve' | 'reject'
type AuditCat = 'workflow' | 'user' | 'security' | 'system'

/* ── mappers ─────────────────────────────────────── */

type RequestRow = Awaited<ReturnType<typeof loadRequestRows>>[number]

function loadRequestRows() {
  return db.request.findMany({
    where: { deletedAt: null },
    include: { events: { orderBy: { id: 'asc' } }, attachments: true },
    orderBy: { createdAt: 'asc' },
  })
}

function mapRequest(r: RequestRow): Request {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    department: r.department,
    type: r.type as Request['type'],
    priority: r.priority as RequestPriority,
    status: r.status as RequestStatus,
    progress: r.progress,
    requesterId: r.requesterId,
    assigneeId: r.assigneeId,
    approverId: r.approverId,
    createdAt: r.createdAt.toISOString(),
    dueAt: r.dueAt.toISOString(),
    attachments: r.attachments.map(a => ({ name: a.name, size: a.size, url: a.url || undefined })),
    events: r.events.map(e => ({
      kind: e.kind as EventKind,
      actorId: e.actorId,
      time: e.time.toISOString(),
      msg: e.msg,
    })),
  }
}

/* ── helpers ─────────────────────────────────────── */

async function userName(id: string): Promise<string> {
  const u = await db.user.findUnique({ where: { id } })
  return u ? `${u.firstName} ${u.lastName}` : '—'
}

async function addEvent(requestId: string, kind: EventKind, actorId: string, msg: string) {
  await db.requestEvent.create({ data: { requestId, kind, actorId, time: new Date(), msg } })
}

async function pushAudit(actor: string, action: string, target: string, detail: string, cat: AuditCat) {
  await db.auditLog.create({ data: { actor, action, target, detail, cat, time: new Date() } })
}

/* ── read ────────────────────────────────────────── */

export async function getStore(): Promise<Omit<AppStore, 'currentUserId' | 'schemaVersion'>> {
  const [users, departments, requests, audit] = await Promise.all([
    db.user.findMany(),
    db.department.findMany(),
    loadRequestRows(),
    db.auditLog.findMany({ orderBy: [{ time: 'desc' }, { id: 'desc' }] }),
  ])

  return {
    users: users.map(u => ({
      id: u.id,
      title: u.title as User['title'],
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role as User['role'],
      dept: u.dept,
    })),
    departments: departments.map(d => ({
      id: d.id, name: d.name, short: d.short, color: d.color,
    })) as Department[],
    requests: requests.map(mapRequest),
    auditLog: audit.map(a => ({
      id: String(a.id),
      time: a.time.toISOString(),
      actor: a.actor,
      action: a.action,
      target: a.target,
      detail: a.detail,
      cat: a.cat as AuditCat,
    })),
  }
}

/* ── request mutations ───────────────────────────── */

export async function createRequest(data: NewRequest, actorId: string): Promise<Request> {
  const id = `REQ-${Date.now()}`
  await db.request.create({
    data: {
      id,
      title: data.title,
      description: data.description,
      department: data.department,
      type: data.type,
      priority: data.priority,
      status: data.status,
      progress: data.progress,
      requesterId: data.requesterId,
      assigneeId: data.assigneeId,
      approverId: data.approverId,
      dueAt: new Date(data.dueAt),
      attachments: { create: data.attachments.map(a => ({ name: a.name, size: a.size, url: a.url ?? '' })) },
      events: {
        create: [{ kind: 'system', actorId: data.requesterId, time: new Date(), msg: 'สร้างคำร้องและส่งเข้าระบบ' }],
      },
    },
  })
  await pushAudit(actorId, 'สร้างคำร้องใหม่', id, data.title, 'workflow')
  const row = await db.request.findUniqueOrThrow({
    where: { id },
    include: { events: { orderBy: { id: 'asc' } }, attachments: true },
  })
  return mapRequest(row)
}

export async function editRequest(
  id: string,
  patch: Partial<Pick<Request, 'title' | 'description' | 'type' | 'department' | 'priority' | 'dueAt' | 'attachments'>>,
) {
  const { attachments, dueAt, ...rest } = patch
  await db.request.update({
    where: { id },
    data: {
      ...rest,
      ...(dueAt ? { dueAt: new Date(dueAt) } : {}),
      ...(attachments
        ? { attachments: { deleteMany: {}, create: attachments.map(a => ({ name: a.name, size: a.size, url: a.url ?? '' })) } }
        : {}),
    },
  })
}

export async function takeRequest(id: string, actorId: string) {
  await db.request.update({ where: { id }, data: { status: 'in_progress', assigneeId: actorId } })
  await addEvent(id, 'system', actorId, `${await userName(actorId)} รับงานและเริ่มดำเนินการ`)
  await pushAudit(actorId, 'รับงาน', id, 'เริ่มดำเนินการ', 'workflow')
}

export async function reassignRequest(id: string, assigneeId: string, actorId: string, note: string) {
  const name = await userName(assigneeId)
  await db.request.update({ where: { id }, data: { assigneeId } })
  await addEvent(id, 'system', actorId, `มอบหมายงานให้ ${name}${note ? ' — ' + note : ''}`)
  await pushAudit(actorId, 'มอบหมายงาน', id, `ส่งต่อให้ ${name}`, 'workflow')
}

export async function changeStatus(id: string, status: RequestStatus, actorId: string, note: string) {
  await db.request.update({ where: { id }, data: { status } })
  await addEvent(id, 'system', actorId, note || 'เปลี่ยนสถานะงาน')
  await pushAudit(actorId, 'เปลี่ยนสถานะ', id, status, 'workflow')
}

export async function updateProgress(id: string, progress: number, actorId: string, note: string) {
  await db.request.update({ where: { id }, data: { progress } })
  await addEvent(id, 'system', actorId, `อัปเดตความคืบหน้า ${progress}% — ${note}`)
}

export async function submitForApproval(id: string, actorId: string) {
  const req = await db.request.findUnique({ where: { id } })
  const approverName = req ? await userName(req.approverId) : 'หัวหน้างาน'
  await db.request.update({ where: { id }, data: { status: 'waiting_approval', progress: 95 } })
  await addEvent(id, 'system', actorId, `ส่งเรื่องให้ ${approverName} พิจารณาอนุมัติ`)
  await pushAudit(actorId, 'ส่งอนุมัติ', id, 'รออนุมัติ', 'workflow')
}

/** Server-side guard: only the request's designated department approver (or admin) may act. */
async function assertCanApprove(id: string, actorId: string) {
  const [req, actor] = await Promise.all([
    db.request.findUnique({ where: { id } }),
    db.user.findUnique({ where: { id: actorId } }),
  ])
  if (!req || !actor) throw new Error('ไม่พบคำร้องหรือผู้ใช้')
  if (!canApprove(actor as unknown as User, req as unknown as Request)) {
    throw new Error('ไม่มีสิทธิ์อนุมัติ/ปฏิเสธคำร้องนี้')
  }
}

export async function approveRequest(id: string, actorId: string, note: string) {
  await assertCanApprove(id, actorId)
  await db.request.update({ where: { id }, data: { status: 'completed', progress: 100 } })
  await addEvent(id, 'approve', actorId, note || 'อนุมัติเรียบร้อย')
  await pushAudit(actorId, 'อนุมัติคำร้อง', id, note || 'อนุมัติ', 'workflow')
}

export async function rejectRequest(id: string, actorId: string, note: string) {
  await assertCanApprove(id, actorId)
  await db.request.update({ where: { id }, data: { status: 'rejected' } })
  await addEvent(id, 'reject', actorId, note)
  await pushAudit(actorId, 'ปฏิเสธคำร้อง', id, note, 'workflow')
}

export async function deleteRequest(id: string, actorId: string) {
  await db.request.update({ where: { id }, data: { deletedAt: new Date() } })
  await pushAudit(actorId, 'ลบคำร้อง (soft delete)', id, '', 'workflow')
}

export async function addComment(id: string, actorId: string, msg: string) {
  await addEvent(id, 'comment', actorId, msg)
}

/* ── user mutations ──────────────────────────────── */

export async function addUser(data: Omit<User, 'id'>, actorId: string) {
  const id = `u-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  await db.user.create({ data: { id, ...data, title: data.title as never, role: data.role as never } })
  await pushAudit(actorId, 'สร้างผู้ใช้ใหม่', `${data.firstName} ${data.lastName}`, data.email, 'user')
}

export async function updateUser(id: string, patch: Partial<User>, actorId: string) {
  const { id: _omit, ...rest } = patch
  await db.user.update({ where: { id }, data: rest as never })
  await pushAudit(actorId, 'อัปเดตข้อมูลผู้ใช้', id, '', 'user')
}

export async function changePassword(id: string, currentPassword: string, newPassword: string, actorId: string) {
  const user = await db.user.findUnique({ where: { id } })
  if (!user) throw new Error('ไม่พบผู้ใช้')
  if (user.password && user.password !== '' && user.password !== currentPassword) {
    throw new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง')
  }
  await db.user.update({ where: { id }, data: { password: newPassword } })
  await pushAudit(actorId, 'เปลี่ยนรหัสผ่าน', id, '', 'security')
}

export async function deleteUser(id: string, actorId: string) {
  const name = await userName(id)
  await db.user.delete({ where: { id } })
  await pushAudit(actorId, 'ลบผู้ใช้', name, '', 'user')
}

/* ── department mutations ────────────────────────── */

export async function addDept(data: Department, actorId: string) {
  await db.department.create({ data })
  await pushAudit(actorId, 'สร้างแผนกใหม่', data.id, data.name, 'system')
}

export async function updateDept(id: string, patch: Partial<Omit<Department, 'id'>>, actorId: string) {
  await db.department.update({ where: { id }, data: patch })
  await pushAudit(actorId, 'แก้ไขข้อมูลแผนก', id, '', 'system')
}

export async function deleteDept(id: string, actorId: string) {
  const d = await db.department.findUnique({ where: { id } })
  await db.department.delete({ where: { id } })
  await pushAudit(actorId, 'ลบแผนก', d?.name ?? id, '', 'system')
}
