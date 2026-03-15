export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'
import { AddTechnicianForm } from './AddTechnicianForm'
import { ToggleActiveButton } from './ToggleActiveButton'
import Link from 'next/link'
import { ArrowLeft, Phone, Tag } from 'lucide-react'

export default async function TechniciansPage() {
  const supabase = createServerClient()

  const [techRes, teamRes] = await Promise.all([
    supabase
      .from('technicians')
      .select('*, teams(name, category_tags)')
      .eq('company_id', COMPANY_ID)
      .order('is_active', { ascending: false })
      .order('full_name'),
    supabase
      .from('teams')
      .select('id, name, category_tags')
      .eq('company_id', COMPANY_ID)
      .eq('is_active', true),
  ])

  const technicians = techRes.data ?? []
  const teams = teamRes.data ?? []

  const active   = technicians.filter((t: any) => t.is_active)
  const inactive = technicians.filter((t: any) => !t.is_active)

  return (
    <AppLayout>
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-[#A1A1A1] hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Settings
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-white font-bold font-[family-name:var(--font-heading)] text-xl">
              Technicians
            </h1>
            <p className="text-[#555555] text-sm mt-1">
              {active.length} active · {inactive.length} inactive
            </p>
          </div>
          <AddTechnicianForm
            teams={teams as any}
            onSuccess={() => { /* page will refresh via router.refresh() in child */ }}
          />
        </div>
      </div>

      {/* Teams overview */}
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        {teams.map((team: any) => (
          <Card key={team.id} elevated>
            <CardBody className="flex items-center gap-3 py-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#BFF549]/10 border border-[#BFF549]/20 text-[#BFF549] shrink-0">
                <Tag size={13} />
              </div>
              <div>
                <p className="text-white text-sm font-medium">{team.name}</p>
                <p className="text-[#555555] text-xs mt-0.5">
                  Handles: {(team.category_tags as string[]).join(', ')}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[#BFF549] font-bold text-lg font-[family-name:var(--font-heading)]">
                  {technicians.filter((t: any) => t.team_id === team.id && t.is_active).length}
                </p>
                <p className="text-[#555555] text-xs">active</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Technician list */}
      <Card>
        <CardHeader>
          <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)]">
            All Technicians
          </h2>
        </CardHeader>

        {technicians.length === 0 ? (
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-[#555555]">
              <p className="text-sm">No technicians added yet</p>
              <p className="text-xs mt-1">Add your first technician using the button above</p>
            </div>
          </CardBody>
        ) : (
          <div className="divide-y divide-[#272727]">
            {technicians.map((tech: any) => (
              <div
                key={tech.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#1E1E1E]/50 ${!tech.is_active ? 'opacity-50' : ''}`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-[#1E1E1E] border border-[#272727] flex items-center justify-center shrink-0">
                  <span className="text-[#A1A1A1] text-sm font-semibold">
                    {tech.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-sm font-medium">{tech.full_name}</p>
                    {tech.employee_id && (
                      <span className="text-[#555555] text-xs font-mono">{tech.employee_id}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-[#A1A1A1] text-xs font-mono">
                      <Phone size={9} /> {tech.wa_number}
                    </span>
                    {tech.teams && (
                      <span className="text-[#555555] text-xs">
                        {tech.teams.name}
                      </span>
                    )}
                    {tech.teams?.category_tags && (
                      <span className="text-[#555555] text-xs">
                        Handles: {(tech.teams.category_tags as string[]).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Toggle */}
                <ToggleActiveButton techId={tech.id} isActive={tech.is_active} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
