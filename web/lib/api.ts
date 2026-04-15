const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!

async function apiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error: string }).error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Member {
  id: string
  userId: string
  clubId: string
  status: 'active' | 'inactive' | 'alumni'
  joinedAt: string
  user: {
    id: string
    fullName: string
    email: string | null
    phone: string | null
    avatarUrl: string | null
    playingRole: string | null
    emergencyContactName: string | null
    emergencyContactPhone: string | null
    emergencyContactRelationship: string | null
    createdAt: string
  }
  roles: { id: string; role: string }[]
  customRoles: { id: string; customRole: { id: string; name: string } }[]
}

export interface Season {
  id: string
  name: string
  year: number
  startDate: string
  endDate: string
  status: 'upcoming' | 'active' | 'completed'
  _count: { registrations: number }
}

export interface SeasonRegistration {
  id: string
  seasonId: string
  clubMemberId: string
  memberType: 'regular' | 'student' | 'alumni'
  status: 'pending' | 'active' | 'inactive'
  registeredAt: string
  clubMember: Member
}

export interface Team {
  id: string
  name: string
  clubId: string
  assignments: SquadAssignment[]
}

export interface SquadAssignment {
  id: string
  teamId: string
  seasonId: string
  assignedAt: string
  clubMember: Member
}

export interface FeeType {
  id: string
  name: string
  amount: string
  studentAmount: string | null
  allowsInstallments: boolean
  _count: { memberFees: number }
}

export interface MemberFee {
  id: string
  amountDue: string
  amountPaid: string
  status: 'pending' | 'partial' | 'paid'
  feeType: { id: string; name: string; allowsInstallments: boolean }
  payments: { id: string; amount: string; method: string; paidAt: string }[]
}

export interface Announcement {
  id: string
  subject: string
  body: string
  audience: 'club' | 'team' | 'board'
  sentAt: string
  sentBy: { id: string; fullName: string; avatarUrl: string | null }
  team: { id: string; name: string } | null
}

export interface PaymentRequest {
  id: string
  memberFeeId: string
  clubMemberId: string
  amount: string
  method: string
  notes: string | null
  status: 'pending' | 'confirmed' | 'rejected'
  createdAt: string
  memberFee: { id: string; feeType: { name: string } }
  clubMember: { id: string; user: { fullName: string } }
}

export interface Tournament {
  id: string
  name: string
  startDate: string
  endDate: string
  seasonId: string
  clubId: string
  createdAt: string
  teams: {
    id: string
    tournamentId: string
    teamId: string
    team: {
      id: string
      name: string
      assignments: SquadAssignment[]
    }
  }[]
}

export interface ClubDocument {
  id: string
  title: string
  fileUrl: string
  category: 'bylaws' | 'code_of_conduct' | 'other'
  visibility: 'club' | 'board'
  uploadedAt: string
  uploadedBy: { fullName: string }
}

export interface MemberAvailability {
  id: string
  clubMemberId: string
  seasonId: string
  tournamentId: string
  status: 'available' | 'partial' | 'unavailable'
  notes: string | null
}

export interface MemberAvailabilityResponse {
  tournaments: Tournament[]
  availability: MemberAvailability[]
}

export interface SeasonAvailability {
  registrations: SeasonRegistration[]
  tournaments: Tournament[]
  availability: MemberAvailability[]
}

export interface PaymentSummary {
  totalDue: number
  totalPaid: number
  totalOutstanding: number
  byStatus: { paid: number; partial: number; pending: number }
  fees: (MemberFee & { clubMember: Member })[]
}

// ── API functions ──────────────────────────────────────────────────────────────

export interface Me {
  id: string
  supabaseId: string
  email: string | null
  fullName: string
  phone: string | null
  avatarUrl: string | null
  playingRole: string | null
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  emergencyContactRelationship: string | null
  jerseyNumber: number | null
  tshirtSize: string | null
  cricclubsUrl: string | null
  clubMemberships: {
    id: string
    status: string
    club: { id: string; name: string; slug: string }
    roles: { id: string; role: string }[]
  }[]
}

export interface Sponsor {
  id: string
  name: string
  contactName: string | null
  contactEmail: string | null
  notes: string | null
  createdAt: string
  contributions: SponsorContribution[]
  _count: { contributions: number }
}

export interface SponsorContribution {
  id: string
  sponsorId: string
  clubId: string
  seasonId: string | null
  amount: string
  description: string | null
  receivedAt: string
  recordedById: string
}

export interface Expense {
  id: string
  clubId: string
  seasonId: string | null
  category: string
  description: string
  amount: string
  paidAt: string
  notes: string | null
  createdAt: string
}

export interface TreasurySummary {
  totalSponsorIncome: number
  totalMemberFees: number
  totalIncome: number
  totalExpenses: number
  net: number
}

export interface CustomRole {
  id: string
  name: string
  _count: { members: number }
}

export const api = {
  me: (token: string) => apiFetch<Me>('/me', token),
  customRoles: {
    list: (token: string) =>
      apiFetch<CustomRole[]>(`/clubs/${CLUB_ID}/custom-roles`, token),
    create: (token: string, name: string) =>
      apiFetch<CustomRole>(`/clubs/${CLUB_ID}/custom-roles`, token, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    delete: (token: string, roleId: string) =>
      apiFetch(`/clubs/${CLUB_ID}/custom-roles/${roleId}`, token, { method: 'DELETE' }),
    assign: (token: string, memberId: string, customRoleId: string) =>
      apiFetch(`/clubs/${CLUB_ID}/members/${memberId}/custom-roles`, token, {
        method: 'POST',
        body: JSON.stringify({ customRoleId }),
      }),
    remove: (token: string, memberId: string, customRoleId: string) =>
      apiFetch(`/clubs/${CLUB_ID}/members/${memberId}/custom-roles/${customRoleId}`, token, {
        method: 'DELETE',
      }),
  },
  members: {
    list: (token: string, status?: string) =>
      apiFetch<Member[]>(
        `/clubs/${CLUB_ID}/members${status ? `?status=${status}` : ''}`,
        token
      ),
    get: (token: string, memberId: string) =>
      apiFetch<Member>(`/clubs/${CLUB_ID}/members/${memberId}`, token),
    teams: (token: string, memberId: string) =>
      apiFetch<any[]>(`/clubs/${CLUB_ID}/members/${memberId}/teams`, token),
    create: (token: string, body: Record<string, unknown>) =>
      apiFetch<Member>(`/clubs/${CLUB_ID}/members`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    jerseyNumbers: (token: string) =>
      apiFetch<{ userId: string; jerseyNumber: number }[]>(`/clubs/${CLUB_ID}/members/jersey-numbers`, token),
    updateStatus: (token: string, memberId: string, status: string) =>
      apiFetch<Member>(`/clubs/${CLUB_ID}/members/${memberId}/status`, token, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  seasons: {
    list: (token: string) =>
      apiFetch<Season[]>(`/clubs/${CLUB_ID}/seasons`, token),
    get: (token: string, seasonId: string) =>
      apiFetch<Season>(`/clubs/${CLUB_ID}/seasons/${seasonId}`, token),
    create: (token: string, body: Record<string, unknown>) =>
      apiFetch<Season>(`/clubs/${CLUB_ID}/seasons`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    delete: (token: string, seasonId: string) =>
      apiFetch(`/clubs/${CLUB_ID}/seasons/${seasonId}`, token, { method: 'DELETE' }),
    registrations: (token: string, seasonId: string) =>
      apiFetch<SeasonRegistration[]>(`/clubs/${CLUB_ID}/seasons/${seasonId}/registrations`, token),
    register: (token: string, seasonId: string, clubMemberId: string, memberType: string) =>
      apiFetch<SeasonRegistration>(`/clubs/${CLUB_ID}/seasons/${seasonId}/registrations`, token, {
        method: 'POST',
        body: JSON.stringify({ clubMemberId, memberType }),
      }),
  },

  squads: {
    listTeams: (token: string) =>
      apiFetch<(Team & { _count: { assignments: number } })[]>(`/clubs/${CLUB_ID}/teams`, token),
    overview: (token: string, seasonId: string) =>
      apiFetch<Team[]>(`/clubs/${CLUB_ID}/seasons/${seasonId}/squads`, token),
    addMember: (token: string, teamId: string, body: Record<string, unknown>) =>
      apiFetch(`/clubs/${CLUB_ID}/teams/${teamId}/squad`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    removeMember: (token: string, teamId: string, assignmentId: string) =>
      apiFetch(`/clubs/${CLUB_ID}/teams/${teamId}/squad/${assignmentId}`, token, {
        method: 'DELETE',
      }),
  },

  payments: {
    summary: (token: string, seasonId: string) =>
      apiFetch<PaymentSummary>(
        `/clubs/${CLUB_ID}/seasons/${seasonId}/payments/summary`,
        token
      ),
    feeTypes: (token: string, seasonId: string) =>
      apiFetch<FeeType[]>(`/clubs/${CLUB_ID}/seasons/${seasonId}/fee-types`, token),
    createFeeType: (token: string, seasonId: string, body: Record<string, unknown>) =>
      apiFetch<FeeType>(`/clubs/${CLUB_ID}/seasons/${seasonId}/fee-types`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    assignAll: (token: string, seasonId: string, feeTypeId: string) =>
      apiFetch<{ assigned: number }>(
        `/clubs/${CLUB_ID}/seasons/${seasonId}/fee-types/${feeTypeId}/assign-all`,
        token,
        { method: 'POST' }
      ),
    memberFees: (token: string, memberId: string, seasonId?: string) =>
      apiFetch<MemberFee[]>(
        `/clubs/${CLUB_ID}/members/${memberId}/fees${seasonId ? `?seasonId=${seasonId}` : ''}`,
        token
      ),
    recordPayment: (token: string, memberId: string, feeId: string, body: Record<string, unknown>) =>
      apiFetch(`/clubs/${CLUB_ID}/members/${memberId}/fees/${feeId}/payments`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    submitRequest: (token: string, memberId: string, feeId: string, body: Record<string, unknown>) =>
      apiFetch<PaymentRequest>(`/clubs/${CLUB_ID}/members/${memberId}/fees/${feeId}/payment-requests`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    listRequests: (token: string, status = 'pending') =>
      apiFetch<PaymentRequest[]>(`/clubs/${CLUB_ID}/payment-requests?status=${status}`, token),
    resolveRequest: (token: string, requestId: string, action: 'confirm' | 'reject', recordedById: string) =>
      apiFetch(`/clubs/${CLUB_ID}/payment-requests/${requestId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ action, recordedById }),
      }),
  },

  tournaments: {
    list: (token: string, seasonId: string) =>
      apiFetch<Tournament[]>(`/clubs/${CLUB_ID}/seasons/${seasonId}/tournaments`, token),
    get: (token: string, seasonId: string, tournamentId: string) =>
      apiFetch<Tournament>(`/clubs/${CLUB_ID}/seasons/${seasonId}/tournaments/${tournamentId}`, token),
    create: (token: string, seasonId: string, body: Record<string, unknown>) =>
      apiFetch<Tournament>(`/clubs/${CLUB_ID}/seasons/${seasonId}/tournaments`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    delete: (token: string, seasonId: string, tournamentId: string) =>
      apiFetch(`/clubs/${CLUB_ID}/seasons/${seasonId}/tournaments/${tournamentId}`, token, {
        method: 'DELETE',
      }),
    addTeam: (token: string, seasonId: string, tournamentId: string, teamId: string) =>
      apiFetch(`/clubs/${CLUB_ID}/seasons/${seasonId}/tournaments/${tournamentId}/teams`, token, {
        method: 'POST',
        body: JSON.stringify({ teamId }),
      }),
    removeTeam: (token: string, seasonId: string, tournamentId: string, teamId: string) =>
      apiFetch(`/clubs/${CLUB_ID}/seasons/${seasonId}/tournaments/${tournamentId}/teams/${teamId}`, token, {
        method: 'DELETE',
      }),
  },

  documents: {
    list: (token: string) =>
      apiFetch<ClubDocument[]>(`/clubs/${CLUB_ID}/documents`, token),
    create: (token: string, body: { title: string; fileUrl: string; category: string; uploadedById: string }) =>
      apiFetch<ClubDocument>(`/clubs/${CLUB_ID}/documents`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    delete: (token: string, docId: string) =>
      apiFetch(`/clubs/${CLUB_ID}/documents/${docId}`, token, { method: 'DELETE' }),
  },

  availability: {
    season: (token: string, seasonId: string) =>
      apiFetch<SeasonAvailability>(`/clubs/${CLUB_ID}/seasons/${seasonId}/availability`, token),

    member: (token: string, memberId: string, seasonId: string) =>
      apiFetch<MemberAvailabilityResponse>(
        `/clubs/${CLUB_ID}/members/${memberId}/availability?seasonId=${seasonId}`,
        token
      ),
    upsert: (token: string, memberId: string, body: { seasonId: string; tournamentId: string; status: string; notes?: string }) =>
      apiFetch<MemberAvailability>(`/clubs/${CLUB_ID}/members/${memberId}/availability`, token, {
        method: 'PUT',
        body: JSON.stringify(body),
      }),
  },

  treasury: {
    sponsors: (token: string) =>
      apiFetch<Sponsor[]>(`/clubs/${CLUB_ID}/sponsors`, token),
    createSponsor: (token: string, body: Record<string, unknown>) =>
      apiFetch<Sponsor>(`/clubs/${CLUB_ID}/sponsors`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    deleteSponsor: (token: string, sponsorId: string) =>
      apiFetch(`/clubs/${CLUB_ID}/sponsors/${sponsorId}`, token, { method: 'DELETE' }),
    addContribution: (token: string, sponsorId: string, body: Record<string, unknown>) =>
      apiFetch<SponsorContribution>(`/clubs/${CLUB_ID}/sponsors/${sponsorId}/contributions`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    deleteContribution: (token: string, sponsorId: string, contributionId: string) =>
      apiFetch(`/clubs/${CLUB_ID}/sponsors/${sponsorId}/contributions/${contributionId}`, token, { method: 'DELETE' }),
    expenses: (token: string, seasonId?: string) =>
      apiFetch<Expense[]>(`/clubs/${CLUB_ID}/expenses${seasonId ? `?seasonId=${seasonId}` : ''}`, token),
    createExpense: (token: string, body: Record<string, unknown>) =>
      apiFetch<Expense>(`/clubs/${CLUB_ID}/expenses`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    deleteExpense: (token: string, expenseId: string) =>
      apiFetch(`/clubs/${CLUB_ID}/expenses/${expenseId}`, token, { method: 'DELETE' }),
    summary: (token: string, seasonId?: string) =>
      apiFetch<TreasurySummary>(`/clubs/${CLUB_ID}/treasury/summary${seasonId ? `?seasonId=${seasonId}` : ''}`, token),
  },

  announcements: {
    list: (token: string, params?: { audience?: string; limit?: number }) => {
      const qs = new URLSearchParams()
      if (params?.audience) qs.set('audience', params.audience)
      if (params?.limit) qs.set('limit', String(params.limit))
      const q = qs.toString()
      return apiFetch<Announcement[]>(
        `/clubs/${CLUB_ID}/announcements${q ? `?${q}` : ''}`,
        token
      )
    },
    create: (token: string, body: Record<string, unknown>) =>
      apiFetch<Announcement>(`/clubs/${CLUB_ID}/announcements`, token, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
}
