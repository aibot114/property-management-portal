'use client'

import { Bell, Search, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TITLES: Record<string, string> = {
  '/':              'Dashboard',
  '/tickets':       'Tickets',
  '/approvals':     'Approvals',
  '/notifications': 'Notifications',
  '/history':       'History',
  '/suppliers':     'Suppliers',
}

const MOBILE_NAV = [
  { href: '/',              label: 'Home' },
  { href: '/tickets',       label: 'Tickets' },
  { href: '/approvals',     label: 'Approvals' },
  { href: '/notifications', label: 'Alerts' },
  { href: '/history',       label: 'History' },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const title = TITLES[pathname] ?? TITLES[Object.keys(TITLES).find(k => k !== '/' && pathname.startsWith(k)) ?? '/'] ?? 'Portal'

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-[#0D0D0D]/80 backdrop-blur-md border-b border-[#272727] flex items-center px-4 lg:px-6 gap-4">
        {/* Mobile menu button */}
        <button
          className="lg:hidden flex items-center justify-center w-8 h-8 rounded-xl text-[#A1A1A1] hover:bg-[#161616] transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Title */}
        <h1 className="text-white font-semibold font-[family-name:var(--font-heading)] text-base flex-1">
          {title}
        </h1>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/notifications"
            className="relative flex items-center justify-center w-8 h-8 rounded-xl text-[#A1A1A1] hover:bg-[#161616] hover:text-white transition-colors"
          >
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#BFF549] rounded-full" />
          </Link>
          <div className="w-8 h-8 rounded-xl bg-[#BFF549] flex items-center justify-center">
            <span className="text-[#0D0D0D] font-bold text-xs">PM</span>
          </div>
        </div>
      </header>

      {/* Mobile slide-over menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <nav
            className="absolute left-0 top-0 bottom-0 w-64 bg-[#0D0D0D] border-r border-[#272727] pt-20 px-3"
            onClick={e => e.stopPropagation()}
          >
            {MOBILE_NAV.map(({ href, label }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl text-sm mb-1 transition-colors',
                    active
                      ? 'bg-[#BFF549]/10 text-[#BFF549] font-medium'
                      : 'text-[#A1A1A1] hover:bg-[#161616] hover:text-white'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </>
  )
}
