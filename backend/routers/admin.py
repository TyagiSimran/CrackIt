from fastapi import APIRouter, HTTPException, Depends
from models.schemas import QuestionCreate, QuestionUpdate
from utils.supabase_client import get_supabase
from utils.auth_middleware import require_admin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.post("/questions")
async def create_question(req: QuestionCreate, admin: dict = Depends(require_admin)):
    db = get_supabase()
    result = db.table("questions").insert({
        "category": req.category,
        "difficulty": req.difficulty,
        "question_text": req.question_text,
        "sample_answer": req.sample_answer,
        "explanation": req.explanation,
        "keywords": req.keywords,
        "tips": req.tips,
    }).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create question")
    return result.data[0]


@router.put("/questions/{question_id}")
async def update_question(question_id: str, req: QuestionUpdate, admin: dict = Depends(require_admin)):
    db = get_supabase()
    result = db.table("questions").update({
        "category": req.category,
        "difficulty": req.difficulty,
        "question_text": req.question_text,
        "sample_answer": req.sample_answer,
        "explanation": req.explanation,
        "keywords": req.keywords,
        "tips": req.tips,
    }).eq("id", question_id).execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Question not found")
    return result.data[0]


@router.delete("/questions/{question_id}")
async def delete_question(question_id: str, admin: dict = Depends(require_admin)):
    db = get_supabase()
    result = db.table("questions").delete().eq("id", question_id).execute()
    return {"message": "Question deleted"}


@router.get("/analytics")
async def get_analytics(admin: dict = Depends(require_admin)):
    db = get_supabase()
    
    users = db.table("users").select("id", count="exact").execute()
    questions = db.table("questions").select("id", count="exact").execute()
    interviews = db.table("interview_sessions").select("overall_score").eq("status", "completed").execute()
    
    total_interviews = len(interviews.data) if interviews.data else 0
    scores = [float(i["overall_score"]) for i in (interviews.data or []) if i["overall_score"]]
    avg_score = sum(scores) / len(scores) if scores else 0
    
    return {
        "total_users": users.count if users.count else 0,
        "total_questions": questions.count if questions.count else 0,
        "total_interviews": total_interviews,
        "avg_score": round(avg_score, 1),
    }


@router.get("/full-report")
async def get_full_report(admin: dict = Depends(require_admin)):
    """Comprehensive admin report with all database details."""
    db = get_supabase()
    
    # 1. Get all users
    users_res = db.table("users").select("id, email, full_name, role, created_at").order("created_at", desc=True).execute()
    users = users_res.data or []
    
    # 2. Get all interview sessions
    sessions_res = db.table("interview_sessions").select("*").order("started_at", desc=True).execute()
    sessions = sessions_res.data or []
    
    # 3. Get all resumes
    resumes_res = db.table("resumes").select("id, user_id, filename, extracted_skills, uploaded_at").order("uploaded_at", desc=True).execute()
    resumes = resumes_res.data or []
    
    # 4. Get all questions count by category
    questions_res = db.table("questions").select("id, category, difficulty").execute()
    questions = questions_res.data or []
    
    # Build per-user stats
    user_stats = []
    for u in users:
        uid = u["id"]
        
        # User's interviews
        user_sessions = [s for s in sessions if s.get("user_id") == uid]
        completed_sessions = [s for s in user_sessions if s.get("status") == "completed"]
        user_scores = [float(s["overall_score"]) for s in completed_sessions if s.get("overall_score")]
        
        # User's resumes
        user_resumes = [r for r in resumes if r.get("user_id") == uid]
        
        # Last activity
        last_activity = None
        if user_sessions:
            last_activity = user_sessions[0].get("started_at")
        
        user_stats.append({
            "id": uid,
            "email": u.get("email", ""),
            "full_name": u.get("full_name", ""),
            "role": u.get("role", "user"),
            "created_at": u.get("created_at", ""),
            "total_interviews": len(user_sessions),
            "completed_interviews": len(completed_sessions),
            "avg_score": round(sum(user_scores) / len(user_scores), 1) if user_scores else 0,
            "best_score": round(max(user_scores), 1) if user_scores else 0,
            "total_resumes": len(user_resumes),
            "last_activity": last_activity,
        })
    
    # Question breakdown by category
    category_breakdown = {}
    for q in questions:
        cat = q.get("category", "Other")
        if cat not in category_breakdown:
            category_breakdown[cat] = {"total": 0, "difficulties": {}}
        category_breakdown[cat]["total"] += 1
        diff = q.get("difficulty", "Medium")
        category_breakdown[cat]["difficulties"][diff] = category_breakdown[cat]["difficulties"].get(diff, 0) + 1
    
    # Recent interviews (last 50)
    recent_interviews = []
    for s in sessions[:50]:
        # Find user name
        user_name = "Unknown"
        for u in users:
            if u["id"] == s.get("user_id"):
                user_name = u.get("full_name", u.get("email", "Unknown"))
                break
        recent_interviews.append({
            "id": s["id"],
            "user_name": user_name,
            "user_id": s.get("user_id", ""),
            "interview_type": s.get("interview_type", ""),
            "difficulty": s.get("difficulty", ""),
            "status": s.get("status", ""),
            "overall_score": s.get("overall_score"),
            "started_at": s.get("started_at", ""),
            "completed_at": s.get("completed_at"),
        })
    
    # Platform summary
    all_completed = [s for s in sessions if s.get("status") == "completed"]
    all_scores = [float(s["overall_score"]) for s in all_completed if s.get("overall_score")]
    
    return {
        "users": user_stats,
        "total_users": len(users),
        "total_interviews": len(sessions),
        "total_completed_interviews": len(all_completed),
        "total_resumes": len(resumes),
        "total_questions": len(questions),
        "avg_platform_score": round(sum(all_scores) / len(all_scores), 1) if all_scores else 0,
        "question_categories": category_breakdown,
        "recent_interviews": recent_interviews,
        "recent_resumes": resumes[:30],
    }
