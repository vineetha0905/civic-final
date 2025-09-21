import requests
import sys
from datetime import datetime

class CivicConnectAPITester:
    def __init__(self, base_url="https://citiguard-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.test_user_id = None
        self.test_issue_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"Response: {response_data}")
                    return success, response_data
                except:
                    print(f"Response: {response.text[:200]}")
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text[:500]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_authentication_endpoints(self):
        """Test all authentication endpoints"""
        print("=== Testing Authentication Endpoints ===")
        
        # Test admin login with correct credentials
        success, response = self.run_test("Admin Login (Valid)", "POST", "api/auth/admin/login", 200, 
                     {"username": "admin", "password": "admin123"})
        if success and 'user' in response:
            self.admin_token = response['user'].get('token')
        
        # Test admin login with invalid credentials
        self.run_test("Admin Login (Invalid)", "POST", "api/auth/admin/login", 401, 
                     {"username": "admin", "password": "wrong"})
        
        # Test send OTP with valid mobile
        self.run_test("Send OTP (Valid)", "POST", "api/auth/send-otp", 200, 
                     {"mobile": "9876543210"})
        
        # Test send OTP with invalid mobile
        self.run_test("Send OTP (Invalid)", "POST", "api/auth/send-otp", 400, 
                     {"mobile": "123"})
        
        # Test verify OTP with correct OTP
        success, response = self.run_test("Verify OTP (Valid)", "POST", "api/auth/verify-otp", 200, 
                     {"mobile": "9876543210", "otp": "123456"})
        if success and 'user' in response:
            self.test_user_id = response['user'].get('id')
        
        # Test verify OTP with wrong OTP
        self.run_test("Verify OTP (Invalid)", "POST", "api/auth/verify-otp", 400, 
                     {"mobile": "9876543210", "otp": "000000"})
        
        # Test guest user creation
        self.run_test("Create Guest User", "POST", "api/auth/guest", 200)

    def test_issues_endpoints(self):
        """Test all issues management endpoints"""
        print("\n=== Testing Issues Management Endpoints ===")
        
        # Test get all issues
        self.run_test("Get All Issues", "GET", "api/issues", 200)
        
        # Test get issues with status filter
        self.run_test("Get Issues (Status Filter)", "GET", "api/issues", 200, params={"status": "reported"})
        
        # Test get issues with category filter
        self.run_test("Get Issues (Category Filter)", "GET", "api/issues", 200, params={"category": "Street Lighting"})
        
        # Test create issue with proper data format
        issue_data = {
            "title": "Test Street Light Issue",
            "description": "Street light not working in residential area",
            "category": "Street Lighting",
            "location": "Test Location, Bhopal",
            "coordinates": [23.2599, 77.4126],
            "user_id": self.test_user_id or "test_user_123",
            "reported_by": "Test User"
        }
        success, response = self.run_test("Create Issue", "POST", "api/issues", 201, issue_data)
        if success and 'issue' in response:
            self.test_issue_id = response['issue'].get('id')
        
        # Test get specific issue
        if self.test_issue_id:
            self.run_test("Get Specific Issue", "GET", f"api/issues/{self.test_issue_id}", 200)
        else:
            # Use mock issue ID
            self.run_test("Get Specific Issue", "GET", "api/issues/1", 200)
            self.test_issue_id = "1"
        
        # Test update issue status
        if self.test_issue_id:
            update_data = {
                "status": "in-progress",
                "assigned_to": "Test Officer",
                "priority": "high"
            }
            self.run_test("Update Issue", "PUT", f"api/issues/{self.test_issue_id}", 200, update_data)
        
        # Test upvote issue
        if self.test_issue_id:
            self.run_test("Upvote Issue", "POST", f"api/issues/{self.test_issue_id}/upvote", 200, 
                         params={"user_id": self.test_user_id or "test_user_123"})

    def test_comments_endpoints(self):
        """Test comments functionality"""
        print("\n=== Testing Comments Endpoints ===")
        
        if self.test_issue_id:
            # Test add comment
            comment_data = {
                "content": "This is a test comment",
                "user_id": self.test_user_id or "test_user_123",
                "author": "Test User",
                "is_admin": False
            }
            self.run_test("Add Comment", "POST", f"api/issues/{self.test_issue_id}/comments", 200, comment_data)
            
            # Test get comments
            self.run_test("Get Comments", "GET", f"api/issues/{self.test_issue_id}/comments", 200)
        else:
            print("⚠️ Skipping comments tests - no test issue ID available")

    def test_admin_endpoints(self):
        """Test admin dashboard and analytics endpoints"""
        print("\n=== Testing Admin Endpoints ===")
        
        # Test admin dashboard
        self.run_test("Admin Dashboard", "GET", "api/admin/dashboard", 200)
        
        # Test admin analytics
        self.run_test("Admin Analytics", "GET", "api/admin/analytics", 200)

    def test_error_handling(self):
        """Test error handling for various scenarios"""
        print("\n=== Testing Error Handling ===")
        
        # Test non-existent issue
        self.run_test("Get Non-existent Issue", "GET", "api/issues/nonexistent", 404)
        
        # Test update non-existent issue
        self.run_test("Update Non-existent Issue", "PUT", "api/issues/nonexistent", 404, 
                     {"status": "resolved"})
        
        # Test upvote non-existent issue
        self.run_test("Upvote Non-existent Issue", "POST", "api/issues/nonexistent/upvote", 404, 
                     params={"user_id": "test"})
        
        # Test add comment to non-existent issue
        self.run_test("Comment on Non-existent Issue", "POST", "api/issues/nonexistent/comments", 404,
                     {"content": "test", "user_id": "test", "author": "test"})

    def test_basic_endpoints(self):
        """Test the basic endpoints that exist in server.py"""
        print("=== Testing Basic Backend Endpoints ===")
        
        # Test root endpoint
        self.run_test("Root Endpoint", "GET", "api/", 200)
        
        # Test create status check
        test_data = {"client_name": f"test_client_{datetime.now().strftime('%H%M%S')}"}
        self.run_test("Create Status Check", "POST", "api/status", 200, test_data)
        
        # Test get status checks
        self.run_test("Get Status Checks", "GET", "api/status", 200)

def main():
    print("🚀 Starting CivicConnect Backend API Tests")
    tester = CivicConnectAPITester()
    
    # Test basic endpoints first
    tester.test_basic_endpoints()
    
    # Test expected civic app endpoints
    tester.test_civic_endpoints()
    
    # Print results
    print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed < 3:  # At least basic endpoints should work
        print("❌ Critical: Basic backend endpoints are not working")
        return 1
    elif tester.tests_passed < tester.tests_run * 0.5:
        print("⚠️  Warning: More than 50% of expected functionality is missing")
        return 1
    else:
        print("✅ Backend tests completed")
        return 0

if __name__ == "__main__":
    sys.exit(main())