import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not url or not key:
    print("Missing Supabase credentials")
    exit(1)

supabase = create_client(url, key)

def check_table_info(table_name):
    print(f"\n--- Analysis for table: {table_name} ---")
    try:
        # We can't easily get schema via SDK, let's just try to fetch one row
        res = supabase.table(table_name).select("*").limit(1).execute()
        if res.data:
            print(f"Sample data: {res.data[0].keys()}")
        else:
            print("Table is empty")
    except Exception as e:
        print(f"Error accessing {table_name}: {e}")

check_table_info("resumes")
check_table_info("questions")
check_table_info("interview_sessions")
check_table_info("interview_responses")

# Check for orphan records or FK potential issues
try:
    resumes = supabase.table("resumes").select("id").limit(5).execute()
    if resumes.data:
        rid = resumes.data[0]['id']
        print(f"\nChecking questions for resume_id: {rid}")
        qs = supabase.table("questions").select("id").eq("resume_id", rid).execute()
        print(f"Count: {len(qs.data)}")
        
        print(f"Checking interview_sessions for resume_id: {rid}")
        ss = supabase.table("interview_sessions").select("id").eq("resume_id", rid).execute()
        print(f"Count: {len(ss.data)}")
except Exception as e:
    print(f"Error during FK check: {e}")
