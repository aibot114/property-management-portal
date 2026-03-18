export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'
import { formatDate, formatCurrency, capitalize } from '@/lib/utils'
import type { Visit, AuditEntry, Photo, Approval } from '@/lib/types'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, User, Wrench, Camera, FileText, AlertTriangle } from 'lucide-react'
import { ApprovalActions } from './ApprovalActions'
import { AssignTechnicianForm } from './AssignTechnicianForm'
import { CloseTicketButton } from './CloseTicketButton'

interface TicketDetailProps {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: TicketDetailProps) {
  const { id } = await params
  const supabase = createServerClient()

  const [ticketRes, visitsRes, photosRes, auditRes, approvalRes, techsRes, teamsRes] = await Promise.all([
    supabase
      .from('tickets')
      .select(`
        *,
        units(unit_label, properties(name)),
        tenants(full_name, wa_number),
        technicians(full_name),
        teams(name)
      `)
      .eq('id', id)
      .eq('company_id', COMPANY_ID)
      .single(),
    supabase
      .from('visits')
      .select('*, technicians(full_name)')
      .eq('ticket_id', id)
      .order('visit_number'),
    supabase
      .from('photos')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at'),
    supabase
      .from('audit_log')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('approvals')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('technicians')
      .select('id, full_name, is_active, team_id')
      .eq('company_id', COMPANY_ID)
      .order('full_name'),
    supabase
      .from('teams')
      .select('id, name')
      .eq('company_id', COMPANY_ID),
  ])

  if (!ticketRes.data) notFound()

  const ticket = ticketRes.data
  const visits = (visitsRes.data ?? []) as Visit[]
  const photos = (photosRes.data ?? []) as Photo[]
  const auditLog = (auditRes.data ?? []) as AuditEntry[]
  const approval = approvalRes.data as Approval | null
  const teamsMap = Object.fromEntries((teamsRes.data ?? []).map(t => [t.id, t]))
  const allTechnicians = (techsRes.data ?? []).map(tech => ({
    ...tech,
    teams: tech.team_id ? (teamsMap[tech.team_id] ?? null) : null,
  }))

  return (
    <AppLayout>
      {/* Back + Header */}
      <div className="mb-6">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-[#A1A1A1] hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to tickets
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-[#BFF549] text-xl font-bold">
              {ticket.reference_number}
            </h1>
            <Badge variant="status" value={ticket.status} />
            {ticket.is_urgent && (
              <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2.5 py-0.5 text-xs font-medium">
                <AlertTriangle size={10} /> Urgent
              </span>
            )}
          </div>
          <p className="text-[#555555] text-xs">{formatDate(ticket.created_at)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Issue Details */}
          <Card>
            <CardHeader>
              <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)] flex items-center gap-2">
                <FileText size={14} className="text-[#555555]" /> Issue Details
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[#555555] text-xs mb-1">Category</p>
                  <Badge variant="category" value={ticket.category} />
                </div>
                <div>
                  <p className="text-[#555555] text-xs mb-1">Preferred Time</p>
                  <p className="text-white text-sm">{ticket.preferred_time ? capitalize(ticket.preferred_time) : '—'}</p>
                </div>
              </div>
              <div>
                <p className="text-[#555555] text-xs mb-1">Description</p>
                <p className="text-[#A1A1A1] text-sm leading-relaxed">{ticket.description}</p>
              </div>
              {ticket.location_value && (
                <div>
                  <p className="text-[#555555] text-xs mb-1 flex items-center gap-1">
                    <MapPin size={10} /> Location
                  </p>
                  <p className="text-[#A1A1A1] text-xs font-mono">{ticket.location_value}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Visit 1 & 2 */}
          {visits.map(visit => (
            <Card key={visit.id}>
              <CardHeader>
                <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)] flex items-center gap-2">
                  <Wrench size={14} className="text-[#555555]" />
                  Visit {visit.visit_number}
                  {visit.technicians?.full_name && (
                    <span className="text-[#555555] font-normal text-xs">
                      — {visit.technicians.full_name}
                    </span>
                  )}
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-[#555555] text-xs mb-1">Arrived</p>
                    <p className="text-white text-xs">{visit.arrived_at ? formatDate(visit.arrived_at) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[#555555] text-xs mb-1">Can Fix Now</p>
                    <p className="text-white text-xs">
                      {visit.can_fix_now === null ? '—' : visit.can_fix_now ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[#555555] text-xs mb-1">Cost</p>
                    <p className={`text-xs font-medium ${visit.cost_aed && visit.cost_aed > 500 ? 'text-yellow-400' : 'text-white'}`}>
                      {formatCurrency(visit.cost_aed)}
                      {visit.cost_finalized && (
                        <span className="ml-1 text-[#BFF549] text-[10px]">✓ Final</span>
                      )}
                    </p>
                  </div>
                </div>

                {visit.fix_notes && (
                  <div>
                    <p className="text-[#555555] text-xs mb-1">Notes</p>
                    <p className="text-[#A1A1A1] text-sm">{visit.fix_notes}</p>
                  </div>
                )}

                {visit.parts_description && (
                  <div>
                    <p className="text-[#555555] text-xs mb-1">Parts Required</p>
                    <p className="text-[#A1A1A1] text-sm">{visit.parts_description}</p>
                    {visit.parts_est_cost_aed && (
                      <p className="text-[#A1A1A1] text-xs mt-1">Est. cost: {formatCurrency(visit.parts_est_cost_aed)}</p>
                    )}
                  </div>
                )}

                {/* GPS arrival link */}
                {visit.arrival_proof_value && visit.arrival_proof_type === 'gps_pin' && (
                  <div>
                    <p className="text-[#555555] text-xs mb-1 flex items-center gap-1">
                      <MapPin size={10} /> GPS Arrival
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${visit.arrival_proof_value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#BFF549] text-xs font-mono hover:underline"
                    >
                      {visit.arrival_proof_value} ↗
                    </a>
                    {visit.arrival_flagged_manual && (
                      <span className="ml-2 text-yellow-400 text-[10px]">⚠ GPS skipped</span>
                    )}
                  </div>
                )}

                {/* Photos for this visit — direct from visit record + photos table */}
                {(() => {
                  const directPhotos: { url: string; label: string }[] = []
                  if (visit.before_photo_url) directPhotos.push({ url: visit.before_photo_url, label: 'Before' })
                  if (visit.after_photo_url)  directPhotos.push({ url: visit.after_photo_url,  label: 'After' })
                  const tablePhotos = photos.filter(p => p.visit_id === visit.id && !directPhotos.some(d => d.url === p.storage_url))
                  const allPhotos = [
                    ...directPhotos.map(p => ({ key: p.url, url: p.url, label: p.label })),
                    ...tablePhotos.map(p => ({ key: p.id, url: p.storage_url, label: p.photo_type })),
                  ]
                  if (!allPhotos.length) return null
                  return (
                    <div>
                      <p className="text-[#555555] text-xs mb-2 flex items-center gap-1">
                        <Camera size={10} /> Visit Photos
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {allPhotos.map(photo => (
                          <a
                            key={photo.key}
                            href={photo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square rounded-xl overflow-hidden bg-[#1E1E1E] border border-[#272727] hover:border-[#BFF549]/50 transition-colors"
                          >
                            <img
                              src={photo.url}
                              alt={photo.label}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded capitalize">
                              {photo.label}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </CardBody>
            </Card>
          ))}

          {/* Audit Log */}
          {auditLog.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)] flex items-center gap-2">
                  <Clock size={14} className="text-[#555555]" /> Audit Trail
                </h2>
              </CardHeader>
              <CardBody className="space-y-0">
                {auditLog.map((entry, i) => (
                  <div key={entry.id} className="flex gap-3 py-2.5 border-b border-[#1E1E1E] last:border-0">
                    <div className="flex flex-col items-center pt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2A2A2A] mt-1" />
                      {i < auditLog.length - 1 && (
                        <div className="w-px flex-1 bg-[#1E1E1E] mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#A1A1A1] text-xs">
                        <span className="text-white font-medium">{capitalize(entry.action)}</span>
                        {entry.previous_status && entry.new_status && (
                          <span className="text-[#555555]"> — {entry.previous_status} → {entry.new_status}</span>
                        )}
                      </p>
                      <p className="text-[#555555] text-[11px] mt-0.5">{formatDate(entry.created_at)} · {capitalize(entry.actor_role)}</p>
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Tenant */}
          <Card>
            <CardHeader>
              <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)] flex items-center gap-2">
                <User size={14} className="text-[#555555]" /> Tenant
              </h2>
            </CardHeader>
            <CardBody className="space-y-2.5">
              <div>
                <p className="text-[#555555] text-xs mb-0.5">Name</p>
                <p className="text-white text-sm">{ticket.tenants?.full_name ?? 'Unknown'}</p>
              </div>
              <div>
                <p className="text-[#555555] text-xs mb-0.5">WhatsApp</p>
                <p className="text-[#A1A1A1] text-sm font-mono">{ticket.tenants?.wa_number ?? '—'}</p>
              </div>
              <div>
                <p className="text-[#555555] text-xs mb-0.5">Unit</p>
                <p className="text-white text-sm font-medium">{ticket.units?.unit_label ?? '—'}</p>
                <p className="text-[#555555] text-xs">{ticket.units?.properties?.name ?? ''}</p>
              </div>
            </CardBody>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)] flex items-center gap-2">
                <Wrench size={14} className="text-[#555555]" /> Assignment
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <p className="text-[#555555] text-xs mb-0.5">Team</p>
                  <p className="text-white text-sm">{ticket.teams?.name ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[#555555] text-xs mb-0.5">Notifications</p>
                  <p className="text-[#A1A1A1] text-sm">{ticket.notifications_sent}</p>
                </div>
              </div>
              {ticket.status !== 'closed' && ticket.status !== 'cancelled' && (
                <AssignTechnicianForm
                  ticketId={ticket.id}
                  currentTechId={ticket.assigned_tech_id}
                  technicians={allTechnicians}
                />
              )}
              {ticket.status === 'in_progress' && (
                <CloseTicketButton ticketId={ticket.id} />
              )}
              {(ticket.status === 'closed' || ticket.status === 'cancelled') && (
                <div>
                  <p className="text-[#555555] text-xs mb-0.5">Technician</p>
                  <p className="text-white text-sm">{ticket.technicians?.full_name ?? '—'}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Approval (if exists) */}
          {approval && (
            <Card>
              <CardHeader>
                <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)]">
                  Approval Required
                </h2>
              </CardHeader>
              <CardBody className="space-y-3">
                <div>
                  <p className="text-[#555555] text-xs mb-0.5">Status</p>
                  <Badge variant="status" value={approval.status === 'pending' ? 'awaiting_approval' : approval.status} />
                </div>
                <div>
                  <p className="text-[#555555] text-xs mb-0.5">Amount</p>
                  <p className="text-yellow-400 font-semibold">{formatCurrency(approval.threshold_aed)}</p>
                </div>
                {approval.status === 'pending' && (
                  <ApprovalActions approvalId={approval.id} ticketId={ticket.id} />
                )}
                {approval.decided_at && (
                  <div>
                    <p className="text-[#555555] text-xs mb-0.5">Decided</p>
                    <p className="text-[#A1A1A1] text-xs">{formatDate(approval.decided_at)}</p>
                    {approval.comment && <p className="text-[#A1A1A1] text-xs mt-1 italic">&ldquo;{approval.comment}&rdquo;</p>}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Issue photo */}
          {ticket.issue_photo_url && (
            <Card>
              <CardHeader>
                <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)] flex items-center gap-2">
                  <Camera size={14} className="text-[#555555]" /> Issue Photo
                </h2>
              </CardHeader>
              <CardBody className="p-2">
                <a href={ticket.issue_photo_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={ticket.issue_photo_url}
                    alt="Issue"
                    className="w-full rounded-xl object-cover max-h-48 hover:opacity-90 transition-opacity"
                  />
                </a>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
