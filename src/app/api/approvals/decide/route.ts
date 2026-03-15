import { NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const { approvalId, ticketId, decision } = await req.json()

  if (!approvalId || !ticketId || !['approve', 'reject'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = createServerClient()

  const approvalStatus = decision === 'approve' ? 'approved' : 'rejected'
  const ticketStatus = decision === 'approve' ? 'in_progress' : 'closed'

  const [approvalUpdate, ticketUpdate] = await Promise.all([
    supabase
      .from('approvals')
      .update({
        status: approvalStatus,
        decided_by_role: 'boss',
        decided_at: new Date().toISOString(),
      })
      .eq('id', approvalId)
      .eq('company_id', COMPANY_ID),
    supabase
      .from('tickets')
      .update({
        status: ticketStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .eq('company_id', COMPANY_ID),
  ])

  if (approvalUpdate.error || ticketUpdate.error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
