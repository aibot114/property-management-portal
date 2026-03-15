'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ToggleActiveButtonProps {
  techId: string
  isActive: boolean
}

export function ToggleActiveButton({ techId, isActive }: ToggleActiveButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    await fetch('/api/technicians', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: techId, is_active: !isActive }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors disabled:opacity-40 ${
        isActive
          ? 'bg-[#BFF549]/10 text-[#BFF549] border-[#BFF549]/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-[#BFF549]/10 hover:text-[#BFF549] hover:border-[#BFF549]/20'
      }`}
    >
      {loading ? '…' : isActive ? 'Active' : 'Inactive'}
    </button>
  )
}
