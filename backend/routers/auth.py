from fastapi import APIRouter, HTTPException, status, Depends
from models.schemas import RegisterRequest, LoginRequest, AuthResponse, UserResponse, ForgotPasswordRequest, ResetPasswordRequest, ProfileUpdateRequest
from utils.supabase_client import get_supabase
from utils.auth_middleware import hash_password, verify_password, create_token, get_current_user
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    db = get_supabase()
    
    # Check if user exists
    existing = db.table("users").select("id").eq("email", req.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password
    from utils.auth_middleware import is_password_strong
    if not is_password_strong(req.password):
        raise HTTPException(
            status_code=400, 
            detail="Password must be at least 6 characters, contain 1 capital letter, 1 number, and 1 special character."
        )

    # Create user
    hashed = hash_password(req.password)
    result = db.table("users").insert({
        "email": req.email,
        "hashed_password": hashed,
        "full_name": req.full_name,
        "role": "user",
    }).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    user = result.data[0]
    token = create_token(user["id"], user["email"], user["role"])
    
    return {
        "access_token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "theme_preference": user.get("theme_preference", "dark")
        }
    }


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    db = get_supabase()
    
    result = db.table("users").select("*").eq("email", req.email).execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user = result.data[0]
    if not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"], user["email"], user["role"])
    
    return {
        "access_token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "theme_preference": user.get("theme_preference", "dark")
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    result = db.table("users").select("id, email, full_name, role, theme_preference").eq("id", current_user["id"]).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")
    return result.data[0]


@router.put("/profile", response_model=UserResponse)
async def update_profile(req: ProfileUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    
    update_data = {}
    if req.full_name is not None:
        update_data["full_name"] = req.full_name
    if req.theme_preference is not None:
        update_data["theme_preference"] = req.theme_preference
        
    if not update_data:
        raise HTTPException(status_code=400, detail="No updates provided")
        
    result = db.table("users").update(update_data).eq("id", current_user["id"]).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update profile")
        
    return result.data[0]


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    db = get_supabase()
    
    # Check if user exists
    result = db.table("users").select("id, email").eq("email", req.email).execute()
    if not result.data:
        # For security, don't reveal if user exists, just return success
        return {"message": "If an account exists with this email, a reset link has been sent."}
    
    user = result.data[0]
    # Create a short-lived token (15 mins)
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "purpose": "password_reset",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "iat": datetime.now(timezone.utc),
    }
    from utils.auth_middleware import JWT_SECRET, JWT_ALGORITHM
    import jwt
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    # Send real email
    from services.email_service import send_reset_email
    import os
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    sent = send_reset_email(user["email"], reset_link)
    
    if not sent:
        # Fallback for dev: still log it
        print(f"\n[DEBUG] Password reset link for {user['email']}: {reset_link}\n")
    
    return {"message": "If an account exists with this email, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    from utils.auth_middleware import decode_token, is_password_strong
    
    # Validate password strength
    if not is_password_strong(req.new_password):
        raise HTTPException(
            status_code=400, 
            detail="Password must be at least 6 characters, contain 1 capital letter, 1 number, and 1 special character."
        )

    try:
        payload = decode_token(req.token)
        if payload.get("purpose") != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid token purpose")
        
        user_id = payload["sub"]
        db = get_supabase()
        
        # Update password
        hashed = hash_password(req.new_password)
        result = db.table("users").update({"hashed_password": hashed}).eq("id", user_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to update password")
            
        return {"message": "Password updated successfully. You can now login with your new password."}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
