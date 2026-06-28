export type JobStatus =
  | 'saved'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected'

export type ProcessingState = 'processing' | 'ready' | 'failed'

export interface JobRecord {
  [key: string]: unknown
  id: string
  company: string
  role: string
  status: JobStatus
  source?: string
  location?: string
  work_mode?: string
  seniority?: string
  salary_range?: string
  required_skills?: unknown
  nice_to_have?: unknown
  fit_score?: number | null
  fit_summary?: string
  fit_strengths?: unknown
  fit_gaps?: unknown
  resume_suggestions?: unknown
  jd_raw?: string
  applied_date?: string
  notes?: string
  processing_state?: ProcessingState
  created_at?: string
  updated_at?: string
}

export interface OutreachDraft {
  [key: string]: unknown
  id: string
  job_id: string
  channel?: 'linkedin_dm' | 'email' | 'cold_email'
  subject?: string
  body: string
  rationale?: string
  approved?: boolean
}

export interface PrepQuestion {
  question: string
  talking_points?: string[]
}

export interface PrepNote {
  [key: string]: unknown
  id: string
  job_id: string
  questions?: unknown
  company_context?: unknown
  focus_areas?: unknown
}
