import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const STORAGE_DIR = path.join(process.cwd(), 'storage', 'uploads')

/**
 * Phase 1: บันทึกไฟล์ลง local filesystem → storage/
 * Phase 2: เปลี่ยนฟังก์ชันนี้ให้ส่งไป Cloudflare R2 / S3 แค่จุดเดียว
 */
export async function saveFile(file: File): Promise<string> {
  await mkdir(STORAGE_DIR, { recursive: true })
  const safe = file.name.replace(/[^a-zA-Z0-9ก-๙._-]/g, '_')
  const filename = `${Date.now()}-${safe}`
  const dest = path.join(STORAGE_DIR, filename)
  await writeFile(dest, Buffer.from(await file.arrayBuffer()))
  return `/api/files/${filename}`
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
