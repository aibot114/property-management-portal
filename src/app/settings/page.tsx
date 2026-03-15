import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardBody } from '@/components/ui/Card'
import Link from 'next/link'
import { Users, Building2, Wrench, ChevronRight, Settings } from 'lucide-react'

const SETTINGS_SECTIONS = [
  {
    href:        '/settings/technicians',
    icon:        Users,
    title:       'Technicians',
    description: 'Add, edit, and manage your maintenance staff. Assign them to teams and set their WhatsApp contact numbers.',
    badge:       'Manage staff',
  },
  {
    href:        '/settings/properties',
    icon:        Building2,
    title:       'Properties & Units',
    description: 'Add buildings and apartments. Units are linked to tenants when they register via WhatsApp.',
    badge:       'Manage buildings',
  },
]

export default function SettingsPage() {
  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Settings size={18} className="text-[#BFF549]" />
          <h1 className="text-white font-bold font-[family-name:var(--font-heading)] text-xl">
            Settings
          </h1>
        </div>
        <p className="text-[#555555] text-sm">
          Configure your property management operation
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 max-w-2xl">
        {SETTINGS_SECTIONS.map(({ href, icon: Icon, title, description, badge }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full hover:border-[#383838] transition-colors p-5">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1E1E1E] border border-[#272727] text-[#A1A1A1] group-hover:bg-[#BFF549]/10 group-hover:text-[#BFF549] group-hover:border-[#BFF549]/20 transition-colors shrink-0">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h2 className="text-white font-semibold font-[family-name:var(--font-heading)] text-sm">
                      {title}
                    </h2>
                    <ChevronRight size={14} className="text-[#555555] group-hover:text-[#BFF549] transition-colors shrink-0" />
                  </div>
                  <p className="text-[#555555] text-xs leading-relaxed">{description}</p>
                  <span className="inline-block mt-3 text-[10px] bg-[#1E1E1E] border border-[#272727] text-[#A1A1A1] rounded-full px-2.5 py-0.5">
                    {badge}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppLayout>
  )
}
