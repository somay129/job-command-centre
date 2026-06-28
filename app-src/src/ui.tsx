import React, { createContext, useCallback, useContext, useState } from 'react'
import { Check, AlertTriangle } from 'lucide-react'
import { cx, fitTier, fitLabel, STATUS_META } from './lib'
import type { JobStatus } from './types'

export function Spinner() {
  return <span className="spin" aria-label="loading" />
}

export function FitMeter({ score, withLabel = true }: { score?: number | null; withLabel?: boolean }) {
  const tier = fitTier(score)
  const pct = Math.max(0, Math.min(100, score ?? 0))
  return (
    <span className={cx('fit', tier)} title={score != null ? `Fit ${score}/100` : 'Fit pending'}>
      <span className="ring" style={{ ['--p' as string]: String(pct) }}>
        <span className="num tnum">{score != null ? score : '·'}</span>
      </span>
      {withLabel && <span className="lab">{fitLabel(score)}</span>}
    </span>
  )
}

export function StatusBadge({ status }: { status: JobStatus }) {
  const meta = STATUS_META[status] ?? { label: status, tone: 'slate' }
  return <span className={cx('badge', `tone-${meta.tone}`)}>{meta.label}</span>
}

export function EmptyState({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="empty">
      <div className="ei">{icon}</div>
      <p>{children}</p>
    </div>
  )
}

/* ----------------------------------------------------------------- toasts -- */
type Toast = { id: number; kind: 'ok' | 'err'; text: string }
const ToastCtx = createContext<(text: string, kind?: 'ok' | 'err') => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const push = useCallback((text: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((t) => [...t, { id, kind, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={cx('toast', t.kind)}>
            {t.kind === 'ok' ? <Check size={15} /> : <AlertTriangle size={15} />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
