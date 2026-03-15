import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  trend?: { value: string; up?: boolean }
  accent?: boolean
  className?: string
}

export function StatCard({ label, value, icon, trend, accent, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 flex flex-col gap-3',
        accent
          ? 'bg-[#BFF549]/5 border-[#BFF549]/20'
          : 'bg-[#161616] border-[#272727]',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[#A1A1A1] text-sm font-medium">{label}</span>
        <span
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-xl',
            accent ? 'bg-[#BFF549]/10 text-[#BFF549]' : 'bg-[#1E1E1E] text-[#A1A1A1]'
          )}
        >
          {icon}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span
          className={cn(
            'text-3xl font-bold font-[family-name:var(--font-heading)]',
            accent ? 'text-[#BFF549]' : 'text-white'
          )}
        >
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs mb-1',
              trend.up ? 'text-red-400' : 'text-[#A1A1A1]'
            )}
          >
            {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
