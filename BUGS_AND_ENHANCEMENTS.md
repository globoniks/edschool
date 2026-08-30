# EdSchool – Bugs and Feature Enhancements

Running list of bugs and requested improvements. Add new items under the right section and update **Status** as you go.

---

## Bugs

| ID | Description | Status | Priority | Notes |
|----|-------------|--------|----------|--------|
| 1 | Parent Portal "Holidays" tile links to `/app/parent/holidays` but no route exists; parents get 404 or wrong page | Done | High | Fixed: link now points to `/app/holidays` |
| 2 | Transport page: `Select` component used with `options` prop but FormField Select expects children (option elements) | Done | High | Fixed: Transport now renders options as children |
| 3 | Transport page: `ConfirmDialog` used with `open` and `onCancel` but component expects `isOpen` and `onClose` | Done | High | Fixed: Transport now uses isOpen and onClose |
| 4 | Teachers unable to text students or a complete class: New message dropdown showed only teachers as recipients | Done | High | Fixed: recipients API now includes parents; added "Send to entire class" option |
| 5 | Unknown URLs rendered a blank white page — no catch-all route | Done | High | Added `pages/NotFound.tsx` + `path="*"` at the top level and inside `/app` |
| 6 | `npm run build` failed in `frontend`: `process.env` / `NodeJS.Timeout` used in browser code with no node types | Done | High | Switched to `import.meta.env.PROD` / `.DEV` and `ReturnType<typeof setTimeout>` |
| 7 | `npm run build` failed in `backend` on a clean checkout — nothing ran `prisma generate`, so ~60 type errors on `prisma.driver` / `prisma.trip` / `prisma.busStop` | Done | High | Added `postinstall` + `prisma generate &&` to the backend build script |
| 8 | Zod validation failures returned **500** with a raw stringified error instead of 400 + field messages | Done | Medium | `errorHandler` now maps ZodError → 400 `{ error, fields }`, and Prisma P2002/P2025/P2003 → 409/404/400 |
| 9 | 404 handler was registered *after* the error handler in `backend/src/index.ts` | Done | Low | Reordered |
| 11 | **Every push notification click landed on a 404.** URLs were hardcoded as `/edschool/app/...` from an older sub-path deployment, but the app now serves from the domain root. Two of them (`/app/alerts`, `/app/notices`) were not real routes even after stripping the prefix | Done | High | Replaced with an `appUrl()` helper + a named `APP_ROUTES` map, driven by an optional `APP_BASE_PATH`. A test reads `frontend/src/App.tsx` and asserts every destination exists as a real route, so a rename fails the build instead of silently breaking notifications |
| 12 | **Three parent features served fabricated data.** Downloads, Subject Videos and Event Gallery had no database access at all — Downloads advertised a **"Report Card - Term 1"** to real parents with a link that 404s | Done | High | All three now return empty lists, so the pages show their existing "will appear here once uploaded" empty states. Whether to build or remove them is a product call — see `NEEDS_YOUR_DECISION.md` #9 |
| 10 | **16 `react-hooks/rules-of-hooks` violations** in `Dashboard.tsx` and `Users.tsx` — hooks called after an early return. If the guard condition flipped mid-session (a role change, a profile refetch) React would throw "rendered fewer hooks than expected" and crash the page | Done | High | Guards moved below every hook; the queries are gated with `enabled` instead, so a redirected or unauthorised user still fires no requests |

## Security

| ID | Description | Status | Priority | Notes |
|----|-------------|--------|----------|--------|
| S1 | **Critical** – `POST /api/auth/register` was public and took `role` + `schoolId` from the body: anyone could create a `SUPER_ADMIN` in any tenant | Done | Critical | Now requires an authenticated SUPER_ADMIN/SCHOOL_ADMIN; a SCHOOL_ADMIN cannot create super admins or cross into another school; `schoolId` is forced from the token. First admin still comes from `prisma db seed`. Verified: unauthenticated call returns 401 |
| S2 | `POST /api/parents` had no `authenticate` at all | Done | Critical | Added `authenticate` + `manageHR` permission. Verified: 401 |
| S3 | Cross-tenant school access — every logged-in user could list all schools, and a SCHOOL_ADMIN could `PATCH` any school id | Done | High | `getSchools` filters to the caller's school unless SUPER_ADMIN; `getSchool`/`updateSchool` reject a mismatched id |
| S4 | No rate limiting anywhere — login was freely brute-forceable (`express-rate-limit` was a dependency but unused) | Done | High | 300 req/min per IP across `/api`, 10 attempts / 15 min on `/api/auth` (successful logins don't count). Added `trust proxy` so the limiter sees the real client IP behind nginx |
| S5 | Path traversal in `DELETE /api/upload/:filename` — the param is URL-decoded, so `..%2F..%2F` escaped the school's folder | Done | High | `path.basename` + a resolved-path containment check |
| S6 | CORS reflected *any* origin with `credentials: true` in production when `CORS_ORIGIN` was unset | Done | High | Credentials are now only enabled for an explicit allowlist; a warning is logged when `CORS_ORIGIN` is missing in production |
| S7 | Unhandled 500s returned the raw `err.message` (query text, file paths, schema details) to clients | Done | Medium | Only `AppError` messages are returned in production; everything else is logged server-side and answered generically |
| S8 | Register accepted 6-character passwords | Done | Low | Raised to 8 |
| S9 | **No password management at all** — no reset, no change-password, no forgot-password. A forgotten parent password required editing the database by hand, and a leaked password could not be rotated | Done | Critical | `POST /api/auth/change-password` (self-service) and `POST /api/users/:id/reset-password` (admin issues a one-time temporary password). New accounts and reset accounts carry `mustChangePassword`, and the app gates the whole UI until it is replaced |
| S10 | Tokens survived a password change — a rotation after a compromise left the attacker's session valid for the rest of the 7 days | Done | High | `passwordChangedAt` on User; `authenticate` retires any token issued at or before it. Verified: the old token 401s immediately, including in the same second as the change |
| S11 | `JWT_SECRET` was still the shipped placeholder and nothing stopped it reaching production | Done | High | `validateEnv()` runs before the port binds: in production a placeholder, short, or missing secret (or a missing `DATABASE_URL`) is a hard exit; in development it warns |
| S13 | **Cross-tenant writes via unscoped id lookups.** Four handlers looked records up with `findUnique({ where: { id } })` and no school check: a school admin could edit **or delete** another school's holidays, any user could read any school's announcement by id, a finance admin could alter another school's fee payment, and a teacher could set marks on a submission belonging to **another school's student** | Done | Critical | All four now use `findFirst` scoped to the caller's school (fee payments via `student.schoolId`, submissions via `homework.schoolId`), returning 404 rather than 403 so ids aren't disclosed. SUPER_ADMIN still crosses deliberately. 6 regression tests; mutation-checked |
| S14 | **Cross-tenant access to staff records.** `getTeacher`, `updateTeacher` and `deleteTeacher` looked up by id with no school check — an HR sub-admin at one school could read, edit or **delete** a teacher at another. The homework submission lookup had the same shape | Done | Critical | All four scoped to the caller's school; SUPER_ADMIN still crosses deliberately. 3 more regression tests (82 total). Swept every remaining `findUnique({ where: { id } })` in the controllers — the four that are left (message read-receipts, school read, two transport assignment handlers) each carry their own explicit ownership check and are correct |
| S12 | No record of who changed a mark, a fee, a student record or a permission | Done | High | New `AuditLog` table + `recordAudit()`, wired into exam marks, fee payments, student create/update/delete, account creation, permission changes and both password paths. Read-only admin API at `/api/audit-logs` — there is deliberately no write or delete route |

## Feature Enhancements

| ID | Description | Status | Priority | Notes |
|----|-------------|--------|----------|--------|
| 1 | Proper brand logo — PWA icons were placeholder "ES" text on sky blue, and `generate-icons.js` imported `canvas`, which is not installed, so it could not run | Done | High | New "G globe" mark in the brand indigo. Source: `frontend/public/brand/logo.svg` (+ a padded `logo-maskable.svg`). `generate-icons.js` rewritten on `sharp` to render every PNG plus a multi-size `favicon.ico`. Old mark kept at `brand/logo-legacy.svg` |
| 2 | Logo was a raw `<img src="/logo.svg">` repeated in 6 places with duplicated wordmark markup | Done | Medium | Added `components/Logo.tsx` (`mark` / `compact` / `stacked` variants), used in Layout, Login, Landing and NotFound |
| 3 | Brand colours were inconsistent: `theme-color` `#000666`, PWA manifest `#0284c7`, Tailwind `primary` sky blue, pages hardcoding `#000666` inline | Done | Medium | Added a `brand` palette to `tailwind.config.js` (`brand-900` = `#000666`) and set the manifest `theme_color` to match. Remaining inline hex on Landing/Login can migrate to `brand-*` incrementally |
| 4 | No Open Graph / Twitter meta — shared links unfurled blank | Done | Low | Added OG + Twitter tags, canonical, `mask-icon` and a proper favicon chain to `index.html` |
| 5 | Admins had no way to find an account and restore access | Done | High | "Account access" search on the Users page: find any account by name/email/role, issue a temporary password, shown once with a copy button |
| 6 | Audit trail viewer | Done | Medium | `/app/audit-logs` (admins only) with action and date filters, pagination, and a mobile card layout |
| 7 | **Test suite** — the repo had none | Done | High | Vitest in `backend/tests` (`npm test`). 58 tests covering the permission resolver, the four authorization middlewares, `authenticate` (forged tokens, deactivated users, token revocation, parent-child gating), school tenant isolation, upload path safety and fee pagination. Each security guard was mutation-checked: reverting the fix makes the test fail |
| 8 | Fees page fetched up to 5000 payments to render five | Done | High | Opt-in pagination on `GET /api/fees/payments` — the array shape is unchanged without `page`/`limit`, so the dashboard totals still work. Fees asks for 5, parent fee history for 10 |
| 9 | Parent Portal fired a `/fees/payments?status=PENDING` request whose result was never read | Done | Medium | Dead query removed — one less round trip on every parent portal load |
| 10 | Dashboard fetched every fee payment to compute four numbers in the browser | Done | High | New `GET /api/fees/stats` aggregates in SQL. Guarded by a finance permission, so an HR sub-admin no longer sees fee totals. Verified the SQL matches the old client-side maths across partial, overpaid and FAILED rows — a naive `SUM(due) - SUM(paid)` would have under-reported pending fees by letting an overpaid row cancel a genuine due |
| 12 | **Landing page rebuilt** — it had an identity problem: half a school's own website (Home/Admissions/Campus nav, an "Admissions AY 2025-26 open" ticker, invented news about a STEAM lab and a basketball final) and half a B2B product page (multi-tenant architecture, Pricing, Security), with ~10 CTAs that all led to `/login` | Done | High | Rebuilt as a product page for the people who buy it, with a clear sign-in path for existing school members. Hero headline cut from "Welcome to Globoniks Schools School Management" to "Run the whole school from one place"; feature copy rewritten from module names to outcomes; added a complete grouped feature list, a role wayfinder, a getting-started sequence and an FAQ. Fabricated news and ticker removed |
| 13 | **Landing page had no mobile navigation at all** — the nav was `hidden lg:flex` with no hamburger, so below 1024px there was no navigation whatsoever | Done | High | Added a proper mobile menu with `aria-expanded`/`aria-controls`, Escape-to-close and focus return to the trigger |
| 14 | **Landing page accessibility failures** | Done | High | The announcement ticker was an infinite marquee with no pause — a WCAG 2.2.2 failure — and is gone. Twelve `href="#"` links (nav and footer) that keyboard users could tab to but not use are now real anchors. A `<button>See All</button>` with no handler is removed. Added a skip link, focus-visible rings throughout, semantic landmarks, and a native `<details>` FAQ that needs no ARIA |
| 15 | **No `prefers-reduced-motion` support anywhere in the app** | Done | Medium | Added a global block in `index.css`. Animations collapse to a single instantaneous step rather than being removed, so anything waiting on an animation-end event still fires instead of leaving the UI stuck |
| 16 | **The landing page never mentioned student records, timetables, homework or staff HR** — all built and working, none advertised. Student records is the foundational feature of a school management system | Done | High | Audited every controller for genuine database-backed implementations, then rewrote the highlights around the daily work and added an "Everything included" section grouped as a procurement checklist. The Downloads, Videos and Event Gallery stubs are deliberately excluded — advertising them would be a lie a prospect discovers on day one |
| 11 | ESLint had never been configured — `npm run lint` could not run at all | Done | Medium | Added `.eslintrc.cjs`. Real bug classes (`rules-of-hooks`, `eqeqeq`, `no-var`, `prefer-const`) are errors; the pre-existing `any`/unused-var debt is warnings. `--max-warnings` is ratcheted to the current 314 so the count can only go down — any new warning fails the build |

## Open — recommended next

| ID | Description | Priority | Notes |
|----|-------------|----------|--------|
| N1 | Test coverage beyond the security core | Medium | 58 tests now cover auth, tenant isolation and pagination. Still untested: the parent/teacher data-scoping inside student, attendance, exam and homework controllers, and the whole frontend |
| N2 | JWT lives in `localStorage` (zustand `persist`) with a 7-day expiry and no refresh | High | Revocation on password change now exists (S10), but an XSS still yields a token valid until the next rotation. Consider short-lived tokens + refresh, or httpOnly cookies |
| N10 | Forgot-password is still self-service-free: a locked-out user must phone an admin | High | Needs an email (SMTP) or SMS provider decision before it can be built — the reset token flow is otherwise a small addition on top of S9 |
| N11 | Online fee payment — fees are tracked but not collectable | Medium | No gateway integrated (Razorpay/Stripe). The `FeePayment` model already carries `paymentMethod` and `transactionId`, so the data shape is ready |
| N12 | Report-card PDF export | Medium | `getReportCard` exists server-side and `utils/print.ts` is on the client; no PDF generation yet |
| N13 | `StudentDashboard.tsx` is dead code — not imported anywhere, and `/app/student-dashboard` redirects to the admin dashboard | Low | Either build out the student portal or delete the file |
| N3 | `authenticate` runs 1–2 DB queries on **every** request (user + tags, and a second parent lookup for parents) | Medium | Cache permissions in the token or a short-TTL store; the parent-children check duplicates `requireParentWithChildren` |
| N4 | Helmet's CSP is disabled (`contentSecurityPolicy: false`) | Medium | Enable with an allowlist for Google Fonts and the Maps API |
| N5 | ~214 `: any` annotations in `frontend/src`; API responses are untyped end to end | Medium | Introduce shared response types, starting with the parent portal and dashboard payloads |
| N6 | `BarChart` chunk is 374 kB (103 kB gzipped) — the single largest asset | Low | Recharts is imported eagerly by the dashboards; lazy-load the chart components |
| N7 | Landing page still ships placeholder content — Unsplash images, fake news items, dead `href="#"` nav links | Low | Replace before any public launch |
| N8 | `tenantGuard` writes `req.body.schoolId` as a side effect and is not applied consistently across routes | Low | Prefer reading `req.user.schoolId` in controllers over mutating the request body |
| N16 | 314 lint warnings of pre-existing debt (mostly `any`, some unused vars) | Low | The ratchet stops it growing. Bring the number down file by file and lower `--max-warnings` as you go |
| N15 | The seeded demo passwords in `prisma/seed.ts` (`Guest@68`) do not match the local `edschool` database, which predates that seed | Low | Re-seed, or document the real credentials — the demo logins in the README currently do not work |

---

## How to use

- Add new bugs or enhancements as rows in the table above. Use **Status**: `Open` → `In progress` → `Done`. Optionally set **Priority** (e.g. High / Medium / Low) and **Notes** (links, assignee, date).
- After changing the logo, re-run `cd frontend && node generate-icons.js` so the favicon and PWA icons stay in sync with `public/brand/logo.svg`.
