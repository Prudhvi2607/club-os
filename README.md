# Club-OS

The all-in-one management platform for cricket clubs. Replaces WhatsApp groups, spreadsheets, and scattered payment apps with a single member portal.

## Features

- **Members** — Roster management, roles, jersey numbers, playing profiles
- **Seasons** — Create seasons, register members, manage teams
- **Payments** — Assign fees, record payments, member payment requests
- **Announcements** — Notify the whole club, a team, or just the board — with email delivery
- **Availability** — Track member availability for tournaments
- **Documents** — Share bylaws, code of conduct, and club files
- **Profile** — Members manage their own info, emergency contacts, CricClubs link

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web | Next.js (App Router) |
| API | Fastify + Prisma |
| Database | PostgreSQL |
| Auth | Auth.js (Google OAuth) |
| Email | Nodemailer (Gmail SMTP) |

## Self-Hosting

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Google OAuth credentials ([setup guide](https://developers.google.com/identity/protocols/oauth2))
- Gmail account with App Password enabled

### 1. Clone the repo

```bash
git clone https://github.com/Prudhvi2607/club-os.git
cd club-os
```

### 2. Configure the API

```bash
cd api
cp .env.example .env
# Fill in your values
npm install
npx prisma migrate deploy
npx prisma db seed   # creates your club + admin user
npm run dev
```

### 3. Configure the web app

```bash
cd web
cp .env.example .env.local
# Fill in your values
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

### API (`api/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct PostgreSQL URL (for migrations) |
| `AUTH_SECRET` | Shared secret with web app for JWT verification |
| `EMAIL_USER` | Gmail address for sending announcements |
| `EMAIL_PASS` | Gmail App Password |
| `CLUB_NAME` | Your club's name (used in emails) |
| `CORS_ORIGIN` | Web app URL (e.g. `http://localhost:3000`) |

### Web (`web/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CLUB_NAME` | Your club's name (shown in UI) |
| `NEXT_PUBLIC_CLUB_ID` | Club UUID from database |
| `NEXT_PUBLIC_API_URL` | API URL (e.g. `http://localhost:3001`) |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `AUTH_SECRET` | Must match API `AUTH_SECRET` |
| `AUTH_URL` | Web app URL (e.g. `http://localhost:3000`) |

## License

MIT — see [LICENSE](LICENSE)
