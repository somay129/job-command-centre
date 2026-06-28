import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X, Check, Sparkles, AlertTriangle } from 'lucide-react'
import type { LemmaClient } from 'lemma-sdk'
import { useWorkflowStart } from 'lemma-sdk/react'
import { cx } from './lib'
import { Spinner, useToast } from './ui'

const STEPS: { node: string; label: string }[] = [
  { node: 'analyze', label: 'Analyzing the JD & scoring your fit' },
  { node: 'create_job', label: 'Adding it to your pipeline' },
  { node: 'outreach', label: 'Drafting recruiter outreach' },
  { node: 'prep', label: 'Generating interview prep' },
  { node: 'save_prep', label: 'Finishing up' },
]

function up(s: unknown): string {
  return typeof s === 'string' ? s.toUpperCase() : ''
}

export function AddJobModal({
  client,
  podId,
  onClose,
}: {
  client: LemmaClient
  podId: string
  onClose: () => void
}) {
  const toast = useToast()
  const [jd, setJd] = useState('')
  const [source, setSource] = useState('')
  const [phase, setPhase] = useState<'edit' | 'running' | 'failed'>('edit')
  const [errMsg, setErrMsg] = useState('')
  const closedRef = useRef(false)

  const wf = useWorkflowStart({ client, podId, workflowName: 'process-job', autoPoll: true })

  const run = wf.run as
    | { status?: string; current_node_id?: string; error?: string; failed_node_id?: string }
    | null

  const activeIndex = useMemo(() => {
    const node = run?.current_node_id
    const i = STEPS.findIndex((s) => s.node === node)
    return i >= 0 ? i : phase === 'running' ? 0 : -1
  }, [run?.current_node_id, phase])

  // React to run completion / failure.
  useEffect(() => {
    if (phase !== 'running' || !run) return
    const status = up(run.status)
    if (status === 'COMPLETED') {
      if (!closedRef.current) {
        closedRef.current = true
        toast('Job processed — pipeline updated', 'ok')
        onClose()
      }
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      setErrMsg(
        run.error?.toString().slice(0, 300) ||
          'The pipeline could not finish. The agents need an LLM key configured on the pod (Anthropic or OpenAI). Add one, then try again.',
      )
      setPhase('failed')
    }
  }, [run, phase, onClose, toast])

  async function submit() {
    if (!jd.trim()) return
    setPhase('running')
    setErrMsg('')
    try {
      await wf.start({ jd_text: jd.trim(), source: source.trim() || 'Manual' })
      // The run now progresses in the background; the board updates live as nodes complete.
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e))
      setPhase('failed')
    }
  }

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h2>Add a job</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--ink-2)', fontSize: 13 }}>
              Paste the description. The AI parses it, scores your fit, drafts outreach, and
              builds interview prep — all into one card.
            </p>
          </div>
          <button className="iconbtn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {phase === 'edit' && (
          <>
            <div className="field" style={{ marginTop: 16 }}>
              <label htmlFor="jd">Job description</label>
              <textarea
                id="jd"
                className="textarea"
                style={{ minHeight: 200 }}
                placeholder="Paste the full job description here…"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                autoFocus
              />
            </div>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="src">Where did you find it?</label>
              <input
                id="src"
                className="input"
                placeholder="LinkedIn, Wellfound, referral…"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={submit} disabled={!jd.trim()}>
                <Sparkles size={15} /> Process job
              </button>
            </div>
          </>
        )}

        {phase === 'running' && (
          <>
            <div className="proc-steps">
              {STEPS.map((s, i) => {
                const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'idle'
                return (
                  <div key={s.node} className={cx('proc-step', state)}>
                    <span className="pi">
                      {state === 'done' ? (
                        <Check size={12} />
                      ) : state === 'active' ? (
                        <Spinner />
                      ) : (
                        <span style={{ width: 6, height: 6, borderRadius: 9, background: 'var(--line-strong)' }} />
                      )}
                    </span>
                    {s.label}
                  </div>
                )
              })}
            </div>
            <p style={{ color: 'var(--ink-2)', fontSize: 12.5, marginTop: 16 }}>
              This runs as a Lemma workflow. You can close this — the card appears on your board
              and fills in as each step finishes.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={onClose}>
                Close — keep working in background
              </button>
            </div>
          </>
        )}

        {phase === 'failed' && (
          <>
            <div className="alert" style={{ marginTop: 16 }}>
              <AlertTriangle size={16} style={{ flex: '0 0 auto', marginTop: 1 }} />
              <span>{errMsg}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button className="btn btn-ghost" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => setPhase('edit')}>
                Try again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
