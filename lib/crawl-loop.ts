import { crawlAllPages } from './crawler'
import { getDB } from './db'

const POLL_MS = 5 * 60 * 1000

async function runCrawl() {
  console.log('[crawl-loop] Starting crawl...')
  try {
    const { listings, pagesFetched, error } = await crawlAllPages()

    if (error) console.error('[crawl-loop] Crawl warning:', error)
    if (!listings.length) {
      console.warn('[crawl-loop] No listings returned, skipping save.')
      return
    }

    const db = getDB()
    const crawledAt = Date.now()

    const run = db.prepare(
      'INSERT INTO crawl_runs (crawled_at, total_listings, pages_fetched) VALUES (?, ?, ?)'
    ).run(crawledAt, listings.length, pagesFetched)

    const crawlRunId = run.lastInsertRowid

    const insertListing = db.prepare(`
      INSERT INTO listings (
        crawl_run_id, code, order_id, order_code, event_id, event_name, showing_id,
        ticket_type_id, ticket_type_name, ticket_type_color, full_purchase, section_name,
        status, status_name, showing_start_time, showing_end_time, is_enabled, quantity, price, deeplink
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    db.transaction(() => {
      for (const l of listings) {
        insertListing.run(
          crawlRunId, l.code, l.orderId, l.orderCode, l.eventId, l.eventName, l.showingId,
          l.ticketTypeId, l.ticketTypeName, l.ticketTypeColor, l.fullPurchase ? 1 : 0, l.sectionName,
          l.status, l.statusName, l.showingStartTime, l.showingEndTime, l.isEnabled ? 1 : 0,
          l.quantity, l.price, l.deeplink
        )
      }
    })()

    console.log(`[crawl-loop] Saved ${listings.length} listings (run #${crawlRunId})`)
  } catch (err) {
    console.error('[crawl-loop] Unexpected error:', err)
  }
}

export function startCrawlLoop() {
  runCrawl()
  setInterval(runCrawl, POLL_MS)
}
