# myclub-os — Technical Reference

## Tech Stack Decision Rationale

**Next.js (React) — Web Frontend**
- No frontend experience → biggest ecosystem, best learning resources
- Solo build → Next.js handles routing, SSR, and API in one project
- React knowledge transfers directly to React Native when mobile is added
- Considered: Remix, SvelteKit — rejected due to smaller communities for a first-time learner

**Node.js + Fastify (TypeScript) — Backend API**
- Separate backend chosen (not Next.js built-in) because: scale + multi-sport + mobile app all need a shared, standalone API
- TypeScript chosen so one language covers the entire stack (frontend + backend)
- Fastify over Express: faster, better TypeScript support, more modern
- Go was considered — rejected because: different language on top of learning React is too much context-switching for a solo builder; Go shines in infra tooling, not web APIs at this scale

**PostgreSQL via Supabase — Database**
- Relational DB required: members → clubs → elections → payments are all relational data
- Supabase chosen over self-hosted Postgres: solo builder should focus on product, not DB ops
- Supabase has real-time subscriptions built in (needed for live poll/availability updates)
- Supabase Auth integrates natively with the DB (row-level security per club = multi-tenant out of the box)
- Neon was considered — Supabase wins because auth + DB + real-time in one platform

**Prisma — ORM**
- Adds type-safe database queries in TypeScript (catches errors at compile time, not in production)
- Auto-generates schema migrations — critical for evolving the DB over time
- You still write raw SQL when needed — Prisma doesn't hide it, just makes the common path safer

**Supabase Auth — Authentication**
- Google login chosen: club members are regular people, "Sign in with Google" = lowest friction
- Magic link email as fallback
- Free up to 50,000 MAU — won't cost anything for years
- Clerk considered ($25+/mo after free tier) — rejected, Supabase Auth is free and already integrated

**Manual payments for MVP → Stripe Connect in V2**
- MVP: treasurer marks payment received manually in the app. Value = record keeping + eligibility automation, not payment processing
- Stripe Connect chosen for V2: money goes directly to club's bank account (not through myclub-os), handles installments, discounts, audit trail
- Venmo/Zelle stays for MVP because clubs are already used to it — reduces onboarding friction

**Resend — Email**
- Free up to 3,000 emails/month — covers MVP with one club comfortably
- Email templates written in React (same language as the frontend)
- AWS SES considered — cheaper at scale, but more setup work; revisit when sending volume justifies it

**Vercel + Railway/Render — Hosting**
- Vercel: built by Next.js team, zero-config deploys, free tier handles MVP
- Railway/Render: simple managed hosting for the Node.js backend API, no server management needed
- Could self-host on AWS (DevOps background) but time is better spent on the product

---

## DB Schema (in progress)

### Design Principles
- Multi-tenant: each club's data is isolated via row-level security in Supabase
- Multi-sport: `sport` field on `clubs` — cricket is just config, schema is generic
- Season-based: members re-register each season but keep the same profile
- Players can float between teams within a club (with approval)

---

### Group 1 — Users & Club Membership

```sql
users  -- extends Supabase Auth
  id                              uuid PK  -- same as Supabase Auth user id
  full_name                       text
  phone                           text
  avatar_url                      text
  playing_role                    enum (batter | bowler | allrounder | wicket_keeper) NULL
  emergency_contact_name          text NULL
  emergency_contact_phone         text NULL
  emergency_contact_relationship  text NULL
  student_id                      text NULL   -- only for students
  student_email                   text NULL
  student_program                 text NULL   -- e.g. "MS Computer Science, UC"
  created_at                      timestamptz

clubs
  id          uuid PK
  name        text
  sport       text         -- 'cricket', 'football', etc.
  slug        text UNIQUE  -- URL-friendly name e.g. 'cincinnati-cc'
  created_at  timestamptz

club_members
  id              uuid PK
  user_id         uuid FK → users
  club_id         uuid FK → clubs
  status          enum (active | inactive | alumni)
  is_multi_club   bool  -- flag if member belongs to multiple clubs
  joined_at       timestamptz
  UNIQUE(user_id, club_id)

club_member_roles
  id              uuid PK
  club_member_id  uuid FK → club_members
  role            enum (board | captain | vice_captain | member)
  UNIQUE(club_member_id, role)
```

**Notes:**
- Roles are in a separate table so one person can hold multiple roles (e.g. board + captain)
- Role is club-level (a person can be board in one club, member in another)

---

### Group 2 — Seasons & Registration

```sql
seasons
  id          uuid PK
  club_id     uuid FK → clubs
  name        text        -- e.g. '2025 Season'
  year        int
  start_date  date
  end_date    date
  status      enum (upcoming | active | completed)

season_registrations
  id                  uuid PK
  season_id           uuid FK → seasons
  club_member_id      uuid FK → club_members
  member_type         enum (regular | student | alumni)
  status              enum (pending | active | inactive)
  availability_notes  text NULL   -- member declares known unavailability upfront
  registered_at       timestamptz
```

**Notes:**
- Board creates a new season each year; members register into it
- `member_type` on registration (not on club_member) because a student one year may be regular the next
- Registration status drives eligibility gating (e.g., must be active to participate)

---

### Group 3 — Teams & Team Assignments

```sql
teams
  id          uuid PK
  club_id     uuid FK → clubs
  name        text        -- e.g. "Cincinnati CC 1", "Team B"
  created_at  timestamptz
  -- NOT season-specific; teams are persistent club entities

team_assignments
  id              uuid PK
  team_id         uuid FK → teams
  season_id       uuid FK → seasons   -- assignments are season-scoped
  club_member_id  uuid FK → club_members
  assigned_at     timestamptz
  removed_at      timestamptz NULL    -- null = currently active; set on mid-season move
  assigned_by     uuid FK → users     -- board member who made the change
  notes           text NULL           -- optional reason for mid-season move
```

**Notes:**
- Active assignment = `removed_at IS NULL`
- Mid-season move: board sets `removed_at` on old row, inserts new row for new team
- Full history preserved for all moves
- When a new season is created, system copies active assignments from previous season
- Supports 1, 2, 3+ teams per club

---

### Group 4 — Tournaments

```sql
tournaments
  id          uuid PK
  club_id     uuid FK → clubs
  season_id   uuid FK → seasons
  name        text        -- e.g. "Spring League 2025"
  start_date  date
  end_date    date
  created_by  uuid FK → users
  created_at  timestamptz
```

**Notes:**
- Board creates tournaments for all teams at once (not team-specific)
- Multiple tournaments per season supported

---

### Group 5 — Fee Types & Payments

```sql
fee_types
  id                  uuid PK
  club_id             uuid FK → clubs
  season_id           uuid FK → seasons
  name                text        -- "Membership Fee", "Jersey Fee", "Fine", etc.
  amount              numeric     -- base amount, same for everyone
  student_amount      numeric NULL  -- set only for membership fee
  allows_installments bool
  created_by          uuid FK → users
  created_at          timestamptz

member_fees
  id              uuid PK
  fee_type_id     uuid FK → fee_types
  club_member_id  uuid FK → club_members
  amount_due      numeric     -- locked in at assignment time (base or student rate)
  amount_paid     numeric     DEFAULT 0
  status          enum (pending | partial | paid)
  created_at      timestamptz

payments
  id              uuid PK
  member_fee_id   uuid FK → member_fees
  amount          numeric
  method          enum (venmo | zelle | cash)
  recorded_by     uuid FK → users    -- treasurer
  paid_at         timestamptz
  notes           text NULL           -- installment context only
```

**Notes:**
- Treasurer selects fee + payment method from buttons (no manual text entry)
- Installment fees: treasurer inputs partial amount; status auto-computes (partial if amount_paid < amount_due, paid if equal)
- All fees are season-level; no tournament-specific fees

---

### Group 6 — Announcements

```sql
announcements
  id          uuid PK
  club_id     uuid FK → clubs
  subject     text
  body        text
  audience    enum (club | team | board)
  team_id     uuid FK → teams NULL   -- set only when audience = team
  sent_by     uuid FK → users
  sent_at     timestamptz
```

**Notes:**
- Sent via email (Resend) to targeted audience
- No in-app feed in MVP
- Board picks audience: whole club / specific team / board only

---

### Group 7 — Club Documents

```sql
club_documents
  id          uuid PK
  club_id     uuid FK → clubs
  title       text
  file_url    text        -- stored in Supabase Storage
  category    enum (bylaws | code_of_conduct | other)
  uploaded_by uuid FK → users
  uploaded_at timestamptz
```

**Notes:**
- Board uploads, all members can view
- Files stored in Supabase Storage

---

### Elections — MVP2 (deferred)
Elections (President, Secretary, Captain, Vice Captain) are out of MVP scope. Will be designed in V2.

---

## Screens (MVP)

### Auth
1. Login — Google login + magic link email

### Member-facing
2. Dashboard — season status, team, fees due, latest announcements
3. My Team / Squad — who's on my team this season
4. My Fees — what I owe, payment history
5. Season Registration — declare in/out + known unavailability notes
6. Documents — view club docs (bylaws, code of conduct, etc.)
7. Profile — my info

### Board-facing
8. Member Management — list, add, manage members; invite new members via email link
9. Season Management — create season, open/close registration, view registrations + availability notes
10. Team Management — assign players to teams per season, track mid-season moves
11. Fee Management — create fee types, assign to all or specific members
12. Payment Tracker — record payments (Venmo/Zelle/Cash), support installments
13. Announcements — compose + send to club/team/board via email
14. Tournament Management — create tournaments under a season
15. Document Management — upload/delete club docs (bylaws, code of conduct, etc.)

---

## Wireframe Notes

### Navigation
- **Member sidebar:** Dashboard, My Team, My Fees, Documents, Profile
- **Board sidebar:** Dashboard, Members, Seasons, Teams, Fees, Payments, Announcements, Tournaments, Documents
- Top bar: app name left, user avatar + logout right

### Key UX Decisions
- Season registration: members reached via email invite + dashboard banner (not buried in nav)
- New member invite: board enters name + email → Supabase Auth sends registration link
- Fee assignment: assign to all (one click) or select specific members (jersey fee, etc.)
- Payment recording: all buttons/dropdowns, no free text except installment amount field
- Student Details section on profile: only visible if member type = student
- Playing role (batter/bowler/allrounder/wicket keeper) set on profile, shown on team roster
