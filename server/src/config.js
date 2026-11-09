// All settings come from environment variables (see .env.example).
// Getters read them lazily, so scripts can fill process.env before the app is used.

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env and fill it in.`);
  return value;
}

export const config = {
  get mongoUri() {
    return required("MONGODB_URI");
  },

  get jwtSecret() {
    const secret = required("JWT_SECRET");
    if (secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters long.");
    return secret;
  },

  // Sites allowed to call the API from a browser: the public site and the admin panel.
  get allowedOrigins() {
    return (process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((o) => o.trim().replace(/\/+$/, ""))
      .filter(Boolean);
  },

  // Email (see src/lib/mail.js). The sender must be on a domain verified in Resend.
  get mailFrom() {
    return process.env.MAIL_FROM || "Ananth Laxmi Mangal Karalaya <bookings@ananthlaxmikaralaya.in>";
  },
  // Who hears about new enquiries; comma-separated for more than one person.
  get ownerEmails() {
    return (process.env.OWNER_EMAIL ?? "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
  },
  // The admin panel's address, for "open this enquiry" links in the owner's email.
  get adminUrl() {
    return (process.env.ADMIN_URL || "https://admin.ananthlaxmikaralaya.in").replace(/\/+$/, "");
  },

  // How long an admin stays signed in.
  tokenTtl: "12h",

  // Login lockout: this many wrong passwords locks the account for LOCK_MINUTES.
  maxFailedLogins: 5,
  lockMinutes: 15,

  // Enquiry flood protection: at most this many enquiries per visitor per window.
  enquiriesPerWindow: 5,
  enquiryWindowMinutes: 15,
};
