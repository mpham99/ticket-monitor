import { NextResponse } from 'next/server'
import { getDB, rowToListing } from '@/lib/db'

export async function GET() {
  try {
    const db = getDB()

    const run = db.prepare('SELECT * FROM crawl_runs ORDER BY crawled_at DESC LIMIT 1').get() as Record<string, unknown> | undefined
    if (!run) {
      return NextResponse.json({ listings: [], lastCrawl: null })
    }

    const rows = db.prepare('SELECT * FROM listings WHERE crawl_run_id = ?').all(run.id) as Record<string, unknown>[]

    return NextResponse.json({
      listings: rows.map(rowToListing),
      lastCrawl: {
        fetchedAt: new Date(run.crawled_at as number).toISOString(),
        totalListings: run.total_listings,
        pages: run.pages_fetched,
        durationMs: 0,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
