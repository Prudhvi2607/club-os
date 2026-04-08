# Club-OS — Next Steps

## Short Term

- [ ] **PDF preview on mobile** — PDFs open externally instead of inline like on web. Fix so they preview within the app on mobile browsers.

- [ ] **Announcement email formatting** — Current email template is plain. Improve with better HTML layout, club branding, and clearer structure.

- [ ] **Custom Google OAuth app** — Login screen currently shows Supabase's URL during Google sign-in. Set up a custom OAuth app under uccricketclub.org so users see the club's domain instead.

## Medium Term

- [ ] **Season registration fee auto-update** — When a member pays their registration fee and board/treasurer confirms, the fee status should update automatically.

- [ ] **Payment confirmation flow** — Members submit payment proof → board confirms → fee marked as paid. End-to-end flow with notifications.

## Future Milestone — Reduce Vendor Lock-in

Currently dependent on Supabase for auth and database hosting. This limits control over branding (Google shows `phxusgzpoqdgodeshinn.supabase.co` during sign-in) and pricing.

- [ ] **Replace Supabase Auth with Auth.js** — Self-hosted, runs inside Next.js, Google OAuth shows your own domain (`uccricketclub.org`). Free.
- [ ] **Move Postgres to a standalone host** — Neon, GCP Cloud SQL, or Railway. Removes Supabase dependency entirely.
- [ ] **Self-host everything on GCP** — API on Cloud Run (already done), DB on Cloud SQL, auth via Auth.js. Full control, no monthly SaaS fees beyond compute.

## Future Milestone — Multi-Club / SaaS

Goal: Make Club-OS work for any cricket club, not just UC.

The API and database are already multi-tenant. What needs to change:

- [ ] **Subdomain routing** — Each club gets `[slug].club-os.app`. Next.js middleware reads subdomain, looks up club by slug, injects the correct club ID.
- [ ] **Dynamic club branding** — Club name and logo pulled from DB, not hardcoded.
- [ ] **Wildcard CORS** — API allows `*.club-os.app` instead of one hardcoded domain.
- [ ] **Club onboarding flow** — Signup page at `club-os.app/signup` to create a new club and invite the admin.
- [ ] **Shared or per-club email** — Either a shared sender (`noreply@club-os.app`) or per-club SMTP config.
- [ ] **Buy `club-os.app` domain** — Or equivalent for the SaaS deployment.
