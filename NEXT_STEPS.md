# Club-OS — Next Steps

## Short Term

- [ ] **Fix custom role assignment bug** — Assigning custom roles to members silently fails. Never root-caused.

- [ ] **Dashboard cleanup** — Add upcoming tournaments widget, availability nudge ("You haven't set availability for X"), and quick links panel.

- [ ] **Season registrations board view** — Board needs a page to see who registered for the season and their member type.

- [ ] **Announcement email formatting** — Current email template is plain. Improve with better HTML layout, club branding, and clearer structure.

- [ ] **PDF preview on mobile** — PDFs open externally instead of inline. Fix so they preview within the app on mobile browsers.

- [ ] **Custom Google OAuth app** — Login screen currently shows Supabase's URL during Google sign-in. Set up a custom OAuth app under uccricketclub.org so users see the club's domain instead.

## Medium Term

- [ ] **Season registration fee auto-update** — When a member pays their registration fee and board/treasurer confirms, the fee status should update automatically.

## Future Milestone — Replace Vercel with Self-Hosted

Vercel is a managed platform with limited visibility into logs and env vars. Alternatives:

- [ ] **Move web (Next.js) to Cloud Run** — Already have the Cloud Build/Cloud Run pipeline for the API. Add a Dockerfile for web and deploy both on GCP. One platform, full control.
- [ ] **Or use Coolify** — Open source self-hosted Vercel alternative. Runs on any VPS, auto-deploys from GitHub, has a UI. Good middle ground.

## Future Milestone — Reduce Vendor Lock-in

Currently dependent on Supabase for auth. This limits control over branding (Google shows Supabase's domain during sign-in).

- [ ] **Replace Supabase Auth with Auth.js** — Self-hosted, runs inside Next.js, Google OAuth shows your own domain (`uccricketclub.org`). Free.
- [ ] **Self-host everything on GCP** — API on Cloud Run (already done), DB on Supabase (free, no cost), auth via Auth.js. Full control, no monthly SaaS fees beyond compute.

## Future Milestone — Open Source (Self-Hosted)

Goal: Any club can run their own Club-OS instance for free. No central hosting, no SaaS fees — you maintain the code, clubs own their data.

- [ ] **One-command setup** — `docker-compose up` spins up the full stack (API + web + Postgres). No cloud account needed.
- [ ] **Postgres included in Docker Compose** — No external DB service needed by default.
- [ ] **Setup guide** — Simple README a non-developer admin can follow to self-host on a cheap VPS ($5/mo on DigitalOcean or free on a home server).
- [ ] **GitHub public repo** — Already open source. Tag first stable release as `v0.1.0`.

---

## Completed

- [x] **Duplicate member error handling** — Returns `"A member with this email already exists"` (was 500 internal server error)
- [x] **Undo recorded payment** — Board can undo any recorded payment inline with confirmation. Fee status recalculates automatically.
- [x] **Club onboarding setup script** — `npm run setup` in `/api` — interactive prompt creates club, admin user, and board membership, then prints env vars to copy. No manual DB work needed.
- [x] **Hardcoded secrets removed from source** — `reset-data.ts` now reads `CLUB_ID` and `MY_EMAIL` from env vars instead of hardcoded values
- [x] **Login page** — Removed hardcoded `club-os` label; club name driven by `NEXT_PUBLIC_CLUB_NAME` env var
- [x] **Artifact Registry cleanup** — Deleted 11 stale Docker images; Artifact Registry back under free tier
- [x] **Confirmed zero ongoing cost** — DB on Supabase free tier (50k MAU limit), API on Cloud Run free tier, web on Vercel free tier. No Cloud SQL.
- [x] **Open source readiness** — LICENSE, CONTRIBUTING, `.env.example` files added; repo is public
- [x] **Payment confirmation flow** — Members submit payment proof → board confirms → fee marked as paid
