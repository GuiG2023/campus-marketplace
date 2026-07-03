# =============================================================
# app/routers/posts.py
# GatorMart - Posts Router
# Handles marketplace listing creation and retrieval
# Includes secure image upload with file type validation
# Author: Guiran Liu (Backend Lead)
# Team 3 - CSC648/848 Spring 2026
# =============================================================

from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import jwt
import uuid
import os
from PIL import Image
import io
from app.config.db import get_connection
from typing import Optional, List


router = APIRouter(prefix="/api/posts", tags=["posts"])

SECRET_KEY = "gatormart_secret_2026"

# Allowed image types - both extension and magic bytes
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB in bytes

# Directory to save uploaded images
UPLOAD_DIR = "app/static/images"

# =============================================================
# Helper: Verify User Identity from JWT Token
# Extracts and decodes the Bearer token from request header
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
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# =============================================================
# Helper: Validate and Save Uploaded Image
# Security checks:
#   1. File extension must be in allowed list
#   2. File size must be under 2MB
#   3. File content verified as real image using Pillow
#      (prevents fake .png that is actually .exe)
#   4. File renamed to random UUID to prevent path attacks
# Returns the saved file URL or raises HTTPException
# =============================================================

def save_image(file: UploadFile) -> str:
    # 1. Check file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # 2. Read file content
    contents = file.file.read()

    # 3. Check file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max size is 2MB")

    # 4. Verify it is a real image using Pillow (magic bytes check)
    # This catches files that are renamed to look like images but are not
    try:
        img = Image.open(io.BytesIO(contents))
        img.verify()  # Raises exception if not a valid image
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # 5. Save with random UUID filename to prevent path traversal attacks
    unique_filename = f"{uuid.uuid4()}{ext}"
    save_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(save_path, "wb") as f:
        f.write(contents)

    # Return the public URL path
    return f"/static/images/{unique_filename}"


# =============================================================
# POST /api/posts - Create a New Listing
# Accepts multipart/form-data (supports file upload)
# Requires authentication (Bearer token)
# Automatically assigns logged-in user as seller
# Image is optional - validated and saved if provided
# =============================================================

@router.post("/")
async def create_post(
    item_title: str = Form(...),
    item_description: str = Form(...),
    item_price: float = Form(...),
    category_id: int = Form(...),
    item_condition: str = Form("Good"),
    image1: Optional[UploadFile] = File(None),
    image2: Optional[UploadFile] = File(None),
    image3: Optional[UploadFile] = File(None),
    image4: Optional[UploadFile] = File(None),
    authorization: str = Header(None)
):
    user = get_current_user(authorization)

    # Handle image upload if provided
    image_url = None
    urls = []
    for img in [image1, image2, image3, image4]:
        if img and img.filename:
            urls.append(save_image(img))
    if urls:
        image_url = ",".join(urls)

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """INSERT INTO posts 
                   (category_id, seller_user_id, item_title, item_description,
                    item_price, item_condition, post_status, image_url)
                   VALUES (%s, %s, %s, %s, %s, %s, 'pending', %s)""",
                (category_id, user["user_id"], item_title,
                 item_description, item_price, item_condition, image_url)
            )
            conn.commit()
            post_id = cursor.lastrowid
    finally:
        conn.close()

    # Trigger AI Moderation Graph
    try:
        from google.adk.apps import App
        from google.adk.runners import InMemoryRunner
        from app.agents import moderation_workflow
        from google.genai import types
        import json

        app_container = App(name="app", root_agent=moderation_workflow)
        runner = InMemoryRunner(app=app_container)
        session = await runner.session_service.create_session(
            app_name="app", user_id=f"user_{user['user_id']}"
        )

        post_payload = {
            "post_id": post_id,
            "item_title": item_title,
            "item_description": item_description,
            "image_url": image_url
        }

        async for event in runner.run_async(
            user_id=f"user_{user['user_id']}",
            session_id=session.id,
            new_message=types.Content(
                role="user",
                parts=[types.Part.from_text(text=json.dumps(post_payload))]
            )
        ):
            pass
    except Exception as mod_err:
        # Fallback to active status in case of API or model limits
        from app.agents.tools import update_post_status
        update_post_status(post_id, "active")

    # Fetch and return final status
    final_status = "active"
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT post_status FROM posts WHERE post_id = %s", (post_id,))
            res = cursor.fetchone()
            if res:
                final_status = res["post_status"]
    finally:
        conn.close()

    return {"success": True, "post_id": post_id, "image_url": image_url, "post_status": final_status}

# =============================================================
# G
# =============================================================
@router.get("/search")
def search_posts(category_id: Optional[int] = None, keyword: Optional[str] = None, seller_user_id: Optional[int] = None):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            query = """
                SELECT p.*, c.category_name,
                       u.display_name AS seller_name,
                       u.sfsu_email AS seller_email
                FROM posts p
                JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN users u ON p.seller_user_id = u.user_id
                WHERE 1=1
            """
            params = []

            # Only show active posts for public search
            if not seller_user_id:
                query += " AND p.post_status = 'active'"

            if category_id:
                query += " AND p.category_id = %s"
                params.append(category_id)

            if keyword:
                query += """
                    AND (
                        p.item_title LIKE %s
                        OR p.item_description LIKE %s
                        OR c.category_name LIKE %s
                    )
                """
                search_term = f"%{keyword}%"
                params.extend([search_term, search_term, search_term])

            # Filter by seller if seller_user_id is provided
            if seller_user_id:
                query += " AND p.seller_user_id = %s"
                params.append(seller_user_id)

            query += " ORDER BY p.created_at DESC"

            cursor.execute(query, params)
            results = cursor.fetchall()

        return {
            "count": len(results),
            "results": results
        }
    finally:
        conn.close()



# =============================================================
# GET /api/posts/{post_id} - Get Post Detail
# Public endpoint - no authentication required
# Returns full post info including:
#   - category name
#   - seller display name
#   - seller SFSU email (SFSU-specific feature, M2 req 14.1)
# =============================================================

@router.get("/{post_id}")
def get_post(post_id: int):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT p.*, c.category_name,
                       u.display_name AS seller_name,
                       u.sfsu_email   AS seller_email
                FROM posts p
                JOIN categories c ON p.category_id = c.category_id
                LEFT JOIN users u  ON p.seller_user_id = u.user_id
                WHERE p.post_id = %s
            """, (post_id,))
            post = cursor.fetchone()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        return post
    finally:
        conn.close()

# =============================================================
# PATCH /api/posts/{post_id}/status - Update Post Status
# Requires authentication - only post owner can update
# Used by ManagePosts to mark sold, archive, restore
# =============================================================
@router.patch("/{post_id}/status")
def update_post_status(
    post_id: int,
    status_data: dict,
    authorization: str = Header(None)
):
    user = get_current_user(authorization)
    new_status = status_data.get("post_status")

    if new_status not in ["active", "archived", "sold"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Verify post belongs to current user
            cursor.execute(
                "SELECT seller_user_id FROM posts WHERE post_id = %s",
                (post_id,)
            )
            post = cursor.fetchone()
            if not post:
                raise HTTPException(status_code=404, detail="Post not found")
            if post["seller_user_id"] != user["user_id"]:
                raise HTTPException(status_code=403, detail="Not authorized")

            cursor.execute(
                "UPDATE posts SET post_status = %s WHERE post_id = %s",
                (new_status, post_id)
            )
            conn.commit()
        return {"success": True, "post_id": post_id, "post_status": new_status}
    finally:
        conn.close()
    

    user = get_current_user(authorization)

