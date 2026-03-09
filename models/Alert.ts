// models/Alert.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface AlertDocument extends Document {
  code: string;
  ticketTypeId: number;
  ticketTypeName: string;
  price: number;
  quantity: number;
  deeplink: string;
  firedAt: Date;
}

const AlertSchema = new Schema<AlertDocument>(
  {
    code:           { type: String, required: true, unique: true },
    ticketTypeId:   { type: Number, required: true },
    ticketTypeName: { type: String, required: true },
    price:          { type: Number, required: true },
    quantity:       { type: Number, required: true },
    deeplink:       { type: String, required: true },
    firedAt:        { type: Date, default: Date.now },
  },
  { collection: "alerts" }
);

export const Alert: Model<AlertDocument> =
  mongoose.models.Alert ??
  mongoose.model<AlertDocument>("Alert", AlertSchema);
