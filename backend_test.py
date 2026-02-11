#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, date
from typing import Dict, Any, Optional

class SchoolAdminAPITester:
    def __init__(self, base_url: str = "https://scholify-manage.preview.emergentagent.com"):
        self.base_url = base_url.rstrip('/')
        self.token = None
        self.school_id = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_school_name = f"Test School {datetime.now().strftime('%H%M%S')}"
        self.test_user_email = f"principal{datetime.now().strftime('%H%M%S')}@testschool.com"
        self.test_user_password = "TestPass123!"
        self.test_student_id = None
        self.test_fee_bill_id = None

    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}/api/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}
            
            return response.status_code, response_data
            
        except requests.exceptions.RequestException as e:
            return 0, {"error": str(e)}

    def test_health_check(self):
        """Test API health endpoints"""
        print("\n🔍 Testing Health Endpoints...")
        
        # Test root endpoint
        status_code, data = self.make_request('GET', '/')
        success = status_code == 200 and 'message' in data
        self.log_result("API Root Health Check", success, 
                       f"Status: {status_code}" if not success else "", data)
        
        # Test health endpoint
        status_code, data = self.make_request('GET', '/health')
        success = status_code == 200 and data.get('status') == 'ok'
        self.log_result("API Health Endpoint", success, 
                       f"Status: {status_code}" if not success else "", data)

    def test_school_registration(self):
        """Test school registration"""
        print("\n🔍 Testing School Registration...")
        
        registration_data = {
            "school_name": self.test_school_name,
            "school_address": "123 Test Street, Test City",
            "school_phone": "+91-9876543210",
            "school_email": "contact@testschool.com",
            "user_name": "Test Principal",
            "user_email": self.test_user_email,
            "user_password": self.test_user_password
        }
        
        status_code, data = self.make_request('POST', '/auth/register-school', registration_data)
        
        success = status_code == 200 and 'access_token' in data
        if success:
            self.token = data['access_token']
            self.school_id = data['school']['id']
            self.user_id = data['user']['id']
        
        self.log_result("School Registration", success, 
                       f"Status: {status_code}, Data: {data}" if not success else "", data)

    def test_login(self):
        """Test user login"""
        print("\n🔍 Testing Login...")
        
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        status_code, data = self.make_request('POST', '/auth/login', login_data)
        
        success = status_code == 200 and 'access_token' in data
        if success:
            self.token = data['access_token']
        
        self.log_result("User Login", success, 
                       f"Status: {status_code}" if not success else "", data)

    def test_get_me(self):
        """Test get current user info"""
        print("\n🔍 Testing Get Current User...")
        
        status_code, data = self.make_request('GET', '/auth/me')
        
        success = status_code == 200 and 'user' in data and 'school' in data
        self.log_result("Get Current User", success, 
                       f"Status: {status_code}" if not success else "", data)

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n🔍 Testing Dashboard Stats...")
        
        status_code, data = self.make_request('GET', '/dashboard/stats')
        
        success = status_code == 200 and 'total_students' in data
        self.log_result("Dashboard Stats", success, 
                       f"Status: {status_code}" if not success else "", data)

    def test_get_classes(self):
        """Test get classes endpoint"""
        print("\n🔍 Testing Get Classes...")
        
        status_code, data = self.make_request('GET', '/classes')
        
        success = status_code == 200 and 'classes' in data
        self.log_result("Get Classes", success, 
                       f"Status: {status_code}" if not success else "", data)

    def test_student_management(self):
        """Test student CRUD operations"""
        print("\n🔍 Testing Student Management...")
        
        # Create student
        student_data = {
            "class_name": "Class 5",
            "admission_number": f"ADM{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "name": "Test Student",
            "father_name": "Test Father",
            "mother_name": "Test Mother",
            "date_of_birth": "2010-01-15",
            "gender": "male",
            "address": "123 Student Street",
            "parent_contact": "+91-9876543210",
            "parent_email": "parent@test.com",
            "date_of_admission": date.today().isoformat()
        }
        
        status_code, data = self.make_request('POST', '/students', student_data)
        success = status_code == 200 and 'id' in data
        if success:
            self.test_student_id = data['id']
        
        self.log_result("Create Student", success, 
                       f"Status: {status_code}" if not success else "", data)
        
        if not success:
            return
        
        # Get students
        status_code, data = self.make_request('GET', '/students')
        success = status_code == 200 and isinstance(data, list)
        self.log_result("Get Students", success, 
                       f"Status: {status_code}" if not success else "", data)
        
        # Get single student
        if self.test_student_id:
            status_code, data = self.make_request('GET', f'/students/{self.test_student_id}')
            success = status_code == 200 and data.get('id') == self.test_student_id
            self.log_result("Get Single Student", success, 
                           f"Status: {status_code}" if not success else "", data)
        
        # Update student
        if self.test_student_id:
            update_data = {"name": "Updated Test Student"}
            status_code, data = self.make_request('PUT', f'/students/{self.test_student_id}', update_data)
            success = status_code == 200 and data.get('name') == "Updated Test Student"
            self.log_result("Update Student", success, 
                           f"Status: {status_code}" if not success else "", data)

    def test_fee_management(self):
        """Test fee management operations"""
        print("\n🔍 Testing Fee Management...")
        
        # Create fee bill
        fee_data = {
            "name": "Monthly Fee",
            "amount": 5000.0,
            "description": "Monthly tuition fee",
            "target_class": "Class 5",
            "due_date": "2024-12-31"
        }
        
        status_code, data = self.make_request('POST', '/fee-bills', fee_data)
        success = status_code == 200 and 'id' in data
        if success:
            self.test_fee_bill_id = data['id']
        
        self.log_result("Create Fee Bill", success, 
                       f"Status: {status_code}" if not success else "", data)
        
        # Get fee bills
        status_code, data = self.make_request('GET', '/fee-bills')
        success = status_code == 200 and isinstance(data, list)
        self.log_result("Get Fee Bills", success, 
                       f"Status: {status_code}" if not success else "", data)
        
        # Get fee bill students
        if self.test_fee_bill_id:
            status_code, data = self.make_request('GET', f'/fee-bills/{self.test_fee_bill_id}/students')
            success = status_code == 200 and isinstance(data, list)
            self.log_result("Get Fee Bill Students", success, 
                           f"Status: {status_code}" if not success else "", data)

    def test_attendance_system(self):
        """Test attendance marking"""
        print("\n🔍 Testing Attendance System...")
        
        if not self.test_student_id:
            self.log_result("Attendance Test", False, "No student ID available", None)
            return
        
        # Mark attendance
        attendance_data = {
            "date": date.today().isoformat(),
            "records": [
                {
                    "student_id": self.test_student_id,
                    "status": "present"
                }
            ]
        }
        
        status_code, data = self.make_request('POST', '/attendance', attendance_data)
        success = status_code == 200 and isinstance(data, list)
        self.log_result("Mark Attendance", success, 
                       f"Status: {status_code}" if not success else "", data)
        
        # Get attendance
        params = {
            "date": date.today().isoformat(),
            "class_name": "Class 5"
        }
        status_code, data = self.make_request('GET', '/attendance', params=params)
        success = status_code == 200 and isinstance(data, list)
        self.log_result("Get Attendance", success, 
                       f"Status: {status_code}" if not success else "", data)

    def test_notifications(self):
        """Test notification system"""
        print("\n🔍 Testing Notification System...")
        
        # Create notification
        notification_data = {
            "title": "Test Notification",
            "message": "This is a test notification for parents.",
            "target_class": "Class 5"
        }
        
        status_code, data = self.make_request('POST', '/notifications', notification_data)
        success = status_code == 200 and 'id' in data
        notification_id = data.get('id') if success else None
        
        self.log_result("Create Notification", success, 
                       f"Status: {status_code}" if not success else "", data)
        
        # Get notifications
        status_code, data = self.make_request('GET', '/notifications')
        success = status_code == 200 and isinstance(data, list)
        self.log_result("Get Notifications", success, 
                       f"Status: {status_code}" if not success else "", data)
        
        # Get notification contacts
        if notification_id:
            status_code, data = self.make_request('GET', f'/notifications/{notification_id}/contacts')
            success = status_code == 200 and 'contacts' in data
            self.log_result("Get Notification Contacts", success, 
                           f"Status: {status_code}" if not success else "", data)

    def test_user_management(self):
        """Test user management (Principal only)"""
        print("\n🔍 Testing User Management...")
        
        # Create teacher user
        teacher_data = {
            "email": f"teacher{datetime.now().strftime('%H%M%S')}@testschool.com",
            "password": "TeacherPass123!",
            "name": "Test Teacher",
            "role": "teacher"
        }
        
        status_code, data = self.make_request('POST', '/users', teacher_data)
        success = status_code == 200 and 'id' in data
        teacher_id = data.get('id') if success else None
        
        self.log_result("Create Teacher User", success, 
                       f"Status: {status_code}" if not success else "", data)
        
        # Get users
        status_code, data = self.make_request('GET', '/users')
        success = status_code == 200 and isinstance(data, list)
        self.log_result("Get Users", success, 
                       f"Status: {status_code}" if not success else "", data)

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test student
        if self.test_student_id:
            status_code, data = self.make_request('DELETE', f'/students/{self.test_student_id}')
            success = status_code == 200
            self.log_result("Delete Test Student", success, 
                           f"Status: {status_code}" if not success else "", data)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting School Administration API Tests...")
        print(f"📍 Testing against: {self.base_url}")
        
        try:
            # Core API tests
            self.test_health_check()
            self.test_school_registration()
            
            if self.token:  # Only continue if registration/login successful
                self.test_get_me()
                self.test_dashboard_stats()
                self.test_get_classes()
                self.test_student_management()
                self.test_fee_management()
                self.test_attendance_system()
                self.test_notifications()
                self.test_user_management()
                
                # Cleanup
                self.cleanup_test_data()
            else:
                print("❌ Authentication failed - skipping authenticated tests")
        
        except Exception as e:
            print(f"❌ Test suite failed with error: {str(e)}")
        
        # Print summary
        print(f"\n📊 Test Results Summary:")
        print(f"   Tests Run: {self.tests_run}")
        print(f"   Tests Passed: {self.tests_passed}")
        print(f"   Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"   Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "   Success Rate: 0%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = SchoolAdminAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "failed_tests": tester.tests_run - tester.tests_passed,
        "success_rate": (tester.tests_passed/tester.tests_run*100) if tester.tests_run > 0 else 0,
        "test_details": tester.test_results
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())