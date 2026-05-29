# =============================================================
# app/routers/messages.py
# GatorMart - Messaging Router
# Handles buyer-seller conversations and individual messages
# Author: Guiran Liu / Binrong Zhu
# Team 3 - CSC648/848 Spring 2026
# =============================================================

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import jwt
from app.config.db import get_connection

router = APIRouter(prefix="/api", tags=["messages"])

SECRET_KEY = "gatormart_secret_2026"

# =============================================================
# Helper: Verify User Identity from JWT Token
# (copied from posts.py / meetup.py per code standards)
# =============================================================
def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# =============================================================
# Request models
# =============================================================
class StartConversationRequest(BaseModel):
    post_id: int

class SendMessageRequest(BaseModel):
    body: str

# =============================================================
# POST /api/conversations
# Start (or fetch existing) conversation about a post.
# The caller is the buyer; seller comes from the post.
# Idempotent: calling twice returns the same conversation_id.
# =============================================================
@router.post("/conversations")
def start_conversation(req: StartConversationRequest, authorization: str = Header(None)):
    user = get_current_user(authorization)
    buyer_user_id = user["user_id"]

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT post_id, seller_user_id, post_status FROM posts WHERE post_id = %s",
                (req.post_id,)
            )
            post = cursor.fetchone()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found")
            if post["seller_user_id"] == buyer_user_id:
                raise HTTPException(status_code=400, detail="Cannot message yourself")

            seller_user_id = post["seller_user_id"]

            # Try to find existing convo first
            cursor.execute(
                """SELECT conversation_id FROM conversations
                   WHERE post_id = %s AND buyer_user_id = %s""",
                (req.post_id, buyer_user_id)
            )
            existing = cursor.fetchone()
            if existing:
                return {"conversation_id": existing["conversation_id"], "created": False}

            # Otherwise create it
            cursor.execute(
                """INSERT INTO conversations (post_id, buyer_user_id, seller_user_id)
                   VALUES (%s, %s, %s)""",
                (req.post_id, buyer_user_id, seller_user_id)
            )
            conn.commit()
            return {"conversation_id": cursor.lastrowid, "created": True}
    finally:
        conn.close()

# =============================================================
# GET /api/conversations
# List all conversations the current user is in.
# Each row tells you which role you play (buyer/seller),
# plus the post info, the other user's name, and a preview.
# Frontend uses `role` to split into Buying / Selling tabs.
# =============================================================
@router.get("/conversations")
def list_conversations(authorization: str = Header(None)):
    user = get_current_user(authorization)
    user_id = user["user_id"]

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT
                    c.conversation_id,
                    c.post_id,
                    c.buyer_user_id,
                    c.seller_user_id,
                    c.updated_at,
                    p.item_title,
                    p.image_url,
                    p.item_price,
                    CASE
                      WHEN c.buyer_user_id = %s THEN 'buyer'
                      ELSE 'seller'
                    END AS role,
                    CASE
                      WHEN c.buyer_user_id = %s THEN seller.display_name
                      ELSE buyer.display_name
                    END AS other_user_name,
                    (SELECT body FROM messages m
                    WHERE m.conversation_id = c.conversation_id
                    ORDER BY m.created_at DESC LIMIT 1) AS last_message,
                    (SELECT created_at FROM messages m
                    WHERE m.conversation_id = c.conversation_id
                    ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
                    (SELECT sender_user_id FROM messages m
                    WHERE m.conversation_id = c.conversation_id
                    ORDER BY m.created_at DESC LIMIT 1) AS last_sender_id
                FROM conversations c
                JOIN posts p   ON c.post_id = p.post_id
                JOIN users buyer  ON c.buyer_user_id  = buyer.user_id
                JOIN users seller ON c.seller_user_id = seller.user_id
                WHERE c.buyer_user_id = %s OR c.seller_user_id = %s
                ORDER BY COALESCE(last_message_at, c.updated_at) DESC""",
                (user_id, user_id, user_id, user_id)
            )
            results = cursor.fetchall()
        return {"results": results}
    finally:
        conn.close()

# =============================================================
# GET /api/conversations/{conversation_id}/messages
# Fetch all messages in a thread.
# Only accessible to participants.
# =============================================================
@router.get("/conversations/{conversation_id}/messages")
def get_messages(conversation_id: int, authorization: str = Header(None)):
    user = get_current_user(authorization)
    user_id = user["user_id"]

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Verify membership
            cursor.execute(
                """SELECT buyer_user_id, seller_user_id, post_id
                   FROM conversations WHERE conversation_id = %s""",
                (conversation_id,)
            )
            convo = cursor.fetchone()
            if not convo:
                raise HTTPException(status_code=404, detail="Conversation not found")
            if user_id not in (convo["buyer_user_id"], convo["seller_user_id"]):
                raise HTTPException(status_code=403, detail="Not a participant")

            cursor.execute(
                """SELECT message_id, sender_user_id, body, created_at
                   FROM messages
                   WHERE conversation_id = %s
                   ORDER BY created_at ASC""",
                (conversation_id,)
            )
            messages = cursor.fetchall()
        return {
            "conversation_id": conversation_id,
            "post_id": convo["post_id"],
            "results": messages
        }
    finally:
        conn.close()

# =============================================================
# POST /api/conversations/{conversation_id}/messages
# Send a message in a thread. Only participants can post.
# Bumps conversations.updated_at automatically via ON UPDATE.
# =============================================================
@router.post("/conversations/{conversation_id}/messages")
def send_message(conversation_id: int, req: SendMessageRequest, authorization: str = Header(None)):
    user = get_current_user(authorization)
    user_id = user["user_id"]

    if not req.body or not req.body.strip():
        raise HTTPException(status_code=400, detail="Message body required")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT buyer_user_id, seller_user_id FROM conversations
                   WHERE conversation_id = %s""",
                (conversation_id,)
            )
            convo = cursor.fetchone()
            if not convo:
                raise HTTPException(status_code=404, detail="Conversation not found")
            if user_id not in (convo["buyer_user_id"], convo["seller_user_id"]):
                raise HTTPException(status_code=403, detail="Not a participant")

            cursor.execute(
                """INSERT INTO messages (conversation_id, sender_user_id, body)
                   VALUES (%s, %s, %s)""",
                (conversation_id, user_id, req.body.strip())
            )
            # Touch conversation so it sorts to top
            cursor.execute(
                "UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE conversation_id = %s",
                (conversation_id,)
            )
            conn.commit()
            message_id = cursor.lastrowid

        return {"success": True, "message_id": message_id}
    finally:
        conn.close()