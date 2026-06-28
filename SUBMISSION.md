# Submission — AI Job Application Command Centre

Copy-paste answers for the Unstop submission form, plus the demo script. Everything here
matches the **actual** build in this repo (3 agents, 3 functions, 1 workflow, 3 tables, a
profile file, and a Vite/React app), not a generic template.

> **Live app:** https://command-centre-019f0f72.apps.lemma.work
> Built on Lemma SDK, deployed on lemma.work cloud. Agents run on Lemma's system model.
> Grant the judge access (invite `ayush@gappy.ai` as a viewer from the pod's Members page in
> the lemma.work UI) or submit the demo recording below.

---

## Field: Problem statement chosen

AI Job Application Command Centre (CAREER track).

## Field: Describe the problem

I apply to 5–10 AI-engineer roles a week across LinkedIn, Wellfound, and referrals. Every
single application needs the same bespoke thinking before I can even send a message: read the
JD, work out whether I'm actually a fit, figure out which parts of my resume to foreground,
write a recruiter message that isn't generic, and prep talking points. That's 20–30 minutes
per role — and it doesn't scale when 20 applications are in flight. Spreadsheets track names;
they don't do the thinking. The user is a student / early-career engineer running an active
search with no recruiter support.

## Field: Describe your product and how it solves it

Job Application Command Centre is an AI workspace built on Lemma SDK. You paste a job
description and hit **Process**. One Lemma workflow then runs end-to-end:

1. **jd-analyst** reads my profile (a Lemma file) and the JD and returns, in one pass: the
   parsed fields, an honest 0–100 fit score, strengths, gaps, and concrete resume edits for
   *this* job.
2. **create_job_record** saves it — the card appears on the board immediately.
3. **outreach-writer** drafts a specific, non-generic recruiter message (real hook, two real
   proofs, a banned-phrase list).
4. **interview-coach** generates five likely questions with talking points grounded in my
   actual projects, plus company context and focus areas.

The front end is a Lemma app: a kanban pipeline (Saved → Applied → Screening → Interview →
Offer → Rejected) where each card fills in **live** as the workflow finishes. Click a card to
see the fit analysis, resume tailoring, the outreach draft (copy / approve), and interview
prep. A Profile page edits the candidate file every agent reads. Raw JD → structured,
actionable intelligence in one click.

## Field: How did you use Lemma SDK?

Lemma is the entire infrastructure layer — no separate backend, no separate database.

- **Tables** (`jobs`, `outreach_drafts`, `prep_notes`) — the single source of truth. FK
  links drafts/prep to jobs. Shared (non-RLS) so the whole workspace shows one pipeline.
- **Files** (`/profile/candidate-profile.md`) — Lemma's built-in document index. Every agent
  reads the profile from here to personalize output; the app's Profile page edits it. Nothing
  about the candidate is hard-coded into prompts.
- **Agents** (`jd-analyst`, `outreach-writer`, `interview-coach`) — three orthogonal
  judgments, each with a typed `output_schema` and scoped to exactly `/profile:read` (zero
  default access).
- **Functions** (`create_job_record`, `attach_outreach`, `attach_prep`) — the deterministic
  writes: enum validation/clamping, coordinated create + the `processing_state → ready` flip.
- **Workflow** (`process-job`) — the spine: `FORM → AGENT → FUNCTION → AGENT → FUNCTION →
  AGENT → FUNCTION → END`, passing data between steps with JMESPath input mappings.
- **App** (`command-centre`) — a Vite + React + `lemma-sdk` operator UI built on the SDK's
  React hooks: `useLiveRecords` (no-poll live board), `useUpdateRecord` (status / approve),
  `useWorkflowStart` (kick off the pipeline), `useCurrentUser`, plus `client.files` for the
  profile editor.

Architecture: **start workflow → agents + functions write tables → app reads tables live.**

## Field: External tools / models / APIs

- An LLM (Anthropic Claude or OpenAI) via Lemma's runtime profile — no model key in app code.
- Nothing else: no custom DB, no custom backend, no third-party APIs. Lemma handles
  persistence, agent orchestration, file RAG, auth, and app hosting.

---

## Demo script (~90 seconds)

1. **[0:00]** Open the live app (lemma.work URL or local). The board is already populated —
   real applications across every stage, each with a fit badge.
2. **[0:10]** "This is the Job Application Command Centre, built on Lemma SDK. It turns any JD
   into actionable intelligence in one click."
3. **[0:18]** Open a real JD in another tab, copy it. Click **+ Add job**, paste, set source,
   **Process job**.
4. **[0:28]** Show the live steps — analyzing & scoring, adding to pipeline, drafting outreach,
   generating prep. Note: "this is a Lemma workflow chaining three agents and three functions."
5. **[0:45]** The new card appears in **Applied** with a fit score and fills in live.
6. **[0:52]** Click it: fit score + strengths/gaps, **resume tailoring**, the outreach draft —
   read two lines, click **Copy**, **Approve** — then the interview-prep questions.
7. **[1:15]** Drag/return to the board; change a status to show the pipeline is operational.
8. **[1:25]** "Raw JD to fit score, resume tips, outreach, and interview prep — under 30
   seconds, entirely on Lemma tables, agents, files, and workflows."

---

## Why this scores

| Criterion | Weight | This build |
| --- | --- | --- |
| Problem clarity & real-world fit | 35% | Hyper-specific real user (the builder). Real, recurring pain. |
| Product judgment | 25% | Three orthogonal agents, not a chain; every feature maps to a real step; no wasted complexity. |
| Execution quality | 25% | Core loop works end-to-end; live product; the board demos itself via seed data. |
| SDK utilization | 15% | All six primitives used meaningfully — tables, files (RAG), agents (scoped + typed), functions, workflow, app. |
