import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { MOCK_DEPARTMENTS, MOCK_USERS, MOCK_REQUESTS, MOCK_AUDIT } from '../lib/mockData'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter })

async function main() {
  console.log('ล้างข้อมูลเดิม...')
  await db.auditLog.deleteMany()
  await db.requestAttachment.deleteMany()
  await db.requestEvent.deleteMany()
  await db.request.deleteMany()
  await db.user.deleteMany()
  await db.department.deleteMany()

  console.log('เพิ่มฝ่าย...')
  for (const d of MOCK_DEPARTMENTS) {
    await db.department.create({ data: d })
  }

  console.log('เพิ่มผู้ใช้...')
  for (const u of MOCK_USERS) {
    await db.user.create({
      data: {
        id: u.id,
        title: u.title as never,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role as never,
        dept: u.dept,
      },
    })
  }

  console.log('เพิ่มคำร้อง + ประวัติ + ไฟล์แนบ...')
  for (const r of MOCK_REQUESTS) {
    await db.request.create({
      data: {
        id: r.id,
        title: r.title,
        description: r.description,
        department: r.department,
        priority: r.priority as never,
        status: r.status as never,
        progress: r.progress,
        requesterId: r.requesterId,
        assigneeId: r.assigneeId,
        approverId: r.approverId,
        createdAt: new Date(r.createdAt),
        dueAt: new Date(r.dueAt),
        events: {
          create: r.events.map(ev => ({
            kind: ev.kind as never,
            actorId: ev.actorId,
            time: new Date(ev.time),
            msg: ev.msg,
          })),
        },
        attachments: {
          create: r.attachments.map(a => ({
            name: a.name,
            size: a.size,
          })),
        },
      },
    })
  }

  console.log('เพิ่ม audit log...')
  for (const a of MOCK_AUDIT) {
    await db.auditLog.create({
      data: {
        time: new Date(a.time),
        actor: a.actor,
        action: a.action,
        target: a.target,
        detail: a.detail,
        cat: a.cat as never,
      },
    })
  }

  console.log('เสร็จสิ้น!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
