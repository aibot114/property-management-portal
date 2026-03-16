'use client'

import {
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

export interface MonthlyTicket {
  month: string
  aircon: number
  general: number
  plumbing: number
  electrical: number
  other: number
  total: number
}

export interface MonthlyCost {
  month: string
  cost: number
}

export interface ApprovalByRole {
  role: string
  count: number
  totalAED: number
}

interface ReportChartsProps {
  monthlyTickets: MonthlyTicket[]
  monthlyCost: MonthlyCost[]
  approvalByRole: ApprovalByRole[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#161616',
  border: '1px solid #272727',
  borderRadius: 12,
  fontSize: 12,
  color: '#A1A1A1',
}

const AXIS_TICK = { fontSize: 11, fill: '#555555' }
const GRID = { stroke: '#1E1E1E', strokeDasharray: '4 4' }

const CAT_COLORS: Record<string, string> = {
  aircon:     '#BFF549',
  general:    '#60A5FA',
  plumbing:   '#34D399',
  electrical: '#F59E0B',
  other:      '#6B7280',
}

export function TicketVolumeChart({ data }: { data: MonthlyTicket[] }) {
  if (!data.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#A1A1A1' }} />
        {Object.keys(CAT_COLORS).map(cat => (
          <Area
            key={cat}
            type="monotone"
            dataKey={cat}
            stackId="1"
            stroke={CAT_COLORS[cat]}
            fill={CAT_COLORS[cat]}
            fillOpacity={0.25}
            strokeWidth={1.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function CostTrendChart({ data }: { data: MonthlyCost[] }) {
  if (!data.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="month" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: unknown) => [`AED ${Number(v).toLocaleString()}`, "Cost"]}
        />
        <Area
          type="monotone"
          dataKey="cost"
          stroke="#BFF549"
          fill="#BFF549"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function ApprovalByRoleChart({ data }: { data: ApprovalByRole[] }) {
  if (!data.length) return <EmptyChart />
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="role" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}



        />
        <Bar dataKey="count" fill="#BFF549" fillOpacity={0.8} radius={[6, 6, 0, 0]} name="Approvals" />
      </BarChart>
    </ResponsiveContainer>
  )
}

function EmptyChart() {
  return (
    <div className="h-[240px] flex items-center justify-center text-[#3A3A3A] text-sm">
      No data for this period
    </div>
  )
}
