"""
AI Service Centralized OpenAI Integration
Handles all AI powered features with API key management
"""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AIService:
    """Centralized AI service for all OpenAI interactions"""
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        self.client = OpenAI(api_key=self.api_key)
        self.model = "gpt-4o-mini"  # Cost-effective and fast
    
    def parse_job_description(self, job_text):
        """
        Parse job description and extract structured data
        
        Args:
            job_text (str): Raw job description text
            
        Returns:
            dict: Extracted job details {company, position, location, salary, job_type, requirements, description}
        """
        try:
            prompt = f"""You are a job application assistant. Extract key information from the following job description.

Job Description:
{job_text}

Extract and return a JSON object with the following fields:
- company: Company name (string)
- position: Job title/position (string)
- location: Job location (string, "Remote" if remote)
- salary: Salary range if mentioned (string, "Not specified" if not mentioned)
- job_type: Employment type (string: "Full-time", "Part-time", "Contract", "Internship", or "Not specified")
- requirements: Key requirements and qualifications (string, bullet points separated by newlines)
- description: Brief summary of the role (string, 2-3 sentences)
- source: Where this job was posted (string, extract from text or "Manual Entry")

Be concise and accurate. If information is not available, use "Not specified".

Return ONLY the JSON object, no additional text."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that extracts structured data from job descriptions. Always return valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            result = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if result.startswith("```json"):
                result = result[7:]
            if result.startswith("```"):
                result = result[3:]
            if result.endswith("```"):
                result = result[:-3]
            
            parsed_data = json.loads(result.strip())
            
            # Ensure all required fields exist
            required_fields = ['company', 'position', 'location', 'salary', 'job_type', 'requirements', 'description', 'source']
            for field in required_fields:
                if field not in parsed_data:
                    parsed_data[field] = "Not specified"
            
            return {
                'success': True,
                'data': parsed_data
            }
            
        except json.JSONDecodeError as e:
            return {
                'success': False,
                'error': f'Failed to parse AI response: {str(e)}',
                'raw_response': result if 'result' in locals() else None
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'AI parsing failed: {str(e)}'
            }
    
    def generate_follow_up_email(self, company, position, days_since_application):
        """
        Generate a personalized follow-up email
        
        Args:
            company (str): Company name
            position (str): Job position
            days_since_application (int): Days since application was submitted
            
        Returns:
            dict: Generated email {subject, body}
        """
        try:
            prompt = f"""Generate a professional follow-up email for a job application.

Company: {company}
Position: {position}
Days since application: {days_since_application}

Create a polite, professional follow-up email with:
1. Subject line
2. Email body (3-4 short paragraphs)

The tone should be:
- Professional but friendly
- Show continued interest
- Not desperate or pushy
- Concise and respectful of their time

Return as JSON with fields: "subject" and "body"."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional career coach helping write follow-up emails. Be concise and professional."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            
            result = response.choices[0].message.content.strip()
            
            # Clean JSON
            if result.startswith("```json"):
                result = result[7:]
            if result.startswith("```"):
                result = result[3:]
            if result.endswith("```"):
                result = result[:-3]
            
            email_data = json.loads(result.strip())
            
            return {
                'success': True,
                'data': email_data
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to generate email: {str(e)}'
            }
    
    def analyze_application_success(self, applications_data):
        """
        Analyze application patterns and provide insights
        
        Args:
            applications_data (list): List of application dictionaries
            
        Returns:
            dict: Insights and recommendations
        """
        try:
            # Prepare data summary
            total = len(applications_data)
            if total == 0:
                return {
                    'success': True,
                    'data': {
                        'insights': ['Not enough data yet. Add more applications to get insights!'],
                        'recommendations': ['Start tracking your job applications to unlock AI-powered insights.']
                    }
                }
            
            # Count by status
            status_counts = {}
            for app in applications_data:
                status = app.get('status', 'Applied')
                status_counts[status] = status_counts.get(status, 0) + 1
            
            prompt = f"""Analyze this job application data and provide insights.

Total Applications: {total}
Status Breakdown: {json.dumps(status_counts)}

Sample Applications:
{json.dumps(applications_data[:10], indent=2)}

Provide:
1. 3-5 key insights about the application patterns
2. 3-5 actionable recommendations to improve success rate

Return as JSON with fields:
- "insights": array of insight strings
- "recommendations": array of recommendation strings

Be specific, actionable, and encouraging."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a career analytics expert providing data-driven insights."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                max_tokens=800
            )
            
            result = response.choices[0].message.content.strip()
            
            # Clean JSON
            if result.startswith("```json"):
                result = result[7:]
            if result.startswith("```"):
                result = result[3:]
            if result.endswith("```"):
                result = result[:-3]
            
            analysis = json.loads(result.strip())
            
            return {
                'success': True,
                'data': analysis
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to analyze applications: {str(e)}'
            }
    
    def generate_cover_letter(self, user_profile, job_details):
        """
        Generate a personalized, human-like cover letter
        
        Args:
            user_profile (dict): User's background {name, experience, skills, projects, achievements}
            job_details (dict): Job information {company, position, description, requirements}
            
        Returns:
            dict: Generated cover letter {content}
        """
        try:
            prompt = f"""Write a SHORT, human-like cover letter for this job application.

APPLICANT PROFILE:
Name: {user_profile.get('name', 'Applicant')}
Current/Recent Role: {user_profile.get('current_role', '')}
Years of Experience: {user_profile.get('years_experience', '')}

WORK EXPERIENCE:
{user_profile.get('experience', '')}

KEY PROJECTS:
{user_profile.get('projects', '')}

SKILLS:
{user_profile.get('skills', '')}

ACHIEVEMENTS:
{user_profile.get('achievements', '')}

JOB DETAILS:
Company: {job_details.get('company', '')}
Position: {job_details.get('position', '')}
Description: {job_details.get('description', '')}
Requirements: {job_details.get('requirements', '')}

INSTRUCTIONS:
1. Keep it SHORT - 3 paragraphs maximum, 250-300 words total
2. Sound HUMAN - conversational, not robotic
3. Connect specific past work/projects to job requirements
4. Highlight 2-3 high-impact achievements relevant to this role
5. Show enthusiasm but stay professional
6. Don't use clichés like "I am writing to express my interest"
7. Start with impact - why you're a great fit
8. Use active voice and strong verbs
9. End with clear next step

Format: Plain text, no subject line, ready to paste.
Tone: Professional but personable, confident not arrogant."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert career coach who writes compelling, human-sounding cover letters that get interviews. You avoid generic templates and focus on specific impact."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=600
            )
            
            cover_letter = response.choices[0].message.content.strip()
            
            return {
                'success': True,
                'data': {
                    'content': cover_letter
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to generate cover letter: {str(e)}'
            }

# Singleton instance
_ai_service = None

def get_ai_service():
    """Get or create AI service instance"""
    global _ai_service
    if _ai_service is None:
        try:
            _ai_service = AIService()
        except ValueError as e:
            print(f"Warning: {e}")
            return None
    return _ai_service
