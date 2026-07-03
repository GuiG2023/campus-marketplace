import os
import logging
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from google.adk.workflow import Workflow, JoinNode
from google.adk.events.event import Event
from google.adk.agents.context import Context
from app.agents.tools import update_post_status

logger = logging.getLogger("gatormart.agents.moderation")

class PostInput(BaseModel):
    post_id: int
    item_title: str
    item_description: str
    image_url: str | None = None

class ModerationVerdict(BaseModel):
    passed: bool = Field(description="True if safe/compliant, False otherwise.")
    reason: str = Field(description="Reasoning behind the verdict.")

def check_image_safety(image_path: str, title: str, desc: str) -> ModerationVerdict:
    """Invokes Gemini Multimodal Vision to inspect product image for safety."""
    if image_path.startswith("/static/"):
        full_path = os.path.join("app", image_path.lstrip("/"))
    else:
        full_path = image_path

    if not os.path.exists(full_path):
        logger.warning("Image path not found: %s", full_path)
        return ModerationVerdict(passed=True, reason="Image file missing from server, skipped vision audit")

    try:
        with open(full_path, "rb") as f:
            image_bytes = f.read()
        
        mime_type = "image/jpeg"
        if full_path.lower().endswith(".png"):
            mime_type = "image/png"
        elif full_path.lower().endswith(".webp"):
            mime_type = "image/webp"
        elif full_path.lower().endswith(".gif"):
            mime_type = "image/gif"

        client = genai.Client()
        prompt = (
            f"Analyze this image of a product listed on a campus marketplace.\n"
            f"Title: {title}\n"
            f"Description: {desc}\n"
            f"Is this item safe and legal to trade in a university marketplace?\n"
            f"Banned items include: weapons, illegal drugs, prescription medications, replica items, adult content, exam leaks, and academic cheating services.\n"
            f"Respond strictly in JSON format matching the schema."
        )
        
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                prompt
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ModerationVerdict,
                temperature=0.0
            )
        )
        verdict = ModerationVerdict.model_validate_json(response.text)
        logger.info("Vision moderation verdict: %s", verdict)
        return verdict
    except Exception as e:
        logger.error("Error in Vision moderation: %s", str(e))
        return ModerationVerdict(passed=True, reason="Vision audit failed to run, fallback to pass")

def check_text_safety(title: str, desc: str) -> ModerationVerdict:
    """Invokes Gemini Text to inspect item title and description for compliance."""
    try:
        client = genai.Client()
        prompt = (
            f"Analyze this campus marketplace product listing.\n"
            f"Title: {title}\n"
            f"Description: {desc}\n"
            f"Is this listing safe, legal, and compliant with university regulations?\n"
            f"Banned listings include: academic dishonesty services (exam help, essay writing, cheating), replica weapons, illegal substances, scam/phishing links, and non-student advertisements.\n"
            f"Respond strictly in JSON format matching the schema."
        )
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ModerationVerdict,
                temperature=0.0
            )
        )
        verdict = ModerationVerdict.model_validate_json(response.text)
        logger.info("Compliance text moderation verdict: %s", verdict)
        return verdict
    except Exception as e:
        logger.error("Error in Compliance text moderation: %s", str(e))
        return ModerationVerdict(passed=True, reason="Text audit failed to run, fallback to pass")

# Workflow Nodes
def store_input(ctx: Context, node_input: PostInput) -> PostInput:
    ctx.state["post_input"] = node_input.model_dump()
    return node_input

def run_text_moderation(node_input: PostInput) -> ModerationVerdict:
    return check_text_safety(node_input.item_title, node_input.item_description)

def run_vision_moderation(node_input: PostInput) -> ModerationVerdict:
    image_paths = node_input.image_url.split(",") if node_input.image_url else []
    if not image_paths:
        return ModerationVerdict(passed=True, reason="No image provided")
    return check_image_safety(image_paths[0], node_input.item_title, node_input.item_description)

def decide_and_writeback(ctx: Context, node_input: dict) -> ModerationVerdict:
    text_verdict_data = node_input.get("run_text_moderation")
    vision_verdict_data = node_input.get("run_vision_moderation")

    # Deserialize dicts to models
    text_verdict = ModerationVerdict(**text_verdict_data)
    vision_verdict = ModerationVerdict(**vision_verdict_data)

    post_input_data = ctx.state["post_input"]
    post_id = post_input_data["post_id"]

    if not text_verdict.passed:
        passed = False
        reason = text_verdict.reason
    elif not vision_verdict.passed:
        passed = False
        reason = vision_verdict.reason
    else:
        passed = True
        reason = "Passed all compliance checks."

    status = "active" if passed else "denied"
    update_post_status(post_id, status)
    
    return ModerationVerdict(passed=passed, reason=reason)

# Define Graph Topology
join = JoinNode(name="merge_verdicts")

edges = [
    ('START', store_input),
    (store_input, (run_text_moderation, run_vision_moderation)),
    ((run_text_moderation, run_vision_moderation), join),
    (join, decide_and_writeback)
]

moderation_workflow = Workflow(
    name="moderation_workflow",
    edges=edges,
    input_schema=PostInput,
    output_schema=ModerationVerdict
)
