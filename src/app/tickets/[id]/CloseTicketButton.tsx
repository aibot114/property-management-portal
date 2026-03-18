'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function CloseTicketButton({ ticketId }: { ticketId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleClose() {
    setLoading(true)
    await fetch('/api/tickets/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId }),
    })
    setLoading(false)
    setConfirming(false)
    router.refresh()
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full flex items-center justify-center gap-2 bg-[#1E1E1E] border border-[#272727] hover:border-[#BFF549]/40 text-[#A1A1A1] hover:text-white rounded-xl py-2.5 text-xs font-medium transition-colors"
      >
        <CheckCircle2 size={13} className="text-[#BFF549]" />
        Close Ticket
      </button>
    )
  }

  return (
    <div className="bg-[#1E1E1E] border border-[#272727] rounded-xl p-3 space-y-2.5">
      <p className="text-white text-xs font-medium">Mark this ticket as resolved?</p>
      <p className="text-[#555555] text-[11px]">This will close the ticket and cannot be undone.</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="py-2 rounded-xl border border-[#272727] text-[#A1A1A1] text-xs hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleClose}
          disabled={loading}
          className="py-2 rounded-xl bg-[#BFF549] text-black text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : null}
          {loading ? 'Closing…' : 'Confirm'}
        </button>
      </div>
    </div>
  )
}
