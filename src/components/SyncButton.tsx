'use client'

import { useState } from 'react'

type State = 'idle' | 'loading' | 'done' | 'error'

const LABEL: Record<State, string> = {
  idle: 'Sync',
  loading: 'Syncing…',
  done: 'Synced',
  error: 'Failed',
}

const CLASSES: Record<State, string> = {
  idle: 'border-border text-text-muted hover:border-ctl hover:text-ctl',
  loading: 'border-border text-text-muted cursor-wait',
  done: 'border-tsb-fresh text-tsb-fresh',
  error: 'border-atl text-atl',
}

export default function SyncButton() {
  const [state, setState] = useState<State>('idle')

  async function handleSync() {
    setState('loading')
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      if (!res.ok) throw new Error()
      setState('done')
      setTimeout(() => setState('idle'), 3000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={state === 'loading'}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border font-mono tracking-wider transition-colors ${CLASSES[state]}`}
    >
      {state === 'loading' && (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      )}
      {LABEL[state]}
    </button>
  )
}
