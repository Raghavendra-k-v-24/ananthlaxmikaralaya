import { Router } from "express";
import mongoose from "mongoose";
import { Enquiry, serializeEnquiry } from "../models/Enquiry.js";
import { STATUSES, enquiryUpdate, listQuery } from "../lib/validation.js";
import { todayInIndia, toYmd } from "../lib/dates.js";
import { HttpError } from "../lib/http.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { sendBookingConfirmation } from "../lib/notify.js";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildFilter({ status, q, when }) {
  const filter = {};
  if (status !== "all") filter.status = status;
  if (when === "upcoming") filter.endDate = { $gte: todayInIndia() };
  if (when === "past") filter.endDate = { $lt: todayInIndia() };
  if (q) {
    const text = new RegExp(escapeRegex(q), "i");
    const or = [{ name: text }, { email: text }, { occasion: text }];
    const digits = q.replace(/\D/g, "");
    if (digits.length >= 3) or.push({ phone: new RegExp(escapeRegex(digits.slice(-10))) });
    filter.$or = or;
  }
  return filter;
}

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  eventDate: { startDate: 1, createdAt: -1 },
};

// Overview numbers for the dashboard
adminRouter.get("/stats", async (_req, res) => {
  const today = todayInIndia();
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [byStatusRows, last7Days, upcoming] = await Promise.all([
    Enquiry.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Enquiry.countDocuments({ createdAt: { $gte: weekAgo } }),
    Enquiry.find({ status: "confirmed", endDate: { $gte: today } })
      .sort({ startDate: 1 })
      .limit(5)
      .lean(),
  ]);
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const row of byStatusRows) byStatus[row._id] = row.count;
  res.json({
    byStatus,
    total: Object.values(byStatus).reduce((a, b) => a + b, 0),
    last7Days,
    upcoming: upcoming.map((e) => serializeEnquiry(e, { withActivity: false })),
  });
});

adminRouter.get("/enquiries", async (req, res) => {
  const query = listQuery.parse(req.query);
  const filter = buildFilter(query);
  const [items, total] = await Promise.all([
    Enquiry.find(filter)
      .sort(SORTS[query.sort])
      .skip((query.page - 1) * query.limit)
      .limit(query.limit)
      .lean(),
    Enquiry.countDocuments(filter),
  ]);
  res.json({
    items: items.map((e) => serializeEnquiry(e, { withActivity: false })),
    page: query.page,
    limit: query.limit,
    total,
    pages: Math.max(1, Math.ceil(total / query.limit)),
  });
});

// Spreadsheet download of the current filter (opens in Excel / Google Sheets)
adminRouter.get("/enquiries/export.csv", async (req, res) => {
  const query = listQuery.parse({ ...req.query, page: 1, limit: 100 });
  const rows = await Enquiry.find(buildFilter(query)).sort(SORTS[query.sort]).limit(5000).lean();
  const header = ["Received", "Name", "Phone", "Email", "Occasion", "From", "To", "Days", "Status", "Visitor notes", "Admin notes"];
  const cell = (v) => {
    let s = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // stop spreadsheet formula injection
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.map(cell).join(",")];
  for (const e of rows) {
    const s = serializeEnquiry(e, { withActivity: false });
    lines.push(
      [
        new Date(s.createdAt).toISOString().replace("T", " ").slice(0, 16),
        s.name,
        `+91 ${s.phone}`,
        s.email,
        s.occasion,
        s.startDate,
        s.endDate,
        s.days,
        s.status,
        s.notes,
        s.adminNotes,
      ]
        .map(cell)
        .join(",")
    );
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="enquiries-${toYmd(new Date())}.csv"`);
  res.send("﻿" + lines.join("\r\n")); // BOM so Excel reads Kannada names correctly
});

async function findEnquiry(id) {
  if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Enquiry not found");
  const enquiry = await Enquiry.findById(id);
  if (!enquiry) throw new HttpError(404, "Enquiry not found");
  return enquiry;
}

// Other live enquiries whose dates overlap this one's
function findClashes(enquiry) {
  return Enquiry.find({
    _id: { $ne: enquiry._id },
    status: { $in: ["new", "contacted", "confirmed"] },
    startDate: { $lte: enquiry.endDate },
    endDate: { $gte: enquiry.startDate },
  })
    .sort({ status: 1, startDate: 1 })
    .limit(20)
    .lean();
}

adminRouter.get("/enquiries/:id", async (req, res) => {
  const enquiry = await findEnquiry(req.params.id);
  const clashes = await findClashes(enquiry);
  res.json({
    enquiry: serializeEnquiry(enquiry),
    clashes: clashes.map((e) => serializeEnquiry(e, { withActivity: false })),
    emailEnabled: Boolean(process.env.RESEND_API_KEY || process.env.MAIL_CAPTURE === "1"),
  });
});

adminRouter.patch("/enquiries/:id", async (req, res) => {
  const update = enquiryUpdate.parse(req.body ?? {});
  const enquiry = await findEnquiry(req.params.id);
  const by = req.admin.username;

  if (update.status && update.status !== enquiry.status) {
    // Guard against double-booking the hall
    if (update.status === "confirmed" && !update.force) {
      const confirmed = (await findClashes(enquiry)).filter((e) => e.status === "confirmed");
      if (confirmed.length) {
        throw new HttpError(409, "These dates overlap a booking that is already confirmed", {
          clashes: confirmed.map((e) => serializeEnquiry(e, { withActivity: false })),
        });
      }
    }
    enquiry.activity.push({ action: "status", by, detail: `${enquiry.status} → ${update.status}` });
    enquiry.status = update.status;
  }

  if (update.adminNotes !== undefined && update.adminNotes !== enquiry.adminNotes) {
    enquiry.adminNotes = update.adminNotes;
    enquiry.activity.push({ action: "notes", by, detail: "Updated the notes" });
  }

  await enquiry.save();
  const clashes = await findClashes(enquiry);
  res.json({
    enquiry: serializeEnquiry(enquiry),
    clashes: clashes.map((e) => serializeEnquiry(e, { withActivity: false })),
    emailEnabled: Boolean(process.env.RESEND_API_KEY || process.env.MAIL_CAPTURE === "1"),
  });
});

// Emails the customer that their booking is confirmed. The admin presses this deliberately.
adminRouter.post("/enquiries/:id/send-confirmation", async (req, res) => {
  const enquiry = await findEnquiry(req.params.id);
  if (enquiry.status !== "confirmed") throw new HttpError(400, "Mark the enquiry as confirmed first");
  if (!enquiry.email) throw new HttpError(400, "This customer didn't give an email address");

  let sent;
  try {
    sent = await sendBookingConfirmation(enquiry);
  } catch (err) {
    console.error("[mail] booking confirmation failed:", err.message);
    throw new HttpError(502, "The email service didn't accept the message. Please try again in a while.");
  }
  if (!sent) throw new HttpError(503, "Email isn't set up on the server yet (RESEND_API_KEY is missing)");

  enquiry.activity.push({ action: "email", by: req.admin.username, detail: `Booking confirmation emailed to ${enquiry.email}` });
  await enquiry.save();
  const clashes = await findClashes(enquiry);
  res.json({
    enquiry: serializeEnquiry(enquiry),
    clashes: clashes.map((e) => serializeEnquiry(e, { withActivity: false })),
    emailEnabled: Boolean(process.env.RESEND_API_KEY || process.env.MAIL_CAPTURE === "1"),
  });
});

adminRouter.delete("/enquiries/:id", async (req, res) => {
  const enquiry = await findEnquiry(req.params.id);
  await enquiry.deleteOne();
  res.json({ ok: true });
});
