#input_type_name: AttachPrepInput
#output_type_name: AttachPrepResult
#function_name: attach_prep

from typing import Any, Dict, List

from pydantic import BaseModel, Field

from lemma_sdk import FunctionContext, Pod


class AttachPrepInput(BaseModel):
    job_id: str
    questions: List[Dict[str, Any]] = Field(default_factory=list)
    company_context: List[str] = Field(default_factory=list)
    focus_areas: List[str] = Field(default_factory=list)


class AttachPrepResult(BaseModel):
    prep_id: str


async def attach_prep(ctx: FunctionContext, data: AttachPrepInput) -> AttachPrepResult:
    pod = Pod.from_env()
    row = pod.table("prep_notes").create({
        "job_id": data.job_id,
        "questions": data.questions,
        "company_context": data.company_context,
        "focus_areas": data.focus_areas,
    })
    # The enrichment pipeline is complete for this job — mark it ready for the UI.
    pod.table("jobs").update(data.job_id, {"processing_state": "ready"})
    return AttachPrepResult(prep_id=str(row["id"]))
