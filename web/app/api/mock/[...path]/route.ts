/**
 * Mock API handler for Playwright e2e tests.
 * Active only when PLAYWRIGHT_MOCK=true and NEXT_PUBLIC_API_URL points here.
 * The sub from the Authorization token determines which persona to serve.
 */
import { type NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status })
}

function getSubFromAuth(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const parts = auth.slice(7).split('.')
  if (parts.length < 2) return null
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    return payload.sub ?? null
  } catch {
    return null
  }
}

// ── Shared mock data ──────────────────────────────────────────────────────────

const SEASON = {
  id: 'season-1',
  name: '2025 Season',
  year: 2025,
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  status: 'active',
  _count: { registrations: 3 },
}

const TOURNAMENT = {
  id: 'tourn-1',
  name: 'Summer Cup 2025',
  startDate: '2025-06-01',
  endDate: '2025-06-15',
  seasonId: 'season-1',
  clubId: 'test-club-id',
  createdAt: '2025-01-01T00:00:00Z',
  teams: [],
}

const MEMBER_USER = {
  id: 'user-1',
  fullName: 'Alex Board',
  email: 'board@testclub.com',
  phone: '555-1234',
  avatarUrl: null,
  playingRole: 'batter',
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '555-5678',
  emergencyContactRelationship: 'Spouse',
  createdAt: '2024-01-01T00:00:00Z',
}

const MEMBER = {
  id: 'member-1',
  userId: 'user-1',
  clubId: 'test-club-id',
  status: 'active',
  joinedAt: '2024-01-01T00:00:00Z',
  user: MEMBER_USER,
  roles: [{ id: 'role-1', role: 'board' }],
  customRoles: [],
}

const MEMBER_2 = {
  id: 'member-2',
  userId: 'user-2',
  clubId: 'test-club-id',
  status: 'active',
  joinedAt: '2024-02-01T00:00:00Z',
  user: {
    id: 'user-2',
    fullName: 'Sam Member',
    email: 'member@testclub.com',
    phone: null,
    avatarUrl: null,
    playingRole: 'bowler',
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactRelationship: null,
    createdAt: '2024-02-01T00:00:00Z',
  },
  roles: [{ id: 'role-2', role: 'member' }],
  customRoles: [],
}

const ME = {
  id: 'user-1',
  supabaseId: 'test-board-supa-id',
  email: 'board@testclub.com',
  fullName: 'Alex Board',
  phone: '555-1234',
  avatarUrl: null,
  playingRole: 'batter',
  emergencyContactName: 'Jane Doe',
  emergencyContactPhone: '555-5678',
  emergencyContactRelationship: 'Spouse',
  jerseyNumber: 7,
  tshirtSize: 'M',
  cricclubsUrl: null,
  clubMemberships: [
    {
      id: 'member-1',
      status: 'active',
      club: { id: 'test-club-id', name: 'Test Cricket Club', slug: 'test-cc' },
      roles: [{ id: 'role-1', role: 'board' }],
    },
  ],
}

const FEE_PENDING = {
  id: 'fee-1',
  amountDue: '100',
  amountPaid: '0',
  status: 'pending',
  feeType: { id: 'ft-1', name: 'Registration Fee', allowsInstallments: false },
  payments: [],
}

const FEE_PAID = {
  id: 'fee-2',
  amountDue: '50',
  amountPaid: '50',
  status: 'paid',
  feeType: { id: 'ft-2', name: 'Training Fee', allowsInstallments: false },
  payments: [{ id: 'pay-1', amount: '50', method: 'zelle', paidAt: '2025-02-01T00:00:00Z' }],
}

const REGISTRATION = {
  id: 'reg-1',
  seasonId: 'season-1',
  clubMemberId: 'member-1',
  memberType: 'regular',
  status: 'active',
  registeredAt: '2025-01-10T00:00:00Z',
  clubMember: MEMBER,
}

const ANNOUNCEMENT = {
  id: 'ann-1',
  subject: 'Welcome to the 2025 season!',
  body: 'We are excited to kick off the year. First practice is this Saturday at 9am.',
  audience: 'club',
  sentAt: '2025-01-15T10:00:00Z',
  sentBy: { id: 'user-1', fullName: 'Alex Board', avatarUrl: null },
  team: null,
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (process.env.PLAYWRIGHT_MOCK !== 'true') return json({ error: 'Not found' }, 404)

  const { path } = await params
  const [seg0, , seg2, seg3, seg4, seg5] = path
  const sub = getSubFromAuth(req)

  // GET /me
  if (seg0 === 'me') {
    if (sub === 'no-member-supa-id') {
      return json({ error: 'No club membership found for this account.' }, 404)
    }
    return json(ME)
  }

  if (seg0 !== 'clubs') return json({ error: 'Mock: unknown path' }, 404)

  // /clubs/:clubId/seasons
  if (seg2 === 'seasons') {
    if (!seg3) return json([SEASON])
    // /clubs/:clubId/seasons/:seasonId
    if (!seg4) return json(SEASON)
    // /clubs/:clubId/seasons/:seasonId/tournaments
    if (seg4 === 'tournaments') {
      if (!seg5) return json([TOURNAMENT])
      return json(TOURNAMENT)
    }
    // /clubs/:clubId/seasons/:seasonId/registrations
    if (seg4 === 'registrations') return json([REGISTRATION])
    // /clubs/:clubId/seasons/:seasonId/squads
    if (seg4 === 'squads') return json([])
    // /clubs/:clubId/seasons/:seasonId/availability
    if (seg4 === 'availability') {
      return json({ registrations: [REGISTRATION], tournaments: [TOURNAMENT], availability: [] })
    }
    // /clubs/:clubId/seasons/:seasonId/fee-types
    if (seg4 === 'fee-types') return json([])
    // /clubs/:clubId/seasons/:seasonId/payments/summary
    if (seg4 === 'payments' && seg5 === 'summary') {
      return json({
        totalDue: 150,
        totalPaid: 50,
        totalOutstanding: 100,
        byStatus: { paid: 1, partial: 0, pending: 1 },
        fees: [
          { ...FEE_PENDING, clubMember: MEMBER },
          { ...FEE_PAID, clubMember: MEMBER_2 },
        ],
      })
    }
  }

  // /clubs/:clubId/members
  if (seg2 === 'members') {
    if (!seg3 || seg3 === 'jersey-numbers') {
      if (seg3 === 'jersey-numbers') return json([{ userId: 'user-1', jerseyNumber: 7 }])
      return json([MEMBER, MEMBER_2])
    }
    // /clubs/:clubId/members/:memberId
    if (!seg4) return json(MEMBER)
    // /clubs/:clubId/members/:memberId/fees
    if (seg4 === 'fees' && !seg5) return json([FEE_PENDING, FEE_PAID])
    // /clubs/:clubId/members/:memberId/availability
    if (seg4 === 'availability') {
      return json({ tournaments: [TOURNAMENT], availability: [] })
    }
    // /clubs/:clubId/members/:memberId/teams
    if (seg4 === 'teams') return json([{ id: 'team-1', name: 'First XI' }])
    // /clubs/:clubId/members/:memberId/payment-requests (not a standard GET but handle gracefully)
    return json([])
  }

  // /clubs/:clubId/teams
  if (seg2 === 'teams') {
    return json([
      { id: 'team-1', name: 'First XI', clubId: 'test-club-id', _count: { assignments: 2 }, assignments: [] },
    ])
  }

  // /clubs/:clubId/custom-roles
  if (seg2 === 'custom-roles') return json([])

  // /clubs/:clubId/documents
  if (seg2 === 'documents') {
    return json([
      {
        id: 'doc-1',
        title: 'Club Bylaws',
        fileUrl: 'https://example.com/bylaws.pdf',
        category: 'bylaws',
        visibility: 'club',
        uploadedAt: '2024-01-01T00:00:00Z',
        uploadedBy: { fullName: 'Alex Board' },
      },
    ])
  }

  // /clubs/:clubId/announcements
  if (seg2 === 'announcements') return json([ANNOUNCEMENT])

  // /clubs/:clubId/sponsors
  if (seg2 === 'sponsors') {
    if (!seg3) {
      return json([
        {
          id: 'sponsor-1',
          name: 'Acme Corp',
          contactName: null,
          contactEmail: null,
          notes: null,
          createdAt: '2024-01-01T00:00:00Z',
          contributions: [{ id: 'c-1', amount: '500', receivedAt: '2025-01-01T00:00:00Z', description: null }],
          _count: { contributions: 1 },
        },
      ])
    }
    return json([])
  }

  // /clubs/:clubId/expenses
  if (seg2 === 'expenses') {
    return json([
      {
        id: 'exp-1',
        category: 'equipment',
        description: 'Cricket bats',
        amount: '300',
        paidAt: '2025-02-01T00:00:00Z',
        notes: null,
        createdAt: '2025-02-01T00:00:00Z',
        clubId: 'test-club-id',
        seasonId: 'season-1',
      },
    ])
  }

  // /clubs/:clubId/treasury/summary
  if (seg2 === 'treasury' && seg3 === 'summary') {
    return json({
      totalSponsorIncome: 1000,
      totalMemberFees: 500,
      totalIncome: 1500,
      totalExpenses: 300,
      net: 1200,
    })
  }

  // /clubs/:clubId/payment-requests
  if (seg2 === 'payment-requests') return json([])

  return json({ error: 'Mock: unhandled path', path: path.join('/') }, 404)
}

export async function POST(req: NextRequest) {
  if (process.env.PLAYWRIGHT_MOCK !== 'true') return json({ error: 'Not found' }, 404)
  const body = await req.json().catch(() => ({}))
  return json({ id: `mock-${Date.now()}`, ...body }, 201)
}

export async function PATCH(req: NextRequest) {
  if (process.env.PLAYWRIGHT_MOCK !== 'true') return json({ error: 'Not found' }, 404)
  const body = await req.json().catch(() => ({}))
  return json({ ...body, updatedAt: new Date().toISOString() })
}

export async function PUT(req: NextRequest) {
  if (process.env.PLAYWRIGHT_MOCK !== 'true') return json({ error: 'Not found' }, 404)
  const body = await req.json().catch(() => ({}))
  return json({ id: `mock-upsert-${Date.now()}`, ...body })
}

export async function DELETE() {
  if (process.env.PLAYWRIGHT_MOCK !== 'true') return json({ error: 'Not found' }, 404)
  return new Response(null, { status: 204 })
}
