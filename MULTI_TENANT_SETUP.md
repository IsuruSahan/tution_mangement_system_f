# Multi-Tenant Conversion — Setup Guide

This converts your tuition management system from a single-customer app into
a product you can sell to multiple teachers, with a super-admin dashboard
for you to manage them all.

## ⚠️ Do this first — rotate your database password

Your original `.env` file had your real MongoDB connection string
(including the password) sitting in plain text, and the backend had **no
`.gitignore`**, so it's very likely already committed to your git history.
Treat that password as compromised:

1. Go to MongoDB Atlas → Database Access → edit your user → **change the password**.
2. Update `tution-api/.env` with the new connection string.
3. If this repo is on GitHub, check whether `.env` was ever committed
   (`git log --all --full-history -- tution-api/.env`). If it was, the
   password is in the history forever unless you rewrite history — rotating
   the password makes that moot either way.

A `.gitignore` has been added to `tution-api/` so this can't happen again.

## What changed

- **New models:** `Teacher` (a tenant/customer) and `Admin` (you).
- Every existing collection (`Student`, `Payment`, `Attendance`, `Location`)
  now has a `teacher` field, and every route is scoped to the logged-in
  teacher via a JWT.
- **New routes:** `/api/auth/teacher/login`, `/api/auth/admin/login`,
  and `/api/admin/teachers` (create/list/edit/suspend/delete — admin only).
- **New frontend pages:** `/login` (teacher), `/admin/login`, and `/admin`
  (the teacher-management dashboard). All existing pages now require a
  teacher login.

## 1. Install new backend dependencies

```
cd tution-api
npm install
```

(`package.json` already lists `bcryptjs` and `jsonwebtoken` as dependencies.)

## 2. Set environment variables

`tution-api/.env`:

```
MONGODB_URI=<your new connection string, after rotating the password>
JWT_SECRET=<a long random string>
```

A fresh random `JWT_SECRET` has already been generated for you in the
`.env` file included here — you can keep it or generate your own with:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Add `JWT_SECRET` and the new `MONGODB_URI` to your Vercel project's
environment variables too (Vercel dashboard → Settings → Environment Variables),
not just your local `.env`.

## 3. Create your admin account (run once)

```
cd tution-api
node seedAdmin.js "Your Name" "you@email.com" "aStrongPassword123"
```

This is how you'll log in at `/admin/login`.

## 4. Migrate your existing customer's data (run once)

Your current customer's students/payments/attendance/locations don't
belong to any teacher yet. This script creates a teacher account for them
and attaches all their existing data to it:

```
cd tution-api
node migrateToMultiTenant.js "Existing Teacher Name" "teacher@email.com" "aTemporaryPassword123"
```

Give the teacher that email/password so they can log in at `/login`. The
script refuses to run twice, so it's safe.

## 5. Install frontend dependencies and run

```
cd tution-frontend
npm install --legacy-peer-deps
npm start
```

(`--legacy-peer-deps` is needed because `react-qr-reader` hasn't been
updated for React 19 — this is pre-existing, not something this change
introduced.)

## How it works day-to-day

- **You (admin):** log in at `/admin/login` → see all teachers, add new
  ones, mark them active/suspended, reset a forgotten password, or delete
  a teacher (this permanently deletes all of their data too).
- **A teacher:** logs in at `/login` with the email/password you gave them
  → sees only their own students, payments, attendance, and locations.
  If you suspend them, their next API request is rejected immediately.
- **Onboarding a new teacher:** go to `/admin`, click "Add Teacher", set a
  temporary password, give it to them. They can start using the system
  right away (no password-reset flow yet — that's a good next addition).

## Known limitations / good next steps

- Teachers can't change their own password from within the app yet (only
  you can reset it via the admin dashboard). Worth adding a "Settings →
  Change Password" option in the teacher app.
- No self-signup — every teacher account is created by you manually, as
  requested.
- No automated billing — subscription status is a manual toggle. If you
  want to automate this later (Stripe subscriptions, auto-suspend on
  failed payment), that plugs into the same `subscriptionStatus` field.
- Admin accounts can only be created via `seedAdmin.js` (no UI for it) —
  intentional, since you're the only admin for now.
