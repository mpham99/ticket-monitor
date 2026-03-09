# GAI HOME CONCERT — Ticket Price Monitor

A Next.js app that crawls the TicketBox resale API every 5 minutes (server-side), stores data in MongoDB, and sends browser notifications when prices drop below your threshold.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure MongoDB
Copy `.env.local.example` to `.env.local` and fill in your MongoDB connection string:
```bash
cp .env.local.example .env.local
```
Then edit `.env.local`:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/gai-monitor?retryWrites=true&w=majority
```

### 3. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production
```bash
npm run build
npm start
```

## How it works

| Layer | What it does |
|---|---|
| **`/app/page.tsx`** | Server component — renders the Dashboard |
| **`/app/api/crawl`** | `POST` triggers a full paginated crawl and saves to MongoDB; `GET` returns latest crawl |
| **`/app/api/listings`** | Returns listings from the latest crawl (optionally filtered by ticketTypeId) |
| **`/app/api/alerts`** | Records which ticket codes have been notified (prevents duplicate alerts) |
| **`/app/api/history`** | Returns the last 20 crawl run metadata |
| **`/lib/crawler.ts`** | Core crawl logic — fetches all pages following `hasMore` pagination |
| **`/lib/models.ts`** | Mongoose schemas: `CrawlRun`, `AlertRecord` |
| **`/components/Dashboard.tsx`** | Client component — UI, polling, browser notifications |

## Deploying to Vercel

1. Push to GitHub
2. Import to [vercel.com](https://vercel.com)
3. Add `MONGODB_URI` in Environment Variables
4. Deploy ✓

> **Note:** The 5-minute auto-crawl runs client-side (via `setInterval`). For true background crawling without keeping a tab open, set up a cron job using [Vercel Cron](https://vercel.com/docs/cron-jobs) to call `POST /api/crawl` on a schedule.

## MongoDB Atlas (free tier)

1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free M0 cluster
3. Add a database user
4. Whitelist your IP (or `0.0.0.0/0` for open access)
5. Get connection string from "Connect > Connect your application"
