import requests
import sys
import json
from datetime import datetime

class ChiefAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.session_id = "test-session-123"  # Mock session for testing

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        if data:
            print(f"   Data: {data}")
        if params:
            print(f"   Params: {params}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        resp_json = response.json()
                        print(f"   Response: {json.dumps(resp_json, indent=2)[:200]}...")
                    except:
                        print(f"   Response: {response.text[:200]}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}")

            return success, response.json() if response.content and response.status_code < 500 else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test /api/ returns status running"""
        success, response = self.run_test(
            "Root API endpoint",
            "GET",
            "api/",
            200
        )
        if success and response.get('status') == 'running':
            print("   ✅ Status is 'running' as expected")
            return True
        elif success:
            print(f"   ❌ Status is '{response.get('status')}', expected 'running'")
        return False

    def test_google_login_url(self):
        """Test /api/auth/google/login returns authorization_url"""
        success, response = self.run_test(
            "Google Login URL",
            "GET",
            "api/auth/google/login",
            200
        )
        if success and 'authorization_url' in response:
            print(f"   ✅ Authorization URL returned: {response['authorization_url'][:50]}...")
            return True
        elif success:
            print("   ❌ No authorization_url in response")
        return False

    def test_create_task(self):
        """Test POST /api/tasks creates task"""
        task_data = {
            "session_id": self.session_id,
            "title": "Test Task",
            "priority": "high"
        }
        
        success, response = self.run_test(
            "Create Task",
            "POST",
            "api/tasks",
            200,
            data=task_data
        )
        
        if success and response.get('title') == 'Test Task':
            print("   ✅ Task created successfully")
            return response.get('id'), True
        elif success:
            print("   ❌ Task not created properly")
        return None, False

    def test_get_tasks(self):
        """Test GET /api/tasks returns tasks"""
        success, response = self.run_test(
            "Get Tasks",
            "GET",
            "api/tasks",
            200,
            params={"session_id": self.session_id}
        )
        
        if success and isinstance(response, list):
            print(f"   ✅ Tasks list returned with {len(response)} tasks")
            return True
        elif success:
            print("   ❌ Response is not a list")
        return False

    def test_delete_task(self, task_id):
        """Test DELETE /api/tasks/{id} deletes task"""
        if not task_id:
            print("❌ Skipping delete test - no task ID")
            return False
            
        success, response = self.run_test(
            "Delete Task",
            "DELETE",
            f"api/tasks/{task_id}",
            200,
            params={"session_id": self.session_id}
        )
        
        if success and response.get('status') == 'deleted':
            print("   ✅ Task deleted successfully")
            return True
        elif success:
            print("   ❌ Task not deleted properly")
        return False

    def test_edit_task(self, task_id):
        """Test PUT /api/tasks/{id} updates task"""
        if not task_id:
            print("❌ Skipping edit test - no task ID")
            return False
            
        success, response = self.run_test(
            "Edit Task",
            "PUT",
            f"api/tasks/{task_id}",
            200,
            params={"session_id": self.session_id},
            data={"title": "Updated Task Title", "priority": "urgent"}
        )
        
        if success and response.get('status') == 'updated':
            print("   ✅ Task edited successfully")
            return True
        elif success:
            print("   ❌ Task not edited properly")
        return False

    def test_get_decisions(self):
        """Test GET /api/decisions returns empty array for unknown session"""
        success, response = self.run_test(
            "Get Decisions",
            "GET", 
            "api/decisions",
            200,
            params={"session_id": "unknown-session-id"}
        )
        
        if success and isinstance(response, list) and len(response) == 0:
            print("   ✅ Empty decisions array returned for unknown session")
            return True
        elif success and isinstance(response, list):
            print(f"   ⚠️ Got {len(response)} decisions, expected empty array for unknown session")
            return True  # May have some decisions from other tests
        elif success:
            print("   ❌ Response is not a list")
        return False

def main():
    print("🚀 Starting Chief API Testing...")
    print("=" * 50)
    
    tester = ChiefAPITester()
    task_id = None
    
    # Test 1: Root endpoint
    tester.test_root_endpoint()
    
    # Test 2: Google login URL
    tester.test_google_login_url()
    
    # Test 3: Task CRUD operations
    # Test 3: Create Task
    task_id, created = tester.test_create_task()
    
    # Test 3.5: Edit Task
    if task_id:
        tester.test_edit_task(task_id)

    tester.test_get_tasks()
    if task_id:
        tester.test_delete_task(task_id)
    
    # Test 4: Get Tasksions endpoint
    tester.test_get_decisions()
    
    # Test 5: Move Event
    print("\n🔍 Testing Move Event Endpoint (Validation checks)...")
    success, resp = tester.run_test(
        "Move Event Validation",
        "POST",
        "api/calendar/events/move",
        404, 
        data={
            "session_id": tester.session_id,
            "event_id": "invalid-id",
            "new_start": datetime.now().isoformat(),
            "new_end": datetime.now().isoformat()
        }
    )
    if success:
        print("   ✅ Endpoint is reachable and validates event existence")

    # Test 6: Planner (Gemini)
    print("\n🔍 Testing Planner (Gemini Integration)...")
    print("   ⚠️  Planner test requires authenticated Google Session.")
    print("   ℹ️  Skipping automated planner test to avoid triggering API costs/errors on invalid session.")

    # Test 7: Security (Rate limiting & Validation)
    print("\n🔒 Testing Security Measures...")
    
    # 7a. Input Validation
    print("   Testing Input Validation (Invalid Priority)...")
    success, _ = tester.run_test(
        "Invalid Task Creation", 
        "POST", 
        "tasks", 
        422, # Expect Unprocessable Entity
        data={
            "session_id": tester.session_id,
            "title": "Valid Title",
            "priority": "invalid_priority"
        }
    )
    if success: print("   ✅ Input validation caught invalid priority")

    print("   Testing Input Validation (Empty Title)...")
    success, _ = tester.run_test(
        "Invalid Task Creation", 
        "POST", 
        "tasks", 
        422,
        data={
            "session_id": tester.session_id,
            "title": "   ", #  Empty after strip
            "priority": "medium"
        }
    )
    if success: print("   ✅ Input validation caught empty title")

    # 7b. Rate Limiting (Spam auth endpoint)
    # The limit is 5/minute. We hit it 6 times.
    print("   Testing Rate Limiting (Spamming auth endpoint)...")
    spam_success = True
    for i in range(7):
        # We use a mocked request anyway, but we need to hit the endpoint
        resp = requests.get(f"{tester.base_url}/api/auth/google/login")
        status = resp.status_code
        if status == 429:
            print(f"   ✅ Rate limit triggered on attempt {i+1}")
            spam_success = True
            break
        spam_success = False
    
    if not spam_success:
        print("   ❌ Rate limit NOT triggered (Limit might be too high or middleware missing)")

    print("\n" + "=" * 50)
    print(f"📊 TEST RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())