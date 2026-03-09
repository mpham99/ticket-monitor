import { NextRequest, NextResponse } from 'next/server'
import { getDB, rowToListing } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const db = getDB()
    const { searchParams } = new URL(req.url)
    const idsParam = searchParams.get('ids')
    const filterIds = idsParam ? idsParam.split(',').map(Number).filter(Boolean) : null

    const run = db.prepare('SELECT * FROM crawl_runs ORDER BY crawled_at DESC LIMIT 1').get() as Record<string, unknown> | undefined
    if (!run) {
      return NextResponse.json({ success: true, listings: [], crawledAt: null, totalListings: 0, pagesFetched: 0 })
    }

    let rows: Record<string, unknown>[]
    if (filterIds && filterIds.length > 0) {
      const placeholders = filterIds.map(() => '?').join(',')
      rows = db.prepare(
        `SELECT * FROM listings WHERE crawl_run_id = ? AND ticket_type_id IN (${placeholders})`
      ).all(run.id, ...filterIds) as Record<string, unknown>[]
    } else {
      rows = db.prepare('SELECT * FROM listings WHERE crawl_run_id = ?').all(run.id) as Record<string, unknown>[]
    }

    return NextResponse.json({
      success: true,
      listings: rows.map(rowToListing),
      crawledAt: new Date(run.crawled_at as number).toISOString(),
      totalListings: run.total_listings,
      pagesFetched: run.pages_fetched,
    })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
