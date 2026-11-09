import { format, formatDistanceToNowStrict, isThisYear, parseISO } from "date-fns";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs) => twMerge(clsx(inputs));

export const STATUS = {
  new: {
    label: "New",
    hint: "Needs a reply",
    badge: "bg-gold-400/15 text-gold-300 ring-gold-400/30",
    dot: "bg-gold-400",
  },
  contacted: {
    label: "Contacted",
    hint: "In conversation",
    badge: "bg-sky-400/12 text-sky-300 ring-sky-400/30",
    dot: "bg-sky-400",
  },
  confirmed: {
    label: "Confirmed",
    hint: "Hall booked",
    badge: "bg-emerald-400/12 text-emerald-300 ring-emerald-400/30",
    dot: "bg-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    hint: "Not going ahead",
    badge: "bg-white/[0.06] text-ivory-muted ring-white/15",
    dot: "bg-ivory-muted/70",
  },
};
export const STATUS_ORDER = ["new", "contacted", "confirmed", "cancelled"];

const day = (ymd) => parseISO(ymd);

// "12 Dec 2026" or "12 – 14 Dec 2026"
export function formatRange(start, end) {
  const a = day(start);
  const b = day(end);
  if (start === end) return format(a, "EEE, d MMM yyyy");
  if (a.getFullYear() !== b.getFullYear()) return `${format(a, "d MMM yyyy")} – ${format(b, "d MMM yyyy")}`;
  if (a.getMonth() !== b.getMonth()) return `${format(a, "d MMM")} – ${format(b, "d MMM yyyy")}`;
  return `${format(a, "d")} – ${format(b, "d MMM yyyy")}`;
}

export function formatShortDate(ymd) {
  const d = day(ymd);
  return format(d, isThisYear(d) ? "d MMM" : "d MMM yyyy");
}

export function timeAgo(iso) {
  return `${formatDistanceToNowStrict(new Date(iso))} ago`;
}

export function formatDateTime(iso) {
  return format(new Date(iso), "d MMM yyyy, h:mm a");
}

export const displayPhone = (p) => `+91 ${p.slice(0, 5)} ${p.slice(5)}`;
export const telLink = (p) => `tel:+91${p}`;
export function whatsappLink(enquiry) {
  const text = `Namaste ${enquiry.name}, thank you for your enquiry with Ananth Laxmi Mangal Karalaya for ${formatRange(enquiry.startDate, enquiry.endDate)}.`;
  return `https://wa.me/91${enquiry.phone}?text=${encodeURIComponent(text)}`;
}

export const LANGUAGE = { en: "English", kn: "Kannada" };
