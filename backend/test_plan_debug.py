import requests
import sys
import uuid
from datetime import datetime

BASE_URL = "http://localhost:8000/api"
SESSION_ID = f"debug-session-{uuid.uuid4()}"

def test_plan_debug():
    print(f"1. Creating Session: {SESSION_ID}")
    # Create session implicitly by creating a task? No, server checks DB for task. 
    # Actually server.py plan_day checks db.sessions first.
    
    # We need to simulate auth/login to get a session or manually insert one?
    # The current backend relies on Google Auth to create sessions.
    # checking server.py:
    # @api_router.post("/plan")
    # session = await db.sessions.find_one({"session_id": req.session_id})
    
    # So we must insert a fake session into DB first or use an existing one.
    # Since I can't easily insert via API (auth callback only), 
    # I might need to rely on the fact that I can't easily fake a session via API without a token.
    # BUT, I can use the same session ID from previous tests if it persists, 
    # or I accept that I need to bypass this check or insert via mongo using `test_gemini.py` style script but interacting with DB.
    
    # Wait, backend_test.py uses "test-session-123". Does that work?
    # backend_test.py doesn't seem to insert a session into DB. 
    # Let's check server.py 'create_task' - it DOES NOT check for session existence in DB.
    # But '/plan' DOES check: `session = await db.sessions.find_one({"session_id": req.session_id})`
    # So backend_test.py might fail /plan if it ran it.
    
    # I need to insert a mock session directly into MongoDB first.
    # I'll use pymongo directly in this script.
    
    try:
        from pymongo import MongoClient
        import os
        from dotenv import load_dotenv
        
        load_dotenv()
        MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
        client = MongoClient(MONGO_URL)
        db = client.chief_db
        
        db.sessions.update_one(
            {"id": SESSION_ID}, # Note: Backend uses 'id' not 'session_id' as primary key in sessions collection? 
            # Checking server.py: await db.sessions.insert_one({"id": session_id...})
            # BUT wait, endpoint checks: find_one({"session_id": req.session_id})? 
            # server.py line 407: session = await db.sessions.find_one({"session_id": req.session_id})
            # Wait, line 180 insert uses "id": session_id. 
            # This looks like a bug in server.py /plan endpoint line 407!
            # It should be searching by "id", not "session_id", unless the insert uses "session_id".
            # Let's check server.py again.
            
            {"$set": {
                "id": SESSION_ID,
                "session_id": SESSION_ID, # Just in case
                "user_info": {"name": "Debug User", "email": "test@example.com"},
                "created_at": datetime.now().isoformat()
            }},
            upsert=True
        )
        print("   Mock session inserted.")
        
    except Exception as e:
        print(f"WARN: Could not insert mock session (pymongo error): {e}")
        # Proceed anyway, maybe it works if check is loose or I misread
        pass

    print("2. Creating a Task...")
    resp = requests.post(f"{BASE_URL}/tasks", json={
        "session_id": SESSION_ID,
        "title": "Urgent Debug Task",
        "priority": "urgent"
    })
    print(f"   Create Task Status: {resp.status_code}")

    print("3. Calling /plan endpoint...")
    plan_resp = requests.post(f"{BASE_URL}/plan", json={
        "session_id": SESSION_ID,
        "date": datetime.now().strftime("%Y-%m-%d")
    })
    
    print(f"   Plan Status: {plan_resp.status_code}")
    if plan_resp.status_code == 200:
        data = plan_resp.json()
        print("\n--- PLANNER RESPONSE ---")
        print(f"Summary: {data.get('summary')}")
        print(f"Actions: {len(data.get('decisions', []))}")
        print("Decisions:")
        for d in data.get('decisions', []):
            print(f" - {d}")
        print("------------------------")
    else:
        print(f"Error: {plan_resp.text}")

if __name__ == "__main__":
    test_plan_debug()
