import os
import sys
import logging
from google.adk.agents import Agent
from google.adk.models import Gemini
from google.adk.tools.mcp_tool import McpToolset
from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams
from mcp import StdioServerParameters

from app.agents.tools import get_safe_meetup_locations, create_meetup_request

logger = logging.getLogger("gatormart.agents.scheduler")

# 1. Resolve Python and Server paths dynamically for Stdio Connection
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")) # application/backend
python_path = os.path.join(base_dir, ".venv", "bin", "python")
server_path = os.path.join(base_dir, "app", "mcp", "server.py")

# Fallback check
if not os.path.exists(python_path):
    python_path = sys.executable

logger.info("Initializing MCP connection: python=%s, server=%s", python_path, server_path)

# 2. Instantiate MCP Toolset
mcp_toolset = McpToolset(
    connection_params=StdioConnectionParams(
        server_params=StdioServerParameters(
            command=python_path,
            args=[server_path]
        )
    )
)

# 3. Define Agent System Instruction
instruction = (
    "You are a Calendar-Aware Meetup Scheduling Concierge for GatorMart, the SFSU Campus Marketplace.\n"
    "Your goal is to coordinate a safe and mutually convenient transaction meetup time and location on campus between a buyer and a seller.\n\n"
    "Instructions:\n"
    "1. You are given a request specifying: post_id, buyer_user_id, seller_user_id, and the preferred timeframe (e.g., 'Friday afternoon').\n"
    "2. Use the `fetch_user_calendar_context` tool to retrieve the schedules for BOTH the buyer (buyer_user_id) and the seller (seller_user_id).\n"
    "3. Analyze their calendar busy slots. Find overlapping free windows within their preferred timeframe (e.g. 2026-07-03 afternoon).\n"
    "4. Use the `get_safe_meetup_locations` tool to fetch authorized campus safe meetup zones.\n"
    "5. Recommend a specific date, time (format: 'YYYY-MM-DD HH:MM:SS'), and safe location from the fetched zones.\n"
    "6. Once the schedule and location are matched, call `create_meetup_request` to insert the request into the database. You must run this action to commit the booking.\n"
    "7. Answer in clean English, explaining the final scheduled slot or listing the matching recommendations."
)

# 4. Instantiate Scheduler Agent
scheduler_agent = Agent(
    name="scheduler_agent",
    model=Gemini(
        model="gemini-flash-latest",
    ),
    instruction=instruction,
    tools=[mcp_toolset, get_safe_meetup_locations, create_meetup_request],
)
