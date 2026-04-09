# Club-OS — Next Steps

## Short Term

- [ ] **PDF preview on mobile** — PDFs open externally instead of inline like on web. Fix so they preview within the app on mobile browsers.

- [ ] **Announcement email formatting** — Current email template is plain. Improve with better HTML layout, club branding, and clearer structure.

- [ ] **Custom Google OAuth app** — Login screen currently shows Supabase's URL during Google sign-in. Set up a custom OAuth app under uccricketclub.org so users see the club's domain instead.

## Medium Term

- [ ] **Season registration fee auto-update** — When a member pays their registration fee and board/treasurer confirms, the fee status should update automatically.

- [ ] **Payment confirmation flow** — Members submit payment proof → board confirms → fee marked as paid. End-to-end flow with notifications.

## Future Milestone — Replace Vercel with Self-Hosted

Vercel is a managed platform with limited visibility into logs and env vars. Alternatives:

- [ ] **Move web (Next.js) to Cloud Run** — Already have the Cloud Build/Cloud Run pipeline for the API. Add a Dockerfile for web and deploy both on GCP. One platform, full control.
- [ ] **Or use Coolify** — Open source self-hosted Vercel alternative. Runs on any VPS, auto-deploys from GitHub, has a UI. Good middle ground.

## Future Milestone — Reduce Vendor Lock-in

Currently dependent on Supabase for auth and database hosting. This limits control over branding (Google shows `phxusgzpoqdgodeshinn.supabase.co` during sign-in) and pricing.

- [ ] **Replace Supabase Auth with Auth.js** — Self-hosted, runs inside Next.js, Google OAuth shows your own domain (`uccricketclub.org`). Free.
- [ ] **Move Postgres to a standalone host** — Neon, GCP Cloud SQL, or Railway. Removes Supabase dependency entirely.
- [ ] **Self-host everything on GCP** — API on Cloud Run (already done), DB on Cloud SQL, auth via Auth.js. Full control, no monthly SaaS fees beyond compute.

## Future Milestone — Open Source (Self-Hosted)

Goal: Any club can run their own Club-OS instance for free. No central hosting, no SaaS fees — you maintain the code, clubs own their data.

- [ ] **One-command setup** — `docker-compose up` spins up the full stack (API + web + Postgres). No cloud account needed.
- [ ] **Config via env file** — Club name, logo, Google OAuth credentials, email — all set in a single `.env` file.
- [ ] **Replace Supabase Auth with Auth.js** — Removes the only remaining Supabase dependency. Google OAuth works out of the box, shows the club's own domain.
- [ ] **Postgres included in Docker Compose** — No external DB service needed by default.
- [ ] **Setup guide** — Simple README a non-developer admin can follow to self-host on a cheap VPS ($5/mo on DigitalOcean or free on a home server).
- [ ] **GitHub public repo** — Publish under an open source license (MIT or Apache 2.0).
