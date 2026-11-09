# Ananth Laxmi Mangal Karalaya

Three apps, each deployed as its own Vercel project:

| Folder    | What it is                              | Suggested address                         |
| --------- | --------------------------------------- | ----------------------------------------- |
| `client/` | The public website with the booking form | `ananthlaxmikaralaya.com`                 |
| `server/` | The API (Node.js, Express, MongoDB)     | `api.ananthlaxmikaralaya.com`             |
| `admin/`  | The admin panel for the owner           | `admin.ananthlaxmikaralaya.com`           |

Booking form → `POST /api/enquiries` on the server → saved in MongoDB → seen and managed in the admin panel.

## Run everything locally

```bash
# 1. API with a throw-away in-memory database (nothing to install)
cd server && npm install && npm run dev:memory     # http://localhost:4000

# 2. Admin panel
cd admin && npm install && npm run dev              # http://localhost:5180

# 3. Website
cd client && npm install && npm run dev -- --port 5179
```

Local settings live in `server/.env`, `admin/.env.local` and `client/.env.local` (copy the `.env.example` next to each).
`npm run dev:memory` creates the admin named in `SEED_ADMIN_*` in `server/.env`, so you can sign in straight away.
Use `npm run dev` instead to run against the real Atlas database in `MONGODB_URI`.

Tests: `cd server && npm test` (runs the whole API against an in-memory MongoDB).

## Deploy

Order matters: database → server → admin panel and website → domains → lock down `ALLOWED_ORIGINS`.

### 0. Put the code on GitHub
Vercel deploys from a GitHub repository. Each Vercel project points at a folder ("Root Directory"),
so all three folders can live in one repository: create three Vercel projects from the same repo.

### 1. MongoDB Atlas (free M0 cluster)
1. Create a cluster, ideally in **AWS Mumbai (ap-south-1)**, close to the Vercel region `bom1`.
2. Database Access → add a database user with a strong password.
3. Network Access → allow `0.0.0.0/0` (Vercel's servers don't have fixed IPs; the database user's password protects it).
4. Connect → Drivers → copy the connection string and add the database name, e.g. `…mongodb.net/ananth-laxmi?retryWrites=true&w=majority`.

### 2. Server project on Vercel
- Root Directory: `server`. Framework preset: **Other**. No build command.
- Environment variables:
  - `MONGODB_URI`: the Atlas string from step 1
  - `JWT_SECRET`: a long random value. Generate one with
    `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
  - `ALLOWED_ORIGINS`: `https://ananthlaxmikaralaya.com,https://www.ananthlaxmikaralaya.com,https://admin.ananthlaxmikaralaya.com`
    (add the `*.vercel.app` addresses too if you use them)
- Add the domain `api.ananthlaxmikaralaya.com`. Check `https://api.ananthlaxmikaralaya.com/api/health` returns `{"ok":true}`.

### 2b. Email with Resend (optional, can be added any time later; free: 3,000 emails/month)
Without these variables the site works normally and simply sends no email.
1. Sign up at resend.com → **Domains → Add domain** → `ananthlaxmikaralaya.com`.
2. Add the DNS records Resend shows (at the domain registrar) and wait until the domain shows **Verified**.
3. **API Keys → Create** (permission: Sending access) and add these to the server project on Vercel:
   - `RESEND_API_KEY`: the key
   - `MAIL_FROM`: `Ananth Laxmi Mangal Karalaya <bookings@ananthlaxmikaralaya.com>`
   - `OWNER_EMAIL`: the owner's address (comma-separate several)
   - `ADMIN_URL`: `https://admin.ananthlaxmikaralaya.com`
4. Redeploy the server project.

What gets sent:
- **To the owner**, for every new enquiry: all details, Call / WhatsApp buttons, a link to it in the admin panel,
  and a red warning if the dates overlap a confirmed booking. Replying goes straight to the customer.
- **To the customer**, if they gave an email: a receipt in English or Kannada (the language they used on the site),
  making clear it is not yet a confirmation. Replying goes to the owner.
- **Booking confirmed**: sent only when the admin presses *Email booking confirmation* on a confirmed enquiry.

Every send (or failure) is written to the enquiry's History in the admin panel. If email is down, enquiries are
still saved. Until a domain is verified, Resend only delivers to the email address you signed up with.

### 3. Create the admin account (no sign-up page)
On your computer, with `MONGODB_URI` in `server/.env` pointing at Atlas:

```bash
cd server
npm run create-admin -- milin "Milin Kulkarni"            # asks for the password (hidden)
npm run create-admin -- milin --reset                      # later: set a new password
```

Passwords are stored as bcrypt hashes, never as plain text. Signing in fails 5 times in a row → that account is locked for 15 minutes.

### 4. Admin project on Vercel
- Root Directory: `admin`. Framework preset: **Vite**.
- Environment variable: `VITE_API_URL` = `https://api.ananthlaxmikaralaya.com`
- Add the domain `admin.ananthlaxmikaralaya.com`. The panel tells search engines not to index it.

### 5. Website project on Vercel
- Root Directory: `client`. Framework preset: **Vite**.
- Environment variable: `VITE_ENQUIRY_ENDPOINT` = `https://api.ananthlaxmikaralaya.com/api/enquiries`
- Add the domains `ananthlaxmikaralaya.com` and `www.ananthlaxmikaralaya.com`.

`VITE_*` values are baked in at build time: after changing one, redeploy that project.

## What the admin panel does
- Overview: new / contacted / confirmed counts, enquiries in the last 7 days, upcoming confirmed bookings.
- List with status tabs, search (name, phone, email, occasion), event-date filter, sorting and paging.
- Each enquiry: call, WhatsApp (with a greeting filled in), email, copy number; change status; private notes;
  history of who changed what; other enquiries for the same dates.
- Double-booking guard: confirming dates that overlap a confirmed booking asks for an explicit "Confirm anyway".
- Export the current list to a spreadsheet (CSV, opens in Excel / Google Sheets).
- Delete an enquiry (spam etc.); change your password (signs out your other sessions).

## Protection built into the API
- Every field is checked on the server as well as in the browser.
- A hidden form field catches spam bots; one visitor can send at most 5 enquiries per 15 minutes; double-clicks don't create duplicates.
- Only the website and admin addresses in `ALLOWED_ORIGINS` can call the API from a browser.
- Admin sessions last 12 hours; changing the password ends every other session.
