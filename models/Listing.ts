// models/Listing.ts
import mongoose, { Schema, Document, Model } from "mongoose";
import { TicketListing } from "@/types";

export interface ListingDocument extends TicketListing, Document {
  savedAt: Date;
}

const ListingSchema = new Schema<ListingDocument>(
  {
    code:             { type: String, required: true, index: true },
    orderId:          { type: Number, required: true },
    orderCode:        { type: String, required: true },
    eventId:          { type: Number, required: true },
    eventName:        { type: String, required: true },
    showingId:        { type: Number, required: true },
    ticketTypeId:     { type: Number, required: true, index: true },
    ticketTypeName:   { type: String, required: true },
    ticketTypeColor:  { type: String },
    fullPurchase:     { type: Boolean, default: false },
    sectionName:      { type: String, default: "" },
    status:           { type: Number },
    statusName:       { type: String },
    showingStartTime: { type: String },
    showingEndTime:   { type: String },
    isEnabled:        { type: Boolean, default: true },
    quantity:         { type: Number, required: true },
    price:            { type: Number, required: true, index: true },
    deeplink:         { type: String, required: true },
    savedAt:          { type: Date, default: Date.now, index: true },
  },
  { collection: "listings" }
);

// Compound index for deduplication
ListingSchema.index({ code: 1, savedAt: -1 });

export const Listing: Model<ListingDocument> =
  mongoose.models.Listing ??
  mongoose.model<ListingDocument>("Listing", ListingSchema);
