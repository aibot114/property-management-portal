import { NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const { ticketId } = await req.json()

  if (!ticketId) {
    return NextResponse.json({ error: 'ticketId is required' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: ticket } = await supabase
    .from('tickets')
    .select('status')
    .eq('id', ticketId)
    .eq('company_id', COMPANY_ID)
    .single()

  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const now = new Date().toISOString()

  const [ticketUpdate, auditInsert] = await Promise.all([
    supabase
      .from('tickets')
      .update({ status: 'closed', closed_at: now, updated_at: now })
      .eq('id', ticketId)
      .eq('company_id', COMPANY_ID),
    supabase.from('audit_log').insert({
      company_id:      COMPANY_ID,
      ticket_id:       ticketId,
      actor_id:        'secretary',
      actor_role:      'secretary',
      action:          'ticket_closed',
      previous_status: ticket.status,
      new_status:      'closed',
      metadata:        {},
    }),
  ])

  if (ticketUpdate.error) {
    return NextResponse.json({ error: ticketUpdate.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
