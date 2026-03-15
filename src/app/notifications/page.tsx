export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'
import { formatDate, capitalize } from '@/lib/utils'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const DELIVERY_COLORS: Record<string, string> = {
  sent:      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  delivered: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  read:      'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/20',
  failed:    'bg-red-500/10 text-red-400 border-red-500/20',
}

const ROLE_ICONS: Record<string, string> = {
  tenant:     '🏠',
  technician: '🔧',
  boss:       '👤',
  secretary:  '📋',
  system:     '⚙️',
}

export default async function NotificationsPage() {
  const supabase = createServerClient()

  const { data } = await supabase
    .from('notification_log')
    .select('*, tickets(reference_number)')
    .eq('company_id', COMPANY_ID)
    .order('sent_at', { ascending: false })
    .limit(100)

  const notifications = data ?? []

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-white font-bold font-[family-name:var(--font-heading)] text-xl">
          Notification Centre
        </h1>
        <p className="text-[#555555] text-sm mt-1">
          All WhatsApp messages sent by the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)]">
              Recent Messages
            </h2>
            <span className="text-[#555555] text-xs">{notifications.length} total</span>
          </div>
        </CardHeader>

        {notifications.length === 0 ? (
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-[#555555]">
              <p className="text-sm">No notifications yet</p>
            </div>
          </CardBody>
        ) : (
          <div className="divide-y divide-[#272727]">
            {notifications.map((n: any) => (
              <div key={n.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-[#1E1E1E]/50 transition-colors">
                {/* Icon */}
                <span className="text-base mt-0.5 shrink-0">
                  {ROLE_ICONS[n.recipient_role] ?? '📩'}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-white text-xs font-medium">{capitalize(n.message_type.replace(/_/g, ' '))}</span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                        DELIVERY_COLORS[n.delivery_status]
                      )}
                    >
                      {n.delivery_status}
                    </span>
                    {n.tickets?.reference_number && (
                      <Link
                        href={`/tickets/${n.ticket_id}`}
                        className="font-mono text-[#BFF549] text-[10px] hover:underline"
                      >
                        {n.tickets.reference_number}
                      </Link>
                    )}
                  </div>

                  <p className="text-[#A1A1A1] text-xs truncate">{n.body_preview ?? '—'}</p>

                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[#555555] text-[10px]">
                      To: <span className="font-mono">{n.recipient_wa}</span>
                    </span>
                    <span className="text-[#555555] text-[10px]">
                      {capitalize(n.recipient_role)} · {n.language?.toUpperCase() ?? 'EN'}
                    </span>
                    <span className="text-[#555555] text-[10px] ml-auto">{formatDate(n.sent_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
