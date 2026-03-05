import requests
import json

BASE_URL = "http://localhost:8000/api/auth"

def test_password_reset():
    email = "test@example.com" # Replace with a valid email from your DB if needed
    
    print(f"Testing forgot-password for {email}...")
    try:
        res = requests.post(f"{BASE_URL}/forgot-password", json={"email": email})
        print(f"Status: {res.status_code}")
        print(f"Response: {res.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_password_reset()
