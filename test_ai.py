"""
Test AI Service - Verify OpenAI Integration
Run this to test if your API key is configured correctly
"""

from ai_service import get_ai_service

def test_ai_service():
    print("🔍 Testing AI Service Configuration...\n")
    
    # Test 1: Check if service can be initialized
    print("Test 1: Initializing AI Service...")
    ai_service = get_ai_service()
    
    if ai_service is None:
        print("❌ FAILED: AI Service not configured")
        print("📝 Please add your OPENAI_API_KEY to the .env file")
        print("   Example: OPENAI_API_KEY=sk-your-key-here")
        return False
    
    print("✅ PASSED: AI Service initialized\n")
    
    # Test 2: Parse a sample job description
    print("Test 2: Testing Job Description Parser...")
    sample_job = """
    Software Engineer at Google
    
    Location: Mountain View, CA (Hybrid)
    Salary: $120,000 - $180,000
    
    We're looking for a talented Software Engineer to join our team. 
    
    Requirements:
    - 3+ years of Python experience
    - Strong knowledge of algorithms and data structures
    - Experience with cloud platforms (GCP, AWS, or Azure)
    - Bachelor's degree in Computer Science or related field
    
    About the role:
    You'll be working on building scalable backend systems that serve millions of users.
    """
    
    result = ai_service.parse_job_description(sample_job)
    
    if result['success']:
        print("✅ PASSED: Job parsing successful!\n")
        print("📊 Extracted Data:")
        data = result['data']
        print(f"   Company: {data.get('company')}")
        print(f"   Position: {data.get('position')}")
        print(f"   Location: {data.get('location')}")
        print(f"   Salary: {data.get('salary')}")
        print(f"   Job Type: {data.get('job_type')}")
        print(f"   Source: {data.get('source')}")
        print(f"\n   Description: {data.get('description')[:100]}...")
        print(f"\n   Requirements: {data.get('requirements')[:150]}...")
    else:
        print(f"❌ FAILED: {result.get('error')}")
        return False
    
    print("\n" + "="*60)
    print("🎉 All tests passed! AI features are ready to use!")
    print("="*60)
    return True

if __name__ == "__main__":
    test_ai_service()
