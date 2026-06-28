import React, { useEffect, useState } from 'react'
import { Check, Save, UserRound } from 'lucide-react'
import type { LemmaClient } from 'lemma-sdk'
import { Spinner, useToast } from './ui'

const PROFILE_PATH = '/profile/candidate-profile.md'

export function ProfilePage({ client }: { client: LemmaClient }) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [original, setOriginal] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const blob = await client.files.download(PROFILE_PATH)
        const content = await blob.text()
        if (!cancelled) {
          setText(content)
          setOriginal(content)
        }
      } catch {
        if (!cancelled) setError('No profile found yet. Write one below and save — the agents read it to personalize everything.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [client])

  async function save() {
    setSaving(true)
    try {
      const blob = new Blob([text], { type: 'text/markdown' })
      try {
        await client.files.update(PROFILE_PATH, { file: blob, searchEnabled: true })
      } catch {
        // Not there yet — create it.
        await client.files.upload(blob, {
          name: 'candidate-profile.md',
          directoryPath: '/profile',
          description: 'Candidate profile read by every agent.',
          searchEnabled: true,
        })
      }
      setOriginal(text)
      setSavedAt(Date.now())
      setError('')
      toast('Profile saved', 'ok')
    } catch (e) {
      toast('Could not save profile', 'err')
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  const dirty = text !== original

  return (
    <div className="page">
      <div className="panel">
        <div className="ph">
          <div>
            <h2>Candidate profile</h2>
            <p>
              This is the single source of truth every agent reads — fit scoring, outreach, and
              interview prep all personalize from it. Edit it as your search evolves; changes take
              effect on the next job you process.
            </p>
          </div>
          <button className="btn btn-primary" onClick={save} disabled={saving || !dirty}>
            {saving ? <Spinner /> : <Save size={15} />} {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>

        {error && <div className="alert" style={{ marginBottom: 14 }}>{error}</div>}

        {loading ? (
          <div className="skeleton" style={{ height: 360, borderRadius: 10 }} />
        ) : (
          <textarea
            className="textarea mono"
            style={{ minHeight: 420, fontSize: 13, lineHeight: 1.6 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="# Candidate Profile&#10;&#10;## Core skills&#10;- …"
          />
        )}

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, minHeight: 20 }}>
          {savedAt && !dirty && (
            <span className="saved-flash">
              <Check size={14} /> Saved
            </span>
          )}
          {dirty && !saving && (
            <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Unsaved changes</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <UserRound size={13} /> stored as a Lemma file · auto-indexed for the agents
          </span>
        </div>
      </div>
    </div>
  )
}
