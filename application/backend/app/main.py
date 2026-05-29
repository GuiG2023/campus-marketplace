from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, posts, meetup, messages
from fastapi.staticfiles import StaticFiles
import os
# ============================================================
# GatorMart Backend - Main Application Entry Point
# This file defines all API endpoints for the GatorMart
# SFSU Student Marketplace backend.
# ============================================================

#init setup FastAPI application

app = FastAPI()


app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(meetup.router)
app.include_router(messages.router)

# Serve uploaded images as static files
os.makedirs("app/static/images", exist_ok=True)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Configure CORS (Cross-Origin Resource Sharing)
# allow_origins=["*"] means any domain can access this API

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# M0 - Team Info Endpoints
# Setup during Milestone 0 for team about page
# ============================================================


# Static team member data --about page

TEAM = [
    {
        "id": 1,
        "name": "Joe Bowen",
        "role": "Team Lead",
        "email": "josephb333@gmail.com",
        "github": "josephb333",
        "discord": "Josephb333"
    },
    {
        "id": 2,
        "name": "Kyler Ayala",
        "role": "Integration / Dev Engineer",
        "email": "ksimmonsayala@sfsu.edu",
        "github": "Kyler2424",
        "discord": "Kylersimmonsayala"
    },
    {
        "id": 3,
        "name": "Bart Beltran",
        "role": "Frontend Lead",
        "email": "bartbeltran1@gmail.com",
        "github": "BARTBELTRAN",
        "discord": "bart14207"
    },
    {
        "id": 4,
        "name": "Guiran Liu",
        "role": "Backend Lead",
        "email": "gliu@sfsu.edu",
        "github": "GuiG2023",
        "discord": "guiranl"
    },
    {
        "id": 5,
        "name": "Marcelo Delgado",
        "role": "Frontend Engineer",
        "email": "mdelgado9@sfsu.edu",
        "github": "marcelodelgado07",
        "discord": "marcelouzuhiko"
    },
    {
        "id": 6,
        "name": "Andres Pineda",
        "role": "GitHub Master & Assistant Integration Engineer",
        "email": "adavidpineda60@gmail.com",
        "github": "GoldenLazer",
        "discord": "Golden_lazer"
    },
    {
        "id": 7,
        "name": "Binrong Zhu",
        "role": "Backend Engineer",
        "email": "bzhu2@sfsu.edu",
        "github": "Binrongz",
        "discord": "Pandaz2023"
    }
]

#Root endpoint - confirms the backend is running.
@app.get("/")
def root():
    return {"status": "ok", "message": "Team03 Backend Running"}

#Health check endpoint - used to verify the API is alive.
@app.get("/api/health")
def health():
    return {"status": "ok"}

# Returns the list of all team members.
@app.get("/api/team")
def get_team():
    return TEAM

# ============================================================
# M2 - Vertical Prototype (VP) Endpoints
# Search functionality for <GatorMart>  marketplace

# Architecture: MVC Pattern
# - This file = Controller (handles requests and business logic)
# - app/config/db.py = Model (handles database connection)
# - React frontend = View (handles display)
# ============================================================


# Import database connection function
from app.config.db import get_connection

# Returns all available product categories.  
# Used by the frontend to populate the category dropdown menu.

@app.get("/api/categories")
def get_categories():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT category_id, category_name FROM categories")
            results = cursor.fetchall()
        return {"results": results}
    finally:
         # Always close the connection to avoid memory leaks
        conn.close()

# search api
# Main search endpoint for the marketplace.

"""
Supports 4 search scenarios (as defined in M2 architecture doc):
T1 - No params:        returns ALL active posts
T2 - category_id only: filters by category
T3 - keyword only:     LIKE search on title + description
T4 - both params:      category filter AND keyword search

Query params:
        category_id (int, optional): category to filter by 
        keyword     (str, optional): search keyword 

    Response format :
    {
        "count": 2,
        "results": [
            {
                "post_id": 1,
                "item_title": "MacBook Pro",
                "item_price": 800.00,
                "item_description": "Good condition laptop",
                "item_condition": "Good",
                "image_url": "https://...",  # null if no image 
                "post_status": "active",
                "created_at": "2026-03-20T10:00:00",
                "category_id": 2,
                "category_name": "Electronics"
            }
        ]
    }

"""

@app.get("/api/posts/search")
def search_posts(category_id: int = None, keyword: str = None):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Base SQL query with JOIN to get category_name
            # This avoids frontend needing a separate request for category names
            sql = """
                SELECT 
                    p.post_id,
                    p.item_title,
                    p.item_description,
                    p.item_price,
                    p.item_condition,
                    p.image_url,
                    p.post_status,
                    p.created_at,
                    p.category_id,
                    c.category_name,
                    CONCAT(p.item_title, ' ', p.item_description) AS searchspace
                FROM posts p
                JOIN categories c ON p.category_id = c.category_id
                WHERE p.post_status = 'active'
            """
            # List to hold query parameters safely
            params = []

            # T2 / T4: Add category filter if category_id is provided
            if category_id is not None:
                sql += " AND p.category_id = %s"
                params.append(category_id)

            # T3 / T4: Add keyword search if keyword is provided
            # CONCAT merges title and description into one searchable string
            if keyword:
                sql += " HAVING searchspace LIKE %s"
                params.append(f"%{keyword}%")

            # Always sort by newest first
            sql += " ORDER BY p.created_at DESC"

            cursor.execute(sql, params)
            results = cursor.fetchall()

        # Return count + results , count is shown as "X items found" on the frontend
        return {"count": len(results), "results": results}
    finally:
        # close the connection
        conn.close()