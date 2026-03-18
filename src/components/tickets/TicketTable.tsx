'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge, UrgentDot } from '@/components/ui/Badge'
import { StatusDropdown } from '@/components/tickets/StatusDropdown'
import { timeAgo } from '@/lib/utils'
import type { Ticket } from '@/lib/types'
import { ChevronRight } from 'lucide-react'

interface TicketTableProps {
  tickets: Ticket[]
}

export function TicketTable({ tickets }: TicketTableProps) {
  const router = useRouter()

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#555555]">
        <p className="text-sm">No tickets found</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Mobile card list (hidden on sm+) ── */}
      <div className="divide-y divide-[#272727] sm:hidden">
        {tickets.map(ticket => (
          <Link
            key={ticket.id}
            href={`/tickets/${ticket.id}`}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#1E1E1E]/60 active:bg-[#1E1E1E] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {ticket.is_urgent && <UrgentDot />}
                <span className="font-mono text-[#BFF549] text-xs font-medium">{ticket.reference_number}</span>
                <StatusDropdown ticketId={ticket.id} currentStatus={ticket.status} />
              </div>
              <p className="text-[#A1A1A1] text-xs truncate mb-1">{ticket.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[#555555] text-xs">{ticket.units?.unit_label ?? '—'}</span>
                {ticket.units?.properties?.name && (
                  <>
                    <span className="text-[#3A3A3A] text-xs">·</span>
                    <span className="text-[#555555] text-xs">{ticket.units.properties.name}</span>
                  </>
                )}
                <span className="text-[#3A3A3A] text-xs">·</span>
                <Badge variant="category" value={ticket.category} />
              </div>
            </div>
            <ChevronRight size={14} className="text-[#3A3A3A] shrink-0" />
          </Link>
        ))}
      </div>

      {/* ── Desktop table (hidden below sm) ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#272727]">
              {['Ref #', 'Unit', 'Category', 'Description', 'Status', 'Tech', 'Age'].map(h => (
                <th key={h} className="text-left text-xs text-[#555555] font-medium px-4 py-3 whitespace-nowrap first:pl-5 last:pr-5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#272727]">
            {tickets.map(ticket => (
              <tr
                key={ticket.id}
                onClick={() => router.push(`/tickets/${ticket.id}`)}
                className="hover:bg-[#1E1E1E]/50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 pl-5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {ticket.is_urgent && <UrgentDot />}
                    <span className="font-mono text-[#BFF549] text-xs font-medium">
                      {ticket.reference_number}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-white font-medium text-xs">{ticket.units?.unit_label ?? '—'}</p>
                  <p className="text-[#555555] text-xs">{ticket.units?.properties?.name ?? ''}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge variant="category" value={ticket.category} />
                </td>
                <td className="px-4 py-3 max-w-[240px]">
                  <p className="text-[#A1A1A1] text-xs truncate">{ticket.description}</p>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <StatusDropdown ticketId={ticket.id} currentStatus={ticket.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="text-[#A1A1A1] text-xs">
                    {ticket.technicians?.full_name ?? <span className="text-[#3A3A3A]">Unassigned</span>}
                  </p>
                </td>
                <td className="px-4 py-3 pr-5 whitespace-nowrap">
                  <p className="text-[#555555] text-xs">{timeAgo(ticket.created_at)}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
