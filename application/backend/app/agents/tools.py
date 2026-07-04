import logging
from app.config.db import get_connection

# Configure logger
logger = logging.getLogger("gatormart.agents.tools")

def update_post_status(post_id: int, status: str) -> bool:
    """Updates the status of a post in the database.

    Args:
        post_id: The ID of the post.
        status: The target status ('active' or 'denied').

    Returns:
        True if the update was successful, False otherwise.
    """
    logger.info("Updating post_id %d status to %s", post_id, status)
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = "UPDATE posts SET post_status = %s WHERE post_id = %s"
            affected = cursor.execute(sql, (status, post_id))
            conn.commit()
            logger.info("Database update completed. Affected rows: %d", affected)
            return affected > 0
    except Exception as e:
        logger.error("Failed to update post status in DB: %s", str(e))
        return False
    finally:
        conn.close()

def get_safe_meetup_locations() -> list:
    """Fetches the list of authorized safe campus meetup locations for transactions.

    Returns:
        A list of dictionaries containing location details.
    """
    logger.info("Fetching authorized campus meetup locations.")
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT meetup_location_id, location_name, location_description, campus_area FROM meetup_locations")
            results = cursor.fetchall()
            logger.info("Retrieved %d locations.", len(results))
            return results
    except Exception as e:
        logger.error("Failed to fetch meetup locations: %s", str(e))
        return []
    finally:
        conn.close()

def create_meetup_request(post_id: int, buyer_user_id: int, seller_user_id: int, meetup_location_id: int, requested_time: str) -> dict:
    """Creates a new meetup request (transaction schedule booking) in the database.

    Args:
        post_id: The ID of the product listing post.
        buyer_user_id: The ID of the buyer student user.
        seller_user_id: The ID of the seller student user.
        meetup_location_id: The ID of the chosen safe meetup location.
        requested_time: The selected meetup date and time (format: 'YYYY-MM-DD HH:MM:SS').

    Returns:
        A dictionary indicating success status and the created meetup request ID.
    """
    logger.info("Creating meetup request for post %d, buyer %d, seller %d at location %d, time %s", 
                post_id, buyer_user_id, seller_user_id, meetup_location_id, requested_time)
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO meetup_requests 
                (post_id, buyer_user_id, seller_user_id, meetup_location_id, request_status, requested_time)
                VALUES (%s, %s, %s, %s, 'pending', %s)
            """
            cursor.execute(sql, (post_id, buyer_user_id, seller_user_id, meetup_location_id, requested_time))
            conn.commit()
            meetup_request_id = cursor.lastrowid
            logger.info("Meetup request created successfully. ID: %d", meetup_request_id)
            return {"success": True, "meetup_request_id": meetup_request_id}
    except Exception as e:
        logger.error("Failed to create meetup request in DB: %s", str(e))
        return {"success": False, "error": str(e)}
    finally:
        conn.close()
