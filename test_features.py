"""
Quick test script to verify all new features work correctly
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = 'http://127.0.0.1:5000'

def test_api():
    print("🧪 Testing Job Tracker API...\n")
    
    # Test 1: Add application with notes
    print("1️⃣ Testing: Add application with notes")
    new_app = {
        'company': 'Test Corp',
        'position': 'QA Engineer',
        'source': 'manual',
        'notes': 'This is a test application with notes'
    }
    response = requests.post(f'{BASE_URL}/api/add-application', json=new_app)
    if response.status_code == 201:
        app_id = response.json()['id']
        print(f"   ✅ Created application with ID: {app_id}")
    else:
        print(f"   ❌ Failed: {response.status_code}")
        return
    
    # Test 2: List applications
    print("\n2️⃣ Testing: List applications")
    response = requests.get(f'{BASE_URL}/api/list-applications')
    if response.status_code == 200:
        apps = response.json()
        print(f"   ✅ Retrieved {len(apps)} applications")
    else:
        print(f"   ❌ Failed: {response.status_code}")
        return
    
    # Test 3: Edit application
    print("\n3️⃣ Testing: Edit application")
    edit_data = {
        'company': 'Updated Test Corp',
        'position': 'Senior QA Engineer',
        'status': 'Interview',
        'notes': 'Updated notes - interview scheduled!'
    }
    response = requests.put(f'{BASE_URL}/api/edit-application/{app_id}', json=edit_data)
    if response.status_code == 200:
        updated = response.json()
        print(f"   ✅ Updated: {updated['company']} - {updated['status']}")
    else:
        print(f"   ❌ Failed: {response.status_code}")
        return
    
    # Test 4: Date range filtering
    print("\n4️⃣ Testing: Date range filtering")
    start = (datetime.now() - timedelta(days=7)).isoformat()
    response = requests.get(f'{BASE_URL}/api/list-applications?start_date={start}')
    if response.status_code == 200:
        filtered = response.json()
        print(f"   ✅ Filtered results: {len(filtered)} applications")
    else:
        print(f"   ❌ Failed: {response.status_code}")
        return
    
    # Test 5: Dashboard stats
    print("\n5️⃣ Testing: Dashboard stats")
    response = requests.get(f'{BASE_URL}/api/dashboard-stats')
    if response.status_code == 200:
        stats = response.json()
        print(f"   ✅ Stats: {stats['total']} total, By status: {stats['by_status']}")
    else:
        print(f"   ❌ Failed: {response.status_code}")
        return
    
    # Test 6: Delete application
    print("\n6️⃣ Testing: Delete application")
    response = requests.delete(f'{BASE_URL}/api/delete-application/{app_id}')
    if response.status_code == 200:
        print(f"   ✅ Deleted application {app_id}")
    else:
        print(f"   ❌ Failed: {response.status_code}")
        return
    
    print("\n✨ All tests passed! Features are working correctly.\n")

if __name__ == '__main__':
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to server.")
        print("   Make sure the Flask app is running: python app.py")
    except Exception as e:
        print(f"❌ Error: {e}")
