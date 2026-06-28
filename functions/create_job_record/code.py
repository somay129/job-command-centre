#input_type_name: CreateJobInput
#output_type_name: CreateJobResult
#function_name: create_job_record

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field

from lemma_sdk import FunctionContext, Pod


class CreateJobInput(BaseModel):
    company: str
    role: str
    source: str = "Manual"
    jd_raw: str = ""
    seniority: str = "unknown"
    location: str = ""
    work_mode: str = "unknown"
    salary_range: str = ""
    required_skills: List[str] = Field(default_factory=list)
    nice_to_have: List[str] = Field(default_factory=list)
    fit_score: Optional[int] = None
    fit_summary: str = ""
    fit_strengths: List[str] = Field(default_factory=list)
    fit_gaps: List[str] = Field(default_factory=list)
    resume_suggestions: List[str] = Field(default_factory=list)


class CreateJobResult(BaseModel):
    job_id: str


_ALLOWED_WORK_MODE = {"remote", "hybrid", "onsite", "unknown"}
_ALLOWED_SENIORITY = {
    "intern", "junior", "mid", "senior", "lead", "staff", "principal", "unknown",
}


def _clamp_enum(value: str, allowed: set, fallback: str) -> str:
    v = (value or "").strip().lower()
    return v if v in allowed else fallback


def _clamp_score(value: Optional[int]) -> Optional[int]:
    if value is None:
        return None
    try:
        return max(0, min(100, int(value)))
    except (TypeError, ValueError):
        return None


async def create_job_record(ctx: FunctionContext, data: CreateJobInput) -> CreateJobResult:
    pod = Pod.from_env()
    row = pod.table("jobs").create({
        "company": data.company.strip() or "Unknown",
        "role": data.role.strip() or "Unknown role",
        "status": "applied",
        "source": data.source.strip() or "Manual",
        "location": data.location.strip(),
        "work_mode": _clamp_enum(data.work_mode, _ALLOWED_WORK_MODE, "unknown"),
        "seniority": _clamp_enum(data.seniority, _ALLOWED_SENIORITY, "unknown"),
        "salary_range": data.salary_range.strip(),
        "required_skills": data.required_skills,
        "nice_to_have": data.nice_to_have,
        "fit_score": _clamp_score(data.fit_score),
        "fit_summary": data.fit_summary.strip(),
        "fit_strengths": data.fit_strengths,
        "fit_gaps": data.fit_gaps,
        "resume_suggestions": data.resume_suggestions,
        "jd_raw": data.jd_raw,
        "applied_date": date.today().isoformat(),
        "processing_state": "processing",
    })
    return CreateJobResult(job_id=str(row["id"]))
