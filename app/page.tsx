import Dashboard from '@/components/Dashboard'
import { ALL_TICKET_TYPES } from '@/lib/ticketTypes'

export default function Home() {
  const allTicketTypes = ALL_TICKET_TYPES.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    price: t.facePrice,
  }))

  return (
    <Dashboard
      initialListings={[]}
      initialLastCrawl={null}
      initialFiredCodes={[]}
      allTicketTypes={allTicketTypes}
    />
  )
}
