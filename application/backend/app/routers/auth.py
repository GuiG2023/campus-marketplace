# =============================================================
# app/routers/auth.py
# GatorMart - User Authentication Router
# Handles user registration and login for SFSU Marketplace
# Author: Guiran Liu 
# Team 3 - CSC648/848 Spring 2026
# =============================================================
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import bcrypt # Password hashing library
import jwt    # JSON Web Token for session management
import datetime
from app.config.db import get_connection

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = "gatormart_secret_2026"
# =============================================================
# Request Models
# Define the expected JSON structure from the frontend
# =============================================================
# ── Request Models ──────────────────────────────────────────
class RegisterRequest(BaseModel):
    sfsu_email: str        # must be sfsu.edu
    display_name: str      
    password: str

class LoginRequest(BaseModel):
    sfsu_email: str
    password: str

# =============================================================
# Helper: Generate JWT Token
# Called after successful registration or login
# Token contains user_id and email, expires in 7 days
# Frontend stores this token and sends it with every request
# =============================================================
# ── Helper ──────────────────────────────────────────────────
def make_token(user_id: int, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

# =============================================================
# POST /api/auth/register - User Registration
# Steps:
#   1. Validate SFSU email format
#   2. Check if email already exists in database
#   3. Hash password using bcrypt before storing
#   4. Insert new user into database
#   5. Return JWT token and user info
# =============================================================

@router.post("/register")
def register(req: RegisterRequest):
    # 1. SFSU email validation
    if not req.sfsu_email.endswith("@sfsu.edu"):
        raise HTTPException(status_code=400, detail="Must use SFSU email")
    
    # 2. Hash password
    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # 3. Check if email already exists
            cursor.execute(
                "SELECT user_id FROM users WHERE sfsu_email = %s",
                (req.sfsu_email,)
            )
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # 4. Insert new user
            cursor.execute(
                """INSERT INTO users (sfsu_email, display_name, password_hash)
                   VALUES (%s, %s, %s)""",
                (req.sfsu_email, req.display_name, hashed)
            )
            conn.commit()
            user_id = cursor.lastrowid
        
        token = make_token(user_id, req.sfsu_email)
        return {
            "success": True,
            "token": token,
            "user": {
                "user_id": user_id,
                "sfsu_email": req.sfsu_email,
                "display_name": req.display_name
            }
        }
    finally:
        conn.close()

# =============================================================
# POST /api/auth/login - User Login
# Steps:
#   1. Find user by email (must be active account)
#   2. Verify password against stored hash using bcrypt
#   3. Return JWT token and user info on success
# =============================================================

@router.post("/login")
def login(req: LoginRequest):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM users WHERE sfsu_email = %s AND account_status = 'active'",
                (req.sfsu_email,)
            )
            user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password
        if not bcrypt.checkpw(req.password.encode(), user["password_hash"].encode()):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        token = make_token(user["user_id"], user["sfsu_email"])
        return {
            "success": True,
            "token": token,
            "user": {
                "user_id": user["user_id"],
                "sfsu_email": user["sfsu_email"],
                "display_name": user["display_name"]
            }
        }
    finally:
        conn.close()