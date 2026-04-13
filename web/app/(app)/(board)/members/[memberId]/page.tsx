import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import { api } from '@/lib/api'

const STATUS_BADGE: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-red-100 text-red-600',
}

const ROLE_LABELS: Record<string, string> = {
  board: 'Board',
  captain: 'Captain',
  vice_captain: 'Vice Captain',
  member: 'Member',
  student: 'Student',
}

interface Props {
  params: Promise<{ memberId: string }>
}

export default async function MemberProfilePage({ params }: Props) {
  const { memberId } = await params
  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [member, teamAssignments] = await Promise.all([
    api.members.get(token, memberId).catch(() => null) as any,
    api.members.teams(token, memberId).catch(() => []),
  ])
  if (!member) notFound()

  const u = member.user

  const totalDue = member.memberFees?.reduce((s: number, f: any) => s + Number(f.amountDue), 0) ?? 0
  const totalPaid = member.memberFees?.reduce((s: number, f: any) => s + Number(f.amountPaid), 0) ?? 0

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <Link href="/members" className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
        ← Members
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">{u.fullName}</h1>
          <p className="text-sm text-zinc-400 mt-0.5 capitalize">
            {member.status}
            {u.playingRole && <span> · {u.playingRole.replace('_', ' ')}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          {member.roles?.map((r: any) => (
            <span key={r.id} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
              {ROLE_LABELS[r.role] ?? r.role}
            </span>
          ))}
          {member.customRoles?.map((cr: any) => (
            <span key={cr.id} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
              {cr.customRole.name}
            </span>
          ))}
        </div>
      </div>

      {/* Contact */}
      <Section title="Contact">
        <Row label="Email" value={u.email ?? '—'} />
        <Row label="Phone" value={u.phone ?? '—'} />
        <Row label="Joined" value={new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
        {u.jerseyNumber && <Row label="Jersey #" value={`#${u.jerseyNumber}`} />}
        {u.tshirtSize && <Row label="T-Shirt" value={u.tshirtSize} />}
        {u.cricclubsUrl && (
          <Row label="CricClubs" value={
            <a href={u.cricclubsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
              {u.cricclubsUrl}
            </a>
          } />
        )}
      </Section>

      {/* Student Info */}
      {(u.studentId || u.studentEmail || u.studentProgram) && (
        <Section title="Student Info">
          {u.studentId && <Row label="Student ID" value={u.studentId} />}
          {u.studentEmail && <Row label="Student Email" value={u.studentEmail} />}
          {u.studentProgram && <Row label="Program" value={u.studentProgram} />}
        </Section>
      )}

      {/* Emergency Contact */}
      {(u.emergencyContactName || u.emergencyContactPhone) && (
        <Section title="Emergency Contact">
          <Row label="Name" value={u.emergencyContactName ?? '—'} />
          <Row label="Phone" value={u.emergencyContactPhone ?? '—'} />
          {u.emergencyContactRelationship && <Row label="Relationship" value={u.emergencyContactRelationship} />}
        </Section>
      )}

      {/* Season Registrations */}
      {member.seasonRegistrations?.length > 0 && (
        <Section title="Season Registrations">
          <div className="divide-y divide-zinc-100">
            {member.seasonRegistrations.map((reg: any) => (
              <div key={reg.id} className="flex items-center justify-between py-2">
                <span className="text-sm">{reg.season.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 capitalize">{reg.memberType}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    reg.status === 'active' ? 'bg-green-100 text-green-700'
                    : reg.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-zinc-100 text-zinc-500'
                  }`}>
                    {reg.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Teams & Tournaments */}
      {teamAssignments.length > 0 && (
        <Section title="Teams & Tournaments">
          <div className="space-y-4">
            {(teamAssignments as any[]).map((a, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{a.teamName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">{a.seasonName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      a.seasonStatus === 'active' ? 'bg-green-100 text-green-700'
                      : a.seasonStatus === 'upcoming' ? 'bg-blue-50 text-blue-600'
                      : 'bg-zinc-100 text-zinc-500'
                    }`}>{a.seasonStatus}</span>
                  </div>
                </div>
                {a.tournaments.length === 0 ? (
                  <p className="pl-3 text-xs text-zinc-400">No tournaments assigned to this team yet</p>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {a.tournaments.map((t: any) => {
                      const avail = t.availability?.[0]
                      return (
                        <div key={t.id} className="flex items-center justify-between py-1.5 pl-3">
                          <div>
                            <span className="text-sm">{t.name}</span>
                            <span className="ml-2 text-xs text-zinc-400">
                              {new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {' – '}
                              {new Date(t.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                            !avail ? 'bg-zinc-100 text-zinc-400'
                            : avail.status === 'available' ? 'bg-green-100 text-green-700'
                            : avail.status === 'partial' ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-600'
                          }`}>
                            {avail ? avail.status : 'not set'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Fees */}
      {member.memberFees?.length > 0 && (
        <Section title={`Fees — $${totalPaid.toFixed(2)} of $${totalDue.toFixed(2)} paid`}>
          <div className="divide-y divide-zinc-100">
            {member.memberFees.map((fee: any) => (
              <div key={fee.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{fee.feeType.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">
                      ${Number(fee.amountPaid).toFixed(2)} / ${Number(fee.amountDue).toFixed(2)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[fee.status]}`}>
                      {fee.status}
                    </span>
                  </div>
                </div>
                {fee.payments?.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between pl-3 text-xs text-zinc-400">
                    <span>
                      {new Date(p.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {p.notes && <span> · {p.notes}</span>}
                    </span>
                    <span className="capitalize">${Number(p.amount).toFixed(2)} · {p.method}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-2">
      <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400">{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="w-28 shrink-0 text-zinc-400">{label}</span>
      <span className="text-zinc-800 min-w-0">{value}</span>
    </div>
  )
}
