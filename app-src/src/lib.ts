import type { JobStatus } from './types'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** JSON columns can come back as a parsed array/object or as a JSON string — normalize to an array. */
export function asArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (typeof value === 'string') {
    const s = value.trim()
    if (!s) return []
    try {
      const parsed = JSON.parse(s)
      return Array.isArray(parsed) ? (parsed as T[]) : [parsed as T]
    } catch {
      return [s as unknown as T]
    }
  }
  if (value == null) return []
  return [value as T]
}

export const STATUS_ORDER: JobStatus[] = [
  'saved',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
]

export const STATUS_META: Record<JobStatus, { label: string; tone: string }> = {
  saved: { label: 'Saved', tone: 'slate' },
  applied: { label: 'Applied', tone: 'blue' },
  screening: { label: 'Screening', tone: 'violet' },
  interview: { label: 'Interview', tone: 'amber' },
  offer: { label: 'Offer', tone: 'emerald' },
  rejected: { label: 'Rejected', tone: 'rose' },
}

export function fitTier(score?: number | null): 'high' | 'mid' | 'low' | 'none' {
  if (score == null || Number.isNaN(score)) return 'none'
  if (score >= 75) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

export function fitLabel(score?: number | null): string {
  const tier = fitTier(score)
  if (tier === 'high') return 'Strong'
  if (tier === 'mid') return 'Worth it'
  if (tier === 'low') return 'Stretch'
  return '—'
}

export function formatDate(value?: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function relativeDays(value?: string): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const days = Math.round((Date.now() - d.getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

export function channelLabel(channel?: string): string {
  switch (channel) {
    case 'linkedin_dm':
      return 'LinkedIn DM'
    case 'email':
      return 'Email'
    case 'cold_email':
      return 'Cold email'
    default:
      return 'Outreach'
  }
}

export function titleCase(value?: string): string {
  if (!value) return ''
  return value.charAt(0).toUpperCase() + value.slice(1)
}
