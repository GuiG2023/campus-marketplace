# =============================================================
# app/routers/meetup.py
# GatorMart - Meetup Request Router
# Handles meetup scheduling between buyers and sellers
# SFSU-specific feature: all meetups at campus locations
# Author: Binrong Zhu (Backend Engineer)
# Team 3 - CSC648/848 Spring 2026
# =============================================================

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
import jwt
from app.config.db import get_connection

router = APIRouter(prefix="/api/meetup_requests", tags=["meetup"])

SECRET_KEY = "gatormart_secret_2026"

# =============================================================
# Helper: Verify User Identity from JWT Token
# Copied from posts.py as per code standards
# Extracts and decodes Bearer token from request header
# Returns decoded payload (contains user_id and email)
# Raises 401 if token is missing or invalid
# =============================================================
def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# =============================================================
# Request Models
# =============================================================
class MeetupRequest(BaseModel):
    post_id: int
    meetup_location_id: Optional[int] = None
    requested_time: Optional[str] = None

# =============================================================
# POST /api/meetup_requests - Buyer Submits a Meetup Request
# Requires authentication (Bearer token)
# Validates:
#   - Post must exist and be active
#   - Buyer cannot submit request on their own post
# Returns meetup_request_id on success
# =============================================================
@router.post("/")
def create_meetup_request(req: MeetupRequest, authorization: str = Header(None)):
    user = get_current_user(authorization)
    buyer_user_id = user["user_id"]

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Check post exists and is active
            cursor.execute(
                "SELECT post_id, seller_user_id, post_status FROM posts WHERE post_id = %s",
                (req.post_id,)
            )
            post = cursor.fetchone()

            if not post:
                raise HTTPException(status_code=404, detail="Post not found")
            if post["post_status"] != "active":
                raise HTTPException(status_code=400, detail="Post is not active")
            if post["seller_user_id"] == buyer_user_id:
                raise HTTPException(status_code=400, detail="Cannot request meetup on your own post")

            seller_user_id = post["seller_user_id"]

            # Insert meetup request
            cursor.execute(
                """INSERT INTO meetup_requests
                    (post_id, buyer_user_id, seller_user_id, meetup_location_id, requested_time)
                   VALUES (%s, %s, %s, %s, %s)""",
                (req.post_id, buyer_user_id, seller_user_id,
                 req.meetup_location_id, req.requested_time)
            )
            conn.commit()
            meetup_request_id = cursor.lastrowid

        return {"success": True, "meetup_request_id": meetup_request_id}
    finally:
        conn.close()

# =============================================================
# GET /api/meetup_requests/received - Seller Views Incoming Requests
# Requires authentication (Bearer token)
# Returns all meetup requests where current user is the seller
# Includes buyer info, location name, and item title
# =============================================================
@router.get("/received")
def get_received_requests(authorization: str = Header(None)):
    user = get_current_user(authorization)
    seller_user_id = user["user_id"]

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT
                    mr.*,
                    u.display_name  AS buyer_name,
                    u.sfsu_email    AS buyer_email,
                    ml.location_name,
                    p.item_title
                FROM meetup_requests mr
                JOIN users u        ON mr.buyer_user_id      = u.user_id
                JOIN posts p        ON mr.post_id            = p.post_id
                LEFT JOIN meetup_locations ml ON mr.meetup_location_id = ml.meetup_location_id
                WHERE mr.seller_user_id = %s
                ORDER BY mr.created_at DESC""",
                (seller_user_id,)
            )
            results = cursor.fetchall()
        return {"results": results}
    finally:
        conn.close()

# =============================================================
# GET /api/meetup_requests/sent - Buyer Views Their Own Requests
# Requires authentication (Bearer token)
# Returns all meetup requests submitted by the current user
# Includes item title, location name, and request status
# =============================================================
@router.get("/sent")
def get_sent_requests(authorization: str = Header(None)):
    user = get_current_user(authorization)
    buyer_user_id = user["user_id"]

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT
                    mr.*,
                    p.item_title,
                    ml.location_name
                FROM meetup_requests mr
                JOIN posts p        ON mr.post_id            = p.post_id
                LEFT JOIN meetup_locations ml ON mr.meetup_location_id = ml.meetup_location_id
                WHERE mr.buyer_user_id = %s
                ORDER BY mr.created_at DESC""",
                (buyer_user_id,)
            )
            results = cursor.fetchall()
        return {"results": results}
    finally:
        conn.close()

# =============================================================
# GET /api/meetup_requests/locations - List Campus Locations
# Public endpoint - no auth required
# =============================================================
@router.get("/locations")
def list_meetup_locations():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """SELECT meetup_location_id, location_name, location_description, campus_area
                   FROM meetup_locations
                   ORDER BY location_name"""
            )
            results = cursor.fetchall()
        return {"results": results}
    finally:
        conn.close()

# =============================================================
# PATCH /api/meetup_requests/{request_id} - Seller Accepts or Rejects
# Requires authentication (Bearer token)
# Only the seller of the related post can update the status
# Valid status values: accepted, rejected, cancelled, completed
# Returns 404 if request not found or user is not the seller
# =============================================================
@router.patch("/{request_id}")
def update_meetup_status(request_id: int, status: str, authorization: str = Header(None)):
    user = get_current_user(authorization)
    seller_user_id = user["user_id"]

    valid_statuses = ["accepted", "rejected", "cancelled", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Verify request exists and current user is the seller
            cursor.execute(
                """SELECT meetup_request_id FROM meetup_requests
                   WHERE meetup_request_id = %s AND seller_user_id = %s""",
                (request_id, seller_user_id)
            )
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Request not found or not authorized")

            # Update status
            cursor.execute(
                "UPDATE meetup_requests SET request_status = %s WHERE meetup_request_id = %s",
                (status, request_id)
            )
            conn.commit()

        return {"success": True, "status": status}
    finally:
        conn.close()