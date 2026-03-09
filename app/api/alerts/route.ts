import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'

export async function GET() {
  try {
    const db = getDB()
    const alerts = db.prepare('SELECT * FROM alert_records ORDER BY fired_at DESC').all()
    return NextResponse.json({ success: true, alerts })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDB()
    const body = await req.json()
    const { ticketCode, ticketTypeId, ticketTypeName, price, threshold, deeplink } = body
    if (!ticketCode) return NextResponse.json({ success: false, error: 'ticketCode required' }, { status: 400 })

    db.prepare(`
      INSERT INTO alert_records (ticket_code, ticket_type_id, ticket_type_name, price, threshold, deeplink, fired_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(ticket_code) DO UPDATE SET
        ticket_type_id   = excluded.ticket_type_id,
        ticket_type_name = excluded.ticket_type_name,
        price            = excluded.price,
        threshold        = excluded.threshold,
        deeplink         = excluded.deeplink,
        fired_at         = excluded.fired_at
    `).run(ticketCode, ticketTypeId, ticketTypeName, price, threshold, deeplink, Date.now())

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const db = getDB()
    db.prepare('DELETE FROM alert_records').run()
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
