'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { UserPlus, X } from 'lucide-react'

interface Team {
  id: string
  name: string
  category_tags: string[]
}

interface AddTechnicianFormProps {
  teams: Team[]
  onSuccess: () => void
}

export function AddTechnicianForm({ teams, onSuccess }: AddTechnicianFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name:   '',
    wa_number:   '',
    team_id:     teams[0]?.id ?? '',
    employee_id: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/technicians', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      return
    }

    setForm({ full_name: '', wa_number: '', team_id: teams[0]?.id ?? '', employee_id: '' })
    setOpen(false)
    onSuccess()
  }

  if (!open) {
    return (
      <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
        <UserPlus size={14} /> Add Technician
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#161616] border border-[#272727] rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#272727]">
          <h2 className="text-white font-semibold font-[family-name:var(--font-heading)] text-sm">
            Add New Technician
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-[#555555] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[#A1A1A1] text-xs mb-1.5">Full Name *</label>
            <input
              required
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="e.g. Khalid Ibrahim"
              className="w-full bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-[#BFF549]/50"
            />
          </div>

          <div>
            <label className="block text-[#A1A1A1] text-xs mb-1.5">
              WhatsApp Number *
              <span className="text-[#555555] ml-1">(with country code)</span>
            </label>
            <input
              required
              value={form.wa_number}
              onChange={e => setForm(f => ({ ...f, wa_number: e.target.value }))}
              placeholder="+971501234567"
              className="w-full bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2.5 text-sm text-white font-mono placeholder:text-[#555555] placeholder:font-sans focus:outline-none focus:border-[#BFF549]/50"
            />
            <p className="text-[#555555] text-[11px] mt-1">
              This number receives job cards and bot messages
            </p>
          </div>

          <div>
            <label className="block text-[#A1A1A1] text-xs mb-1.5">Team *</label>
            <select
              required
              value={form.team_id}
              onChange={e => setForm(f => ({ ...f, team_id: e.target.value }))}
              className="w-full bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#BFF549]/50"
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} — covers: {(team.category_tags as string[]).join(', ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#A1A1A1] text-xs mb-1.5">
              Employee ID <span className="text-[#555555]">(optional)</span>
            </label>
            <input
              value={form.employee_id}
              onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
              placeholder="e.g. TECH-003"
              className="w-full bg-[#1E1E1E] border border-[#272727] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[#555555] focus:outline-none focus:border-[#BFF549]/50"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" size="md" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" className="flex-1" disabled={loading}>
              {loading ? 'Saving…' : 'Add Technician'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
