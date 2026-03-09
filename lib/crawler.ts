export interface TicketListing {
  code: string
  orderId: number
  orderCode: string
  eventId: number
  eventName: string
  showingId: number
  ticketTypeId: number
  ticketTypeName: string
  ticketTypeColor: string
  fullPurchase: boolean
  sectionName: string
  status: number
  statusName: string
  showingStartTime: string
  showingEndTime: string
  isEnabled: boolean
  quantity: number
  price: number
  deeplink: string
}

export interface CrawlResult {
  listings: TicketListing[]
  pagesFetched: number
  error?: string
}

const API_BASE = 'https://api-v2.ticketbox.vn/marketplace/api/v1/resale-events/25671'

export async function crawlAllPages(): Promise<CrawlResult> {
  const listings: TicketListing[] = []
  let page = 1
  let hasMore = true
  let pagesFetched = 0

  while (hasMore) {
    const url = `${API_BASE}?page=${page}&limit=24`
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://ticketbox.vn/',
          'Origin': 'https://ticketbox.vn',
        },
      })
      if (!res.ok) {
        return { listings, pagesFetched, error: `HTTP ${res.status} on page ${page}` }
      }
      const json = await res.json()
      const results: TicketListing[] = json.data?.results ?? []
      listings.push(...results)
      pagesFetched++
      hasMore = json.data?.pagination?.hasMore === true
      page++
    } catch (err) {
      return {
        listings,
        pagesFetched,
        error: `Fetch error on page ${page}: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
  }

  return { listings, pagesFetched }
}
