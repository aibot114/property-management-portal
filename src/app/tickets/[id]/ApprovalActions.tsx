'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { CheckCircle, XCircle } from 'lucide-react'

interface ApprovalActionsProps {
  approvalId: string
  ticketId: string
}

export function ApprovalActions({ approvalId, ticketId }: ApprovalActionsProps) {
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState(false)

  async function decide(decision: 'approve' | 'reject') {
    setLoading(decision)
    const res = await fetch('/api/approvals/decide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvalId, ticketId, decision }),
    })
    if (res.ok) setDone(true)
    setLoading(null)
  }

  if (done) {
    return <p className="text-[#BFF549] text-xs">Decision recorded.</p>
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="primary"
        size="sm"
        onClick={() => decide('approve')}
        disabled={!!loading}
        className="flex-1"
      >
        <CheckCircle size={12} />
        {loading === 'approve' ? 'Approving…' : 'Approve'}
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={() => decide('reject')}
        disabled={!!loading}
        className="flex-1"
      >
        <XCircle size={12} />
        {loading === 'reject' ? 'Rejecting…' : 'Reject'}
      </Button>
    </div>
  )
}
