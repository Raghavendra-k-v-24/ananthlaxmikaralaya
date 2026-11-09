import mongoose from "mongoose";
import { STATUSES } from "../lib/validation.js";
import { daysBetween, toYmd } from "../lib/dates.js";

const activitySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    by: { type: String, default: "website" }, // admin username, or "website" for the visitor
    action: { type: String, required: true }, // "created" | "status" | "notes"
    detail: { type: String, default: "" },
  },
  { _id: false }
);

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, index: true }, // 10 digits, no country code
    email: { type: String, default: null, lowercase: true, trim: true },
    occasion: { type: String, required: true, maxlength: 60 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    language: { type: String, enum: ["en", "kn"], default: "en" },
    notes: { type: String, default: null, maxlength: 1000 },

    status: { type: String, enum: STATUSES, default: "new", index: true },
    adminNotes: { type: String, default: "", maxlength: 4000 },
    activity: { type: [activitySchema], default: [] },

    // A salted hash of the visitor's IP, only used to stop floods. Never shown.
    ipHash: { type: String, select: false },
  },
  { timestamps: true }
);

enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ startDate: 1, endDate: 1 });
enquirySchema.index({ ipHash: 1, createdAt: -1 });

export const Enquiry = mongoose.models.Enquiry ?? mongoose.model("Enquiry", enquirySchema);

// The shape the admin panel receives. Works for documents and lean objects alike.
export function serializeEnquiry(e, { withActivity = true } = {}) {
  return {
    id: String(e._id),
    name: e.name,
    phone: e.phone,
    email: e.email ?? null,
    occasion: e.occasion,
    startDate: toYmd(e.startDate),
    endDate: toYmd(e.endDate),
    days: daysBetween(e.startDate, e.endDate) + 1,
    language: e.language,
    notes: e.notes ?? null,
    status: e.status,
    adminNotes: e.adminNotes ?? "",
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    ...(withActivity ? { activity: e.activity ?? [] } : {}),
  };
}
