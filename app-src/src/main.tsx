import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthGuard, useCurrentUser, useLiveRecords } from 'lemma-sdk/react'
import { LayoutGrid, UserRound, Plus, Compass } from 'lucide-react'
import { lemmaClient } from './lemma-client'
import type { JobRecord, OutreachDraft, PrepNote } from './types'
import { Toaster } from './ui'
import { Pipeline } from './Pipeline'
import { JobDetail } from './JobDetail'
import { AddJobModal } from './AddJobModal'
import { ProfilePage } from './ProfilePage'
import './styles.css'

const queryClient = new QueryClient()
const podId = lemmaClient.podId as string

type View = 'pipeline' | 'profile'

function displayName(user: { first_name?: string | null; last_name?: string | null; email?: string } | null): string {
  const full = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()
  return full || user?.email?.split('@')[0] || 'You'
}

function initials(user: { first_name?: string | null; last_name?: string | null; email?: string } | null): string {
  const base = displayName(user)
  const parts = base.split(/[ ._-]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || base[0].toUpperCase()
}

function App() {
  const { user } = useCurrentUser({ client: lemmaClient })
  const [view, setView] = useState<View>('pipeline')
  const [adding, setAdding] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const jobsQ = useLiveRecords<JobRecord>({
    client: lemmaClient,
    podId,
    tableName: 'jobs',
    sort: [{ field: 'applied_date', direction: 'desc' }],
    limit: 300,
  })
  const draftsQ = useLiveRecords<OutreachDraft>({ client: lemmaClient, podId, tableName: 'outreach_drafts', limit: 500 })
  const prepsQ = useLiveRecords<PrepNote>({ client: lemmaClient, podId, tableName: 'prep_notes', limit: 500 })

  const jobs = jobsQ.records
  const stats = useMemo(() => {
    const active = jobs.filter((j) => j.status !== 'rejected')
    const scored = jobs.filter((j) => typeof j.fit_score === 'number')
    const avg = scored.length
      ? Math.round(scored.reduce((s, j) => s + (j.fit_score ?? 0), 0) / scored.length)
      : null
    return {
      active: active.length,
      avg,
      interview: jobs.filter((j) => j.status === 'interview').length,
      offer: jobs.filter((j) => j.status === 'offer').length,
    }
  }, [jobs])

  const selected = selectedId ? jobs.find((j) => j.id === selectedId) ?? null : null
  const selectedDraft = selected ? draftsQ.records.find((d) => d.job_id === selected.id) : undefined
  const selectedPrep = selected ? prepsQ.records.find((p) => p.job_id === selected.id) : undefined

  return (
    <div className="shell">
      <aside className="rail">
        <div className="brand">
          <span className="glyph"><Compass size={19} /></span>
          <span className="word">
            <b>Command Centre</b>
            <span>Job Search</span>
          </span>
        </div>

        <div className="nav-label">Workspace</div>
        <button className={`nav-item ${view === 'pipeline' ? 'active' : ''}`} onClick={() => setView('pipeline')}>
          <LayoutGrid size={17} /> Pipeline
        </button>
        <button className={`nav-item ${view === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')}>
          <UserRound size={17} /> Profile
        </button>

        <div className="rail-foot">
          <span className="avatar">{initials(user)}</span>
          <span className="who">
            <b>{displayName(user)}</b>
            <span>{user?.email || 'signed in'}</span>
          </span>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="ttl">
            <h1>{view === 'pipeline' ? 'Application Pipeline' : 'Profile'}</h1>
            <p>
              {view === 'pipeline'
                ? 'Every application, scored and prepped — one place to run your search.'
                : 'What the AI knows about you.'}
            </p>
          </div>
          {view === 'pipeline' && (
            <button className="btn btn-primary" onClick={() => setAdding(true)}>
              <Plus size={16} /> Add job
            </button>
          )}
        </div>

        {view === 'pipeline' && (
          <>
            <div className="statbar scroll-x">
              <div className="stat">
                <div className="k">Active</div>
                <div className="v tnum">{stats.active}</div>
              </div>
              <div className="stat">
                <div className="k">Avg fit</div>
                <div className="v tnum">
                  {stats.avg != null ? stats.avg : '—'}
                  {stats.avg != null && <small>/100</small>}
                </div>
              </div>
              <div className="stat">
                <div className="k">Interviewing</div>
                <div className="v tnum">{stats.interview}</div>
              </div>
              <div className="stat">
                <div className="k">Offers</div>
                <div className="v tnum">{stats.offer}</div>
              </div>
            </div>

            {jobsQ.error ? (
              <div className="page">
                <div className="alert">{jobsQ.error.message}</div>
              </div>
            ) : (
              <Pipeline jobs={jobs} isLoading={jobsQ.isLoading} onOpen={(j) => setSelectedId(j.id)} />
            )}
          </>
        )}

        {view === 'profile' && <ProfilePage client={lemmaClient} />}
      </main>

      {adding && <AddJobModal client={lemmaClient} podId={podId} onClose={() => setAdding(false)} />}
      {selected && (
        <JobDetail
          client={lemmaClient}
          podId={podId}
          job={selected}
          draft={selectedDraft}
          prep={selectedPrep}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toaster>
        <AuthGuard
          client={lemmaClient}
          loadingFallback={
            <div className="auth-fallback">
              <div className="auth-card">
                <div className="glyph"><Compass size={22} /></div>
                <p style={{ color: 'var(--ink-2)' }}>Checking access…</p>
              </div>
            </div>
          }
        >
          <App />
        </AuthGuard>
      </Toaster>
    </QueryClientProvider>
  </React.StrictMode>,
)
