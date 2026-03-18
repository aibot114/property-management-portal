import { NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'

const VALID_STATUSES = ['new', 'assigned', 'in_progress', 'awaiting_parts', 'awaiting_approval', 'closed', 'cancelled']

export async function PATCH(req: Request) {
  const { ticketId, status } = await req.json()

  if (!ticketId || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { error } = await supabase
    .from('tickets')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(status === 'closed' ? { closed_at: new Date().toISOString() } : {}),
    })
    .eq('id', ticketId)
    .eq('company_id', COMPANY_ID)

  if (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
