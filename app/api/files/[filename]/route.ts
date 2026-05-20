import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { STORAGE_DIR } from '@/lib/storage'

const MIME: Record<string, string> = {
  pdf:  'application/pdf',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls:  'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params
  const safe = path.basename(filename)
  if (!safe || safe.startsWith('.')) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const filePath = path.join(STORAGE_DIR, safe)
  try {
    const buf = await readFile(filePath)
    const ext = safe.split('.').pop()?.toLowerCase() ?? ''
    const contentType = MIME[ext] ?? 'application/octet-stream'
    return new NextResponse(buf, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(safe)}`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    console.error('[files] not found:', filePath, err)
    return NextResponse.json({ error: 'not found', path: filePath }, { status: 404 })
  }
}
