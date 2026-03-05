from fastapi import APIRouter, Depends
from utils.supabase_client import get_supabase
from utils.auth_middleware import get_current_user
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    user_id = current_user["id"]
    
    # Get all completed sessions
    sessions = (
        db.table("interview_sessions")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "completed")
        .order("completed_at", desc=True)
        .execute()
    )
    
    data = sessions.data or []
    total = len(data)
    
    scores = [float(s["overall_score"]) for s in data if s["overall_score"]]
    avg_score = sum(scores) / len(scores) if scores else 0
    best_score = max(scores) if scores else 0
    
    # Sessions this week
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    weekly = [s for s in data if s.get("completed_at") and s["completed_at"] >= week_ago]
    
    # Category performance
    cat_scores = {}
    for s in data:
        cat = s["interview_type"]
        if cat not in cat_scores:
            cat_scores[cat] = []
        cat_scores[cat].append(float(s["overall_score"]))
    
    category_scores = [
        {"category": cat, "avg_score": round(sum(sc) / len(sc), 1)}
        for cat, sc in cat_scores.items()
    ]
    
    # Weak areas: categories with avg < 6
    weak_areas = [cs["category"] + " interviews" for cs in category_scores if cs["avg_score"] < 6]
    
    # Check weak areas from individual response feedback
    session_ids = [s["id"] for s in data]
    top_weaknesses = []
    
    if session_ids:
        all_responses = (
            db.table("interview_responses")
            .select("ai_feedback")
            .in_("session_id", session_ids)
            .execute()
        )
        
        weakness_count = {}
        for r in (all_responses.data or []):
            feedback = r.get("ai_feedback") or {}
            for w in feedback.get("weaknesses", []):
                w_lower = w.lower()[:50]
                weakness_count[w_lower] = weakness_count.get(w_lower, 0) + 1
        
        # Top 5 most common weaknesses
        sorted_weaknesses = sorted(weakness_count.items(), key=lambda x: x[1], reverse=True)
        top_weaknesses = [w[0].capitalize() for w in sorted_weaknesses[:5]]
    
    if top_weaknesses:
        weak_areas.extend(top_weaknesses[:3])
    
    return {
        "total_interviews": total,
        "avg_score": round(avg_score, 1),
        "best_score": round(best_score, 1),
        "sessions_this_week": len(weekly),
        "category_scores": category_scores,
        "weak_areas": weak_areas[:6],
    }


@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    
    result = (
        db.table("interview_sessions")
        .select("*")
        .eq("user_id", current_user["id"])
        .order("started_at", desc=True)
        .limit(20)
        .execute()
    )
    
    return result.data or []
