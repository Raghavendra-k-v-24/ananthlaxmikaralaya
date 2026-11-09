import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

/*
 * Sends email through Resend (https://resend.com, free for 3,000 emails a month).
 *
 * Without RESEND_API_KEY nothing is sent: the email is logged, and if MAIL_PREVIEW_DIR is set
 * its HTML is written there so it can be opened in a browser. Tests set MAIL_CAPTURE=1 to
 * collect emails in memory instead.
 */

export const capturedMail = (globalThis.__alkMail ??= []);

export async function sendMail({ to, subject, html, text, replyTo }) {
  const recipients = [].concat(to).filter(Boolean);
  if (!recipients.length) return { skipped: true };

  if (process.env.MAIL_CAPTURE === "1") {
    capturedMail.push({ to: recipients, subject, html, text, replyTo });
    return { id: `captured-${capturedMail.length}` };
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`[mail] RESEND_API_KEY not set, not sending "${subject}" to ${recipients.join(", ")}`);
    if (process.env.MAIL_PREVIEW_DIR) {
      await fs.mkdir(process.env.MAIL_PREVIEW_DIR, { recursive: true });
      const slug = subject.replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "email";
      const file = path.join(process.env.MAIL_PREVIEW_DIR, `${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${slug}.html`);
      await fs.writeFile(file, html);
      console.log(`[mail] preview written to ${file}`);
    }
    return { skipped: true };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: config.mailFrom,
      to: recipients,
      subject,
      html,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend answered ${res.status}: ${body.slice(0, 300)}`);
  }
  return { id: (await res.json()).id };
}
