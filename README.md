# Job Application Command Centre

> Paste a job description → get a parsed record, an **honest** fit score with résumé
> tailoring, a recruiter outreach draft, and interview prep — all tracked in one
> pipeline. Built on **Lemma SDK** for the Gappy AI × Lemma "Ship to Get Hired" hackathon.

**Problem statement:** AI Job Application Command Centre (CAREER track).
**Real user:** a student / early-career engineer running an active search across LinkedIn,
Wellfound, and referrals — 5–10 new applications a week, no recruiter support.

---

## The hero moment

A job-seeker pastes a JD and clicks **Process job**. One Lemma workflow then:

1. **`jd-analyst`** reads the candidate profile (a Lemma file) and the JD, and returns —
   in one pass — the parsed fields, an honest 0–100 fit score, strengths, gaps, and
   concrete résumé edits for *this* job.
2. **`create_job_record`** persists it as a card that appears on the board immediately.
3. **`outreach-writer`** drafts a non-generic recruiter message (specific hook, two real
   proofs, banned-phrase list).
4. **`interview-coach`** generates five likely questions with talking points anchored in
   the candidate's real projects, plus company context and focus areas.

The card fills in live as each step finishes — no polling, no refresh.

---

## How it uses Lemma SDK (the 5 primitives, meaningfully)

| Primitive | Used as |
| --- | --- |
| **Tables** (`jobs`, `outreach_drafts`, `prep_notes`) | The single source of truth. Shared (non-RLS) so the whole workspace — and the judge — sees one coherent pipeline. FK from drafts/prep → jobs. |
| **Files** (`/profile/candidate-profile.md`) | Built-in RAG. Every agent reads the profile from here to personalize output; the app's Profile page edits it. No background is hard-coded into prompts. |
| **Agents** (`jd-analyst`, `outreach-writer`, `interview-coach`) | Three **orthogonal** judgments, each with a typed `output_schema`, each granted only `/profile:read`. One rich agent per judgment (Lemma's "one step, one agent"). |
| **Functions** (`create_job_record`, `attach_outreach`, `attach_prep`) | The deterministic writes the workflow needs — validate/normalize enums, coordinated create+update, flip `processing_state` to `ready`. |
| **Workflow** (`process-job`) | The spine: `FORM → AGENT → FUNCTION → AGENT → FUNCTION → AGENT → FUNCTION → END`, passing data between steps with JMESPath mappings. |
| **App** (`command-centre`) | A Vite + React + `lemma-sdk` operator UI: kanban pipeline, live detail drawer, profile editor — built on the SDK's React hooks (`useLiveRecords`, `useUpdateRecord`, `useWorkflowStart`, `useCurrentUser`). |

Architecture: **start workflow → agents + functions write tables → app reads tables live.**
No custom backend, no separate database.

---

## Prerequisites

- **Docker Desktop** running (for the local stack), or a **lemma.work** account (cloud).
- The Lemma CLI: `uv tool install lemma-terminal` (or `pip install lemma-terminal`). Verify
  with `lemma --version`.
- An **LLM key** (Anthropic or OpenAI) for the agents to run — see "Configure a model" below.
  The seeded board demos the product without one; the live paste-a-JD loop needs it.

---

## Setup

### Option A — local stack

```bash
# 1. Bring up the stack (Windows PowerShell):
iwr https://raw.githubusercontent.com/lemma-work/lemma-platform/main/install.ps1 | iex
#    (macOS/Linux: curl -fsSL .../install.sh | bash)

# 2. Point the CLI at it and log in
lemma servers select local
lemma auth login

# 3. Create the pod, then import the bundle (dependency-ordered, idempotent upsert)
lemma pods create job-command-centre
lemma pods import ./job-command-centre --dry-run     # validate first
lemma pods import ./job-command-centre
```

### Option B — lemma.work cloud (what the judge accesses)

```bash
lemma servers select cloud
lemma auth login                                     # your lemma.work account
lemma pods create job-command-centre
lemma pods import ./job-command-centre
```

### Model (none needed on cloud)

On **lemma.work cloud the agents run on Lemma's built-in system model** — no API key is
required, and the full `process-job` workflow runs end-to-end out of the box (verified).

To pin your own provider instead (optional): create an org runtime profile and the agents
will use it — `lemma runtime profiles create ANTHROPIC_COMPATIBLE --name Claude --api-key sk-ant-... --default-model claude-3-5-sonnet-latest --model claude-3-5-sonnet-latest`.
On a **local stack**, set `lemma-stack config set LEMMA_ANTHROPIC_API_KEY sk-ant-...` then
`lemma-stack restart`.

### Seed so it demos itself

Records and file bytes do **not** travel through import — this lays down the profile and a
realistic pipeline across every stage:

```bash
lemma pods list            # confirm job-command-centre is active
python ./job-command-centre/seed/seed.py
```

### The app (no-build HTML deploy)

The operator UI is a React app whose **dev project lives in `app-src/`**. It is built into a
single self-contained `apps/command-centre/html.html` (JS + CSS inlined via
`vite-plugin-singlefile`) and deployed by `lemma pods import` as a **no-build HTML app** —
this avoids Lemma's `npm`-spawn step, which fails on Windows.

```bash
# edit / develop the app:
cd job-command-centre/app-src
npm install
npm run dev                 # dev — auto-authed as your CLI session

# rebuild + redeploy after changes:
npm run build
copy dist\index.html ..\apps\command-centre\html.html      # (cp on macOS/Linux)
lemma pods import ../ ../apps/command-centre                # re-imports just the app
```

### Grant the judge access (cloud)

The CLI only *lists* members (`lemma pods members`), so invite the judge from the **web UI**:
open lemma.work → the `job-command-centre` pod → **Members / Share** → invite
`ayush@gappy.ai` as a viewer. (The hackathon also accepts a **screen recording** in place of
live access.) Get the app URL to submit with `lemma apps get command-centre`.

> **Live deployment:** https://command-centre-019f0f72.apps.lemma.work
> Pod `job-command-centre` · org "Keshav Singla" · app status READY · board seeded · full
> `process-job` workflow verified end-to-end.

---

## Verify (end-to-end smoke test)

```bash
# each layer independently
lemma agents run jd-analyst "Senior AI Engineer at Acme. Required: Python, RAG, LangGraph."
lemma functions run create_job_record --data '{"company":"Acme","role":"AI Eng","fit_score":80}'
lemma workflows run process-job --data '{"jd_text":"<paste a real JD>","source":"LinkedIn"}'

# then confirm state
lemma records list jobs --limit 5
lemma records list outreach_drafts --limit 5
```
Open the app → the new job is on the board with fit, outreach, and prep filled in.

---

## What does **not** round-trip through import (set up after)

- **File bytes** — the profile is uploaded by `seed/seed.py` (or the Profile page).
- **Records** — seeded by `seed/seed.py`.
- **Model key** — configured per "Configure a model" above.

Everything else (tables, agents + grants, functions, workflow, app) is in the bundle and
imports idempotently.
