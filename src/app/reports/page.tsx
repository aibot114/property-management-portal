export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'
import {
  TicketVolumeChart,
  CostTrendChart,
  ApprovalByRoleChart,
  type MonthlyTicket,
  type MonthlyCost,
  type ApprovalByRole,
} from '@/components/reports/ReportCharts'
import { Ticket, DollarSign, CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'

// ─── helpers ────────────────────────────────────────────────────────────────

function fmtMonth(m: string) {
  const [year, mon] = m.split('-')
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${names[parseInt(mon) - 1]} '${year.slice(2)}`
}

const CATEGORIES = ['aircon', 'general', 'plumbing', 'electrical', 'other'] as const

// ─── page ────────────────────────────────────────────────────────────────────

interface ReportsProps {
  searchParams: Promise<{
    from?: string
    to?: string
    category?: string
    tech_id?: string
    property_id?: string
  }>
}

export default async function ReportsPage({ searchParams }: ReportsProps) {
  const { from, to, category, tech_id, property_id } = await searchParams
  const supabase = createServerClient()

  // Date range defaults: last 6 months
  const defaultTo   = new Date()
  const defaultFrom = new Date()
  defaultFrom.setMonth(defaultFrom.getMonth() - 5)
  defaultFrom.setDate(1)

  const dateFrom = from ?? defaultFrom.toISOString().split('T')[0]
  const dateTo   = to   ?? defaultTo.toISOString().split('T')[0]

  // ── parallel fetches ────────────────────────────────────────────────────
  const [ticketsRes, visitsRes, approvalsRes, techsRes, propertiesRes] = await Promise.all([
    (() => {
      let q = supabase
        .from('tickets')
        .select('id, category, status, is_urgent, created_at, closed_at, assigned_tech_id, unit_id, units(property_id)')
        .eq('company_id', COMPANY_ID)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')
      if (category)    q = q.eq('category', category)
      if (tech_id)     q = q.eq('assigned_tech_id', tech_id)
      if (property_id) q = (q as any).eq('units.property_id', property_id)
      return q
    })(),
    supabase
      .from('visits')
      .select('cost_aed, created_at, technician_id')
      .eq('company_id', COMPANY_ID)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo + 'T23:59:59'),
    supabase
      .from('approvals')
      .select('status, decided_by_role, threshold_aed, decided_at')
      .eq('company_id', COMPANY_ID)
      .gte('created_at', dateFrom)
      .lte('created_at', dateTo + 'T23:59:59'),
    supabase
      .from('technicians')
      .select('id, full_name')
      .eq('company_id', COMPANY_ID)
      .eq('is_active', true)
      .order('full_name'),
    supabase
      .from('properties')
      .select('id, name')
      .eq('company_id', COMPANY_ID)
      .order('name'),
  ])

  const tickets    = (ticketsRes.data    ?? []) as any[]
  const visits     = (visitsRes.data     ?? []) as any[]
  const approvals  = (approvalsRes.data  ?? []) as any[]
  const techs      = (techsRes.data      ?? []) as any[]
  const properties = (propertiesRes.data ?? []) as any[]

  // ── KPIs ────────────────────────────────────────────────────────────────
  const totalTickets   = tickets.length
  const totalCostAED   = visits.reduce((s: number, v: any) => s + (v.cost_aed ?? 0), 0)
  const closedTickets  = tickets.filter((t: any) => t.status === 'closed')
  const urgentTickets  = tickets.filter((t: any) => t.is_urgent).length

  const approvedCount   = approvals.filter((a: any) => a.status === 'approved').length
  const totalApprovals  = approvals.filter((a: any) => a.status !== 'pending').length
  const approvalRate    = totalApprovals > 0 ? Math.round((approvedCount / totalApprovals) * 100) : 0

  const resolutionDays = closedTickets
    .filter((t: any) => t.closed_at)
    .map((t: any) => (new Date(t.closed_at).getTime() - new Date(t.created_at).getTime()) / 86400000)
  const avgResolutionDays = resolutionDays.length > 0
    ? (resolutionDays.reduce((s: number, d: number) => s + d, 0) / resolutionDays.length).toFixed(1)
    : '—'

  // ── Monthly ticket volume (stacked by category) ──────────────────────
  const ticketMonthMap: Record<string, Record<string, number>> = {}
  for (const t of tickets) {
    const m   = (t.created_at as string).slice(0, 7)
    const cat = CATEGORIES.includes(t.category) ? t.category : 'other'
    if (!ticketMonthMap[m]) ticketMonthMap[m] = { aircon: 0, general: 0, plumbing: 0, electrical: 0, other: 0 }
    ticketMonthMap[m][cat] = (ticketMonthMap[m][cat] ?? 0) + 1
  }
  const monthlyTickets: MonthlyTicket[] = Object.entries(ticketMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, cats]) => ({
      month: fmtMonth(month),
      aircon:     cats.aircon     ?? 0,
      general:    cats.general    ?? 0,
      plumbing:   cats.plumbing   ?? 0,
      electrical: cats.electrical ?? 0,
      other:      cats.other      ?? 0,
      total:      Object.values(cats).reduce((s, v) => s + v, 0),
    }))

  // ── Monthly cost trend ───────────────────────────────────────────────
  const costMonthMap: Record<string, number> = {}
  for (const v of visits) {
    if (!v.cost_aed) continue
    const m = (v.created_at as string).slice(0, 7)
    costMonthMap[m] = (costMonthMap[m] ?? 0) + (v.cost_aed as number)
  }
  const monthlyCost: MonthlyCost[] = Object.entries(costMonthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, cost]) => ({ month: fmtMonth(month), cost: Math.round(cost) }))

  // ── Approvals by role ────────────────────────────────────────────────
  const roleMap: Record<string, { count: number; totalAED: number }> = {}
  for (const a of approvals) {
    if (!a.decided_by_role) continue
    const role = a.decided_by_role === 'boss' ? 'Boss' : 'Secretary'
    if (!roleMap[role]) roleMap[role] = { count: 0, totalAED: 0 }
    roleMap[role].count++
    roleMap[role].totalAED += a.threshold_aed ?? 0
  }
  const approvalByRole: ApprovalByRole[] = Object.entries(roleMap).map(([role, d]) => ({
    role,
    count:    d.count,
    totalAED: Math.round(d.totalAED),
  }))

  // ── Technician performance ───────────────────────────────────────────
  const techStats: Record<string, { name: string; assigned: number; closed: number; totalCost: number }> = {}
  for (const t of tickets) {
    const tid = t.assigned_tech_id
    if (!tid) continue
    const tech = techs.find((tt: any) => tt.id === tid)
    if (!tech) continue
    if (!techStats[tid]) techStats[tid] = { name: tech.full_name, assigned: 0, closed: 0, totalCost: 0 }
    techStats[tid].assigned++
    if (t.status === 'closed') techStats[tid].closed++
  }
  for (const v of visits) {
    const tid = v.technician_id
    if (!tid || !techStats[tid] || !v.cost_aed) continue
    techStats[tid].totalCost += v.cost_aed
  }
  const techPerformance = Object.values(techStats).sort((a, b) => b.assigned - a.assigned)

  // ── Category breakdown ───────────────────────────────────────────────
  const catCount: Record<string, number> = {}
  for (const t of tickets) {
    const cat = CATEGORIES.includes(t.category) ? t.category : 'other'
    catCount[cat] = (catCount[cat] ?? 0) + 1
  }
  const maxCat = Math.max(...Object.values(catCount), 1)

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-white font-bold font-[family-name:var(--font-heading)] text-xl">Reports</h1>
        <p className="text-[#555555] text-sm mt-1">Operations overview for management</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <form method="GET" className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[#555555] text-xs">From</label>
              <input
                name="from"
                type="date"
                defaultValue={dateFrom}
                className="bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFF549]/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[#555555] text-xs">To</label>
              <input
                name="to"
                type="date"
                defaultValue={dateTo}
                className="bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFF549]/50"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[#555555] text-xs">Category</label>
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
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[#555555] text-xs">Building</label>
              <select
                name="property_id"
                defaultValue={property_id ?? ''}
                className="bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFF549]/50"
              >
                <option value="">All Buildings</option>
                {properties.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[#555555] text-xs">Technician</label>
              <select
                name="tech_id"
                defaultValue={tech_id ?? ''}
                className="bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#BFF549]/50"
              >
                <option value="">All Technicians</option>
                {techs.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-[#BFF549] text-[#0D0D0D] rounded-xl px-4 py-2 text-sm font-semibold hover:bg-[#AADB3A] transition-colors"
            >
              Apply
            </button>
            {(from || to || category || tech_id || property_id) && (
              <Link
                href="/reports"
                className="flex items-center bg-[#1E1E1E] border border-[#272727] text-[#A1A1A1] rounded-xl px-4 py-2 text-sm hover:text-white transition-colors"
              >
                Reset
              </Link>
            )}
          </form>
        </CardBody>
      </Card>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Total Tickets"
          value={totalTickets}
          icon={<Ticket size={16} />}
        />
        <StatCard
          label="Maintenance Cost"
          value={`AED ${Math.round(totalCostAED).toLocaleString()}`}
          icon={<DollarSign size={16} />}
        />
        <StatCard
          label="Approval Rate"
          value={`${approvalRate}%`}
          icon={<CheckCircle2 size={16} />}
        />
        <StatCard
          label="Avg Resolution"
          value={avgResolutionDays === '—' ? '—' : `${avgResolutionDays}d`}
          icon={<Clock size={16} />}
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Card>
          <CardHeader>
            <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)]">
              Ticket Volume by Category
            </h2>
            <p className="text-[#555555] text-xs mt-0.5">Monthly trend, stacked by type</p>
          </CardHeader>
          <CardBody className="pt-0">
            <TicketVolumeChart data={monthlyTickets} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)]">
              Maintenance Cost Trend
            </h2>
            <p className="text-[#555555] text-xs mt-0.5">Monthly spend in AED</p>
          </CardHeader>
          <CardBody className="pt-0">
            <CostTrendChart data={monthlyCost} />
          </CardBody>
        </Card>
      </div>

      {/* Category breakdown + Approvals */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)]">
              Tickets by Category
            </h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {CATEGORIES.map(cat => {
              const count = catCount[cat] ?? 0
              const pct = totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-[#A1A1A1] text-xs w-20 capitalize">{cat}</span>
                  <div className="flex-1 h-2 bg-[#1E1E1E] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#BFF549] rounded-full transition-all"
                      style={{ width: `${(count / maxCat) * 100}%` }}
                    />
                  </div>
                  <span className="text-[#555555] text-xs w-16 text-right">{count} ({pct}%)</span>
                </div>
              )
            })}
          </CardBody>
        </Card>

        {/* Approval breakdown */}
        <Card>
          <CardHeader>
            <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)]">
              Approvals Overview
            </h2>
          </CardHeader>
          <CardBody>
            {/* Summary badges */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Pending',  count: approvals.filter((a: any) => a.status === 'pending').length,  color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
                { label: 'Approved', count: approvedCount,                                                 color: 'text-green-400 bg-green-400/10 border-green-400/20' },
                { label: 'Rejected', count: approvals.filter((a: any) => a.status === 'rejected').length, color: 'text-red-400 bg-red-400/10 border-red-400/20' },
              ].map(({ label, count, color }) => (
                <div key={label} className={`rounded-xl p-3 border text-center ${color}`}>
                  <p className="font-bold text-xl font-[family-name:var(--font-heading)]">{count}</p>
                  <p className="text-xs opacity-70 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <ApprovalByRoleChart data={approvalByRole} />
            {approvalByRole.length > 0 && (
              <div className="mt-3 divide-y divide-[#1E1E1E]">
                {approvalByRole.map(r => (
                  <div key={r.role} className="flex items-center justify-between py-2 text-xs">
                    <span className="text-[#A1A1A1]">{r.role}</span>
                    <span className="text-white font-medium">{r.count} decisions · AED {r.totalAED.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Technician performance */}
      <Card>
        <CardHeader>
          <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)]">
            Technician Performance
          </h2>
          <p className="text-[#555555] text-xs mt-0.5">
            Assigned tickets, completion rate, and cost incurred
          </p>
        </CardHeader>
        {techPerformance.length === 0 ? (
          <CardBody>
            <p className="text-[#555555] text-sm text-center py-8">No technician data for this period</p>
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#272727]">
                  {['Technician', 'Assigned', 'Completed', 'Completion Rate', 'Total Cost (AED)'].map(h => (
                    <th key={h} className="text-left text-xs text-[#555555] font-medium px-4 py-3 first:pl-5 last:pr-5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#272727]">
                {techPerformance.map((t, i) => {
                  const rate = t.assigned > 0 ? Math.round((t.closed / t.assigned) * 100) : 0
                  return (
                    <tr key={i} className="hover:bg-[#1E1E1E]/50 transition-colors">
                      <td className="px-4 py-3 pl-5 whitespace-nowrap">
                        <p className="text-white text-xs font-medium">{t.name}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-[#A1A1A1] text-xs">{t.assigned}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-[#A1A1A1] text-xs">{t.closed}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#1E1E1E] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${rate}%`,
                                backgroundColor: rate >= 80 ? '#BFF549' : rate >= 50 ? '#F59E0B' : '#EF4444',
                              }}
                            />
                          </div>
                          <span className="text-xs text-[#A1A1A1]">{rate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 pr-5 whitespace-nowrap">
                        <p className="text-[#A1A1A1] text-xs font-mono">
                          {t.totalCost > 0 ? t.totalCost.toLocaleString() : '—'}
                        </p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Urgent tickets summary */}
      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        <div className="bg-[#161616] border border-[#272727] rounded-2xl p-4">
          <p className="text-[#555555] text-xs mb-1">Urgent Tickets</p>
          <p className="text-white font-bold text-2xl font-[family-name:var(--font-heading)]">{urgentTickets}</p>
          <p className="text-[#555555] text-xs mt-1">
            {totalTickets > 0 ? Math.round((urgentTickets / totalTickets) * 100) : 0}% of total tickets flagged urgent
          </p>
        </div>
        <div className="bg-[#161616] border border-[#272727] rounded-2xl p-4">
          <p className="text-[#555555] text-xs mb-1">Cost per Ticket</p>
          <p className="text-white font-bold text-2xl font-[family-name:var(--font-heading)]">
            {totalTickets > 0 && totalCostAED > 0
              ? `AED ${Math.round(totalCostAED / totalTickets).toLocaleString()}`
              : '—'}
          </p>
          <p className="text-[#555555] text-xs mt-1">Average maintenance cost per request</p>
        </div>
        <div className="bg-[#161616] border border-[#272727] rounded-2xl p-4">
          <p className="text-[#555555] text-xs mb-1">Closure Rate</p>
          <p className="text-white font-bold text-2xl font-[family-name:var(--font-heading)]">
            {totalTickets > 0 ? `${Math.round((closedTickets.length / totalTickets) * 100)}%` : '—'}
          </p>
          <p className="text-[#555555] text-xs mt-1">
            {closedTickets.length} of {totalTickets} tickets closed
          </p>
        </div>
      </div>
    </AppLayout>
  )
}
