import { NextResponse } from 'next/server'
import { runCrawl } from '@/lib/crawl-loop'

export async function GET() {
  try {
    await runCrawl()
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}
