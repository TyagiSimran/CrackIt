import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = None

def get_groq_client():
    global client
    if client is None:
        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY must be set in .env")
        client = Groq(api_key=api_key)
    return client


def generate_interview_questions(interview_type: str, difficulty: str, num_questions: int = 5) -> list[str]:
    """Generate interview questions using Groq LLM."""
    groq = get_groq_client()

    type_desc = {
        "HR": "HR and soft-skills interview questions about teamwork, leadership, motivation, and career goals",
        "Technical": "technical interview questions about programming, data structures, algorithms, databases, and system design",
        "Mixed": "a mix of HR, behavioral, and technical interview questions",
    }

    prompt = f"""Generate exactly {num_questions} {type_desc.get(interview_type, 'interview')} questions.
Difficulty level: {difficulty}.
    
Rules:
- Questions should be realistic and commonly asked in job interviews
- For {difficulty} difficulty: {"basic, straightforward questions" if difficulty == "Easy" else "moderate complexity, requires some thought" if difficulty == "Medium" else "advanced, requires deep understanding and detailed answers"}
- Return ONLY a JSON array of strings, nothing else
- Example format: ["Question 1?", "Question 2?"]
"""

    response = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are an expert interview coach. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=1500,
    )

    text = response.choices[0].message.content.strip()
    # Extract JSON array from response
    try:
        # Try to find JSON array in the response
        start = text.index("[")
        end = text.rindex("]") + 1
        questions = json.loads(text[start:end])
        return questions[:num_questions]
    except (ValueError, json.JSONDecodeError):
        # Fallback: split by newlines
        lines = [l.strip().lstrip("0123456789.-) ") for l in text.split("\n") if l.strip() and "?" in l]
        return lines[:num_questions]


def evaluate_answer(question: str, answer: str, interview_type: str = "Technical") -> dict:
    """Evaluate a user's answer using Groq LLM."""
    groq = get_groq_client()

    prompt = f"""You are an expert interview evaluator. Evaluate the following interview answer.

Question: {question}
Candidate's Answer: {answer}
Interview Type: {interview_type}

Evaluate based on these criteria:
1. Clarity - How clear and well-articulated is the response
2. Technical Correctness - Accuracy of information provided
3. Structure - Organization and logical flow
4. Relevance - How well the answer addresses the question
5. Depth - Level of detail and insight

Return a JSON object with this exact structure:
{{
    "score": <number from 1 to 10>,
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "suggestions": ["suggestion 1", "suggestion 2"]
}}

Be fair but constructive. Return ONLY the JSON object, nothing else.
"""

    response = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are an expert interview evaluator. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        max_tokens=800,
    )

    text = response.choices[0].message.content.strip()
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        result = json.loads(text[start:end])
        # Ensure score is bounded
        result["score"] = max(1, min(10, float(result.get("score", 5))))
        result.setdefault("strengths", [])
        result.setdefault("weaknesses", [])
        result.setdefault("suggestions", [])
        return result
    except (ValueError, json.JSONDecodeError):
        return {
            "score": 5.0,
            "strengths": ["Answer was provided"],
            "weaknesses": ["Could not fully evaluate"],
            "suggestions": ["Try providing more structured answers"],
        }


def generate_resume_questions(skills: list[str], projects: list[str], num_questions: int = 50) -> list[dict]:
    """Generate personalized interview questions from resume data with metadata."""
    groq = get_groq_client()

    prompt = f"""Based on the following candidate profile, generate exactly {num_questions} personalized interview questions.

Skills: {', '.join(skills)}
Projects: {', '.join(projects)}

For each question, provide:
1. The question text
2. A sample answer
3. An explanation of why it's asked
4. A suggested difficulty level (Easy, Medium, Hard)
5. A category (Technical, Behavioral, HR, System Design)
6. A 'profile' tag (e.g., 'Fullstack Developer', 'Backend Engineer') based on the resume.

Return ONLY a JSON array of objects with the following structure:
[
  {{
    "question_text": "...",
    "sample_answer": "...",
    "explanation": "...",
    "difficulty": "Medium",
    "category": "Technical",
    "profile": "..."
  }},
  ...
]
"""

    response = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are an expert interview coach for top-tier companies. You must generate as many high-quality, diverse questions as possible to fill the candidate's preparation gap."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.7,
        max_tokens=5000,
    )

    text = response.choices[0].message.content.strip()
    try:
        # Improved JSON extraction
        if "[" in text and "]" in text:
            start = text.index("[")
            end = text.rindex("]") + 1
            return json.loads(text[start:end])
        return []
    except (ValueError, json.JSONDecodeError):
        # Even more robust fallback: try to find multiple {} objects if [] failed or was truncated
        import re
        try:
            matches = re.findall(r'\{[^{}]*\}', text)
            if matches:
                questions = []
                for m in matches:
                    try:
                        questions.append(json.loads(m))
                    except: continue
                return questions
        except:
            pass
        return []


def extract_skills_from_text(resume_text: str) -> dict:
    """Use Groq to extract skills and projects from resume text."""
    groq = get_groq_client()

    prompt = f"""Analyze the following resume text and extract:
1. Technical and soft skills
2. Project names or descriptions

Resume text:
{resume_text[:3000]}

Return a JSON object with this structure:
{{
    "skills": ["skill1", "skill2", ...],
    "projects": ["project1", "project2", ...]
}}

Return ONLY the JSON object.
"""

    response = groq.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are an expert resume parser. Return only valid JSON."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=800,
    )

    text = response.choices[0].message.content.strip()
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        result = json.loads(text[start:end])
        return {
            "skills": result.get("skills", []),
            "projects": result.get("projects", []),
        }
    except (ValueError, json.JSONDecodeError):
        return {"skills": [], "projects": []}
