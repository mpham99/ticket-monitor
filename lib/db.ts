import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

declare global {
  // eslint-disable-next-line no-var
  var _sqliteDB: Database.Database | undefined
}

export function getDB(): Database.Database {
  if (global._sqliteDB) return global._sqliteDB

  // Vercel's filesystem is read-only except for /tmp
  const dataDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  const db = new Database(path.join(dataDir, 'tickets.db'))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS crawl_runs (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      crawled_at     INTEGER NOT NULL,
      total_listings INTEGER NOT NULL,
      pages_fetched  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS listings (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      crawl_run_id       INTEGER NOT NULL REFERENCES crawl_runs(id) ON DELETE CASCADE,
      code               TEXT,
      order_id           INTEGER,
      order_code         TEXT,
      event_id           INTEGER,
      event_name         TEXT,
      showing_id         INTEGER,
      ticket_type_id     INTEGER,
      ticket_type_name   TEXT,
      ticket_type_color  TEXT,
      full_purchase      INTEGER,
      section_name       TEXT,
      status             INTEGER,
      status_name        TEXT,
      showing_start_time TEXT,
      showing_end_time   TEXT,
      is_enabled         INTEGER,
      quantity           INTEGER,
      price              INTEGER,
      deeplink           TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_listings_run  ON listings(crawl_run_id);
    CREATE INDEX IF NOT EXISTS idx_listings_type ON listings(ticket_type_id);

    CREATE TABLE IF NOT EXISTS alert_records (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_code      TEXT UNIQUE NOT NULL,
      ticket_type_id   INTEGER,
      ticket_type_name TEXT,
      price            INTEGER,
      threshold        INTEGER,
      deeplink         TEXT,
      fired_at         INTEGER NOT NULL
    );
  `)

  global._sqliteDB = db
  return db
}

// Converts a snake_case listings row back to camelCase TicketListing shape
export function rowToListing(row: Record<string, unknown>) {
  return {
    code:               row.code,
    orderId:            row.order_id,
    orderCode:          row.order_code,
    eventId:            row.event_id,
    eventName:          row.event_name,
    showingId:          row.showing_id,
    ticketTypeId:       row.ticket_type_id,
    ticketTypeName:     row.ticket_type_name,
    ticketTypeColor:    row.ticket_type_color,
    fullPurchase:       row.full_purchase === 1,
    sectionName:        row.section_name,
    status:             row.status,
    statusName:         row.status_name,
    showingStartTime:   row.showing_start_time,
    showingEndTime:     row.showing_end_time,
    isEnabled:          row.is_enabled === 1,
    quantity:           row.quantity,
    price:              row.price,
    deeplink:           row.deeplink,
  }
}
