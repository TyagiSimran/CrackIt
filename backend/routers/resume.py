from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from utils.supabase_client import get_supabase
from utils.auth_middleware import get_current_user
from services.resume_parser import extract_text_from_pdf
from services.groq_service import extract_skills_from_text, generate_resume_questions

router = APIRouter(prefix="/api/resume", tags=["Resume"])


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")
    
    # Read file
    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    # Extract text from PDF
    resume_text = extract_text_from_pdf(file_bytes)
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
    
    # Extract skills and projects using AI
    extracted = extract_skills_from_text(resume_text)
    skills = extracted.get("skills", [])
    projects = extracted.get("projects", [])
    
    # Generate personalized questions (reduced to 15 to prevent API truncation)
    generated_questions = generate_resume_questions(skills, projects, num_questions=15)
    
    # Store in database (The resume record itself)
    db = get_supabase()
    resume_res = db.table("resumes").insert({
        "user_id": current_user["id"],
        "filename": file.filename,
        "extracted_skills": skills,
        "extracted_projects": projects,
    }).execute()

    if not resume_res.data:
        raise HTTPException(status_code=500, detail="Failed to save resume")
    
    resume_id = resume_res.data[0]["id"]

    # ADD TO GLOBAL QUESTION BANK
    # Note: We filter the questions to match the database expectations
    if generated_questions:
        questions_to_insert = []
        for q in generated_questions:
            questions_to_insert.append({
                "category": q.get("category", "Technical"),
                "difficulty": q.get("difficulty", "Medium"),
                "question_text": q.get("question_text", ""),
                "sample_answer": q.get("sample_answer", "No sample answer provided."),
                "explanation": q.get("explanation", ""),
                "profile": q.get("profile", ""),
                "company": "Community Contributed", # Mark these as resume/community derived
                "resume_id": resume_id
            })
        
        # Bulk insert into global bank
        db.table("questions").insert(questions_to_insert).execute()
    
    return {
        "id": resume_id,
        "filename": file.filename,
        "skills": skills,
        "projects": projects,
        "questions": generated_questions,
    }


@router.get("/")
async def list_resumes(current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    resumes = db.table("resumes").select("*").eq("user_id", current_user["id"]).order("uploaded_at", desc=True).execute()
    return resumes.data


@router.get("/{resume_id}/questions")
async def get_resume_questions(resume_id: str, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    
    # Verify ownership
    resume = db.table("resumes").select("id").eq("id", resume_id).eq("user_id", current_user["id"]).execute()
    if not resume.data:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    questions = db.table("questions").select("*").eq("resume_id", resume_id).execute()
    return questions.data


@router.delete("/{resume_id}")
async def delete_resume(resume_id: str, current_user: dict = Depends(get_current_user)):
    db = get_supabase()
    
    # Verify ownership
    resume = db.table("resumes").select("id").eq("id", resume_id).eq("user_id", current_user["id"]).execute()
    if not resume.data:
        raise HTTPException(status_code=404, detail="Resume not found")
    
    # Delete associated questions first
    db.table("questions").delete().eq("resume_id", resume_id).execute()
    
    # Delete the resume record
    db.table("resumes").delete().eq("id", resume_id).execute()
    
    return {"message": "Resume deleted successfully"}
