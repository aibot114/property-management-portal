'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { value: '',                  label: 'All' },
  { value: 'new',               label: 'New' },
  { value: 'in_progress',       label: 'In Progress' },
  { value: 'awaiting_approval', label: 'Needs Approval' },
  { value: 'urgent',            label: 'Urgent' },
  { value: 'closed',            label: 'Closed' },
]

export function StatusTabs() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get('status') ?? ''

  function setStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {TABS.map(tab => (
        <button
          key={tab.value}
          onClick={() => setStatus(tab.value)}
          className={cn(
            'px-3 py-1.5 rounded-xl text-xs font-medium transition-colors',
            current === tab.value
              ? 'bg-[#BFF549] text-[#0D0D0D]'
              : 'bg-[#1E1E1E] text-[#A1A1A1] hover:bg-[#272727] hover:text-white border border-[#272727]'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
