export type TicketStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'awaiting_parts'
  | 'awaiting_approval'
  | 'closed'
  | 'cancelled'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface Ticket {
  id: string
  company_id: string
  reference_number: string
  status: TicketStatus
  is_urgent: boolean
  is_duplicate_flag: boolean
  tenant_id: string
  unit_id: string
  category: string
  description: string
  issue_photo_url: string | null
  location_type: 'whatsapp_pin' | 'typed_address' | null
  location_value: string | null
  preferred_time: 'morning' | 'afternoon' | 'evening' | null
  assigned_team_id: string | null
  assigned_tech_id: string | null
  notifications_sent: number
  outside_hours_flag: boolean
  created_at: string
  updated_at: string
  closed_at: string | null
  // Joined fields
  units?: { unit_label: string; properties?: { name: string } | null } | null
  tenants?: { full_name: string | null; wa_number: string } | null
  technicians?: { full_name: string } | null
  teams?: { name: string } | null
}

export interface Visit {
  id: string
  company_id: string
  ticket_id: string
  technician_id: string | null
  visit_number: 1 | 2
  scheduled_at: string | null
  arrived_at: string | null
  arrival_proof_type: 'gps_pin' | 'door_photo' | null
  arrival_proof_value: string | null
  arrival_flagged_manual: boolean
  before_photo_url: string | null
  can_fix_now: boolean | null
  after_photo_url: string | null
  fix_notes: string | null
  cost_aed: number | null
  cost_finalized: boolean
  parts_description: string | null
  parts_est_cost_aed: number | null
  created_at: string
  updated_at: string
  technicians?: { full_name: string } | null
}

export interface Approval {
  id: string
  company_id: string
  ticket_id: string
  visit_id: string | null
  required: boolean
  threshold_aed: number
  status: ApprovalStatus
  decided_by_role: 'boss' | 'secretary' | null
  decided_at: string | null
  secretary_override: boolean
  override_reason: string | null
  comment: string | null
  created_at: string
  tickets?: Ticket | null
}

export interface NotificationLog {
  id: string
  company_id: string
  ticket_id: string | null
  recipient_wa: string
  recipient_role: 'tenant' | 'technician' | 'boss' | 'secretary' | 'system'
  message_type: string
  language: string | null
  body_preview: string | null
  wa_message_id: string | null
  delivery_status: 'sent' | 'delivered' | 'read' | 'failed'
  sent_at: string
  tickets?: { reference_number: string } | null
}

export interface AuditEntry {
  id: string
  ticket_id: string | null
  actor_id: string | null
  actor_role: 'system' | 'secretary' | 'boss' | 'technician'
  action: string
  previous_status: string | null
  new_status: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface Photo {
  id: string
  ticket_id: string
  visit_id: string | null
  photo_type: 'issue' | 'before' | 'after' | 'arrival_proof'
  storage_url: string
  created_at: string
}

export interface Supplier {
  id: string
  company_id: string
  name: string
  wa_number: string | null
  email: string | null
  categories: string[]
  is_active: boolean
  notes: string | null
  created_at: string
}

export interface Technician {
  id: string
  team_id: string
  full_name: string
  wa_number: string
  employee_id: string | null
  is_active: boolean
}
