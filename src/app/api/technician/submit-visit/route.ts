import { NextResponse } from 'next/server'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'

const STORAGE_BUCKET = 'mrn-group-evidence'
const WF02_URL = 'https://n8n.srv1043829.hstgr.cloud/webhook/pm-visit-submitted'

export async function POST(req: Request) {
  const formData = await req.formData()

  const ticketId      = formData.get('ticketId') as string | null
  const technicianId  = formData.get('technicianId') as string | null
  const visitNumberRaw = formData.get('visitNumber') as string | null
  const arrivalLat    = formData.get('arrivalLat') as string | null
  const arrivalLng    = formData.get('arrivalLng') as string | null
  const arrivalFlagged = formData.get('arrivalFlaggedManual') === 'true'
  const beforePhotoFile = formData.get('beforePhoto') as File | null
  const canFixNow     = formData.get('canFixNow') === 'true'
  const afterPhotoFile  = formData.get('afterPhoto') as File | null
  const fixNotes      = (formData.get('fixNotes') as string | null) ?? ''
  const costAedRaw    = formData.get('costAed') as string | null
  const partsDesc     = (formData.get('partsDescription') as string | null) ?? ''
  const partsEstRaw   = formData.get('partsEstCost') as string | null

  if (!ticketId) {
    return NextResponse.json({ error: 'Missing ticketId' }, { status: 400 })
  }

  const visitNumber = parseInt(visitNumberRaw ?? '1', 10) as 1 | 2
  const costAed = costAedRaw ? parseFloat(costAedRaw) : null
  const partsEstCost = partsEstRaw ? parseFloat(partsEstRaw) : null

  const supabase = createServerClient()

  // ─── 1. Upload photos to Supabase Storage ──────────────────────────────────

  async function uploadPhoto(file: File, type: 'before' | 'after'): Promise<string | null> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${ticketId}/visit-${visitNumber}/${type}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      })

    if (uploadError) {
      console.error(`Photo upload error (${type}):`, uploadError)
      return null
    }

    // Generate a signed URL valid for 10 years (service role can sign private bucket URLs)
    const { data: signedData } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10)

    return signedData?.signedUrl ?? null
  }

  const [beforeUrl, afterUrl] = await Promise.all([
    beforePhotoFile ? uploadPhoto(beforePhotoFile, 'before') : Promise.resolve(null),
    afterPhotoFile && canFixNow ? uploadPhoto(afterPhotoFile, 'after') : Promise.resolve(null),
  ])

  // ─── 2. Build arrival proof ────────────────────────────────────────────────

  const arrivalProofValue =
    arrivalLat && arrivalLng && !(arrivalLat === '0' && arrivalLng === '0')
      ? `${arrivalLat},${arrivalLng}`
      : null

  const arrivedAt = new Date().toISOString()

  // ─── 3. Insert visit record ────────────────────────────────────────────────

  const { data: visitData, error: visitError } = await supabase
    .from('visits')
    .insert({
      company_id:              COMPANY_ID,
      ticket_id:               ticketId,
      technician_id:           technicianId || null,
      visit_number:            visitNumber,
      arrived_at:              arrivedAt,
      arrival_proof_type:      arrivalProofValue ? 'gps_pin' : null,
      arrival_proof_value:     arrivalProofValue,
      arrival_flagged_manual:  arrivalFlagged,
      before_photo_url:        beforeUrl,
      can_fix_now:             canFixNow,
      after_photo_url:         canFixNow ? afterUrl : null,
      fix_notes:               canFixNow ? fixNotes || null : null,
      cost_aed:                canFixNow ? costAed : null,
      cost_finalized:          canFixNow && costAed !== null,
      parts_description:       !canFixNow ? partsDesc || null : null,
      parts_est_cost_aed:      !canFixNow ? partsEstCost : null,
    })
    .select('id')
    .single()

  if (visitError || !visitData) {
    console.error('Visit insert error:', visitError)
    return NextResponse.json({ error: 'Failed to save visit record' }, { status: 500 })
  }

  const visitId = visitData.id

  // ─── 4. Insert photo records ───────────────────────────────────────────────

  const photoRows = []
  if (beforeUrl) {
    photoRows.push({ company_id: COMPANY_ID, ticket_id: ticketId, visit_id: visitId, photo_type: 'before', storage_url: beforeUrl })
  }
  if (afterUrl) {
    photoRows.push({ company_id: COMPANY_ID, ticket_id: ticketId, visit_id: visitId, photo_type: 'after', storage_url: afterUrl })
  }
  if (photoRows.length > 0) {
    await supabase.from('photos').insert(photoRows)
  }

  // ─── 5. Update ticket status ───────────────────────────────────────────────

  const newTicketStatus = canFixNow ? 'in_progress' : 'awaiting_parts'

  // Fetch actual current status before writing audit log
  const { data: ticketNow } = await supabase
    .from('tickets').select('status').eq('id', ticketId).single()

  const [ticketUpdate, auditInsert] = await Promise.all([
    supabase
      .from('tickets')
      .update({ status: newTicketStatus, assigned_tech_id: technicianId || undefined, updated_at: new Date().toISOString() })
      .eq('id', ticketId)
      .eq('company_id', COMPANY_ID),
    supabase
      .from('audit_log')
      .insert({
        company_id:      COMPANY_ID,
        ticket_id:       ticketId,
        actor_id:        technicianId || null,
        actor_role:      'technician',
        action:          canFixNow ? 'visit_completed' : 'visit_parts_needed',
        previous_status: ticketNow?.status ?? 'assigned',
        new_status:      newTicketStatus,
        metadata:        { visit_id: visitId, visit_number: visitNumber, can_fix_now: canFixNow },
      }),
  ])

  if (ticketUpdate.error) {
    console.error('Ticket status update error:', ticketUpdate.error)
  }

  // ─── 6. Trigger WF02 (pm-visit-submitted) ─────────────────────────────────

  const wf02Payload = {
    company_id:    COMPANY_ID,
    ticket_id:     ticketId,
    visit_id:      visitId,
    technician_id: technicianId || null,
    arrival_proof: {
      type:          arrivalProofValue ? 'gps_pin' : null,
      value:         arrivalProofValue,
      flagged_manual: arrivalFlagged,
    },
    before_photo_url: beforeUrl,
    can_fix_now:      canFixNow,
    completion: canFixNow
      ? {
          after_photo_url: afterUrl,
          fix_notes:       fixNotes || null,
          cost_aed:        costAed,
        }
      : null,
    parts_needed: !canFixNow
      ? {
          description:       partsDesc || null,
          estimated_cost_aed: partsEstCost,
        }
      : null,
  }

  try {
    await fetch(WF02_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wf02Payload),
    })
  } catch (err) {
    // Non-fatal — visit is already saved. WF02 can be re-triggered manually.
    console.error('WF02 trigger failed (non-fatal):', err)
  }

  return NextResponse.json({ ok: true, visitId })
}
