import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '../lib/generated/prisma/client'

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter })

async function main() {
  await db.requestEvent.deleteMany({})
  console.log('cleared: requestEvents')
  await db.requestAttachment.deleteMany({})
  console.log('cleared: requestAttachments')
  await db.request.deleteMany({})
  console.log('cleared: requests')
  await db.auditLog.deleteMany({})
  console.log('cleared: auditLog')
  const deleted = await db.user.deleteMany({ where: { role: { not: 'admin' } } })
  console.log(`cleared: ${deleted.count} users (admin kept)`)

  const remaining = await db.user.findMany()
  console.log('remaining users:', remaining.map(u => `${u.firstName} ${u.lastName} (${u.role})`))
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
