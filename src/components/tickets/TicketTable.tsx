import Link from 'next/link'
import { Badge, UrgentDot } from '@/components/ui/Badge'
import { timeAgo } from '@/lib/utils'
import type { Ticket } from '@/lib/types'
import { ArrowUpRight } from 'lucide-react'

interface TicketTableProps {
  tickets: Ticket[]
}

export function TicketTable({ tickets }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#555555]">
        <p className="text-sm">No tickets found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#272727]">
            {['Ref #', 'Unit', 'Category', 'Description', 'Status', 'Tech', 'Age', ''].map(h => (
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
              className="hover:bg-[#1E1E1E]/50 transition-colors group"
            >
              {/* Ref # */}
              <td className="px-4 py-3 pl-5 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  {ticket.is_urgent && <UrgentDot />}
                  <span className="font-mono text-[#BFF549] text-xs font-medium">
                    {ticket.reference_number}
                  </span>
                </div>
              </td>

              {/* Unit */}
              <td className="px-4 py-3 whitespace-nowrap">
                <div>
                  <p className="text-white font-medium text-xs">
                    {ticket.units?.unit_label ?? '—'}
                  </p>
                  <p className="text-[#555555] text-xs">
                    {ticket.units?.properties?.name ?? ''}
                  </p>
                </div>
              </td>

              {/* Category */}
              <td className="px-4 py-3 whitespace-nowrap">
                <Badge variant="category" value={ticket.category} />
              </td>

              {/* Description */}
              <td className="px-4 py-3 max-w-[240px]">
                <p className="text-[#A1A1A1] text-xs truncate">
                  {ticket.description}
                </p>
              </td>

              {/* Status */}
              <td className="px-4 py-3 whitespace-nowrap">
                <Badge variant="status" value={ticket.status} />
              </td>

              {/* Tech */}
              <td className="px-4 py-3 whitespace-nowrap">
                <p className="text-[#A1A1A1] text-xs">
                  {ticket.technicians?.full_name ?? <span className="text-[#3A3A3A]">Unassigned</span>}
                </p>
              </td>

              {/* Age */}
              <td className="px-4 py-3 whitespace-nowrap">
                <p className="text-[#555555] text-xs">{timeAgo(ticket.created_at)}</p>
              </td>

              {/* Action */}
              <td className="px-4 py-3 pr-5 whitespace-nowrap">
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[#BFF549] text-xs hover:underline transition-opacity"
                >
                  View <ArrowUpRight size={12} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
