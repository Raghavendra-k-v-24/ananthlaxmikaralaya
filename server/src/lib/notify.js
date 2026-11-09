import { config } from "../config.js";
import { Enquiry } from "../models/Enquiry.js";
import { sendMail } from "./mail.js";
import { customerConfirmedEmail, customerReceiptEmail, ownerNewEnquiryEmail } from "./emails.js";

// Confirmed bookings whose dates overlap this enquiry's
export function confirmedClashes(enquiry) {
  return Enquiry.find({
    _id: { $ne: enquiry._id },
    status: "confirmed",
    startDate: { $lte: enquiry.endDate },
    endDate: { $gte: enquiry.startDate },
  })
    .limit(5)
    .lean();
}

async function attempt(label, send) {
  try {
    const result = await send();
    return result.skipped ? null : { ok: true, label };
  } catch (err) {
    console.error(`[mail] ${label} failed:`, err.message);
    return { ok: false, label };
  }
}

/*
 * After a new enquiry is saved: tell the owner, and send the visitor a receipt if they gave an
 * email. Never throws: the enquiry is already saved, and an email problem must not turn into an
 * error for the visitor. The outcome is written to the enquiry's history.
 */
export async function notifyNewEnquiry(enquiry) {
  const jobs = [];
  if (config.ownerEmails.length) {
    const clashes = await confirmedClashes(enquiry).catch(() => []);
    jobs.push(
      attempt("owner", () => sendMail({ to: config.ownerEmails, ...ownerNewEnquiryEmail(enquiry, { confirmedClashes: clashes }) }))
    );
  }
  if (enquiry.email) {
    jobs.push(attempt("customer", () => sendMail({ to: enquiry.email, ...customerReceiptEmail(enquiry) })));
  }

  const results = (await Promise.all(jobs)).filter(Boolean);
  if (!results.length) return;
  for (const r of results) {
    enquiry.activity.push({
      action: "email",
      by: "system",
      detail:
        r.label === "owner"
          ? r.ok
            ? "New-enquiry email sent to the owner"
            : "Couldn't email the owner about this enquiry"
          : r.ok
            ? `Receipt emailed to ${enquiry.email}`
            : `Couldn't email a receipt to ${enquiry.email}`,
    });
  }
  await enquiry.save().catch((err) => console.error("[mail] couldn't record email outcome:", err.message));
}

// Sent from the admin panel once a booking is confirmed. Throws if sending fails, so the admin sees it.
export async function sendBookingConfirmation(enquiry) {
  const result = await sendMail({ to: enquiry.email, ...customerConfirmedEmail(enquiry) });
  return !result.skipped;
}
