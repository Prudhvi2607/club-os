import type { Metadata } from 'next'
import { auth } from '@/auth'
import { api } from '@/lib/api'
import { UploadDocumentModal } from '@/components/upload-document-modal'
import { DeleteDocumentButton } from '@/components/delete-document-button'
import { DocumentPreviewModal } from '@/components/document-preview-modal'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'Documents | club-os' }

const CLUB_ID = process.env.NEXT_PUBLIC_CLUB_ID!
const API_URL = process.env.NEXT_PUBLIC_API_URL!

const CATEGORY_LABELS: Record<string, string> = {
  bylaws: 'Bylaws / Constitution',
  code_of_conduct: 'Code of Conduct',
  other: 'Other',
}

export default async function DocumentsPage() {
  
  const session = await auth()
  const token = (session as any)?.accessToken ?? ''

  const [me, docs] = await Promise.all([
    api.me(token).catch(() => null),
    api.documents.list(token).catch(() => []),
  ])

  const roles = me?.clubMemberships[0]?.roles.map((r) => r.role) ?? []
  const isBoard = roles.some((r) => ['board', 'captain', 'vice_captain'].includes(r))
  const myUserId = me?.id ?? ''

  const grouped = docs.reduce<Record<string, typeof docs[number][]>>((acc, doc) => {
    acc[doc.category] = acc[doc.category] ?? []
    acc[doc.category].push(doc)
    return acc
  }, {})

  const categoryOrder = ['bylaws', 'code_of_conduct', 'other']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Club Documents</h1>
        {isBoard && (
          <UploadDocumentModal token={token} apiUrl={API_URL} clubId={CLUB_ID} uploadedById={myUserId} />
        )}
      </div>

      {docs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-zinc-200 bg-white px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-500">No documents uploaded yet</p>
          <p className="mt-1 text-xs text-zinc-400">
            {isBoard ? 'Upload bylaws, code of conduct, or other club documents above.' : 'Your board hasn\'t uploaded any documents yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categoryOrder.filter((c) => grouped[c]?.length).map((cat) => (
            <div key={cat}>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
                {CATEGORY_LABELS[cat]}
              </h2>
              <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-zinc-100">
                    {grouped[cat].map((doc) => (
                      <tr key={doc.id} className="hover:bg-zinc-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <DocumentPreviewModal title={doc.title} fileUrl={doc.fileUrl} />
                            {doc.visibility === 'board' && (
                              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-400">Board only</span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            Uploaded by {doc.uploadedBy.fullName} · {formatDate(doc.uploadedAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {isBoard && (
                            <DeleteDocumentButton docId={doc.id} docTitle={doc.title} token={token} apiUrl={API_URL} clubId={CLUB_ID} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
