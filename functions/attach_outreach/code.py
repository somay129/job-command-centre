#input_type_name: AttachOutreachInput
#output_type_name: AttachOutreachResult
#function_name: attach_outreach

from pydantic import BaseModel

from lemma_sdk import FunctionContext, Pod


class AttachOutreachInput(BaseModel):
    job_id: str
    channel: str = "linkedin_dm"
    subject: str = ""
    body: str
    rationale: str = ""


class AttachOutreachResult(BaseModel):
    draft_id: str


_ALLOWED_CHANNEL = {"linkedin_dm", "email", "cold_email"}


async def attach_outreach(ctx: FunctionContext, data: AttachOutreachInput) -> AttachOutreachResult:
    pod = Pod.from_env()
    channel = (data.channel or "").strip().lower()
    if channel not in _ALLOWED_CHANNEL:
        channel = "linkedin_dm"
    row = pod.table("outreach_drafts").create({
        "job_id": data.job_id,
        "channel": channel,
        "subject": data.subject.strip(),
        "body": data.body.strip(),
        "rationale": data.rationale.strip(),
        "approved": False,
    })
    return AttachOutreachResult(draft_id=str(row["id"]))
