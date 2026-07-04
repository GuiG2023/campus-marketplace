import os
import json
import logging
from mcp.server.fastmcp import FastMCP

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gatormart.mcp.calendar")

mcp = FastMCP("GatorMart Calendar MCP Server")

CALENDAR_PATH = os.path.join(os.path.dirname(__file__), "mock_calendar.json")

@mcp.tool()
def fetch_user_calendar_context(user_id: int) -> str:
    """Fetches the mock calendar busy slots for a given user.

    Args:
        user_id: The ID of the student user (e.g. 1 or 4).

    Returns:
        A JSON string containing the user's display name and busy slots list.
    """
    logger.info("Fetching calendar for user_id: %d", user_id)
    if not os.path.exists(CALENDAR_PATH):
        logger.error("Mock calendar file not found at: %s", CALENDAR_PATH)
        return json.dumps({"error": "Calendar database missing"})

    try:
        with open(CALENDAR_PATH, "r") as f:
            data = json.load(f)
        
        user_key = str(user_id)
        if user_key in data:
            return json.dumps(data[user_key])
        else:
            return json.dumps({
                "display_name": f"User {user_id}",
                "busy_slots": []
            })
    except Exception as e:
        logger.error("Error reading calendar: %s", str(e))
        return json.dumps({"error": "Failed to load calendar context"})

if __name__ == "__main__":
    mcp.run()
