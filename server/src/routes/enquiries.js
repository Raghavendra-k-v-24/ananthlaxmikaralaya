import { Router } from "express";
import { config } from "../config.js";
import { Enquiry } from "../models/Enquiry.js";
import { enquiryInput } from "../lib/validation.js";
import { parseYmd } from "../lib/dates.js";
import { HttpError, clientIp, hashIp } from "../lib/http.js";
import { notifyNewEnquiry } from "../lib/notify.js";

// Public: the booking form on the website posts here.
export const enquiriesRouter = Router();

enquiriesRouter.post("/", async (req, res) => {
  const data = enquiryInput.parse(req.body ?? {});

  // A bot filled the hidden field. Answer as if it worked so it does not retry, but keep nothing.
  if (data.website) return res.status(201).json({ ok: true });

  const ipHash = hashIp(clientIp(req), config.jwtSecret);
  const since = new Date(Date.now() - config.enquiryWindowMinutes * 60_000);

  const recent = await Enquiry.countDocuments({ ipHash, createdAt: { $gte: since } });
  if (recent >= config.enquiriesPerWindow) {
    throw new HttpError(429, "You have sent several enquiries just now. Please wait a few minutes, or call us.");
  }

  const startDate = parseYmd(data.startDate);
  const endDate = parseYmd(data.endDate);

  // A double-click or a resend of the same enquiry: keep the first one.
  const duplicate = await Enquiry.exists({ phone: data.phone, startDate, endDate, createdAt: { $gte: since } });
  if (duplicate) return res.status(201).json({ ok: true, id: String(duplicate._id) });

  const enquiry = await Enquiry.create({
    name: data.name,
    phone: data.phone,
    email: data.email,
    occasion: data.occasion,
    startDate,
    endDate,
    language: data.language,
    notes: data.notes,
    ipHash,
    activity: [{ action: "created", by: "website", detail: "Enquiry received from the website" }],
  });

  // Sent before answering: on Vercel the function may be frozen as soon as the response goes out.
  await notifyNewEnquiry(enquiry);

  res.status(201).json({ ok: true, id: String(enquiry._id) });
});
