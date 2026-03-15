import { NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const body = await req.json()
  const { full_name, wa_number, team_id, employee_id } = body

  if (!full_name || !wa_number || !team_id) {
    return NextResponse.json({ error: 'full_name, wa_number, and team_id are required' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('technicians')
    .insert({
      company_id:  COMPANY_ID,
      full_name:   full_name.trim(),
      wa_number:   wa_number.trim(),
      team_id,
      employee_id: employee_id?.trim() || null,
      is_active:   true,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A technician with this WhatsApp number already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, technician: data })
}

export async function PATCH(req: Request) {
  const { id, is_active } = await req.json()

  if (!id || typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'id and is_active required' }, { status: 400 })
  }

  const supabase = createServerClient()

  const { error } = await supabase
    .from('technicians')
    .update({ is_active })
    .eq('id', id)
    .eq('company_id', COMPANY_ID)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
