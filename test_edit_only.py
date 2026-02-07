import requests
import sys

BASE_URL = "http://localhost:8000/api"
SESSION_ID = "test-session-edit"

def test_edit():
    print("Testing Edit Task Flow...")
    
    # 1. Create
    print("1. Creating Task...")
    resp = requests.post(f"{BASE_URL}/tasks", json={
        "session_id": SESSION_ID,
        "title": "Original Title",
        "priority": "low"
    })
    if resp.status_code != 200:
        print(f"Failed to create: {resp.text}")
        return False
    
    task_id = resp.json()['id']
    print(f"   Created Task ID: {task_id}")
    
    # 2. Edit
    print("2. Editing Task...")
    edit_resp = requests.put(f"{BASE_URL}/tasks/{task_id}", params={"session_id": SESSION_ID}, json={
        "title": "Edited Title",
        "priority": "high"
    })
    
    if edit_resp.status_code != 200:
        print(f"Failed to edit: {edit_resp.text}")
        return False
    
    data = edit_resp.json()
    if data['status'] == 'updated':
        print("   Edit Response OK")
    else:
        print(f"   Unexpected Edit Response: {data}")
        return False
        
    # 3. Verify Get
    print("3. Verifying Update...")
    get_resp = requests.get(f"{BASE_URL}/tasks", params={"session_id": SESSION_ID})
    tasks = get_resp.json()
    
    updated_task = next((t for t in tasks if t['id'] == task_id), None)
    if not updated_task:
        print("   Task not found in list")
        return False
        
    print(f"   Found Task: {updated_task}")
    
    if updated_task['title'] == "Edited Title" and updated_task['priority'] == "high":
        print("✅ SUCCESS: Task updated correctly!")
        return True
    else:
        print("❌ FAILURE: Task fields did not match expected")
        return False

if __name__ == "__main__":
    if test_edit():
        sys.exit(0)
    else:
        sys.exit(1)
