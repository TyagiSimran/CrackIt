import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def diagnose():
    load_dotenv("backend/.env")
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("ERROR: SUPABASE_URL or SUPABASE_KEY missing in .env")
        return

    print(f"Connecting to: {url}")
    try:
        supabase = create_client(url, key)
        # Try to list tables (check if 'users' table exists)
        # Note: Supabase Python client doesn't have a direct 'list tables' but we can try a query
        print("Checking for 'users' table...")
        try:
            res = supabase.table("users").select("count", count="exact").limit(0).execute()
            print("SUCCESS: 'users' table exists.")
            print(f"Current user count: {res.count}")
        except Exception as e:
            if "relation \"public.users\" does not exist" in str(e):
                print("ERROR: 'users' table does NOT exist in Supabase! You must run the SQL schema.")
            else:
                print(f"ERROR querying 'users' table: {e}")
                
    except Exception as e:
        print(f"CRITICAL ERROR connecting to Supabase: {e}")

if __name__ == "__main__":
    diagnose()
