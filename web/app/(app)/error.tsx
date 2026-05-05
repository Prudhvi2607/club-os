'use client'

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <p className="font-medium">Something went wrong.</p>
        <p className="text-sm text-zinc-500">The server may be temporarily unavailable.</p>
        <button
          onClick={reset}
          className="text-sm underline text-zinc-600 hover:text-zinc-900"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
