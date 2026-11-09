import crypto from "node:crypto";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

// The visitor's IP. Vercel sets x-real-ip / x-forwarded-for itself, so they can be trusted there.
export function clientIp(req) {
  return req.headers["x-real-ip"] || String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim() || req.ip || "";
}

export function hashIp(ip, secret) {
  return crypto.createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}

export function zodFields(err) {
  const fields = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  return fields;
}

export function notFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Please check the highlighted fields", fields: zodFields(err) });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...err.extra });
  }
  if (err?.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON body" });
  if (err?.type === "entity.too.large") return res.status(413).json({ error: "Request is too large" });
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side. Please try again." });
}
