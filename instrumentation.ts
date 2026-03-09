export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startCrawlLoop } = await import('./lib/crawl-loop')
    startCrawlLoop()
  }
}
