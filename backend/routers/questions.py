from fastapi import APIRouter, Depends, Query
from typing import Optional
from utils.supabase_client import get_supabase
from utils.auth_middleware import get_current_user

router = APIRouter(prefix="/api/questions", tags=["Questions"])


@router.get("")
async def list_questions(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    profile: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    db = get_supabase()
    query = db.table("questions").select("*")
    
    if category:
        query = query.eq("category", category)
    if difficulty:
        query = query.eq("difficulty", difficulty)
    if company:
        query = query.eq("company", company)
    if profile:
        query = query.eq("profile", profile)
    
    result = query.order("created_at", desc=True).execute()
    return result.data


@router.get("/{question_id}")
async def get_question(question_id: str, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    result = db.table("questions").select("*").eq("id", question_id).execute()
    if not result.data:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Question not found")
    return result.data[0]
