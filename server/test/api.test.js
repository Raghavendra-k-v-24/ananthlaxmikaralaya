// End-to-end checks of the API against a throw-away in-memory MongoDB.  Run: npm test
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo, server, base, Admin, hashPassword, disconnectDb, mail;
const ADMIN = { username: "testadmin", password: crypto.randomBytes(9).toString("base64url") + "7a" };
const ORIGIN = "http://localhost:5180";

const ymd = (daysFromNow) => new Date(Date.now() + daysFromNow * 86_400_000).toISOString().slice(0, 10);

async function call(path, { method = "GET", body, token, ip = "10.0.0.1", origin = ORIGIN } = {}) {
  const headers = { "x-real-ip": ip, origin };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* CSV etc. */
  }
  return { status: res.status, body: json, text, headers: res.headers };
}

const enquiry = (over = {}) => ({
  name: "Ravi Kumar",
  phone: "+91 98765 43210",
  email: "Ravi@Example.com",
  occasion: "Wedding",
  startDate: ymd(40),
  endDate: ymd(41),
  language: "kn",
  notes: "About 600 guests",
  submittedAt: new Date().toISOString(),
  ...over,
});

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri("alk-test");
  process.env.JWT_SECRET = crypto.randomBytes(48).toString("base64url");
  process.env.ALLOWED_ORIGINS = `${ORIGIN},http://localhost:5179`;
  process.env.MAIL_CAPTURE = "1";
  process.env.OWNER_EMAIL = "owner@example.com";
  process.env.ADMIN_URL = "https://admin.example.com";
  const { default: app } = await import("../src/app.js");
  ({ Admin } = await import("../src/models/Admin.js"));
  ({ capturedMail: mail } = await import("../src/lib/mail.js"));
  ({ hashPassword } = await import("../src/lib/auth.js"));
  ({ disconnectDb, connectDb: globalThis.__connect } = await import("../src/db.js"));
  await globalThis.__connect();
  await Admin.create({ username: ADMIN.username, displayName: "Test", passwordHash: await hashPassword(ADMIN.password) });
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server?.close();
  await disconnectDb?.();
  await mongo?.stop();
});

let token;
let firstId;

describe("public enquiry form", () => {
  test("health check", async () => {
    const r = await call("/api/health");
    assert.equal(r.status, 200);
  });

  test("accepts a valid enquiry and normalises it", async () => {
    const r = await call("/api/enquiries", { method: "POST", body: enquiry() });
    assert.equal(r.status, 201);
    assert.ok(r.body.id);
    firstId = r.body.id;
  });

  test("a resend of the same enquiry does not create a duplicate", async () => {
    const r = await call("/api/enquiries", { method: "POST", body: enquiry() });
    assert.equal(r.status, 201);
    assert.equal(r.body.id, firstId);
  });

  test("rejects bad input with field messages", async () => {
    const r = await call("/api/enquiries", {
      method: "POST",
      body: enquiry({ name: "A", phone: "12345", email: "nope", startDate: ymd(10), endDate: ymd(5) }),
      ip: "10.0.0.2",
    });
    assert.equal(r.status, 400);
    for (const f of ["name", "phone", "email", "endDate"]) assert.ok(r.body.fields[f], `missing ${f}`);
  });

  test("rejects past dates and impossible dates", async () => {
    let r = await call("/api/enquiries", { method: "POST", body: enquiry({ startDate: ymd(-5), endDate: ymd(-5) }), ip: "10.0.0.2" });
    assert.equal(r.status, 400);
    assert.ok(r.body.fields.startDate);
    r = await call("/api/enquiries", { method: "POST", body: enquiry({ startDate: "2027-02-31", endDate: "2027-03-01" }), ip: "10.0.0.2" });
    assert.equal(r.status, 400);
  });

  test("silently drops bots that fill the hidden field", async () => {
    const r = await call("/api/enquiries", { method: "POST", body: enquiry({ website: "http://spam", phone: "9000000001" }), ip: "10.0.0.3" });
    assert.equal(r.status, 201);
    assert.equal(r.body.id, undefined);
  });

  test("limits floods from one visitor", async () => {
    let last;
    for (let i = 0; i < 6; i++) {
      last = await call("/api/enquiries", {
        method: "POST",
        body: enquiry({ phone: `90000000${10 + i}`, startDate: ymd(60 + i), endDate: ymd(60 + i) }),
        ip: "10.0.0.9",
      });
    }
    assert.equal(last.status, 429);
  });

  test("CORS only allows the configured sites", async () => {
    const ok = await call("/api/health", { origin: ORIGIN });
    assert.equal(ok.headers.get("access-control-allow-origin"), ORIGIN);
    const bad = await call("/api/health", { origin: "https://evil.example" });
    assert.equal(bad.headers.get("access-control-allow-origin"), null);
  });
});

describe("admin sign-in", () => {
  test("admin routes need a token", async () => {
    assert.equal((await call("/api/admin/enquiries")).status, 401);
    assert.equal((await call("/api/admin/enquiries", { token: "garbage" })).status, 401);
  });

  test("wrong username and wrong password give the same answer", async () => {
    const a = await call("/api/auth/login", { method: "POST", body: { username: "nobody", password: "x" } });
    const b = await call("/api/auth/login", { method: "POST", body: { username: ADMIN.username, password: "wrong" } });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.body.error, b.body.error);
  });

  test("signs in (username is case-insensitive)", async () => {
    const r = await call("/api/auth/login", { method: "POST", body: { username: "TestAdmin", password: ADMIN.password } });
    assert.equal(r.status, 200);
    assert.ok(r.body.token);
    assert.equal(r.body.admin.username, ADMIN.username);
    assert.equal(r.body.admin.passwordHash, undefined);
    token = r.body.token;
    const me = await call("/api/auth/me", { token });
    assert.equal(me.body.admin.username, ADMIN.username);
  });

  test("locks the account after repeated wrong passwords", async () => {
    await Admin.create({ username: "victim", passwordHash: await hashPassword("Something123x") });
    let r;
    for (let i = 0; i < 6; i++) r = await call("/api/auth/login", { method: "POST", body: { username: "victim", password: "bad" } });
    assert.equal(r.status, 429);
    r = await call("/api/auth/login", { method: "POST", body: { username: "victim", password: "Something123x" } });
    assert.equal(r.status, 429, "even the right password is refused while locked");
  });
});

describe("admin enquiries", () => {
  test("lists, searches and filters", async () => {
    let r = await call("/api/admin/enquiries", { token });
    assert.equal(r.status, 200);
    assert.ok(r.body.total >= 6);
    const mine = r.body.items.find((e) => e.id === firstId);
    assert.equal(mine.phone, "9876543210");
    assert.equal(mine.email, "ravi@example.com");
    assert.equal(mine.days, 2);
    assert.equal(mine.ipHash, undefined);

    r = await call("/api/admin/enquiries?q=98765", { token });
    assert.equal(r.body.total, 1);
    r = await call("/api/admin/enquiries?q=ravi&status=confirmed", { token });
    assert.equal(r.body.total, 0);
    r = await call("/api/admin/enquiries?status=bogus", { token });
    assert.equal(r.status, 400);
  });

  test("shows one enquiry with its history", async () => {
    const r = await call(`/api/admin/enquiries/${firstId}`, { token });
    assert.equal(r.status, 200);
    assert.equal(r.body.enquiry.activity[0].action, "created");
    assert.equal((await call("/api/admin/enquiries/not-an-id", { token })).status, 404);
  });

  test("changes status and notes, recording who did it", async () => {
    const r = await call(`/api/admin/enquiries/${firstId}`, {
      method: "PATCH",
      token,
      body: { status: "confirmed", adminNotes: "Advance Rs 10,000 received" },
    });
    assert.equal(r.status, 200);
    assert.equal(r.body.enquiry.status, "confirmed");
    assert.equal(r.body.enquiry.adminNotes, "Advance Rs 10,000 received");
    const actions = r.body.enquiry.activity.map((a) => a.action).filter((a) => a !== "email");
    assert.deepEqual(actions, ["created", "status", "notes"]);
    assert.equal(r.body.enquiry.activity.find((a) => a.action === "status").by, ADMIN.username);
  });

  test("refuses to double-book confirmed dates unless forced", async () => {
    const other = await call("/api/enquiries", {
      method: "POST",
      body: enquiry({ name: "Second Family", phone: "9123456789", startDate: ymd(41), endDate: ymd(41) }),
      ip: "10.0.0.20",
    });
    const id = other.body.id;
    const detail = await call(`/api/admin/enquiries/${id}`, { token });
    assert.equal(detail.body.clashes[0].id, firstId);

    let r = await call(`/api/admin/enquiries/${id}`, { method: "PATCH", token, body: { status: "confirmed" } });
    assert.equal(r.status, 409);
    assert.equal(r.body.clashes[0].id, firstId);
    r = await call(`/api/admin/enquiries/${id}`, { method: "PATCH", token, body: { status: "confirmed", force: true } });
    assert.equal(r.status, 200);
  });

  test("stats count by status and list upcoming bookings", async () => {
    const r = await call("/api/admin/stats", { token });
    assert.equal(r.status, 200);
    assert.equal(r.body.byStatus.confirmed, 2);
    assert.equal(r.body.upcoming[0].id, firstId);
  });

  test("exports a CSV that is safe to open in Excel", async () => {
    await call("/api/enquiries", {
      method: "POST",
      body: enquiry({ name: "=HYPERLINK(1)", phone: "9988776655", startDate: ymd(90), endDate: ymd(90) }),
      ip: "10.0.0.30",
    });
    const r = await call("/api/admin/enquiries/export.csv", { token });
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /text\/csv/);
    assert.match(r.text, /'=HYPERLINK\(1\)/);
    assert.match(r.text, /Ravi Kumar/);
  });

  test("deletes an enquiry", async () => {
    const list = await call("/api/admin/enquiries?q=HYPERLINK", { token });
    const id = list.body.items[0].id;
    assert.equal((await call(`/api/admin/enquiries/${id}`, { method: "DELETE", token })).status, 200);
    assert.equal((await call(`/api/admin/enquiries/${id}`, { token })).status, 404);
  });
});

describe("emails", () => {
  test("a new enquiry emails the owner and a Kannada receipt to the customer", async () => {
    mail.length = 0;
    const r = await call("/api/enquiries", {
      method: "POST",
      body: enquiry({
        name: "Lakshmi <b>Rao</b>",
        phone: "9811122233",
        email: "lakshmi@example.com",
        language: "kn",
        startDate: ymd(40),
        endDate: ymd(40),
        notes: "<script>alert(1)</script>",
      }),
      ip: "10.0.0.40",
    });
    assert.equal(r.status, 201);
    const owner = mail.find((m) => m.to.includes("owner@example.com"));
    const customer = mail.find((m) => m.to.includes("lakshmi@example.com"));
    assert.ok(owner && customer, "both emails sent");

    assert.match(owner.subject, /^New enquiry: /);
    assert.match(owner.html, new RegExp(`https://admin.example.com/enquiries/${r.body.id}`));
    assert.match(owner.html, /overlap a confirmed booking/, "warns about the confirmed booking on these dates");
    assert.equal(owner.replyTo, "lakshmi@example.com");
    assert.doesNotMatch(owner.html, /<script>|<b>Rao/, "visitor input is escaped");

    assert.match(customer.subject, /ನಿಮ್ಮ ವಿಚಾರಣೆ/);
    assert.match(customer.html, /ಮದುವೆ/, "occasion shown in Kannada");
    assert.match(customer.html, /98111 22233/);
    assert.equal(customer.replyTo, "owner@example.com");
    assert.doesNotMatch(customer.html, /<script>/);

    const detail = await call(`/api/admin/enquiries/${r.body.id}`, { token });
    const emails = detail.body.enquiry.activity.filter((a) => a.action === "email");
    assert.equal(emails.length, 2, "both sends are recorded in the history");
  });

  test("no receipt when the customer gave no email", async () => {
    mail.length = 0;
    await call("/api/enquiries", {
      method: "POST",
      body: enquiry({ email: null, phone: "9822233344", startDate: ymd(120), endDate: ymd(120) }),
      ip: "10.0.0.41",
    });
    assert.deepEqual(mail.map((m) => m.to[0]), ["owner@example.com"]);
  });

  test("booking confirmation is sent only for confirmed enquiries with an email", async () => {
    const list = await call("/api/admin/enquiries?q=lakshmi", { token });
    const id = list.body.items[0].id;
    let r = await call(`/api/admin/enquiries/${id}/send-confirmation`, { method: "POST", token });
    assert.equal(r.status, 400, "not confirmed yet");

    await call(`/api/admin/enquiries/${id}`, { method: "PATCH", token, body: { status: "confirmed", force: true } });
    mail.length = 0;
    r = await call(`/api/admin/enquiries/${id}/send-confirmation`, { method: "POST", token });
    assert.equal(r.status, 200);
    assert.equal(mail.length, 1);
    assert.match(mail[0].subject, /ಬುಕಿಂಗ್ ದೃಢಪಟ್ಟಿದೆ/);
    assert.ok(r.body.enquiry.activity.some((a) => a.detail.startsWith("Booking confirmation emailed")));

    const noEmail = await call("/api/admin/enquiries?q=9822233344", { token });
    const id2 = noEmail.body.items[0].id;
    await call(`/api/admin/enquiries/${id2}`, { method: "PATCH", token, body: { status: "confirmed" } });
    r = await call(`/api/admin/enquiries/${id2}/send-confirmation`, { method: "POST", token });
    assert.equal(r.status, 400);
  });
});

describe("password change", () => {
  test("rejects a wrong current password and weak new ones", async () => {
    let r = await call("/api/auth/change-password", { method: "POST", token, body: { currentPassword: "nope", newPassword: "Abcdefghij12" } });
    assert.equal(r.status, 400);
    assert.ok(r.body.fields.currentPassword);
    r = await call("/api/auth/change-password", { method: "POST", token, body: { currentPassword: ADMIN.password, newPassword: "short" } });
    assert.equal(r.status, 400);
    assert.ok(r.body.fields.newPassword);
  });

  test("changes it and signs out older sessions", async () => {
    const newPassword = "Fresh" + crypto.randomBytes(6).toString("hex") + "9";
    const r = await call("/api/auth/change-password", { method: "POST", token, body: { currentPassword: ADMIN.password, newPassword } });
    assert.equal(r.status, 200);
    assert.equal((await call("/api/auth/me", { token })).status, 401, "old token no longer works");
    assert.equal((await call("/api/auth/me", { token: r.body.token })).status, 200);
    const login = await call("/api/auth/login", { method: "POST", body: { username: ADMIN.username, password: newPassword } });
    assert.equal(login.status, 200);
  });
});
