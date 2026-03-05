import os
import json
import time
from groq import Groq
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY") # Use Service Role for bulk admin inserts
if not url or not key:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.")
    exit(1)

supabase: Client = create_client(url, key)

# Initialize Groq
groq_key = os.getenv("GROQ_API_KEY")
if not groq_key:
    print("Error: GROQ_API_KEY must be set.")
    exit(1)

client = Groq(api_key=groq_key)

# Configuration
COMPANIES = [
    "Google", "Amazon", "Microsoft", "Meta", "Netflix", "Apple", "Uber", "Airbnb", 
    "TCS", "Infosys", "Capgemini", "Cognizant", "Wipro", "HCL", "Accenture",
    "Community Contributed"
]
PROFILES = [
    "Frontend Developer", "Backend Developer", "Fullstack Developer", 
    "Data Scientist", "Data Analyst", "Cloud Engineer", "DevOps Engineer", 
    "Product Manager", "AI/ML Engineer", "Mobile Developer", "QA Engineer", 
    "Cybersecurity Analyst"
]
CATEGORIES = ["HR", "Technical", "Behavioral", "System Design", "Aptitude"]
DIFFICULTIES = ["Easy", "Medium", "Hard"]

def generate_batch(category, company, profile, count=10):
    print(f"Generating {count} questions for {category} | {company} | {profile}...")
    
    prompt = f"""Generate exactly {count} interview questions for the category '{category}'.
Target Company: {company}
Target Profile: {profile}

For each question, provide:
1. The question text
2. A sample answer
3. An explanation
4. Suggested difficulty (Easy, Medium, Hard)

Return ONLY a JSON array of objects with the structure:
[
  {{
    "question_text": "...",
    "sample_answer": "...",
    "explanation": "...",
    "difficulty": "..."
  }},
  ...
]
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant", # Switched to 8b to avoid rate limits for bulk tokens
            messages=[
                {"role": "system", "content": "You are an expert technical interviewer. Return only JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=3000,
        )
        
        text = response.choices[0].message.content.strip()
        start = text.index("[")
        end = text.rindex("]") + 1
        questions = json.loads(text[start:end])
        
        # Add metadata for insertion
        to_insert = []
        for q in questions:
            to_insert.append({
                "category": category,
                "difficulty": q.get("difficulty", "Medium"),
                "question_text": q.get("question_text", ""),
                "sample_answer": q.get("sample_answer", ""),
                "explanation": q.get("explanation", ""),
                "company": company,
                "profile": profile
            })
        return to_insert
    except Exception as e:
        print(f"Error generating batch: {e}")
        return []

def main():
    total_generated = 0
    target_total = 550 # Aim slightly higher
    
    # We'll iterate through combinations to ensure diversity
    for profile in PROFILES:
        for company in COMPANIES:
            for category in CATEGORIES:
                if total_generated >= target_total:
                    break
                
                # Generate 5-10 per combination
                batch = generate_batch(category, company, profile, count=5)
                if batch:
                    # Insert into Supabase
                    res = supabase.table("questions").insert(batch).execute()
                    total_generated += len(batch)
                    print(f"Progress: {total_generated}/{target_total} questions added.")
                
                # Sleep briefly to avoid Groq rate limits
                time.sleep(1)
            
            if total_generated >= target_total:
                break
        if total_generated >= target_total:
            break

    print(f"Successfully populated {total_generated} questions into the bank!")

if __name__ == "__main__":
    main()
