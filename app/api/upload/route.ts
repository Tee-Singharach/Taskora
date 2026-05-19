import { NextRequest, NextResponse } from 'next/server'
import { saveFile, formatSize } from '@/lib/storage'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'no file' }, { status: 400 })

    const url = await saveFile(file)
    return NextResponse.json({ url, name: file.name, size: formatSize(file.size) })
  } catch (err) {
    console.error('[upload] failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
