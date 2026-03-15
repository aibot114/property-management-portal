export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader } from '@/components/ui/Card'
import { TicketTable } from '@/components/tickets/TicketTable'
import { StatusTabs } from '@/components/tickets/StatusTabs'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'
import type { Ticket } from '@/lib/types'
import { Suspense } from 'react'

interface TicketsPageProps {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const { status, category, q } = await searchParams
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

  if (status === 'urgent') {
    query = query.eq('is_urgent', true).not('status', 'in', '(closed,cancelled)')
  } else if (status) {
    query = query.eq('status', status)
  }

  if (category) query = query.eq('category', category)

  const { data } = await query
  const tickets = (data ?? []) as unknown as Ticket[]

  return (
    <AppLayout>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <h2 className="text-white font-semibold font-[family-name:var(--font-heading)] text-sm">
                All Tickets
              </h2>
              <p className="text-[#555555] text-xs mt-0.5">{tickets.length} results</p>
            </div>
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
