# GAI HOME CONCERT — Ticket Price Monitor

A Next.js app that crawls the TicketBox resale API, stores data in SQLite, and sends browser notifications when prices drop below your threshold.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

The SQLite database is created automatically at `./data/tickets.db` on first run. No configuration needed.

### 3. Build for production
```bash
npm run build
npm start
```

## How it works

| Layer | What it does |
|---|---|
| **`/app/page.tsx`** | Server component — renders the Dashboard |
| **`/app/api/tickets`** | Returns listings from the latest crawl; triggers a fresh crawl if data is older than 5 minutes |
| **`/app/api/listings`** | Returns listings from the latest crawl (optionally filtered by ticketTypeId) |
| **`/app/api/alerts`** | Records which ticket codes have been notified (prevents duplicate alerts) |
| **`/app/api/history`** | Returns the last 20 crawl run metadata |
| **`/lib/crawler.ts`** | Core crawl logic — fetches all pages following `hasMore` pagination |
| **`/lib/db.ts`** | SQLite connection singleton and schema initialisation |
| **`/lib/crawl-loop.ts`** | Crawl logic — fetches listings and saves them to SQLite |
| **`/components/Dashboard.tsx`** | Client component — UI, polling, browser notifications |

## Deploying to Vercel

1. Push to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Deploy ✓

> **Note:** The SQLite database is written to the local filesystem. On Vercel, the filesystem is ephemeral — data resets on each deployment. For persistent storage on Vercel, consider [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or [Turso](https://turso.tech) (libSQL).
