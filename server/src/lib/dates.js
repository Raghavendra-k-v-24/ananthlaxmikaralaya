// Event dates are calendar days, stored as midnight UTC so they never shift with time zones.

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseYmd(value) {
  const m = YMD.exec(value ?? "");
  if (!m) return null;
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  // rejects impossible dates such as 2026-02-31
  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function toYmd(date) {
  return date ? new Date(date).toISOString().slice(0, 10) : null;
}

// Today's date in India, as midnight UTC.
export function todayInIndia() {
  const ist = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
}

export function daysBetween(from, to) {
  return Math.round((new Date(to) - new Date(from)) / 86_400_000);
}
