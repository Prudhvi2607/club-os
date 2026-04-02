import { createClient } from '@/lib/supabase/server'
import { api } from '@/lib/api'
import { CreateAnnouncementModal } from '@/components/create-announcement-modal'
import { DeleteAnnouncementButton } from '@/components/delete-announcement-button'

const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!
const API_URL = process.env.NEXT_PUBLIC_API_URL!

const AUDIENCE_BADGE: Record<string, string> = {
  club: 'bg-blue-100 text-blue-700',
  team: 'bg-purple-100 text-purple-700',
  board: 'bg-zinc-100 text-zinc-600',
}

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token ?? ''

  const [announcements, me, teams] = await Promise.all([
    api.announcements.list(token, { limit: 50 }).catch(() => []),
    api.me(token).catch(() => null),
    api.squads.listTeams(token).catch(() => []),
  ])

  const myUserId = me?.id ?? ''
  const roles = me?.clubMemberships[0]?.roles.map((r) => r.role) ?? []
  const isBoard = roles.some((r) => ['board', 'captain', 'vice_captain'].includes(r))

  // Members only see club-audience and team announcements
  const visible = isBoard ? announcements : announcements.filter((a) => a.audience === 'club' || a.audience === 'team')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Announcements</h1>
        {isBoard && <CreateAnnouncementModal sentById={myUserId} teams={teams} token={token} clubId={CLUB_ID} apiUrl={API_URL} />}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center text-zinc-400 text-sm">
          No announcements yet.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((a) => (
            <div key={a.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{a.subject}</span>
                    {isBoard && (
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${AUDIENCE_BADGE[a.audience]}`}>
                        {a.audience}{a.team ? ` · ${a.team.name}` : ''}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-600 whitespace-pre-wrap">{a.body}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span className="text-xs text-zinc-400">{new Date(a.sentAt).toLocaleDateString()}</span>
                  {isBoard && <DeleteAnnouncementButton announcementId={a.id} token={token} clubId={CLUB_ID} apiUrl={API_URL} />}
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-400">Sent by {a.sentBy.fullName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
