import type { User, Request, AuditEntry, RequestEvent, RequestAttachment, Department } from './types'

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'it',    name: 'ฝ่ายเทคโนโลยีสารสนเทศ', short: 'IT',        color: 'indigo' },
  { id: 'hr',    name: 'ฝ่ายบุคคล',               short: 'HR',        color: 'rose' },
  { id: 'fin',   name: 'ฝ่ายการเงิน',              short: 'Finance',   color: 'emerald' },
  { id: 'proc',  name: 'ฝ่ายจัดซื้อ',              short: 'Procure',   color: 'amber' },
  { id: 'mkt',   name: 'ฝ่ายการตลาด',              short: 'Marketing', color: 'violet' },
  { id: 'admin', name: 'ฝ่ายธุรการ',               short: 'Admin',     color: 'sky' },
]

export const MOCK_USERS: User[] = [
  { id: 'u01', title: 'นาย',   firstName: 'สมชาย',    lastName: 'รุ่งโรจน์',     role: 'staff',   dept: 'mkt',   email: 'somchai.r@taskora.co' },
  { id: 'u02', title: 'นาง',   firstName: 'นภาพร',    lastName: 'เจริญสุข',      role: 'staff',   dept: 'fin',   email: 'naphaporn.j@taskora.co' },
  { id: 'u03', title: 'นาย',   firstName: 'วิทยา',    lastName: 'ชัยพัฒนา',      role: 'staff',   dept: 'mkt',   email: 'witthaya.c@taskora.co' },
  { id: 'u04', title: 'นางสาว',firstName: 'พิมพ์ชนก', lastName: 'ธีระวุฒิ',      role: 'staff',   dept: 'proc',  email: 'pimchanok.t@taskora.co' },
  { id: 'u05', title: 'นาย',   firstName: 'ฐิติพงษ์', lastName: 'อินทรประเสริฐ', role: 'officer', dept: 'it',    email: 'thitiphong.i@taskora.co' },
  { id: 'u06', title: 'นางสาว',firstName: 'ปิยะพร',   lastName: 'โกมลศรี',       role: 'officer', dept: 'hr',    email: 'piyaporn.k@taskora.co' },
  { id: 'u07', title: 'นาย',   firstName: 'ธนวัฒน์',  lastName: 'ศิริชัย',       role: 'officer', dept: 'fin',   email: 'thanawat.s@taskora.co' },
  { id: 'u08', title: 'นาง',   firstName: 'อรนุช',    lastName: 'พงศ์พันธ์',     role: 'officer', dept: 'admin', email: 'oranuch.p@taskora.co' },
  { id: 'u09', title: 'นางสาว',firstName: 'สุภัทรา',  lastName: 'วงศ์วิวัฒน์',   role: 'manager', dept: 'it',    email: 'suphattra.w@taskora.co' },
  { id: 'u10', title: 'นาย',   firstName: 'ประวิทย์', lastName: 'เกียรติยศ',     role: 'manager', dept: 'fin',   email: 'prawit.k@taskora.co' },
  { id: 'u11', title: 'นาง',   firstName: 'เกศินี',   lastName: 'ภู่ทองคำ',      role: 'manager', dept: 'hr',    email: 'kesinee.p@taskora.co' },
  { id: 'u12', title: 'นาย',   firstName: 'ชัยวัฒน์', lastName: 'พัฒนสุข',       role: 'admin',   dept: 'it',    email: 'chaiwat.p@taskora.co' },
]

function d(yyyy: number, mm: number, dd: number, hh = 9, min = 0): string {
  return new Date(yyyy, mm - 1, dd, hh, min).toISOString()
}

function mkEvents(
  requester: string, assignee: string, approver: string,
  created: string, status: string
): RequestEvent[] {
  const c = new Date(created)
  const t1 = new Date(c); t1.setHours(t1.getHours() + 4)
  const t2 = new Date(c); t2.setDate(t2.getDate() + 1)
  const t3 = new Date(c); t3.setDate(t3.getDate() + 2)

  const evs: RequestEvent[] = [
    { kind: 'system', actorId: requester, time: created, msg: 'สร้างคำร้องและส่งเข้าระบบ' },
  ]
  if (['in_progress', 'waiting_approval', 'completed', 'rejected'].includes(status)) {
    evs.push({ kind: 'system', actorId: assignee, time: t1.toISOString(), msg: 'รับงานและเริ่มดำเนินการ' })
    evs.push({ kind: 'comment', actorId: assignee, time: new Date(t1.getTime() + 30 * 60000).toISOString(), msg: 'ได้รับเรื่องเรียบร้อยแล้ว กำลังตรวจสอบรายละเอียดเพิ่มเติม' })
  }
  if (['waiting_approval', 'completed', 'rejected'].includes(status)) {
    evs.push({ kind: 'system', actorId: assignee, time: t2.toISOString(), msg: `ส่งเรื่องให้พิจารณาอนุมัติ` })
  }
  if (status === 'completed') {
    evs.push({ kind: 'approve', actorId: approver, time: t3.toISOString(), msg: 'อนุมัติเรียบร้อย โปรดดำเนินการตามขั้นตอนต่อไป' })
  }
  if (status === 'rejected') {
    evs.push({ kind: 'reject', actorId: approver, time: t3.toISOString(), msg: 'ขอให้ปรับรายละเอียดเพิ่มเติมก่อนเสนอใหม่อีกครั้ง โดยเฉพาะส่วนของงบประมาณ' })
  }
  return evs
}

type RawTemplate = {
  title: string; dept: string; pri: string; status: string; due: number
  created: string; requester: string; assignee: string; approver: string
  progress: number; attachments: RequestAttachment[]
}

const templates: RawTemplate[] = [
  { title: 'ขอเบิกอุปกรณ์คอมพิวเตอร์ใหม่ — Notebook สำหรับงานออกแบบ', dept: 'it',    pri: 'high',   status: 'in_progress',     due: d(2026,5,16), created: d(2026,5,10), requester: 'u01', assignee: 'u05', approver: 'u09', progress: 40, attachments: [{ name:'รายละเอียดประกอบ.pdf', size:'248 KB' },{ name:'ใบเสนอราคา_v2.xlsx', size:'62 KB' }] } as unknown as RawTemplate,
  { title: 'ขออนุมัติเดินทางไปประชุมที่จังหวัดเชียงใหม่ 14–16 พ.ค.',  dept: 'fin',   pri: 'normal', status: 'completed', due: d(2026,5,13), created: d(2026,5,11,9), requester: 'u02', assignee: 'u07', approver: 'u10', progress: 100, attachments: [{ name:'เอกสารแนบ.pdf', size:'1.2 MB' }] } as unknown as RawTemplate,
  { title: 'ขอเบิกค่าเลี้ยงรับรองลูกค้าโครงการ Aurora',                dept: 'fin',   pri: 'normal', status: 'completed',        due: d(2026,5,8),  created: d(2026,5,12,10), requester: 'u03', assignee: 'u07', approver: 'u10', progress: 100, attachments: [] } as unknown as RawTemplate,
  { title: 'ขอลาพักร้อน 5 วัน ระหว่างวันที่ 20–24 พ.ค.',                dept: 'hr',    pri: 'low',    status: 'completed',        due: d(2026,5,9),  created: d(2026,5,13,14), requester: 'u04', assignee: 'u06', approver: 'u11', progress: 100, attachments: [] } as unknown as RawTemplate,
  { title: 'ขอแก้ไขสิทธิ์เข้าระบบ ERP สำหรับทีมจัดซื้อ',                dept: 'it',    pri: 'urgent', status: 'open',             due: d(2026,5,11), created: d(2026,5,10,8), requester: 'u01', assignee: null as unknown as string, approver: 'u09', progress: 0, attachments: [] } as unknown as RawTemplate,
  { title: 'ขอเสนอจัดซื้อโปรเจกเตอร์สำหรับห้องประชุม Sapphire',         dept: 'proc',  pri: 'normal', status: 'in_progress',      due: d(2026,5,15), created: d(2026,5,11,14), requester: 'u02', assignee: 'u06', approver: 'u11', progress: 55, attachments: [{ name:'รายละเอียดประกอบ.pdf', size:'248 KB' },{ name:'ใบเสนอราคา_v2.xlsx', size:'62 KB' }] } as unknown as RawTemplate,
  { title: 'ขออนุมัติการจ้างพนักงานใหม่ ตำแหน่ง Senior Designer',       dept: 'hr',    pri: 'high',   status: 'completed', due: d(2026,5,14), created: d(2026,5,12), requester: 'u03', assignee: 'u06', approver: 'u11', progress: 100, attachments: [{ name:'เอกสารแนบ.pdf', size:'1.2 MB' }] } as unknown as RawTemplate,
  { title: 'ขอติดตั้งซอฟต์แวร์ Adobe Creative Cloud (10 license)',     dept: 'it',    pri: 'normal', status: 'in_progress',      due: d(2026,5,18), created: d(2026,5,12,11), requester: 'u04', assignee: 'u05', approver: 'u09', progress: 70, attachments: [] } as unknown as RawTemplate,
  { title: 'ขอใช้ห้องประชุมใหญ่ สำหรับงาน Townhall ประจำเดือน',         dept: 'admin', pri: 'normal', status: 'completed',        due: d(2026,5,7),  created: d(2026,5,13,9), requester: 'u01', assignee: 'u08', approver: 'u09', progress: 100, attachments: [] } as unknown as RawTemplate,
  { title: 'ขอเบิกงบประมาณแคมเปญ Mid-Year Sale 2026',                  dept: 'mkt',   pri: 'high',   status: 'completed', due: d(2026,5,12), created: d(2026,5,13,15), requester: 'u02', assignee: 'u06', approver: 'u11', progress: 100, attachments: [{ name:'รายละเอียดประกอบ.pdf', size:'248 KB' },{ name:'ใบเสนอราคา_v2.xlsx', size:'62 KB' }] } as unknown as RawTemplate,
  { title: 'ขอเปลี่ยนแปลงเลขบัญชีพนักงาน',                              dept: 'hr',    pri: 'low',    status: 'rejected',        due: d(2026,5,17), created: d(2026,5,14,10), requester: 'u03', assignee: null as unknown as string, approver: 'u11', progress: 0, attachments: [] } as unknown as RawTemplate,
  { title: 'ขอจัดซื้อวัสดุสำนักงานประจำเดือน',                          dept: 'proc',  pri: 'low',    status: 'in_progress',      due: d(2026,5,19), created: d(2026,5,14,13), requester: 'u04', assignee: 'u08', approver: 'u09', progress: 25, attachments: [] } as unknown as RawTemplate,
  { title: 'ขออนุมัติงบประมาณการอบรม Data Engineering ทีมงาน 8 คน',     dept: 'hr',    pri: 'high',   status: 'completed', due: d(2026,5,15), created: d(2026,5,15,10), requester: 'u01', assignee: 'u06', approver: 'u11', progress: 100, attachments: [{ name:'เอกสารแนบ.pdf', size:'1.2 MB' }] } as unknown as RawTemplate,
  { title: 'ขอเปลี่ยน Server Storage เนื่องจากใกล้เต็ม',                  dept: 'it',    pri: 'urgent', status: 'in_progress',      due: d(2026,5,10), created: d(2026,5,15,14), requester: 'u02', assignee: 'u05', approver: 'u09', progress: 40, attachments: [] } as unknown as RawTemplate,
  { title: 'ขอออกใบกำกับภาษีให้กับลูกค้าบริษัท Northwind',              dept: 'fin',   pri: 'normal', status: 'completed',        due: d(2026,5,5),  created: d(2026,5,16,9), requester: 'u03', assignee: 'u07', approver: 'u10', progress: 100, attachments: [] } as unknown as RawTemplate,
  { title: 'ขอเสนอแผนปรับปรุงสวัสดิการประจำปี',                          dept: 'hr',    pri: 'normal', status: 'rejected',         due: d(2026,5,9),  created: d(2026,5,5),  requester: 'u04', assignee: 'u06', approver: 'u11', progress: 60, attachments: [] } as unknown as RawTemplate,
  { title: 'ขอจัดซื้ออุปกรณ์ฉุกเฉินภายในสำนักงาน',                       dept: 'admin', pri: 'high',   status: 'open',             due: d(2026,5,12), created: d(2026,5,9),  requester: 'u01', assignee: null as unknown as string, approver: 'u09', progress: 0, attachments: [] } as unknown as RawTemplate,
  { title: 'ขออนุมัติแผนการตลาดผลิตภัณฑ์ใหม่ Q3',                       dept: 'mkt',   pri: 'high',   status: 'in_progress',      due: d(2026,5,21), created: d(2026,5,6),  requester: 'u02', assignee: 'u06', approver: 'u11', progress: 55, attachments: [] } as unknown as RawTemplate,
  { title: 'ขอเชื่อมต่อ API ระบบบัญชีกับ Partner ภายนอก',                dept: 'it',    pri: 'normal', status: 'open',             due: d(2026,5,16), created: d(2026,5,9),  requester: 'u03', assignee: null as unknown as string, approver: 'u09', progress: 0, attachments: [] } as unknown as RawTemplate,
  { title: 'ขออนุมัติแผนงบประมาณซ่อมบำรุงประจำปี 2026',                  dept: 'admin', pri: 'normal', status: 'waiting_approval', due: d(2026,5,14), created: d(2026,5,7),  requester: 'u04', assignee: 'u08', approver: 'u09', progress: 95, attachments: [{ name:'รายละเอียดประกอบ.pdf', size:'248 KB' },{ name:'ใบเสนอราคา_v2.xlsx', size:'62 KB' }] } as unknown as RawTemplate,
]

const DESCRIPTIONS: Record<string, string> = {
  it:    'รายละเอียดความต้องการ: สำหรับโครงการที่กำลังจะเริ่มในเดือนหน้า ทีมงานต้องการอุปกรณ์เพิ่มเติมเพื่อรองรับการทำงานออกแบบความละเอียดสูง โปรดพิจารณาตามรายการแนบ',
  fin:   'รายละเอียดงบประมาณ: รายการค่าใช้จ่ายตามรายละเอียดในไฟล์แนบ ขอเบิกล่วงหน้าก่อนวันเดินทาง 5 วันทำการ',
  hr:    'เนื่องจากทีมงานมีภาระงานเพิ่มขึ้นต่อเนื่อง จึงขอเสนอเรื่องดังกล่าวเพื่อพิจารณาตามขั้นตอน',
  proc:  'อุปกรณ์ที่มีอยู่หมดอายุการใช้งานและมีค่าซ่อมแซมสูงกว่าจัดซื้อใหม่ จึงเห็นควรจัดซื้อใหม่ตามใบเสนอราคาแนบ',
  mkt:   'แผนงานและรายละเอียด KPI ตามเอกสารแนบ ขอความกรุณาพิจารณาเพื่อดำเนินการต่อ',
  admin: 'ตามที่ได้ประสานเบื้องต้น ขอนำเรียนรายละเอียดเพื่อพิจารณาอนุมัติตามขั้นตอน',
}

export const MOCK_REQUESTS: Request[] = (templates as unknown as Array<{
  title: string; dept: string; pri: string; status: string
  due: string; created: string; requester: string; assignee: string | null; approver: string
  progress: number; attachments: RequestAttachment[]
}>).map((t, i) => ({
  id: `REQ-${2026000 + i + 1}`,
  title: t.title,
  description: DESCRIPTIONS[t.dept] || '',
  department: t.dept,
  priority: t.pri as Request['priority'],
  status: t.status as Request['status'],
  progress: t.progress,
  requesterId: t.requester,
  assigneeId: t.assignee,
  approverId: t.approver,
  createdAt: t.created,
  dueAt: t.due,
  attachments: t.attachments,
  events: mkEvents(t.requester, t.assignee || t.requester, t.approver, t.created, t.status),
}))

export const MOCK_AUDIT: AuditEntry[] = [
  { id: 'a01', time: d(2026,5,10,9,42),  actor: 'u12', action: 'อัปเดตบทบาทผู้ใช้',    target: 'นภาพร เจริญสุข',         detail: 'เปลี่ยนบทบาทจาก Staff → Officer',           cat: 'user' },
  { id: 'a02', time: d(2026,5,10,9,14),  actor: 'u09', action: 'อนุมัติคำร้อง',         target: 'REQ-2026010',             detail: 'อนุมัติเรียบร้อย',                            cat: 'workflow' },
  { id: 'a03', time: d(2026,5,10,8,51),  actor: 'u05', action: 'รับงาน',                target: 'REQ-2026019',             detail: 'เริ่มดำเนินการ',                               cat: 'workflow' },
  { id: 'a04', time: d(2026,5,10,8,22),  actor: 'u01', action: 'สร้างคำร้องใหม่',       target: 'REQ-2026019',             detail: 'ขอเชื่อมต่อ API ระบบบัญชี',                    cat: 'workflow' },
  { id: 'a05', time: d(2026,5,9,17,10),  actor: 'u12', action: 'สร้างผู้ใช้ใหม่',        target: 'พิมพ์ชนก ธีระวุฒิ',       detail: 'เพิ่มผู้ใช้ ฝ่ายจัดซื้อ',                      cat: 'user' },
  { id: 'a06', time: d(2026,5,9,16,32),  actor: 'u11', action: 'ปฏิเสธคำร้อง',          target: 'REQ-2026016',             detail: 'ขอให้ปรับรายละเอียดงบประมาณ',                  cat: 'workflow' },
  { id: 'a07', time: d(2026,5,9,15,4),   actor: 'u12', action: 'แก้ไขโครงสร้างแผนก',    target: 'ฝ่ายการตลาด',             detail: 'เพิ่มทีมย่อย Brand',                            cat: 'system' },
  { id: 'a08', time: d(2026,5,9,11,28),  actor: 'u05', action: 'อัปโหลดไฟล์',            target: 'REQ-2026005',             detail: 'แนบใบเสนอราคา_v2.xlsx',                        cat: 'workflow' },
  { id: 'a09', time: d(2026,5,9,10,9),   actor: 'u10', action: 'อนุมัติคำร้อง',          target: 'REQ-2026003',             detail: 'อนุมัติพร้อมความเห็น',                           cat: 'workflow' },
  { id: 'a10', time: d(2026,5,9,9,45),   actor: 'u12', action: 'รีเซ็ตรหัสผ่าน',          target: 'วิทยา ชัยพัฒนา',          detail: 'ส่งลิงก์รีเซ็ตทางอีเมล',                        cat: 'security' },
  { id: 'a11', time: d(2026,5,8,18,12),  actor: 'u12', action: 'เข้าสู่ระบบ',             target: 'admin console',           detail: 'จาก IP 10.42.8.12',                             cat: 'security' },
  { id: 'a12', time: d(2026,5,8,16,58),  actor: 'u09', action: 'มอบหมายงาน',              target: 'REQ-2026008',             detail: 'ส่งต่อให้ ฐิติพงษ์',                            cat: 'workflow' },
  { id: 'a13', time: d(2026,5,8,14,30),  actor: 'u02', action: 'สร้างคำร้องใหม่',         target: 'REQ-2026010',             detail: 'ขอเบิกงบแคมเปญ Mid-Year',                       cat: 'workflow' },
  { id: 'a14', time: d(2026,5,8,11,0),   actor: 'u12', action: 'ปรับสิทธิ์ระบบ',          target: 'Role: Officer',           detail: 'เพิ่มสิทธิ์ลบไฟล์แนบ',                          cat: 'system' },
]
