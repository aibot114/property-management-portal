export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'
import Link from 'next/link'
import { ArrowLeft, Building2, Home } from 'lucide-react'

export default async function PropertiesPage() {
  const supabase = createServerClient()

  const { data: properties } = await supabase
    .from('properties')
    .select(`
      id, name, address, is_active,
      units(id, unit_label, floor, is_active)
    `)
    .eq('company_id', COMPANY_ID)
    .eq('is_active', true)
    .order('name')

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
              Properties & Units
            </h1>
            <p className="text-[#555555] text-sm mt-1">
              {properties?.length ?? 0} properties configured
            </p>
          </div>
          <span className="bg-[#1E1E1E] border border-[#272727] text-[#555555] rounded-full px-3 py-1.5 text-xs">
            Add via Supabase for now
          </span>
        </div>
      </div>

      {(!properties || properties.length === 0) ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-[#555555]">
              <Building2 size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No properties configured yet</p>
              <p className="text-xs mt-1 max-w-xs text-center">
                Properties and units are currently added directly in Supabase. A portal UI for this is coming in a future update.
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {properties.map((property: any) => (
            <Card key={property.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#1E1E1E] border border-[#272727] flex items-center justify-center text-[#A1A1A1]">
                    <Building2 size={14} />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold font-[family-name:var(--font-heading)] text-sm">{property.name}</h2>
                    {property.address && (
                      <p className="text-[#555555] text-xs mt-0.5">{property.address}</p>
                    )}
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-[#BFF549] font-bold text-xl font-[family-name:var(--font-heading)]">
                      {property.units?.filter((u: any) => u.is_active).length ?? 0}
                    </p>
                    <p className="text-[#555555] text-xs">units</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {property.units && property.units.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {property.units
                      .filter((u: any) => u.is_active)
                      .sort((a: any, b: any) => a.unit_label.localeCompare(b.unit_label, undefined, { numeric: true }))
                      .map((unit: any) => (
                        <span
                          key={unit.id}
                          className="flex items-center gap-1 bg-[#1E1E1E] border border-[#272727] text-[#A1A1A1] rounded-lg px-2 py-1 text-xs"
                        >
                          <Home size={9} />
                          {unit.unit_label}
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="text-[#555555] text-xs">No units configured</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  )
}
