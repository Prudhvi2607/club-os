import Fastify from 'fastify'
import cors from '@fastify/cors'
import authPlugin from './plugins/auth.js'
import clubAccessPlugin from './plugins/club-access.js'
import clubsRoutes from './routes/clubs.js'
import membersRoutes from './routes/members.js'
import seasonsRoutes from './routes/seasons.js'
import paymentsRoutes from './routes/payments.js'
import squadsRoutes from './routes/squads.js'
import announcementsRoutes from './routes/announcements.js'
import meRoutes from './routes/me.js'
import customRolesRoutes from './routes/custom-roles.js'
import tournamentsRoutes from './routes/tournaments.js'
import availabilityRoutes from './routes/availability.js'
import documentsRoutes from './routes/documents.js'

const app = Fastify({ logger: true })

app.get('/health', async () => ({ status: 'ok' }))

await app.register(cors, {
  origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
})

await app.register(authPlugin)
await app.register(clubAccessPlugin)

// All routes below require a valid Supabase JWT + club membership check
const routeOptions = { preHandler: [app.authenticate, app.requireClubMember] }

app.register(clubsRoutes, routeOptions)
app.register(membersRoutes, routeOptions)
app.register(seasonsRoutes, routeOptions)
app.register(paymentsRoutes, routeOptions)
app.register(squadsRoutes, routeOptions)
app.register(announcementsRoutes, routeOptions)
app.register(meRoutes, routeOptions)
app.register(customRolesRoutes, routeOptions)
app.register(tournamentsRoutes, routeOptions)
app.register(availabilityRoutes, routeOptions)
app.register(documentsRoutes, routeOptions)

app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
