export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'
import { formatDate, formatCurrency, timeAgo } from '@/lib/utils'
import Link from 'next/link'
import { ArrowUpRight, AlertTriangle } from 'lucide-react'

export default async function ApprovalsPage() {
  const supabase = createServerClient()

  const { data } = await supabase
    .from('approvals')
    .select(`
      *,
      tickets(
        reference_number, status, is_urgent, category, description,
        units(unit_label, properties(name)),
        technicians(full_name),
        visits(visit_number, cost_aed, fix_notes)
      )
    `)
    .eq('company_id', COMPANY_ID)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const approvals = data ?? []

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-white font-bold font-[family-name:var(--font-heading)] text-xl">
          Approval Queue
        </h1>
        <p className="text-[#555555] text-sm mt-1">
          {approvals.length} ticket{approvals.length !== 1 ? 's' : ''} waiting for approval
        </p>
      </div>

      {approvals.length === 0 ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-16 text-[#555555]">
              <p className="text-sm">No pending approvals</p>
              <p className="text-xs mt-1">All tickets are within auto-approval thresholds</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval: any) => {
            const ticket = approval.tickets
            const latestVisit = ticket?.visits?.sort((a: any, b: any) => b.visit_number - a.visit_number)[0]

            return (
              <Card key={approval.id} className="hover:border-[#383838] transition-colors">
                <CardBody>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Left */}
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[#BFF549] text-sm font-bold">
                          {ticket?.reference_number}
                        </span>
                        {ticket?.is_urgent && (
                          <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5 text-xs">
                            <AlertTriangle size={9} /> Urgent
                          </span>
                        )}
                        <Badge variant="category" value={ticket?.category ?? 'other'} />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-[#555555] mb-0.5">Unit</p>
                          <p className="text-white font-medium">{ticket?.units?.unit_label ?? '—'}</p>
                          <p className="text-[#555555]">{ticket?.units?.properties?.name ?? ''}</p>
                        </div>
                        <div>
                          <p className="text-[#555555] mb-0.5">Technician</p>
                          <p className="text-white">{ticket?.technicians?.full_name ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-[#555555] mb-0.5">Visit Cost</p>
                          <p className="text-yellow-400 font-semibold text-sm">{formatCurrency(latestVisit?.cost_aed)}</p>
                        </div>
                        <div>
                          <p className="text-[#555555] mb-0.5">Waiting</p>
                          <p className="text-white">{timeAgo(approval.created_at)}</p>
                        </div>
                      </div>

                      {latestVisit?.fix_notes && (
                        <p className="text-[#A1A1A1] text-xs italic leading-relaxed line-clamp-2">
                          &ldquo;{latestVisit.fix_notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <Link
                        href={`/tickets/${approval.ticket_id}`}
                        className="flex items-center gap-1.5 bg-[#BFF549] text-[#0D0D0D] rounded-xl px-4 py-2 text-xs font-semibold hover:bg-[#AADB3A] transition-colors"
                      >
                        Review <ArrowUpRight size={12} />
                      </Link>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </AppLayout>
  )
}
