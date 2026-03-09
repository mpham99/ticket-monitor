import { NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

export async function GET() {
  try {
    const db = getDB()
    const runs = db.prepare(
      'SELECT id, crawled_at, total_listings, pages_fetched FROM crawl_runs ORDER BY crawled_at DESC LIMIT 20'
    ).all()
    return NextResponse.json({ success: true, runs })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
