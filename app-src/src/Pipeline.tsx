import React from 'react'
import { Radio, Inbox } from 'lucide-react'
import type { JobRecord, JobStatus } from './types'
import { cx, STATUS_ORDER, STATUS_META, relativeDays } from './lib'
import { FitMeter } from './ui'

const TONE_COLOR: Record<string, string> = {
  slate: '#94a3b8',
  blue: '#3b82f6',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  emerald: '#10b981',
  rose: '#f43f5e',
}

function JobCard({ job, onOpen }: { job: JobRecord; onOpen: (j: JobRecord) => void }) {
  const processing = job.processing_state === 'processing'
  return (
    <div className={cx('card', processing && 'is-processing')} onClick={() => onOpen(job)}>
      <div className="co">{job.company || 'Unknown'}</div>
      <div className="ro">{job.role || '—'}</div>
      <div className="card-foot">
        {processing ? (
          <span className="proc">
            <span className="spin" /> Enriching…
          </span>
        ) : (
          <FitMeter score={job.fit_score} />
        )}
        <div className="meta">
          {job.source && (
            <span className="src">
              <Radio size={12} /> {job.source}
            </span>
          )}
          <span>{relativeDays(job.applied_date)}</span>
        </div>
      </div>
    </div>
  )
}

export function Pipeline({
  jobs,
  isLoading,
  onOpen,
}: {
  jobs: JobRecord[]
  isLoading: boolean
  onOpen: (j: JobRecord) => void
}) {
  const byStatus = (s: JobStatus) => jobs.filter((j) => j.status === s)

  return (
    <div className="board-wrap">
      <div className="board">
        {STATUS_ORDER.map((status) => {
          const meta = STATUS_META[status]
          const items = byStatus(status)
          return (
            <div className="col" key={status}>
              <div className="col-head">
                <span className="name">
                  <span className="dot" style={{ background: TONE_COLOR[meta.tone] }} />
                  {meta.label}
                </span>
                <span className="count tnum">{items.length}</span>
              </div>
              <div className="col-body">
                {isLoading ? (
                  <>
                    <div className="skeleton sk-card" />
                    <div className="skeleton sk-card" style={{ opacity: 0.6 }} />
                  </>
                ) : items.length === 0 ? (
                  <div className="col-empty">
                    {status === 'saved' ? 'Nothing saved' : status === 'rejected' ? 'None' : 'Empty'}
                  </div>
                ) : (
                  items.map((job) => <JobCard key={job.id} job={job} onOpen={onOpen} />)
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
