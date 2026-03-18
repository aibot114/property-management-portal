export const dynamic = 'force-dynamic'

import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { TechnicianJobView } from '@/components/technician/TechnicianJobView'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tech?: string }>
}

export default async function TechnicianJobPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tech: techId } = await searchParams

  const supabase = createServerClient()

  const [ticketRes, visitsRes, techRes] = await Promise.all([
    supabase
      .from('tickets')
      .select(`
        id, reference_number, status, category, description, is_urgent, issue_photo_url,
        units(unit_label, properties(name)),
        tenants(full_name)
      `)
      .eq('id', id)
      .eq('company_id', COMPANY_ID)
      .single(),
    supabase
      .from('visits')
      .select('id, visit_number, arrived_at, can_fix_now, fix_notes, cost_aed, parts_description, created_at')
      .eq('ticket_id', id)
      .order('visit_number'),
    techId
      ? supabase
          .from('technicians')
          .select('id, full_name')
          .eq('id', techId)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (!ticketRes.data) notFound()

  const ticket = ticketRes.data

  // Re-sign the issue photo URL using the service key so stale/invalid tokens are refreshed.
  // Extracts the storage path from the stored URL and generates a fresh 10-year signed URL.
  let issuePhotoUrl: string | null = (ticket as any).issue_photo_url ?? null
  if (issuePhotoUrl) {
    try {
      const BUCKET = 'mrn-group-evidence'
      const match = issuePhotoUrl.match(new RegExp(`/object/sign/${BUCKET}/([^?]+)`))
      if (match?.[1]) {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(match[1], 60 * 60 * 24 * 365 * 10)
        if (signed?.signedUrl) issuePhotoUrl = signed.signedUrl
      }
    } catch {
      // Non-fatal — keep original URL; client will show fallback on error
    }
  }
  const visits = (visitsRes.data ?? []) as any[]
  const technician = techRes.data as { id: string; full_name: string } | null

  // Determine next visit number (max 2 visits allowed)
  const completedVisits = visits.filter((v: any) => v.arrived_at !== null)
  const nextVisitNumber = (completedVisits.length + 1) as 1 | 2

  // Pass visit 1 notes to the job form so tech can review what was done before
  const previousVisit = nextVisitNumber === 2 ? (visits.find((v: any) => v.visit_number === 1) ?? null) : null

  if (nextVisitNumber > 2) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-[#A1A1A1] text-sm">This ticket has already had 2 visits recorded.</p>
          <p className="text-[#555555] text-xs mt-2">Please contact the office for further action.</p>
        </div>
      </div>
    )
  }

  const isClosed = ticket.status === 'closed' || ticket.status === 'cancelled'

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header bar */}
      <div className="bg-[#161616] border-b border-[#272727] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#BFF549] font-mono text-sm font-bold">{ticket.reference_number}</p>
            <p className="text-[#555555] text-xs mt-0.5">
              {(ticket.units as any)?.unit_label ?? '—'}
              {(ticket.units as any)?.properties?.name
                ? ` · ${(ticket.units as any).properties.name}`
                : ''}
            </p>
          </div>
          <div className="text-right">
            {technician && <p className="text-white text-xs font-medium">{technician.full_name}</p>}
            {techId && (
              <Link href={`/technician?tech=${techId}`} className="text-[#555555] text-[11px] hover:text-[#A1A1A1] transition-colors">
                ← My Jobs
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5 max-w-lg mx-auto">
        {isClosed ? (
          <div className="bg-[#161616] rounded-2xl border border-[#272727] p-6 text-center mt-4">
            <p className="text-[#A1A1A1] text-sm">This ticket is already {ticket.status}.</p>
            <p className="text-[#555555] text-xs mt-2">No further action needed.</p>
          </div>
        ) : (
          <TechnicianJobView
            ticketId={ticket.id}
            technicianId={techId ?? null}
            visitNumber={nextVisitNumber}
            category={ticket.category}
            description={ticket.description}
            isUrgent={ticket.is_urgent}
            tenantName={(ticket.tenants as any)?.full_name ?? null}
            referenceNumber={ticket.reference_number}
            unitLabel={(ticket.units as any)?.unit_label ?? null}
            buildingName={(ticket.units as any)?.properties?.name ?? null}
            issuePhotoUrl={issuePhotoUrl}
            previousVisit={previousVisit}
          />
        )}
      </div>
    </div>
  )
}
