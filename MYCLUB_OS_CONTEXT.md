# myclub-os — Project Context

## What This Is
myclub-os — "The Operating System for Amateur Cricket Clubs"
Single platform replacing WhatsApp + Google Sheets + Venmo/Zelle + ElectionRunner.

## Competitive Positioning
- **Not competing with CricClubs** — CricClubs owns match day (scoring, results, stats, game availability). myclub-os owns everything around the match: governance, payments, elections, rosters.
- Clubs use both side by side. myclub-os is additive, not a replacement.
- Lower adoption barrier: clubs don't have to drop CricClubs to use myclub-os.
- Future integration: pull match/stats data from CricClubs API to enrich member profiles — without rebuilding what CricClubs already does well.

## Founder
- President, Cincinnati Cricket Club
- DevOps Engineer with software dev background

## Real Club Operations (How It Works Today)
1. Club has 2 teams. Board conducts elections for team leaders, then divides squads.
2. Before elections: members fill availability sheet (prerequisite) + pay registration fee (prerequisite to vote/contest).
3. Board shares candidates and election info via email + meeting link.
4. Ballot created from registered members → elections run in ElectionRunner.
5. Squad division: team leaders pick 10 core players from previous year, then alternate picks (in person).
6. Board announces final squads.
7. Board collects membership fee with due date; installments allowed. Payments via Venmo/Zelle to treasurer.
8. Teams use CricClubs for match availability and scoring.
9. Board coordinates jersey orders and payments with vendor.
10. All communication on WhatsApp group.
11. Weekly practice polls sent Tuesday/Thursday on WhatsApp.

## MVP Scope (decided)
| Feature | In MVP | Replaces |
|---|---|---|
| Member Management | ✓ | Google Sheets |
| Elections | ✓ | ElectionRunner + Forms |
| Payment Tracking | ✓ | Venmo + spreadsheet (manual for MVP, Stripe in V2) |
| Squad Management | ✓ | Done in person |
| Announcements | ✓ | Email + WhatsApp |
| Practice Polls | ✗ | WhatsApp (keep it) |
| Game Availability | ✗ | CricClubs (keep it) |

### Membership Fee
- $200 base, student discount (variable)
- Board creates misc fees: election reg fee, jersey fee, fines, etc.
- MVP: treasurer manually marks payment received → triggers eligibility
- V2: Stripe Connect (money direct to club bank account)

## Three Product Layers

### Club Layer (MVP — see above)

### Team Layer (V1.5)
- Squad/roster mgmt, match availability, lineup selection, stats integration

### League Layer (Strategic Moat)
- Player eligibility registry, roster compliance, transfers, suspensions, official lineup submission
- Network effect: league adopts → clubs must join to participate → compound adoption

## Tech Stack (finalized)
| Layer | Tech | Notes |
|---|---|---|
| Web Frontend | Next.js (React) | TypeScript |
| Backend API | Node.js + Fastify (TypeScript) | Separate service, shared by web + mobile |
| Mobile App | Expo / React Native | Later, shares same backend API |
| Database | PostgreSQL via Supabase | Managed, real-time subscriptions |
| ORM | Prisma | Type-safe DB queries, migrations |
| Auth | Supabase Auth | Google login + email magic link |
| Payments | Manual (MVP) → Stripe Connect (V2) | Treasurer marks paid manually in MVP |
| Email | Resend | Free up to 3k/mo, React email templates |
| Hosting | Vercel (frontend) + Railway/Render (backend) | Zero-config deploys |

**MVP infra cost: ~$0/month**

See [MYCLUB_OS_TECHNICAL.md](MYCLUB_OS_TECHNICAL.md) for tech stack decision rationale and DB schema.
See [MYCLUB_OS_WIREFRAMES.md](MYCLUB_OS_WIREFRAMES.md) for all screen wireframes.

## Roadmap
1. Month 1 — Research, schema, wireframes
2. Months 2-4 — Build MVP (auth, members, payments, elections, polls, squads)
3. Months 5-8 — Test with own Cincinnati club (full season)
4. Months 9-12 — Expand to 10-20 clubs
5. Months 13-16 — V2 features (draft builder, jersey mgmt, financial dashboard)
6. Month 17+ — League layer

## Monetization
- Per Club: $200-400/year
- Per Player: $2-5/year
- League License: negotiated
- GTM: own club → nearby clubs (first season free) → league partnerships → paid tiers at 20+ clubs
