'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Ticket,
  CheckCircle,
  Bell,
  Clock,
  Store,
  Settings,
  ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',              label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/tickets',       label: 'Tickets',       icon: Ticket },
  { href: '/approvals',     label: 'Approvals',     icon: CheckCircle },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/history',       label: 'History',       icon: Clock },
  { href: '/suppliers',     label: 'Suppliers',     icon: Store, inactive: true },
]

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-[248px] h-screen sticky top-0 bg-[#0D0D0D] border-r border-[#272727] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[#272727]">
        <div className="w-7 h-7 rounded-lg bg-[#BFF549] flex items-center justify-center">
          <span className="text-[#0D0D0D] font-bold text-xs font-[family-name:var(--font-heading)]">PM</span>
        </div>
        <div>
          <p className="text-white text-sm font-semibold font-[family-name:var(--font-heading)] leading-none">MRN Group</p>
          <p className="text-[#555555] text-xs mt-0.5">Management Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, inactive }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={inactive ? '#' : href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-100 group',
                active
                  ? 'bg-[#BFF549]/10 text-[#BFF549] font-medium'
                  : inactive
                    ? 'text-[#3A3A3A] cursor-not-allowed'
                    : 'text-[#A1A1A1] hover:bg-[#161616] hover:text-white'
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {inactive && (
                <span className="text-[10px] bg-[#1E1E1E] text-[#555555] px-1.5 py-0.5 rounded-full border border-[#272727]">
                  Soon
                </span>
              )}
              {active && <ChevronRight size={12} className="opacity-50" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-3 border-t border-[#272727] pt-2">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-100',
                active
                  ? 'bg-[#BFF549]/10 text-[#BFF549] font-medium'
                  : 'text-[#A1A1A1] hover:bg-[#161616] hover:text-white'
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
        <p className="text-[#3A3A3A] text-xs px-3 mt-2">PropertyManager v2.0</p>
      </div>
    </aside>
  )
}
