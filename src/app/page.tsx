export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader } from '@/components/ui/Card'
import { TicketTable } from '@/components/tickets/TicketTable'
import { StatusTabs } from '@/components/tickets/StatusTabs'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'
import { Ticket, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'
import type { Ticket as TicketType } from '@/lib/types'
import { Suspense } from 'react'

async function getStats() {
  const supabase = createServerClient()
  const today = new Date().toISOString().split('T')[0]

  const [openRes, urgentRes, approvalRes, closedRes] = await Promise.all([
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', COMPANY_ID)
      .in('status', ['new', 'assigned', 'in_progress', 'awaiting_parts']),
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', COMPANY_ID)
      .eq('is_urgent', true)
      .not('status', 'in', '(closed,cancelled)'),
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', COMPANY_ID)
      .eq('status', 'awaiting_approval'),
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', COMPANY_ID)
      .eq('status', 'closed')
      .gte('closed_at', today),
  ])

  return {
    open: openRes.count ?? 0,
    urgent: urgentRes.count ?? 0,
    approval: approvalRes.count ?? 0,
    closedToday: closedRes.count ?? 0,
  }
}

async function getTickets(status?: string) {
  const supabase = createServerClient()

  let query = supabase
    .from('tickets')
    .select(`
      id, reference_number, status, is_urgent, category, description, created_at,
      units(unit_label, properties(name)),
      technicians(full_name)
    `)
    .eq('company_id', COMPANY_ID)
    .order('is_urgent', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (status === 'urgent') {
    query = query.eq('is_urgent', true).not('status', 'in', '(closed,cancelled)')
  } else if (status) {
    query = query.eq('status', status)
  }

  const { data } = await query
  return (data ?? []) as unknown as TicketType[]
}

interface DashboardProps {
  searchParams: Promise<{ status?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const { status } = await searchParams
  const [stats, tickets] = await Promise.all([getStats(), getTickets(status)])

  return (
    <AppLayout>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Open Tickets"
          value={stats.open}
          icon={<Ticket size={16} />}
        />
        <StatCard
          label="Urgent"
          value={stats.urgent}
          icon={<AlertTriangle size={16} />}
          accent={stats.urgent > 0}
        />
        <StatCard
          label="Needs Approval"
          value={stats.approval}
          icon={<Clock size={16} />}
        />
        <StatCard
          label="Closed Today"
          value={stats.closedToday}
          icon={<CheckCircle2 size={16} />}
        />
      </div>

      {/* Ticket Board */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <h2 className="text-white font-semibold font-[family-name:var(--font-heading)] text-sm">
              Live Ticket Board
            </h2>
            <Suspense>
              <StatusTabs />
            </Suspense>
          </div>
        </CardHeader>
        <TicketTable tickets={tickets} />
      </Card>
    </AppLayout>
  )
}
