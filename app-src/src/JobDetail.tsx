import React, { useState } from 'react'
import {
  X, MapPin, Briefcase, Calendar, Radio, Target, MessageSquareText,
  GraduationCap, FileText, Copy, Check, ChevronRight, ThumbsUp, Wand2, BadgeCheck,
} from 'lucide-react'
import type { LemmaClient } from 'lemma-sdk'
import { useUpdateRecord } from 'lemma-sdk/react'
import type { JobRecord, OutreachDraft, PrepNote, PrepQuestion, JobStatus } from './types'
import { asArray, cx, formatDate, channelLabel, titleCase, STATUS_ORDER, STATUS_META } from './lib'
import { FitMeter, useToast } from './ui'

export function JobDetail({
  client,
  podId,
  job,
  draft,
  prep,
  onClose,
}: {
  client: LemmaClient
  podId: string
  job: JobRecord
  draft?: OutreachDraft
  prep?: PrepNote
  onClose: () => void
}) {
  const toast = useToast()
  const [openQ, setOpenQ] = useState<number | null>(0)
  const [showJd, setShowJd] = useState(false)
  const [copied, setCopied] = useState(false)
  const [localStatus, setLocalStatus] = useState<JobStatus>(job.status)
  const [approved, setApproved] = useState<boolean>(Boolean(draft?.approved))

  const statusUpdater = useUpdateRecord({ client, podId, tableName: 'jobs', recordId: job.id })
  const draftUpdater = useUpdateRecord({ client, podId, tableName: 'outreach_drafts', recordId: draft?.id ?? null })

  const required = asArray<string>(job.required_skills)
  const nice = asArray<string>(job.nice_to_have)
  const strengths = asArray<string>(job.fit_strengths)
  const gaps = asArray<string>(job.fit_gaps)
  const resume = asArray<string>(job.resume_suggestions)
  const questions = asArray<PrepQuestion>(prep?.questions)
  const context = asArray<string>(prep?.company_context)
  const focus = asArray<string>(prep?.focus_areas)

  async function changeStatus(next: JobStatus) {
    setLocalStatus(next)
    const res = await statusUpdater.update({ status: next })
    if (res) toast(`Moved to ${STATUS_META[next].label}`, 'ok')
    else toast('Could not update status', 'err')
  }

  async function copyDraft() {
    if (!draft) return
    const text = draft.subject ? `Subject: ${draft.subject}\n\n${draft.body}` : draft.body
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      toast('Copy failed', 'err')
    }
  }

  async function toggleApprove() {
    if (!draft) return
    const next = !approved
    setApproved(next)
    const res = await draftUpdater.update({ approved: next })
    if (res) toast(next ? 'Draft approved' : 'Approval removed', 'ok')
  }

  return (
    <div className="scrim drawer-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer" role="dialog" aria-modal="true">
        <div className="dt-head">
          <div className="row1">
            <div>
              <h2>{job.company || 'Unknown company'}</h2>
              <div className="role">{job.role || '—'}</div>
            </div>
            <button className="iconbtn" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <div className="chips">
            <select
              className="select"
              style={{ width: 'auto', padding: '5px 30px 5px 11px', fontSize: 12.5 }}
              value={localStatus}
              onChange={(e) => changeStatus(e.target.value as JobStatus)}
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
            {job.source && (
              <span className="chip">
                <Radio size={13} /> {job.source}
              </span>
            )}
            {job.location && (
              <span className="chip">
                <MapPin size={13} /> {job.location}
              </span>
            )}
            {job.work_mode && job.work_mode !== 'unknown' && (
              <span className="chip">
                <Briefcase size={13} /> {titleCase(job.work_mode)}
              </span>
            )}
            {job.seniority && job.seniority !== 'unknown' && (
              <span className="chip">
                <BadgeCheck size={13} /> {titleCase(job.seniority)}
              </span>
            )}
            <span className="chip">
              <Calendar size={13} /> {formatDate(job.applied_date)}
            </span>
          </div>
        </div>

        <div className="dt-body">
          {/* Fit */}
          {(job.fit_score != null || job.fit_summary) && (
            <div className="section">
              <h3>
                <span className="icon"><Target size={14} /></span> Fit analysis
              </h3>
              <div className="fit-big">
                {job.fit_score != null && (
                  <>
                    <FitMeter score={job.fit_score} withLabel={false} />
                    <div className="score tnum">
                      {job.fit_score}
                      <small>/100</small>
                    </div>
                  </>
                )}
              </div>
              {job.fit_summary && <p className="fit-summary">{job.fit_summary}</p>}
              {(strengths.length > 0 || gaps.length > 0) && (
                <div className="two-col" style={{ marginTop: 16 }}>
                  {strengths.length > 0 && (
                    <div>
                      <div className="mini-h good">Strengths</div>
                      <ul className="ticks good">
                        {strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {gaps.length > 0 && (
                    <div>
                      <div className="mini-h bad">Gaps</div>
                      <ul className="ticks bad">
                        {gaps.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Resume suggestions */}
          {resume.length > 0 && (
            <div className="section">
              <h3>
                <span className="icon"><Wand2 size={14} /></span> Resume tailoring
              </h3>
              <ul className="ticks accent">
                {resume.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {/* Skills */}
          {(required.length > 0 || nice.length > 0) && (
            <div className="section">
              <h3>
                <span className="icon"><Briefcase size={14} /></span> Requirements
              </h3>
              {required.length > 0 && (
                <>
                  <div className="mini-h">Required</div>
                  <div className="skills" style={{ marginBottom: nice.length ? 12 : 0 }}>
                    {required.map((s, i) => <span key={i} className="skill">{s}</span>)}
                  </div>
                </>
              )}
              {nice.length > 0 && (
                <>
                  <div className="mini-h">Nice to have</div>
                  <div className="skills">
                    {nice.map((s, i) => <span key={i} className="skill opt">{s}</span>)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Outreach */}
          {draft && (
            <div className="section">
              <h3>
                <span className="icon"><MessageSquareText size={14} /></span> Recruiter outreach
              </h3>
              <div className="draft">
                <div className="dh">
                  <span className="badge tone-violet">{channelLabel(draft.channel)}</span>
                  {approved && (
                    <span className="badge tone-emerald">
                      <Check size={11} /> Approved
                    </span>
                  )}
                </div>
                {draft.subject && <div className="subject">{draft.subject}</div>}
                <div className="body">{draft.body}</div>
                {draft.rationale && <div className="why">{draft.rationale}</div>}
                <div className="acts">
                  <button className="btn btn-ghost btn-sm" onClick={copyDraft}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    className={cx('btn', 'btn-sm', approved ? 'btn-subtle' : 'btn-primary')}
                    onClick={toggleApprove}
                  >
                    <ThumbsUp size={14} /> {approved ? 'Approved' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interview prep */}
          {(questions.length > 0 || context.length > 0 || focus.length > 0) && (
            <div className="section">
              <h3>
                <span className="icon"><GraduationCap size={14} /></span> Interview prep
              </h3>
              {questions.map((q, i) => (
                <div key={i} className={cx('qa', openQ === i && 'open')}>
                  <div className="q" onClick={() => setOpenQ(openQ === i ? null : i)}>
                    <span className="qn tnum">{i + 1}</span>
                    <span className="qt">{q.question}</span>
                    <ChevronRight size={16} className="caret" />
                  </div>
                  {openQ === i && (q.talking_points?.length ?? 0) > 0 && (
                    <div className="a">
                      <ul className="ticks accent">
                        {(q.talking_points ?? []).map((p, j) => <li key={j}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              {focus.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div className="mini-h">Revise before the interview</div>
                  <div className="skills">
                    {focus.map((s, i) => <span key={i} className="skill">{s}</span>)}
                  </div>
                </div>
              )}
              {context.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div className="mini-h">Know about the company</div>
                  <ul className="ticks">
                    {context.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* JD raw */}
          {job.jd_raw && (
            <div className="section">
              <button className="jd-toggle" onClick={() => setShowJd((v) => !v)}>
                <FileText size={14} /> {showJd ? 'Hide' : 'Show'} original job description
              </button>
              {showJd && <div className="jd-raw">{job.jd_raw}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
