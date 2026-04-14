'use client'

interface Fee {
  clubMember: { user: { fullName: string } }
  feeType: { name: string }
  amountDue: number | string
  amountPaid: number | string
  status: string
  payments: { paidAt: string; amount: number | string; method: string; notes?: string | null }[]
}

interface Props {
  fees: Fee[]
  seasonYear: string | number
}

export function ExportPaymentsButton({ fees, seasonYear }: Props) {
  function download() {
    const rows: string[][] = [
      ['Member', 'Fee Type', 'Amount Due', 'Amount Paid', 'Outstanding', 'Status', 'Payment Date', 'Payment Method', 'Notes'],
    ]

    for (const fee of fees) {
      const due = Number(fee.amountDue)
      const paid = Number(fee.amountPaid)

      if (fee.payments.length === 0) {
        rows.push([
          fee.clubMember.user.fullName,
          fee.feeType.name,
          due.toFixed(2),
          paid.toFixed(2),
          (due - paid).toFixed(2),
          fee.status,
          '', '', '',
        ])
      } else {
        fee.payments.forEach((p, i) => {
          rows.push([
            i === 0 ? fee.clubMember.user.fullName : '',
            i === 0 ? fee.feeType.name : '',
            i === 0 ? due.toFixed(2) : '',
            i === 0 ? paid.toFixed(2) : '',
            i === 0 ? (due - paid).toFixed(2) : '',
            i === 0 ? fee.status : '',
            new Date(p.paidAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            p.method,
            p.notes ?? '',
          ])
        })
      }
    }

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const today = new Date().toISOString().slice(0, 10)
    a.download = `payments-${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={download}
      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Export CSV
    </button>
  )
}
