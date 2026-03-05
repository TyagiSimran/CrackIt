from fastapi import APIRouter, HTTPException, Depends, Response
from models.schemas import InterviewStartRequest, AnswerSubmitRequest, InterviewStartResponse
from utils.supabase_client import get_supabase
from utils.auth_middleware import get_current_user
from services.groq_service import generate_interview_questions, evaluate_answer
from services.adaptive import compute_adaptive_difficulty
from datetime import datetime, timezone

router = APIRouter(prefix="/api/interview", tags=["Interview"])


@router.post("/start", response_model=InterviewStartResponse)
async def start_interview(req: InterviewStartRequest, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    
    # Check if user has recent scores for adaptive difficulty
    recent_sessions = (
        db.table("interview_sessions")
        .select("overall_score")
        .eq("user_id", current_user["id"])
        .eq("status", "completed")
        .order("completed_at", desc=True)
        .limit(3)
        .execute()
    )
    
    # Apply adaptive difficulty
    effective_difficulty = req.difficulty
    if recent_sessions.data:
        recent_scores = [float(s["overall_score"]) for s in recent_sessions.data]
        effective_difficulty = compute_adaptive_difficulty(req.difficulty, recent_scores)
    
    questions = []
    
    # FETCH QUESTIONS BASED ON MODE
    if req.interview_type == "Resume-based" and req.resume_id:
        # Fetch questions linked to this resume
        res = db.table("questions").select("*").eq("resume_id", req.resume_id).limit(10).execute()
        if res.data:
            questions = res.data
    
    if not questions:
        # Fallback to general filtered questions
        query = db.table("questions").select("*").eq("category", req.interview_type if req.interview_type in ["HR", "Technical", "Behavioral", "System Design", "Aptitude"] else "Technical")
        
        if req.company and req.company != "All":
            query = query.eq("company", req.company)
        if req.profile and req.profile != "All":
            query = query.eq("profile", req.profile)
            
        res = query.eq("difficulty", effective_difficulty).limit(req.num_questions).execute()
        questions = res.data
        
    # If still no questions in DB, generate on-the-fly (fallback)
    if not questions:
        q_texts = generate_interview_questions(
            req.interview_type if req.interview_type != "Resume-based" else "Technical", 
            effective_difficulty, 
            req.num_questions
        )
        # Wrap in dict structure for below processing
        questions = [{"question_text": text, "difficulty": effective_difficulty} for text in q_texts]
    
    # Create session
    session = db.table("interview_sessions").insert({
        "user_id": current_user["id"],
        "interview_type": req.interview_type,
        "difficulty": effective_difficulty,
        "total_questions": len(list(questions)[:10]),
        "status": "in_progress",
        "resume_id": req.resume_id,
        "company": req.company,
        "profile": req.profile
    }).execute()
    
    if not session.data:
        raise HTTPException(status_code=500, detail="Failed to create session")
    
    session_id = session.data[0]["id"]
    
    # Pre-insert response placeholders
    all_q_data = []
    actual_q_texts = []
    for i, q in enumerate(list(questions)[:10]):
        actual_text = q.get("question_text", q) if isinstance(q, dict) else q
        actual_q_texts.append(actual_text)
        
        # Suggested timer (in seconds) based on difficulty
        time_limit = 120 # 2 mins default
        if q.get("difficulty") == "Hard": time_limit = 180
        elif q.get("difficulty") == "Easy": time_limit = 90
        
        db.table("interview_responses").insert({
            "session_id": session_id,
            "question_text": actual_text,
            "question_number": i + 1,
            "difficulty": q.get("difficulty", effective_difficulty),
            "time_limit": time_limit # Note: Need to add this column to interview_responses
        }).execute()
    
    # Return session ID and questions with metadata
    response_questions = []
    for i, text in enumerate(actual_q_texts):
        # We can find the time_limit we just used or re-calculate
        # For simplicity, let's reuse the logic or just store it in a list earlier
        # But wait, I already have the loop above. Let's optimize.
        pass

    # Actually, let's just use the data we collected in the loop
    # Return session ID and questions with metadata
    return {"session_id": session_id, "questions": [{"text": t, "time_limit": 120 if req.interview_type in ["Technical", "Resume-based"] else 90} for t in actual_q_texts]}


@router.post("/{session_id}/answer")
async def submit_answer(
    session_id: str,
    req: AnswerSubmitRequest,
    current_user: dict = Depends(get_current_user),
):
    db = get_supabase()
    
    # Verify session belongs to user
    session = db.table("interview_sessions").select("*").eq("id", session_id).eq("user_id", current_user["id"]).execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.data[0]["status"] == "completed":
        raise HTTPException(status_code=400, detail="Session already completed")
    
    # Evaluate answer with AI
    evaluation = evaluate_answer(
        req.question_text,
        req.user_answer,
        session.data[0]["interview_type"],
    )
    
    # Update the response record
    db.table("interview_responses").update({
        "user_answer": req.user_answer,
        "ai_score": evaluation["score"],
        "ai_feedback": {
            "strengths": evaluation.get("strengths", []),
            "weaknesses": evaluation.get("weaknesses", []),
            "suggestions": evaluation.get("suggestions", []),
        },
        "answered_at": datetime.now(timezone.utc).isoformat(),
    }).eq("session_id", session_id).eq("question_number", req.question_number).execute()
    
    # Update answered count
    db.table("interview_sessions").update({
        "answered_count": req.question_number,
    }).eq("id", session_id).execute()
    
    return {
        "score": evaluation["score"],
        "feedback": {
            "strengths": evaluation.get("strengths", []),
            "weaknesses": evaluation.get("weaknesses", []),
            "suggestions": evaluation.get("suggestions", []),
        }
    }


@router.post("/{session_id}/complete")
async def complete_interview(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    
    # Get all responses
    responses = (
        db.table("interview_responses")
        .select("ai_score")
        .eq("session_id", session_id)
        .execute()
    )
    
    if not responses.data:
        raise HTTPException(status_code=400, detail="No responses found")
    
    scores = [float(r["ai_score"]) for r in responses.data if r["ai_score"]]
    overall_score = sum(scores) / len(scores) if scores else 0
    
    # Update session
    db.table("interview_sessions").update({
        "status": "completed",
        "overall_score": round(overall_score, 2),
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", session_id).execute()
    
    return {"overall_score": round(overall_score, 2), "status": "completed"}

# IMPORTANT: /overall/report must be defined BEFORE /{session_id} routes
# to prevent FastAPI from matching "overall" as a session_id parameter.
@router.get("/overall/report")
async def download_overall_report(current_user: dict = Depends(get_current_user)):
    from routers.dashboard import get_dashboard_stats
    stats = await get_dashboard_stats(current_user)
    
    from services.report_service import generate_overall_report_pdf
    pdf_buffer = generate_overall_report_pdf(current_user, stats)
    
    filename = f"Overall_Performance_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    
    session = db.table("interview_sessions").select("*").eq("id", session_id).eq("user_id", current_user["id"]).execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    responses = (
        db.table("interview_responses")
        .select("*")
        .eq("session_id", session_id)
        .order("question_number")
        .execute()
    )
    
    return {
        "session": session.data[0],
        "responses": responses.data,
    }


@router.get("/{session_id}/report")
async def download_session_report(session_id: str, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    
    # Get session
    session = db.table("interview_sessions").select("*").eq("id", session_id).eq("user_id", current_user["id"]).execute()
    if not session.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get responses
    responses = db.table("interview_responses").select("*").eq("session_id", session_id).order("question_number").execute()
    
    from services.report_service import generate_interview_report_pdf
    pdf_buffer = generate_interview_report_pdf(session.data[0], responses.data, current_user["full_name"])
    
    filename = f"Report_{session.data[0]['interview_type']}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
