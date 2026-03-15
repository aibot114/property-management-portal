import { cn, capitalize } from '@/lib/utils'
import type { TicketStatus } from '@/lib/types'

const STATUS_STYLES: Record<TicketStatus, string> = {
  new:               'bg-blue-500/10 text-blue-400 border-blue-500/20',
  assigned:          'bg-violet-500/10 text-violet-400 border-violet-500/20',
  in_progress:       'bg-amber-500/10 text-amber-400 border-amber-500/20',
  awaiting_parts:    'bg-orange-500/10 text-orange-400 border-orange-500/20',
  awaiting_approval: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  closed:            'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/20',
  cancelled:         'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

const CATEGORY_STYLES: Record<string, string> = {
  aircon:      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  plumbing:    'bg-sky-500/10 text-sky-400 border-sky-500/20',
  electrical:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  general:     'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
  other:       'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
}

interface BadgeProps {
  variant: 'status' | 'category' | 'urgent' | 'default'
  value: string
  className?: string
}

export function Badge({ variant, value, className }: BadgeProps) {
  let style = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'

  if (variant === 'status') {
    style = STATUS_STYLES[value as TicketStatus] ?? style
  } else if (variant === 'category') {
    style = CATEGORY_STYLES[value.toLowerCase()] ?? style
  } else if (variant === 'urgent') {
    style = 'bg-red-500/10 text-red-400 border-red-500/20'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        style,
        className
      )}
    >
      {capitalize(value)}
    </span>
  )
}

export function UrgentDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
    </span>
  )
}
