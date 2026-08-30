# Needs your decision

Things I can't decide or do on your behalf. Nothing here is blocking the code
from building or running — but several items **will** bite in production.

Ordered by urgency. Update **Status** as you resolve them.

---

## 🔴 Before this goes to production

| # | What | Why it matters | Status |
|---|------|----------------|--------|
| 1 | **Generate a real `JWT_SECRET`** | `backend/.env` still holds the example placeholder. Anyone who has seen the repo or the docs can forge a token for any user, in any school, including `SUPER_ADMIN`. The server now refuses to start in production with a placeholder or a secret under 32 chars, so a deploy will fail loudly rather than silently — but it still needs a real value. Generate one with:<br>`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` | Open |
| 2 | **Set `CORS_ORIGIN`** to your real frontend URL(s), comma-separated | Left unset, the API accepts requests from any origin. Credentials are now only enabled for an explicit allowlist, so the damage is limited — but set it. The server logs a warning at boot when it's missing in production. | Open |
| 3 | **Run `npx prisma migrate deploy` on the production database** | Your production DB has never seen `20260830090000_add_password_lifecycle_and_audit_log` (password reset + audit trail). It also may be missing `add_bus_tracking` and `add_driver_model`, which were unapplied on your dev DB until this session — if production is in the same state, the transport and driver features are broken there right now. Check with `npx prisma migrate status`. | Open |
| 4 | **Confirm the canonical URL** | I set `<link rel="canonical">` in `frontend/index.html` to `https://schools.globoniks.com/` as a best guess. If that's wrong it will mislead search engines. | Open |
| 5 | **Decide what to do about the demo accounts** | `prisma/seed.ts` hashes every demo password as `Guest@68`, but the local `edschool` database predates that seed — none of the documented demo logins work. Either re-seed, or correct the credentials in the README. Also decide whether demo accounts (`superadmin@test.com` etc.) should exist in production at all. | Open |

---

## 🟠 Features that need a provider or vendor choice

I've deliberately not picked these for you — each one commits you to a third
party, and two of them touch real money or personal data.

| # | Feature | What I need from you | Notes |
|---|---------|---------------------|-------|
| 6 | **Forgot password** | An email (SMTP) or SMS provider | Right now a locked-out parent must phone the school, and an admin issues a temporary password by hand. That flow works and is audited, but it doesn't scale. The token-based reset is a small addition once there's a delivery channel. Options: your own SMTP, SendGrid/Postmark/SES, or SMS via MSG91/Twilio (often better for Indian parents than email). |
| 7 | **Online fee payment** | A payment gateway | Fees are tracked but not collectable. `FeePayment` already carries `paymentMethod` and `transactionId`, so the data shape is ready. Razorpay is the usual fit for Indian schools; Stripe if you're billing internationally. This also needs a decision on who bears the gateway fee. |
| 8 | **Google Maps billing** | Confirm `VITE_GOOGLE_MAPS_KEY` is set and the key is restricted | There is no `frontend/.env` in the repo, so live bus tracking currently renders a "Set VITE_GOOGLE_MAPS_KEY" placeholder. When you do set it, restrict the key by HTTP referrer — an unrestricted Maps key in a public bundle gets scraped and billed to you. |

---

## 🟡 Product decisions

| # | What | The situation | Status |
|---|------|---------------|--------|
| 9 | **Three parent features are not implemented** — Downloads, Subject Videos, Event Gallery | Their controllers had no database access at all; they returned invented data. Downloads advertised a **"Report Card - Term 1"** to real parents, with a link that 404s. I've changed all three to return empty lists, so the pages now show their existing "will appear here once uploaded" empty states instead of fabricating records. **Decide:** build them properly (each needs a new model + an upload flow), or remove the menu entries so parents aren't shown dead sections. See the header comments in `download/video/gallery.controller.ts` for what each model would need. | Open |
| 10 | **Landing page: confirm the contact address** | I rebuilt the landing page (see `BUGS_AND_ENHANCEMENTS.md`) and needed a real destination for the "Book a walkthrough" and "Email us" buttons. I used **`hello@globoniks.com`**, which is a guess — I have no way to verify it exists. If it's wrong, those are the two primary conversion buttons on the page pointing into a void. Replace it, or tell me the right one. It appears twice in `Landing.tsx`. | Open |
| 10b | **Landing page: social proof is missing on purpose** | Research is unanimous that named customers, logos or a testimonial with a real metric is the single highest-impact addition to a B2B page — and I will not invent them. If you can give me even one real school name and a quote, that section is quick to add. Same for a customer count: "used by N schools" needs a true N. | Open |
| 10c | **Landing page: the hero illustration is a mock-up** | The dashboard shown in the hero is a hand-drawn impression with plausible-looking numbers (94.2% attendance, ₹8.4L collected), clearly labelled "Illustration of the admin dashboard" and marked `aria-hidden`. A real screenshot of a real dashboard converts better. Send me one with the school's data anonymised and I'll swap it in. | Open |
| 11 | **The `STUDENT` role does not exist, but 13 code paths assume it does** | `STUDENT` is absent from the `UserRole` enum in `schema.prisma`, so no account can ever hold it — yet **13 `role === 'STUDENT'` branches across 8 controllers** apply "students may only see their own record" scoping, plus `StudentDashboard.tsx` (unimported, and `/app/student-dashboard` redirects away). None of it can run. Not a data leak — the dead branches are the *restrictive* ones — but it reads like student access control exists when it cannot. **Decide:** add `STUDENT` to the enum and finish the portal, or delete the branches. Don't leave it half-built: someone will later assume the scoping works. | Open |
| 12 | **Dashboard "change" percentages are hardcoded** | `studentsChange: 5.2`, `attendanceChange: 2.1`, `feesChange: 8.5` are literals in `Dashboard.tsx`, presented to admins as real month-over-month trends with up-arrows. They are invented. Either compute them from historical data or remove the trend indicators. | Open |

---

## 🔵 White-labelling — both models now built

You said both models are likely, so both are implemented; they compose rather
than conflict. What remains is per-deployment configuration, not code.

| # | What | Status |
|---|------|--------|
| 16 | **Runtime branding (shared deployment)** — once a user signs in, the app chrome, tab title and install prompt carry their school's name and logo, resolved from the school record on their session. `School.logo` is no longer a dead column. | Built |
| 17 | **A School settings page** (`/app/school-settings`, admins only) — set the school's name and upload/replace/remove its logo; the chrome rebrands immediately, not at next sign-in. | Built |
| 18 | **Build-time branding (dedicated deployment)** — set `VITE_BRAND_NAME`, `VITE_BRAND_SHORT_NAME`, `VITE_BRAND_TAGLINE`, `VITE_BRAND_LOGO_URL`, `VITE_BRAND_THEME_COLOR` and build; the login page, install prompt **and the PWA manifest** (installed-app name, icon label, theme colour) take the school's identity. Documented in `frontend/.env.example`. An unset build is exactly the Globoniks-branded product. | Built |
| 19 | **Known limit: PWA identity on the shared deployment.** The manifest is emitted at build time, so on a shared deployment the *installed app's* name/icon stay "G Schools" for every school, even though everything inside the app rebrands. Fixing that needs a runtime-generated manifest per school (a backend endpoint plus per-school icons). Say the word if shared-deployment schools must have their own installed-app identity. | Open — decide if needed |
| 20 | **Landing page on dedicated builds.** The public landing is pinned to the vendor identity because its copy is Globoniks marketing. A dedicated school build likely wants "/" to go straight to login instead. One-line change once you confirm. | Open |

## 🟢 Housekeeping I'd do if you want it

| # | What | Effort |
|---|------|--------|
| 13 | Bring down the 314 ESLint warnings by typing API responses. The ratchet in `frontend/package.json` stops the count growing; lowering it is mechanical work. | Medium, low risk |
| 14 | Delete `landing/` — a whole separate Next.js app in the repo that nothing references. Confirm it's abandoned first. | Small |
| 15 | `backend/prisma/create-missing-tables.sql` and `fix-user-role-enum.sql` are hand-written patches from when migrations were out of sync. Now that migrations are applied, these are probably obsolete and misleading. | Small |

---

## How to use this file

Tell me a number and I'll build it. For anything in the amber section, I need
the provider name before I can start — I won't pick a payment gateway or an
email vendor for you.

Bugs and completed work are tracked separately in `BUGS_AND_ENHANCEMENTS.md`.
