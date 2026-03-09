import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

export async function GET() {
  try {
    const db = getDB()
    const run = db.prepare('SELECT * FROM crawl_runs ORDER BY crawled_at DESC LIMIT 1').get() as Record<string, unknown> | undefined
    return NextResponse.json({ success: true, data: run ?? null })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
