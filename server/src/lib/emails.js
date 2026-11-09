import { config } from "../config.js";
import { toYmd } from "./dates.js";

/*
 * Email templates. Email apps support only old-fashioned HTML, so these use tables and inline
 * styles. Everything a visitor typed is escaped before it goes into the HTML.
 */

export const SITE = {
  nameEn: "Ananth Laxmi Mangal Karalaya",
  nameKn: "ಅನಂತಲಕ್ಷ್ಮೀ ಮಂಗಲ ಕಾರ್ಯಾಲಯ",
  phone: "+91 99168 74924",
  phoneTel: "+919916874924",
  addressEn: "Gyani Garden, Station Road, Chhatrapati Shivaji Nagar, Vijayapura, Karnataka 586104",
  addressKn: "ಗ್ಯಾನಿ ಗಾರ್ಡನ್, ಸ್ಟೇಷನ್ ರಸ್ತೆ, ಛತ್ರಪತಿ ಶಿವಾಜಿ ನಗರ, ವಿಜಯಪುರ, ಕರ್ನಾಟಕ 586104",
  mapsUrl: "https://maps.app.goo.gl/Gdp9NN34QD9pGLqa7",
  siteUrl: "https://ananthlaxmikaralaya.com",
};

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const nl2br = (s) => esc(s).replace(/\r?\n/g, "<br>");

const OCCASION_KN = {
  Wedding: "ಮದುವೆ",
  Engagement: "ನಿಶ್ಚಿತಾರ್ಥ",
  Reception: "ಆರತಕ್ಷತೆ",
  "Naming ceremony": "ನಾಮಕರಣ",
};

function formatDates(e, lang) {
  const fmt = new Intl.DateTimeFormat(lang === "kn" ? "kn-IN" : "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const start = fmt.format(new Date(e.startDate));
  const end = fmt.format(new Date(e.endDate));
  const days = Math.round((new Date(e.endDate) - new Date(e.startDate)) / 86_400_000) + 1;
  const range = toYmd(e.startDate) === toYmd(e.endDate) ? start : `${start} – ${end}`;
  if (lang === "kn") return `${range} (${days} ${days === 1 ? "ದಿನ" : "ದಿನಗಳು"})`;
  return `${range} (${days} day${days === 1 ? "" : "s"})`;
}

const displayPhone = (p) => `+91 ${p.slice(0, 5)} ${p.slice(5)}`;

/* ---------- shared layout ---------- */

const C = {
  page: "#f5efe3",
  card: "#ffffff",
  ink: "#231d33",
  muted: "#6b6478",
  line: "#ebe3d3",
  night: "#0e0c24",
  gold: "#b8862f",
  goldSoft: "#f8efd9",
};
const FONT = "'Segoe UI', Roboto, Helvetica, Arial, 'Noto Sans Kannada', sans-serif";
const SERIF = "Georgia, 'Times New Roman', 'Noto Serif Kannada', serif";

function layout({ lang = "en", preheader, body }) {
  const brand = lang === "kn" ? SITE.nameKn : SITE.nameEn;
  const blessing = lang === "kn" ? "ಶ್ರೀ ವೆಂಕಟೇಶ್ವರನ ಆಶೀರ್ವಾದದೊಂದಿಗೆ" : "With the blessings of Sri Venkateswara";
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${esc(brand)}</title>
</head>
<body style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};">
<tr><td align="center" style="padding:28px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
    <tr><td style="background:${C.night};border-radius:16px 16px 0 0;padding:26px 28px;text-align:center;">
      <div style="font-family:${SERIF};font-size:24px;line-height:1.3;color:#f2d595;">${esc(brand)}</div>
      <div style="font-family:${FONT};font-size:12px;letter-spacing:2px;color:#c9c0d3;margin-top:6px;">${esc(lang === "kn" ? "ವಿಜಯಪುರ" : "VIJAYAPURA")}</div>
    </td></tr>
    <tr><td style="background:${C.card};padding:30px 28px;font-family:${FONT};font-size:15px;line-height:1.65;color:${C.ink};">
      ${body}
    </td></tr>
    <tr><td style="background:${C.card};border-top:1px solid ${C.line};border-radius:0 0 16px 16px;padding:20px 28px;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.muted};">
      <div style="font-family:${SERIF};font-size:15px;color:${C.gold};margin-bottom:6px;">${esc(blessing)}</div>
      ${esc(lang === "kn" ? SITE.addressKn : SITE.addressEn)}<br>
      <a href="tel:${SITE.phoneTel}" style="color:${C.ink};text-decoration:none;">${SITE.phone}</a>
      &nbsp;·&nbsp; <a href="${SITE.mapsUrl}" style="color:${C.gold};">${esc(lang === "kn" ? "ದಾರಿ ತೋರಿಸಿ" : "Get directions")}</a>
      &nbsp;·&nbsp; <a href="${SITE.siteUrl}" style="color:${C.gold};">ananthlaxmikaralaya.com</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`;
}

function detailsTable(rows) {
  const cells = rows
    .filter(([, v]) => v)
    .map(
      ([label, value]) => `<tr>
      <td style="padding:9px 14px;border-bottom:1px solid ${C.line};color:${C.muted};font-size:13px;width:38%;vertical-align:top;">${esc(label)}</td>
      <td style="padding:9px 14px;border-bottom:1px solid ${C.line};font-weight:600;vertical-align:top;">${value}</td>
    </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:12px;border-collapse:separate;overflow:hidden;margin:18px 0;">${cells}</table>`;
}

function button(href, label, { primary = true } = {}) {
  const style = primary
    ? `background:${C.gold};color:#ffffff;border:1px solid ${C.gold};`
    : `background:#ffffff;color:${C.ink};border:1px solid ${C.line};`;
  return `<a href="${esc(href)}" style="${style}display:inline-block;padding:11px 20px;border-radius:999px;font-weight:600;font-size:14px;text-decoration:none;margin:4px 6px 4px 0;">${esc(label)}</a>`;
}

const textBlock = (lines) => lines.filter((l) => l !== null && l !== undefined).join("\n");

/* ---------- 1. to the owner: a new enquiry ---------- */

export function ownerNewEnquiryEmail(e, { confirmedClashes = [] } = {}) {
  const id = String(e._id);
  const link = `${config.adminUrl}/enquiries/${id}`;
  const dates = formatDates(e, "en");
  const wa = `https://wa.me/91${e.phone}?text=${encodeURIComponent(`Namaste ${e.name}, thank you for your enquiry with ${SITE.nameEn}.`)}`;

  const warning = confirmedClashes.length
    ? `<div style="background:#fdecea;border:1px solid #f3c2bb;border-radius:12px;padding:12px 14px;margin:0 0 18px;color:#8a2a1d;font-size:14px;">
        <strong>These dates overlap a confirmed booking:</strong><br>
        ${confirmedClashes.map((c) => `${esc(c.name)} · ${esc(formatDates(c, "en"))}`).join("<br>")}
      </div>`
    : "";

  const body = `
    <div style="font-family:${SERIF};font-size:22px;margin:0 0 4px;">New booking enquiry</div>
    <div style="color:${C.muted};font-size:14px;margin-bottom:18px;">Received from the website</div>
    ${warning}
    ${detailsTable([
      ["Name", esc(e.name)],
      ["Phone", `<a href="tel:+91${e.phone}" style="color:${C.ink};">${displayPhone(e.phone)}</a>`],
      ["Email", e.email ? `<a href="mailto:${esc(e.email)}" style="color:${C.ink};">${esc(e.email)}</a>` : null],
      ["Occasion", esc(e.occasion)],
      ["Dates", esc(dates)],
      ["Form language", e.language === "kn" ? "Kannada" : "English"],
      ["Message", e.notes ? nl2br(e.notes) : null],
    ])}
    <div style="margin-top:6px;">
      ${button(link, "Open in admin panel")}
      ${button(`tel:+91${e.phone}`, "Call", { primary: false })}
      ${button(wa, "WhatsApp", { primary: false })}
    </div>`;

  return {
    subject: `New enquiry: ${e.name} · ${e.occasion} · ${dates}`,
    html: layout({ lang: "en", preheader: `${e.name} wants to book ${dates}`, body }),
    text: textBlock([
      "New booking enquiry from the website",
      confirmedClashes.length ? "\nWARNING: these dates overlap a confirmed booking.\n" : null,
      `Name: ${e.name}`,
      `Phone: ${displayPhone(e.phone)}`,
      e.email ? `Email: ${e.email}` : null,
      `Occasion: ${e.occasion}`,
      `Dates: ${dates}`,
      e.notes ? `Message: ${e.notes}` : null,
      "",
      `Open in the admin panel: ${link}`,
    ]),
    replyTo: e.email || undefined,
  };
}

/* ---------- 2. to the customer: we received your enquiry ---------- */

const COPY = {
  en: {
    receiptSubject: `We've received your enquiry · ${SITE.nameEn}`,
    confirmedSubject: `Your booking is confirmed · ${SITE.nameEn}`,
    greeting: (n) => `Namaste ${n},`,
    receiptIntro: (phone) =>
      `Thank you for choosing ${SITE.nameEn}. We have received your enquiry and will call you on <strong>${phone}</strong> shortly to confirm availability.`,
    receiptIntroText: (phone) =>
      `Thank you for choosing ${SITE.nameEn}. We have received your enquiry and will call you on ${phone} shortly to confirm availability.`,
    receiptNote: "Please note: this is not yet a booking confirmation. Your dates are reserved once we have spoken with you.",
    confirmedIntro: `We are delighted to confirm your booking at ${SITE.nameEn}. Here are the details:`,
    confirmedNote: `If anything changes, or you have questions about catering, decoration or arrangements, call us on ${SITE.phone}.`,
    occasion: "Occasion",
    dates: "Dates",
    message: "Your message",
    contact: `Questions? Call us on ${SITE.phone} or simply reply to this email.`,
    directions: "Get directions",
    closing: "We look forward to welcoming you.",
  },
  kn: {
    receiptSubject: `ನಿಮ್ಮ ವಿಚಾರಣೆ ನಮಗೆ ತಲುಪಿದೆ · ${SITE.nameKn}`,
    confirmedSubject: `ನಿಮ್ಮ ಬುಕಿಂಗ್ ದೃಢಪಟ್ಟಿದೆ · ${SITE.nameKn}`,
    greeting: (n) => `ನಮಸ್ಕಾರ ${n},`,
    receiptIntro: (phone) =>
      `${SITE.nameKn}ವನ್ನು ಆಯ್ಕೆ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ವಿಚಾರಣೆ ನಮಗೆ ತಲುಪಿದೆ. ದಿನಾಂಕಗಳ ಲಭ್ಯತೆಯನ್ನು ಖಚಿತಪಡಿಸಲು ಶೀಘ್ರದಲ್ಲೇ <strong>${phone}</strong> ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡುತ್ತೇವೆ.`,
    receiptIntroText: (phone) =>
      `${SITE.nameKn}ವನ್ನು ಆಯ್ಕೆ ಮಾಡಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ವಿಚಾರಣೆ ನಮಗೆ ತಲುಪಿದೆ. ದಿನಾಂಕಗಳ ಲಭ್ಯತೆಯನ್ನು ಖಚಿತಪಡಿಸಲು ಶೀಘ್ರದಲ್ಲೇ ${phone} ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡುತ್ತೇವೆ.`,
    receiptNote: "ದಯವಿಟ್ಟು ಗಮನಿಸಿ: ಇದು ಇನ್ನೂ ಬುಕಿಂಗ್ ದೃಢೀಕರಣವಲ್ಲ. ನಿಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡಿದ ನಂತರವೇ ದಿನಾಂಕಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗುತ್ತದೆ.",
    confirmedIntro: "ನಿಮ್ಮ ಬುಕಿಂಗ್ ದೃಢಪಟ್ಟಿದೆ ಎಂದು ತಿಳಿಸಲು ನಮಗೆ ಸಂತೋಷವಾಗುತ್ತಿದೆ. ವಿವರಗಳು ಇಲ್ಲಿವೆ:",
    confirmedNote: `ಯಾವುದೇ ಬದಲಾವಣೆ ಇದ್ದರೆ ಅಥವಾ ಊಟ, ಅಲಂಕಾರ, ವ್ಯವಸ್ಥೆಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳಿದ್ದರೆ ${SITE.phone} ಗೆ ಕರೆ ಮಾಡಿ.`,
    occasion: "ಸಮಾರಂಭ",
    dates: "ದಿನಾಂಕಗಳು",
    message: "ನಿಮ್ಮ ಸಂದೇಶ",
    contact: `ಪ್ರಶ್ನೆಗಳಿದ್ದರೆ ${SITE.phone} ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಈ ಇಮೇಲ್‌ಗೆ ಉತ್ತರಿಸಿ.`,
    directions: "ದಾರಿ ತೋರಿಸಿ",
    closing: "ನಿಮ್ಮನ್ನು ಸ್ವಾಗತಿಸಲು ಎದುರು ನೋಡುತ್ತಿದ್ದೇವೆ.",
  },
};

const occasionIn = (e, lang) => (lang === "kn" ? (OCCASION_KN[e.occasion] ?? e.occasion) : e.occasion);
const replyToOwner = () => config.ownerEmails[0];

export function customerReceiptEmail(e) {
  const lang = e.language === "kn" ? "kn" : "en";
  const t = COPY[lang];
  const phone = displayPhone(e.phone);
  const dates = formatDates(e, lang);
  const body = `
    <p style="margin:0 0 12px;font-size:16px;">${esc(t.greeting(e.name))}</p>
    <p style="margin:0 0 4px;">${t.receiptIntro(esc(phone))}</p>
    ${detailsTable([
      [t.occasion, esc(occasionIn(e, lang))],
      [t.dates, esc(dates)],
      [t.message, e.notes ? nl2br(e.notes) : null],
    ])}
    <div style="background:${C.goldSoft};border-radius:12px;padding:12px 14px;font-size:14px;color:#5c4415;margin-bottom:18px;">${esc(t.receiptNote)}</div>
    <p style="margin:0 0 14px;">${esc(t.contact)}</p>
    <div>${button(`tel:${SITE.phoneTel}`, SITE.phone)}${button(SITE.mapsUrl, t.directions, { primary: false })}</div>`;
  return {
    subject: t.receiptSubject,
    html: layout({ lang, preheader: t.receiptIntroText(phone), body }),
    text: textBlock([t.greeting(e.name), "", t.receiptIntroText(phone), "", `${t.occasion}: ${occasionIn(e, lang)}`, `${t.dates}: ${dates}`, e.notes ? `${t.message}: ${e.notes}` : null, "", t.receiptNote, "", t.contact]),
    replyTo: replyToOwner(),
  };
}

/* ---------- 3. to the customer: booking confirmed (sent from the admin panel) ---------- */

export function customerConfirmedEmail(e) {
  const lang = e.language === "kn" ? "kn" : "en";
  const t = COPY[lang];
  const dates = formatDates(e, lang);
  const body = `
    <p style="margin:0 0 12px;font-size:16px;">${esc(t.greeting(e.name))}</p>
    <p style="margin:0 0 4px;">${esc(t.confirmedIntro)}</p>
    ${detailsTable([
      [t.occasion, esc(occasionIn(e, lang))],
      [t.dates, `<span style="color:${C.gold};">${esc(dates)}</span>`],
    ])}
    <p style="margin:0 0 14px;">${esc(t.confirmedNote)}</p>
    <p style="margin:0 0 16px;font-family:${SERIF};font-size:17px;">${esc(t.closing)}</p>
    <div>${button(`tel:${SITE.phoneTel}`, SITE.phone)}${button(SITE.mapsUrl, t.directions, { primary: false })}</div>`;
  return {
    subject: t.confirmedSubject,
    html: layout({ lang, preheader: `${t.confirmedIntro} ${dates}`, body }),
    text: textBlock([t.greeting(e.name), "", t.confirmedIntro, `${t.occasion}: ${occasionIn(e, lang)}`, `${t.dates}: ${dates}`, "", t.confirmedNote, "", t.closing]),
    replyTo: replyToOwner(),
  };
}
