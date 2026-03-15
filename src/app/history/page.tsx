export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'
import { formatDate, timeAgo } from '@/lib/utils'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { Ticket } from '@/lib/types'

interface HistoryProps {
  searchParams: Promise<{
    q?: string
    category?: string
    status?: string
    from?: string
    to?: string
  }>
}

export default async function HistoryPage({ searchParams }: HistoryProps) {
  const { q, category, status, from, to } = await searchParams
  const supabase = createServerClient()

  let query = supabase
    .from('tickets')
    .select(`
      id, reference_number, status, is_urgent, category, description, created_at, closed_at,
      units(unit_label, properties(name)),
      technicians(full_name)
    `)
    .eq('company_id', COMPANY_ID)
    .order('created_at', { ascending: false })
    .limit(200)

  if (q) {
    query = query.ilike('reference_number', `%${q}%`)
  }
  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to + 'T23:59:59')

  const { data } = await query
  const tickets = (data ?? []) as unknown as Ticket[]

  // Analytics
  const categoryCount = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + 1
    return acc
  }, {})

  const statusCount = tickets.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1
    return acc
  }, {})

  const CATEGORIES = ['aircon', 'general', 'plumbing', 'electrical', 'other']
  const maxCat = Math.max(...Object.values(categoryCount), 1)

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-white font-bold font-[family-name:var(--font-heading)] text-xl">
          History & Analytics
        </h1>
        <p className="text-[#555555] text-sm mt-1">Search and analyse all past tickets</p>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardBody>
          <form method="GET" className="flex flex-wrap gap-3">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search ref # (e.g. MRN-2026)"
              className="flex-1 min-w-[160px] bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2 text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-[#BFF549]/50"
            />
            <select
              name="category"
              defaultValue={category ?? ''}
              className="bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFF549]/50"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status ?? ''}
              className="bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFF549]/50"
            >
              <option value="">All Statuses</option>
              {['new', 'assigned', 'in_progress', 'awaiting_approval', 'closed', 'cancelled'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
            <input
              name="from"
              type="date"
              defaultValue={from}
              className="bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFF549]/50"
            />
            <input
              name="to"
              type="date"
              defaultValue={to}
              className="bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFF549]/50"
            />
            <button
              type="submit"
              className="bg-[#BFF549] text-[#0D0D0D] rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[#AADB3A] transition-colors"
            >
              Search
            </button>
            {(q || category || status || from || to) && (
              <Link
                href="/history"
                className="flex items-center bg-[#1E1E1E] border border-[#272727] text-[#A1A1A1] rounded-xl px-4 py-2 text-sm hover:text-white transition-colors"
              >
                Clear
              </Link>
            )}
          </form>
        </CardBody>
      </Card>

      {/* Analytics row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)]">Tickets by Category</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {CATEGORIES.map(cat => (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-[#A1A1A1] text-xs w-20 capitalize">{cat}</span>
                <div className="flex-1 h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#BFF549] rounded-full transition-all"
                    style={{ width: `${((categoryCount[cat] ?? 0) / maxCat) * 100}%` }}
                  />
                </div>
                <span className="text-[#555555] text-xs w-6 text-right">{categoryCount[cat] ?? 0}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader>
            <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)]">Tickets by Status</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(statusCount).map(([s, count]) => (
                <div key={s} className="bg-[#1E1E1E] rounded-xl p-3 border border-[#272727]">
                  <p className="text-[#555555] text-xs mb-1">{s.replace(/_/g, ' ')}</p>
                  <p className="text-white font-bold text-xl font-[family-name:var(--font-heading)]">{count}</p>
                </div>
              ))}
              {Object.keys(statusCount).length === 0 && (
                <p className="text-[#555555] text-sm col-span-2 text-center py-4">No data</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Results table */}
      <Card>
        <CardHeader>
          <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)]">
            Results <span className="text-[#555555] font-normal">({tickets.length})</span>
          </h2>
        </CardHeader>
        {tickets.length === 0 ? (
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-[#555555]">
              <p className="text-sm">No tickets match your filters</p>
            </div>
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#272727]">
                  {['Ref #', 'Unit', 'Category', 'Status', 'Tech', 'Created', 'Closed', ''].map(h => (
                    <th key={h} className="text-left text-xs text-[#555555] font-medium px-4 py-3 first:pl-5 last:pr-5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#272727]">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-[#1E1E1E]/50 transition-colors group">
                    <td className="px-4 py-3 pl-5 whitespace-nowrap">
                      <span className="font-mono text-[#BFF549] text-xs">{ticket.reference_number}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-white text-xs">{ticket.units?.unit_label ?? '—'}</p>
                      <p className="text-[#555555] text-xs">{ticket.units?.properties?.name ?? ''}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="category" value={ticket.category} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="status" value={ticket.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-[#A1A1A1] text-xs">{ticket.technicians?.full_name ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-[#555555] text-xs">{timeAgo(ticket.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-[#555555] text-xs">
                        {ticket.closed_at ? timeAgo(ticket.closed_at) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 pr-5 whitespace-nowrap">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[#BFF549] text-xs hover:underline transition-opacity"
                      >
                        View <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
