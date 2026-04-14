export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-40 rounded-md bg-zinc-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-zinc-200 bg-white p-4 space-y-2">
            <div className="h-3 w-20 rounded bg-zinc-100" />
            <div className="h-7 w-28 rounded bg-zinc-200" />
            <div className="h-3 w-24 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-zinc-100 last:border-0">
            <div className="h-4 w-32 rounded bg-zinc-200" />
            <div className="h-4 w-24 rounded bg-zinc-100" />
            <div className="ml-auto h-4 w-16 rounded bg-zinc-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-7 w-40 rounded-md bg-zinc-200" />
      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
        <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-3 flex gap-6">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-3 w-20 rounded bg-zinc-200" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-4 py-3 border-b border-zinc-100 last:border-0">
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className={`h-4 rounded bg-zinc-${j === 0 ? '200' : '100'}`} style={{ width: `${60 + j * 15}px` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
