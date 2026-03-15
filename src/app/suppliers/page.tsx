export const dynamic = 'force-dynamic'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { createServerClient, COMPANY_ID } from '@/lib/supabase-server'
import { Badge } from '@/components/ui/Badge'

export default async function SuppliersPage() {
  const supabase = createServerClient()

  const { data } = await supabase
    .from('suppliers')
    .select('*')
    .eq('company_id', COMPANY_ID)
    .order('name')

  const suppliers = data ?? []

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold font-[family-name:var(--font-heading)] text-xl">
            Suppliers
          </h1>
          <p className="text-[#555555] text-sm mt-1">
            Supplier management — currently inactive (coming soon)
          </p>
        </div>
        <span className="bg-[#1E1E1E] border border-[#272727] text-[#555555] rounded-full px-3 py-1 text-xs">
          Feature: Inactive
        </span>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-white text-sm font-semibold font-[family-name:var(--font-heading)]">
            Supplier Directory
          </h2>
        </CardHeader>

        {suppliers.length === 0 ? (
          <CardBody>
            <div className="flex flex-col items-center justify-center py-12 text-[#555555]">
              <p className="text-sm">No suppliers added yet</p>
              <p className="text-xs mt-1">This feature will be enabled in a future update</p>
            </div>
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#272727]">
                  {['Name', 'WhatsApp', 'Email', 'Categories', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs text-[#555555] font-medium px-4 py-3 first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#272727]">
                {suppliers.map((s: any) => (
                  <tr key={s.id} className="hover:bg-[#1E1E1E]/50 transition-colors opacity-60">
                    <td className="px-4 py-3 pl-5 text-white text-xs font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-[#A1A1A1] text-xs font-mono">{s.wa_number ?? '—'}</td>
                    <td className="px-4 py-3 text-[#A1A1A1] text-xs">{s.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(s.categories ?? []).map((c: string) => (
                          <Badge key={c} variant="category" value={c} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 pr-5">
                      <span className="text-xs text-[#555555]">Inactive</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppLayout>
  )
}
