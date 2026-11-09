import { z } from "zod";
import { daysBetween, parseYmd, todayInIndia } from "./dates.js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EVENT_DAYS = 14;
const MAX_YEARS_AHEAD = 3;

export const STATUSES = ["new", "contacted", "confirmed", "cancelled"];

// Accepts "98765 43210", "+91 98765-43210", "098765 43210" and returns the 10 digits, or null.
export function normalizePhone(input) {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

const ymd = z.string().refine((v) => parseYmd(v) !== null, "Use a real date in YYYY-MM-DD format");

// Mirrors the checks the booking form makes in the browser, so the two always agree.
export const enquiryInput = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(80),
    phone: z
      .string()
      .trim()
      .max(20)
      .refine((v) => normalizePhone(v) !== null, "Enter a valid 10-digit mobile number")
      .transform(normalizePhone),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .max(120)
      .refine((v) => v === "" || EMAIL.test(v), "Enter a valid email address")
      .nullish()
      .transform((v) => v || null),
    occasion: z.string().trim().min(1, "Choose the occasion").max(60),
    startDate: ymd,
    endDate: ymd,
    language: z.enum(["en", "kn"]).default("en"),
    notes: z
      .string()
      .trim()
      .max(1000)
      .nullish()
      .transform((v) => v || null),
    // Hidden from people; bots that fill every field fill this one too.
    website: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const start = parseYmd(data.startDate);
    const end = parseYmd(data.endDate);
    if (!start || !end) return;
    const today = todayInIndia();
    if (daysBetween(today, start) < -1) {
      ctx.addIssue({ code: "custom", path: ["startDate"], message: "The event date has already passed" });
    }
    if (daysBetween(today, start) > MAX_YEARS_AHEAD * 366) {
      ctx.addIssue({ code: "custom", path: ["startDate"], message: "That date is too far ahead" });
    }
    if (end < start) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "The end date is before the start date" });
    } else if (daysBetween(start, end) + 1 > MAX_EVENT_DAYS) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: `Bookings can span at most ${MAX_EVENT_DAYS} days` });
    }
  });

export const loginInput = z.object({
  username: z.string().trim().toLowerCase().min(1).max(40),
  password: z.string().min(1).max(200),
});

export const changePasswordInput = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z
    .string()
    .min(10, "Use at least 10 characters")
    .max(200)
    .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), "Use letters and at least one number"),
});

export const enquiryUpdate = z
  .object({
    status: z.enum(STATUSES).optional(),
    adminNotes: z.string().max(4000).optional(),
    // confirm even though another confirmed booking overlaps these dates
    force: z.boolean().optional(),
  })
  .refine((v) => v.status !== undefined || v.adminNotes !== undefined, "Nothing to update");

export const listQuery = z.object({
  status: z.enum(["all", ...STATUSES]).default("all"),
  q: z.string().trim().max(80).default(""),
  sort: z.enum(["newest", "oldest", "eventDate"]).default("newest"),
  when: z.enum(["any", "upcoming", "past"]).default("any"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
