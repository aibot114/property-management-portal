'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { UserCheck, ChevronDown } from 'lucide-react'

interface Technician {
  id: string
  full_name: string
  is_active: boolean
  teams: { id: string; name: string } | null
}

interface AssignTechnicianFormProps {
  ticketId: string
  currentTechId: string | null
  technicians: Technician[]
}

export function AssignTechnicianForm({ ticketId, currentTechId, technicians }: AssignTechnicianFormProps) {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(currentTechId ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const activeTechs = technicians.filter(t => t.is_active)
  const selectedTech = activeTechs.find(t => t.id === selectedId)

  async function assign() {
    if (!selectedId) return
    setLoading(true)
    await fetch('/api/tickets/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId,
        technicianId: selectedId,
        teamId: selectedTech?.teams?.id ?? null,
      }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <div className="relative">
      <Button
        variant={currentTechId ? 'outline' : 'secondary'}
        size="sm"
        onClick={() => setOpen(!open)}
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <UserCheck size={13} />
          {currentTechId
            ? technicians.find(t => t.id === currentTechId)?.full_name ?? 'Reassign'
            : 'Assign Technician'}
        </span>
        <ChevronDown size={12} />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#161616] border border-[#272727] rounded-xl shadow-xl overflow-hidden">
            {activeTechs.length === 0 ? (
              <p className="text-[#555555] text-xs text-center py-4">
                No active technicians
              </p>
            ) : (
              activeTechs.map(tech => (
                <button
                  key={tech.id}
                  onClick={() => setSelectedId(tech.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#1E1E1E] transition-colors ${
                    selectedId === tech.id ? 'bg-[#BFF549]/10' : ''
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1E1E1E] border border-[#272727] flex items-center justify-center shrink-0">
                    <span className="text-[#A1A1A1] text-xs font-semibold">
                      {tech.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${selectedId === tech.id ? 'text-[#BFF549]' : 'text-white'}`}>
                      {tech.full_name}
                    </p>
                    <p className="text-[#555555] text-xs">{tech.teams?.name ?? '—'}</p>
                  </div>
                  {selectedId === tech.id && (
                    <span className="text-[#BFF549] text-xs">✓</span>
                  )}
                </button>
              ))
            )}
            {selectedId && selectedId !== currentTechId && (
              <div className="px-3 py-2.5 border-t border-[#272727]">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={assign}
                  disabled={loading}
                >
                  {loading ? 'Saving…' : 'Confirm Assignment'}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
