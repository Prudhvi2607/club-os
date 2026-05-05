import { vi } from 'vitest'

const makeModel = () => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  aggregate: vi.fn(),
  count: vi.fn(),
  upsert: vi.fn(),
})

export const prismaMock = {
  user: makeModel(),
  club: makeModel(),
  clubMember: makeModel(),
  clubMemberRole: makeModel(),
  clubCustomRole: makeModel(),
  clubMemberCustomRole: makeModel(),
  clubDocument: makeModel(),
  season: makeModel(),
  seasonRegistration: makeModel(),
  feeType: makeModel(),
  memberFee: makeModel(),
  payment: makeModel(),
  paymentRequest: makeModel(),
  announcement: makeModel(),
  team: makeModel(),
  teamAssignment: makeModel(),
  tournament: makeModel(),
  tournamentTeam: makeModel(),
  memberAvailability: makeModel(),
  sponsor: makeModel(),
  sponsorContribution: makeModel(),
  expense: makeModel(),
  $transaction: vi.fn((fn: any) => fn(prismaMock)),
}

export function resetMocks() {
  for (const model of Object.values(prismaMock)) {
    if (typeof model === 'object') {
      for (const fn of Object.values(model)) {
        if (typeof fn === 'function' && 'mockReset' in fn) (fn as any).mockReset()
      }
    }
  }
  ;(prismaMock.$transaction as any).mockImplementation((fn: any) => fn(prismaMock))
}
