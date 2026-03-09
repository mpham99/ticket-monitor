// types/index.ts

export interface TicketListing {
  code: string;
  orderId: number;
  orderCode: string;
  eventId: number;
  eventName: string;
  showingId: number;
  ticketTypeId: number;
  ticketTypeName: string;
  ticketTypeColor: string;
  fullPurchase: boolean;
  sectionName: string;
  status: number;
  statusName: string;
  showingStartTime: string;
  showingEndTime: string;
  isEnabled: boolean;
  quantity: number;
  price: number;
  deeplink: string;
}

export interface TicketType {
  id: number;
  name: string;
  color: string;
  price: number; // face value
}

export interface CrawlResult {
  success: boolean;
  fetchedAt: string;
  totalListings: number;
  pages: number;
  error?: string;
}

export interface AlertRecord {
  code: string;
  ticketTypeId: number;
  ticketTypeName: string;
  price: number;
  quantity: number;
  deeplink: string;
  firedAt: string;
}
