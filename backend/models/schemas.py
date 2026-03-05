from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ─── Auth ─────────────────────────────────────
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    theme_preference: Optional[str] = "dark"

class AuthResponse(BaseModel):
    access_token: str
    user: UserResponse


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    theme_preference: Optional[str] = None


# ─── Questions ────────────────────────────────
class QuestionCreate(BaseModel):
    category: str
    difficulty: str
    question_text: str
    sample_answer: str
    explanation: Optional[str] = ""
    keywords: Optional[List[str]] = []
    tips: Optional[str] = ""

class QuestionUpdate(QuestionCreate):
    pass


# ─── Interview ────────────────────────────────
class InterviewStartRequest(BaseModel):
    interview_type: str  # HR, Technical, Mixed, Resume-based
    difficulty: str      # Easy, Medium, Hard
    num_questions: Optional[int] = 10
    resume_id: Optional[str] = None
    company: Optional[str] = None
    profile: Optional[str] = None

class AnswerSubmitRequest(BaseModel):
    question_number: int
    question_text: str
    user_answer: str

class AnswerFeedback(BaseModel):
    score: float
    feedback: dict  # { strengths: [], weaknesses: [], suggestions: [] }

class InterviewStartResponse(BaseModel):
    session_id: str
    questions: List[dict]


# ─── Resume ───────────────────────────────────
class ResumeAnalysisResponse(BaseModel):
    filename: str
    skills: List[str]
    projects: List[str]
    questions: List[str]


# ─── Dashboard ────────────────────────────────
class DashboardStats(BaseModel):
    total_interviews: int
    avg_score: float
    best_score: float
    sessions_this_week: int
    category_scores: List[dict]
    weak_areas: List[str]
