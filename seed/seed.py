"""Seed the job-command-centre pod so it demos itself.

Records and file bytes do NOT travel through `lemma pods import`, so this script lays
down: (1) the candidate profile file, and (2) a realistic pipeline of jobs across every
stage, each with a fit analysis, an outreach draft, and interview prep — exactly what the
`process-job` workflow would produce, but deterministic so the app has a populated board
the moment a judge opens it.

Run AFTER `lemma pods import` and after selecting the pod:

    lemma servers select <local|cloud>
    lemma auth login
    lemma pods list                 # confirm job-command-centre is the active pod
    python seed/seed.py

It authenticates exactly like a Lemma function does — `Pod.from_env()` reads the active
CLI session (token + pod id). Set LEMMA_POD_ID to override the target pod.
"""

from __future__ import annotations

import os
import sys
from datetime import date, timedelta
from pathlib import Path

from lemma_sdk import Pod

PROFILE_PATH = "/profile/candidate-profile.md"
PROFILE_SRC = Path(__file__).with_name("candidate-profile.md")

TODAY = date.today()


def _ago(days: int) -> str:
    return (TODAY - timedelta(days=days)).isoformat()


# A real, coherent pipeline — the kind of board this user would actually have.
JOBS = [
    {
        "company": "Perplexity",
        "role": "AI Engineer, Agents",
        "status": "interview",
        "source": "Wellfound",
        "location": "San Francisco / Remote",
        "work_mode": "remote",
        "seniority": "mid",
        "salary_range": "$160k–$210k + equity",
        "required_skills": ["Python", "LLM orchestration", "RAG", "agent frameworks", "production systems"],
        "nice_to_have": ["LangGraph", "evaluation pipelines", "search/ranking"],
        "fit_score": 86,
        "fit_summary": "Strong match — production RAG and multi-agent orchestration are exactly this role's core.",
        "fit_strengths": [
            "Production RAG with re-ranking and evaluation",
            "LangGraph multi-agent orchestration in production",
            "Python-first backend depth (FastAPI, PostgreSQL)",
        ],
        "fit_gaps": ["No large-scale search/ranking experience called out in the JD"],
        "resume_suggestions": [
            "Lead with the production RAG system (re-ranking + eval) — it maps 1:1 to the role.",
            "Quantify the LangGraph agent work: number of agents, throughput, reliability.",
        ],
        "days_ago": 9,
        "outreach": {
            "channel": "linkedin_dm",
            "subject": "",
            "body": "Hi Aravind — the way Perplexity collapses search + synthesis into one agent loop is the problem I've been building toward. I've shipped a production RAG stack (re-ranking + an eval harness so quality is measured, not assumed) and a LangGraph multi-agent system handling real traffic. I'd love 15 minutes to compare notes on how you handle agent reliability at scale — open to it?",
            "rationale": "Leads with a specific hook about their product loop, then two concrete proofs.",
            "approved": True,
        },
        "prep": {
            "questions": [
                {
                    "question": "Walk me through a RAG system you took to production. What broke?",
                    "talking_points": [
                        "The re-ranking layer and why naive top-k retrieval wasn't enough",
                        "The eval harness that caught regressions before users did",
                        "Latency vs. quality trade-offs and how they were tuned",
                    ],
                },
                {
                    "question": "How do you keep a multi-agent system reliable?",
                    "talking_points": [
                        "LangGraph state machine boundaries and explicit failure paths",
                        "Where determinism (functions) replaced LLM judgment to cut variance",
                    ],
                },
                {
                    "question": "Design an agent that answers from a live web index.",
                    "talking_points": [
                        "Retrieval → re-rank → synthesize, with citations as a first-class output",
                        "Guardrails against hallucinated sources",
                    ],
                },
                {
                    "question": "Tell me about a hard architecture decision you owned.",
                    "talking_points": [
                        "The multi-model router (Strategy + Registry + Adapter) at BoockAI",
                        "Why the abstraction paid off when a model was swapped",
                    ],
                },
                {
                    "question": "Where do you draw the line between an agent and a plain function?",
                    "talking_points": [
                        "Judgment vs. determinism; cost and testability of each",
                    ],
                },
            ],
            "company_context": [
                "Search-first product — expect questions on retrieval quality and citations.",
                "Latency is a product feature here; have numbers ready.",
            ],
            "focus_areas": ["Retrieval/ranking fundamentals", "Agent reliability patterns", "Eval methodology"],
        },
    },
    {
        "company": "Cohere",
        "role": "Member of Technical Staff, Applied AI",
        "status": "screening",
        "source": "Referral",
        "location": "Remote (Canada/US)",
        "work_mode": "remote",
        "seniority": "senior",
        "salary_range": "",
        "required_skills": ["Python", "LLM fine-tuning", "RAG", "distributed systems", "5+ yrs experience"],
        "nice_to_have": ["enterprise deployments", "Kubernetes"],
        "fit_score": 62,
        "fit_summary": "Solid on the AI stack, but the role wants 5+ years and distributed-systems depth that isn't proven yet.",
        "fit_strengths": ["RAG and LLM integration depth", "Ships real systems end-to-end"],
        "fit_gaps": ["Seniority bar (5+ yrs)", "No distributed-systems / Kubernetes track record"],
        "resume_suggestions": [
            "Reframe freelance + BoockAI work as continuous shipping to offset the years-of-experience gap.",
            "Surface any scale/concurrency numbers from the voice pipeline to speak to distributed concerns.",
        ],
        "days_ago": 5,
        "outreach": {
            "channel": "email",
            "subject": "RAG + applied AI — quick intro",
            "body": "Hi — a mutual connection pointed me to your Applied AI team. I build production RAG and LLM systems end-to-end (re-ranking, evaluation, and a multi-model router I designed for a live audio pipeline). I know the JD leans senior; what I'd bring is range — I architect and implement, and I ship. Could I send a short portfolio and grab 15 minutes?",
            "rationale": "Names the seniority gap honestly and reframes it as range, backed by a referral.",
            "approved": False,
        },
        "prep": {
            "questions": [
                {
                    "question": "How would you fine-tune vs. RAG for an enterprise knowledge use case?",
                    "talking_points": [
                        "When retrieval beats fine-tuning on cost and freshness",
                        "Eval-driven decision rather than defaulting to one",
                    ],
                },
                {
                    "question": "Describe a system you scaled. What was the bottleneck?",
                    "talking_points": [
                        "Voice pipeline concurrency on +91 numbers and where latency concentrated",
                    ],
                },
                {
                    "question": "How do you approach a problem you haven't solved before?",
                    "talking_points": ["Concrete example of learning distributed concepts on the job"],
                },
                {
                    "question": "What does 'production-ready' mean to you for an LLM feature?",
                    "talking_points": ["Evaluation, guardrails, observability, rollback"],
                },
                {
                    "question": "Why Cohere?",
                    "talking_points": ["Enterprise/applied focus aligns with shipping over research-for-its-own-sake"],
                },
            ],
            "company_context": [
                "Enterprise/applied AI — emphasize reliability and measurable quality.",
                "Likely strong systems bar; prepare to discuss scale even if from smaller systems.",
            ],
            "focus_areas": ["Distributed systems basics", "Fine-tuning vs RAG trade-offs", "Enterprise deployment concerns"],
        },
    },
    {
        "company": "Hebbia",
        "role": "AI Product Engineer",
        "status": "applied",
        "source": "LinkedIn",
        "location": "New York",
        "work_mode": "hybrid",
        "seniority": "mid",
        "salary_range": "$170k–$220k",
        "required_skills": ["Python", "LLM apps", "product sense", "RAG over documents"],
        "nice_to_have": ["TypeScript", "front-end"],
        "fit_score": 74,
        "fit_summary": "Good fit on document-RAG and product instinct; the front-end nice-to-haves are a minor stretch.",
        "fit_strengths": ["Document RAG", "Builds whole products, not just models"],
        "fit_gaps": ["Front-end depth is light vs. the nice-to-haves"],
        "resume_suggestions": [
            "Foreground a product you scoped AND built to show product-engineer range.",
            "Mention React Native/Expo so the front-end nice-to-have isn't a blank.",
        ],
        "days_ago": 2,
        "outreach": {
            "channel": "linkedin_dm",
            "subject": "",
            "body": "Hi — Hebbia's bet that the document is the interface (not a chat box) is the most interesting take on enterprise RAG I've seen. I build document-grounded RAG end-to-end and care as much about the product surface as the retrieval underneath. I'd love to show you a couple of things I've shipped — open to a quick call?",
            "rationale": "Hooks on their distinctive product thesis, then connects RAG + product range.",
            "approved": False,
        },
        "prep": {
            "questions": [
                {
                    "question": "How do you design RAG over long, messy enterprise documents?",
                    "talking_points": ["Chunking + re-ranking choices", "Citations and traceability for trust"],
                },
                {
                    "question": "Show product judgment: what would you cut from a feature?",
                    "talking_points": ["Example of de-scoping to ship the core loop"],
                },
                {
                    "question": "How do you measure whether an AI feature is actually good?",
                    "talking_points": ["Eval harness, user-visible quality metrics"],
                },
                {
                    "question": "Walk through a full product you built solo.",
                    "talking_points": ["Architecture → implementation → ship, end to end"],
                },
                {
                    "question": "How comfortable are you across the stack?",
                    "talking_points": ["Python backend strength; React Native for front-end when needed"],
                },
            ],
            "company_context": [
                "Document-as-interface product thesis — speak to it directly.",
                "Hybrid NYC; product-engineer hybrid of taste + implementation.",
            ],
            "focus_areas": ["Document RAG design", "Product trade-off framing", "Front-end basics"],
        },
    },
    {
        "company": "Modal Labs",
        "role": "Backend Engineer (AI Infra)",
        "status": "saved",
        "source": "Wellfound",
        "location": "Remote",
        "work_mode": "remote",
        "seniority": "mid",
        "salary_range": "",
        "required_skills": ["Python", "infrastructure", "containers", "performance"],
        "nice_to_have": ["Rust", "GPU scheduling"],
        "fit_score": 48,
        "fit_summary": "A stretch — strong Python and Docker, but this is infra-heavy and the AI-application strengths are less central.",
        "fit_strengths": ["Python + Docker fluency", "CLI-native, comfortable in infra-adjacent work"],
        "fit_gaps": ["Deep infra / performance engineering", "No Rust or GPU scheduling"],
        "resume_suggestions": [
            "Only worth tailoring if you want to pivot toward infra — otherwise deprioritize.",
            "If pursuing, lead with Docker/Linux systems work, not the LLM application layer.",
        ],
        "days_ago": 1,
        "outreach": None,
        "prep": None,
    },
    {
        "company": "Adept (acqui-hired)",
        "role": "Research Engineer, Agents",
        "status": "rejected",
        "source": "LinkedIn",
        "location": "San Francisco",
        "work_mode": "onsite",
        "seniority": "senior",
        "salary_range": "",
        "required_skills": ["PyTorch", "RL", "research publications", "agent training"],
        "nice_to_have": ["distributed training"],
        "fit_score": 31,
        "fit_summary": "Poor fit — this is a research role wanting publications and RL/training depth, not applied agent engineering.",
        "fit_strengths": ["Agent intuition from applied work"],
        "fit_gaps": ["No research publications", "No RL / model-training background", "Onsite SF"],
        "resume_suggestions": ["Skip — the profile is applied-engineering, not research. Better to spend the time elsewhere."],
        "days_ago": 14,
        "outreach": None,
        "prep": None,
    },
]


def upsert_profile(pod: Pod) -> None:
    content = PROFILE_SRC.read_text(encoding="utf-8")
    pod.files.write_text(PROFILE_PATH, content)
    print(f"  profile -> {PROFILE_PATH} ({len(content)} bytes)")


def seed_jobs(pod: Pod) -> None:
    jobs_t = pod.table("jobs")
    for j in JOBS:
        row = jobs_t.create({
            "company": j["company"],
            "role": j["role"],
            "status": j["status"],
            "source": j["source"],
            "location": j["location"],
            "work_mode": j["work_mode"],
            "seniority": j["seniority"],
            "salary_range": j["salary_range"],
            "required_skills": j["required_skills"],
            "nice_to_have": j["nice_to_have"],
            "fit_score": j["fit_score"],
            "fit_summary": j["fit_summary"],
            "fit_strengths": j["fit_strengths"],
            "fit_gaps": j["fit_gaps"],
            "resume_suggestions": j["resume_suggestions"],
            "jd_raw": f"(seed) {j['role']} at {j['company']}.",
            "applied_date": _ago(j["days_ago"]),
            "processing_state": "ready",
        })
        job_id = str(row["id"])
        print(f"  job -> {j['company']} / {j['role']} [{j['status']}] fit={j['fit_score']}")

        if j.get("outreach"):
            o = j["outreach"]
            pod.table("outreach_drafts").create({
                "job_id": job_id,
                "channel": o["channel"],
                "subject": o["subject"],
                "body": o["body"],
                "rationale": o["rationale"],
                "approved": o["approved"],
            })
        if j.get("prep"):
            p = j["prep"]
            pod.table("prep_notes").create({
                "job_id": job_id,
                "questions": p["questions"],
                "company_context": p["company_context"],
                "focus_areas": p["focus_areas"],
            })


def main() -> int:
    pod_id = os.environ.get("LEMMA_POD_ID")
    pod = Pod.from_env()
    print(f"Seeding pod{f' {pod_id}' if pod_id else ''} ...")
    print("Profile:")
    upsert_profile(pod)
    print("Jobs:")
    seed_jobs(pod)
    print("Done. Open the app — the pipeline is populated.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
