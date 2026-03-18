'use client'

import { useState } from 'react'
import { History, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle } from 'lucide-react'

interface HistoryTicket {
  id: string
  reference_number: string
  status: string
  category: string
  description: string
  closed_at: string | null
  created_at: string
  units: { unit_label: string; properties: { name: string } | null } | null
}

interface Props {
  tickets: HistoryTicket[]
}

const CATEGORY_COLORS: Record<string, string> = {
  aircon:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  plumbing:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  electrical: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  general:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  other:      'bg-[#272727] text-[#A1A1A1] border-[#272727]',
}

function timeLabel(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 30) return `${d}d ago`
  const m = Math.floor(d / 30)
  return `${m}mo ago`
}

export function HistorySection({ tickets }: Props) {
  const [open, setOpen] = useState(false)

  if (tickets.length === 0) return null

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-[#161616] border border-[#272727] rounded-2xl px-4 py-3.5 hover:border-[#383838] transition-colors"
      >
        <div className="flex items-center gap-2">
          <History size={15} className="text-[#555555]" />
          <span className="text-[#A1A1A1] text-sm font-medium">Job History</span>
          <span className="bg-[#272727] text-[#555555] rounded-full px-2 py-0.5 text-[11px] font-medium">
            {tickets.length}
          </span>
        </div>
        {open
          ? <ChevronUp size={14} className="text-[#555555]" />
          : <ChevronDown size={14} className="text-[#555555]" />
        }
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          {tickets.map(ticket => {
            const catColor = CATEGORY_COLORS[ticket.category] ?? CATEGORY_COLORS.other
            const unit = ticket.units?.unit_label ?? '—'
            const building = ticket.units?.properties?.name ?? ''
            const isCancelled = ticket.status === 'cancelled'

            return (
              <div
                key={ticket.id}
                className="bg-[#161616] border border-[#272727] rounded-2xl px-4 py-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#BFF549] font-mono text-xs font-bold">{ticket.reference_number}</span>
                    <span className={`text-[11px] font-medium border rounded-full px-2.5 py-0.5 capitalize ${catColor}`}>
                      {ticket.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCancelled
                      ? <XCircle size={12} className="text-zinc-500" />
                      : <CheckCircle2 size={12} className="text-[#BFF549]" />
                    }
                    <span className={`text-[11px] ${isCancelled ? 'text-zinc-500' : 'text-[#BFF549]'}`}>
                      {isCancelled ? 'Cancelled' : 'Closed'}
                    </span>
                  </div>
                </div>

                <p className="text-[#A1A1A1] text-xs leading-relaxed line-clamp-2">{ticket.description}</p>

                <div className="flex items-center justify-between">
                  <span className="text-[#555555] text-xs">
                    Unit {unit}{building ? ` · ${building}` : ''}
                  </span>
                  <div className="flex items-center gap-1 text-[#555555]">
                    <Clock size={10} />
                    <span className="text-[11px]">{timeLabel(ticket.closed_at ?? ticket.created_at)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
