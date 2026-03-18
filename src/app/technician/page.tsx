export const dynamic = 'force-dynamic'

import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'
import Link from 'next/link'
import { AlertTriangle, Wrench, Clock } from 'lucide-react'

interface Props {
  searchParams: Promise<{ tech?: string }>
}

const CATEGORY_COLORS: Record<string, string> = {
  aircon:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  plumbing:    'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  electrical:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  general:     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  other:       'bg-[#272727] text-[#A1A1A1] border-[#272727]',
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  assigned:        { label: 'Assigned',       color: 'text-blue-400' },
  in_progress:     { label: 'In Progress',    color: 'text-[#BFF549]' },
  awaiting_parts:  { label: 'Awaiting Parts', color: 'text-yellow-400' },
  new:             { label: 'New',            color: 'text-[#A1A1A1]' },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return 'Just now'
}

export default async function TechnicianDashboardPage({ searchParams }: Props) {
  const { tech: techId } = await searchParams

  if (!techId) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#A1A1A1] text-sm">No technician ID provided.</p>
          <p className="text-[#555555] text-xs mt-2">Open this page from the link sent by your office.</p>
        </div>
      </div>
    )
  }

  const supabase = createServerClient()

  const [techRes, ticketsRes] = await Promise.all([
    supabase
      .from('technicians')
      .select('full_name')
      .eq('id', techId)
      .eq('company_id', COMPANY_ID)
      .single(),
    supabase
      .from('tickets')
      .select('id, reference_number, status, category, is_urgent, created_at, units(unit_label, properties(name))')
      .eq('assigned_tech_id', techId)
      .eq('company_id', COMPANY_ID)
      .not('status', 'in', '(closed,cancelled)')
      .order('is_urgent', { ascending: false })
      .order('created_at'),
  ])

  const tech = techRes.data
  const tickets = (ticketsRes.data ?? []) as any[]

  if (!tech) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#A1A1A1] text-sm">Technician not found.</p>
          <p className="text-[#555555] text-xs mt-2">Check the link sent by your office.</p>
        </div>
      </div>
    )
  }

  const firstName = tech.full_name.split(' ')[0]
  const assignedCount  = tickets.filter(t => t.status === 'assigned').length
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length
  const urgentTickets  = tickets.filter(t => t.is_urgent)

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <div className="bg-[#161616] border-b border-[#272727] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#BFF549] font-mono text-sm font-bold">My Jobs</p>
            <p className="text-white text-base font-semibold mt-0.5">Hi, {firstName} 👷</p>
          </div>
          {tickets.length > 0 && (
            <span className="bg-[#BFF549]/10 text-[#BFF549] border border-[#BFF549]/20 rounded-full px-3 py-1 text-xs font-semibold">
              {tickets.length} pending
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Urgent alert banner */}
        {urgentTickets.length > 0 && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3">
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm font-medium">
              {urgentTickets.length} urgent job{urgentTickets.length > 1 ? 's' : ''} — action required
            </p>
          </div>
        )}

        {/* Stats strip */}
        {tickets.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#161616] border border-[#272727] rounded-2xl px-3 py-3 text-center">
              <p className="text-white text-xl font-bold">{assignedCount}</p>
              <p className="text-[#555555] text-[11px] mt-0.5">Assigned</p>
            </div>
            <div className="bg-[#161616] border border-[#272727] rounded-2xl px-3 py-3 text-center">
              <p className="text-[#BFF549] text-xl font-bold">{inProgressCount}</p>
              <p className="text-[#555555] text-[11px] mt-0.5">In Progress</p>
            </div>
            <div className="bg-[#161616] border border-[#272727] rounded-2xl px-3 py-3 text-center">
              <p className="text-white text-xl font-bold">{tickets.length}</p>
              <p className="text-[#555555] text-[11px] mt-0.5">Total</p>
            </div>
          </div>
        )}

        {/* Ticket list */}
        {tickets.length === 0 ? (
          <div className="bg-[#161616] border border-[#272727] rounded-2xl px-5 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-[#BFF549]/10 flex items-center justify-center mx-auto mb-3">
              <Wrench size={20} className="text-[#BFF549]" />
            </div>
            <p className="text-white font-semibold text-sm">All caught up!</p>
            <p className="text-[#555555] text-xs mt-1">No pending jobs assigned to you.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket: any) => {
              const st = STATUS_LABEL[ticket.status] ?? { label: ticket.status, color: 'text-[#A1A1A1]' }
              const catColor = CATEGORY_COLORS[ticket.category] ?? CATEGORY_COLORS.other
              const unit = ticket.units?.unit_label ?? '—'
              const building = ticket.units?.properties?.name ?? ''
              return (
                <Link
                  key={ticket.id}
                  href={`/technician/${ticket.id}?tech=${techId}`}
                  className="block bg-[#161616] border border-[#272727] rounded-2xl px-4 py-4 hover:border-[#BFF549]/30 active:bg-[#1E1E1E] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#BFF549] font-mono text-xs font-bold">{ticket.reference_number}</span>
                      {ticket.is_urgent && (
                        <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5 text-[10px] font-medium">
                          <AlertTriangle size={9} /> Urgent
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-medium shrink-0 ${st.color}`}>{st.label}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2.5">
                    <span className={`text-[11px] font-medium border rounded-full px-2.5 py-0.5 capitalize ${catColor}`}>
                      {ticket.category}
                    </span>
                    <span className="text-[#A1A1A1] text-xs">
                      Unit {unit}{building ? ` · ${building}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[#555555]">
                    <Clock size={10} />
                    <span className="text-[11px]">{timeAgo(ticket.created_at)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
