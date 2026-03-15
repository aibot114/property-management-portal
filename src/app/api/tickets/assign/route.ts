import { NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const { ticketId, technicianId, teamId } = await req.json()

  if (!ticketId || !technicianId) {
    return NextResponse.json({ error: 'ticketId and technicianId are required' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data: ticket } = await supabase
    .from('tickets')
    .select('status')
    .eq('id', ticketId)
    .eq('company_id', COMPANY_ID)
    .single()

  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  const newStatus = ticket.status === 'new' ? 'assigned' : ticket.status

  const [ticketUpdate, auditInsert] = await Promise.all([
    supabase
      .from('tickets')
      .update({
        assigned_tech_id: technicianId,
        assigned_team_id: teamId ?? null,
        status:           newStatus,
        updated_at:       new Date().toISOString(),
      })
      .eq('id', ticketId)
      .eq('company_id', COMPANY_ID),
    supabase.from('audit_log').insert({
      company_id:      COMPANY_ID,
      ticket_id:       ticketId,
      actor_id:        'secretary',
      actor_role:      'secretary',
      action:          'technician_assigned',
      previous_status: ticket.status,
      new_status:      newStatus,
      metadata:        { tech_id: technicianId },
    }),
  ])

  if (ticketUpdate.error) {
    return NextResponse.json({ error: ticketUpdate.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
