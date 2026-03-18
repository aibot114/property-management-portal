'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = [
  { value: 'new',               label: 'New' },
  { value: 'assigned',          label: 'Assigned' },
  { value: 'in_progress',       label: 'In Progress' },
  { value: 'awaiting_parts',    label: 'Awaiting Parts' },
  { value: 'awaiting_approval', label: 'Needs Approval' },
  { value: 'closed',            label: 'Closed' },
  { value: 'cancelled',         label: 'Cancelled' },
]

const STATUS_STYLES: Record<string, string> = {
  new:               'text-blue-400   border-blue-500/30   bg-blue-500/10',
  assigned:          'text-violet-400 border-violet-500/30 bg-violet-500/10',
  in_progress:       'text-amber-400  border-amber-500/30  bg-amber-500/10',
  awaiting_parts:    'text-orange-400 border-orange-500/30 bg-orange-500/10',
  awaiting_approval: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  closed:            'text-[#BFF549]  border-[#BFF549]/30  bg-[#BFF549]/10',
  cancelled:         'text-zinc-400   border-zinc-500/30   bg-zinc-500/10',
}

interface Props {
  ticketId: string
  currentStatus: string
}

export function StatusDropdown({ ticketId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.stopPropagation()
    const newStatus = e.target.value
    setStatus(newStatus)

    await fetch('/api/tickets/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId, status: newStatus }),
    })

    startTransition(() => router.refresh())
  }

  const style = STATUS_STYLES[status] ?? 'text-zinc-400 border-zinc-500/30 bg-zinc-500/10'

  return (
    <select
      value={status}
      onChange={handleChange}
      onClick={(e) => e.stopPropagation()}
      disabled={isPending}
      className={`rounded-full border pl-2.5 pr-6 py-0.5 text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/10 disabled:opacity-50 transition-opacity ${style}`}
    >
      {STATUS_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-[#1E1E1E] text-white">
          {opt.label}
        </option>
      ))}
    </select>
  )
}
