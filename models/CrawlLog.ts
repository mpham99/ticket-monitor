// models/CrawlLog.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface CrawlLogDocument extends Document {
  fetchedAt: Date;
  totalListings: number;
  pages: number;
  success: boolean;
  error?: string;
  durationMs: number;
}

const CrawlLogSchema = new Schema<CrawlLogDocument>(
  {
    fetchedAt:     { type: Date, default: Date.now, index: true },
    totalListings: { type: Number, default: 0 },
    pages:         { type: Number, default: 0 },
    success:       { type: Boolean, required: true },
    error:         { type: String },
    durationMs:    { type: Number, default: 0 },
  },
  { collection: "crawl_logs" }
);

export const CrawlLog: Model<CrawlLogDocument> =
  mongoose.models.CrawlLog ??
  mongoose.model<CrawlLogDocument>("CrawlLog", CrawlLogSchema);
