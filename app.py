from flask import Flask, jsonify, request, render_template, send_file
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from ai_service import get_ai_service

BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, 'job_applications.db')

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{DB_PATH}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(256), nullable=False)
    position = db.Column(db.String(256), nullable=False)
    source = db.Column(db.String(128), default='manual')
    status = db.Column(db.String(64), default='Applied')
    notes = db.Column(db.Text, default='')
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'company': self.company,
            'position': self.position,
            'source': self.source,
            'status': self.status,
            'notes': self.notes or '',
            'applied_at': self.applied_at.isoformat()
        }

class UserProfile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(256), nullable=False)
    email = db.Column(db.String(256))
    phone = db.Column(db.String(64))
    current_role = db.Column(db.String(256))
    years_experience = db.Column(db.String(64))
    experience = db.Column(db.Text)  # Previous work experience
    projects = db.Column(db.Text)  # Key projects
    skills = db.Column(db.Text)  # Technical and soft skills
    achievements = db.Column(db.Text)  # High-impact achievements
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email or '',
            'phone': self.phone or '',
            'current_role': self.current_role or '',
            'years_experience': self.years_experience or '',
            'experience': self.experience or '',
            'projects': self.projects or '',
            'skills': self.skills or '',
            'achievements': self.achievements or '',
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

with app.app_context():
    # Ensure tables exist when the app module is imported/run
    db.create_all()
    
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/dashboard-stats', methods=['GET'])
def dashboard_stats():
    total = Application.query.count()
    by_status = {}
    for row in db.session.query(Application.status, db.func.count(Application.id)).group_by(Application.status):
        by_status[row[0]] = row[1]
    return jsonify({'total': total, 'by_status': by_status})

@app.route('/api/add-application', methods=['POST'])
def add_application():
    data = request.get_json() or {}
    company = data.get('company')
    position = data.get('position')
    source = data.get('source', 'manual')
    notes = data.get('notes', '')
    if not company or not position:
        return jsonify({'error': 'company and position required'}), 400
    app_obj = Application(company=company, position=position, source=source, notes=notes)
    db.session.add(app_obj)
    db.session.commit()
    return jsonify(app_obj.to_dict()), 201

@app.route('/api/update-status', methods=['POST'])
def update_status():
    data = request.get_json() or {}
    app_id = data.get('id')
    status = data.get('status')
    if not app_id or not status:
        return jsonify({'error': 'id and status required'}), 400
    app_obj = Application.query.get(app_id)
    if not app_obj:
        return jsonify({'error': 'not found'}), 404
    app_obj.status = status
    db.session.commit()
    return jsonify(app_obj.to_dict())

@app.route('/api/sync-gmail', methods=['POST'])
def sync_gmail():
    # Placeholder: in MVP we simulate a sync that adds a sample record
    sample = Application(company='Example Corp', position='Software Engineer', source='gmail')
    db.session.add(sample)
    db.session.commit()
    return jsonify({'synced': 1})


@app.route('/api/list-applications', methods=['GET'])
def list_applications():
    # Support date range filtering
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = Application.query
    
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query = query.filter(Application.applied_at >= start)
        except ValueError:
            pass
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            query = query.filter(Application.applied_at <= end)
        except ValueError:
            pass
    
    apps = query.order_by(Application.applied_at.desc()).limit(200).all()
    return jsonify([a.to_dict() for a in apps])

@app.route('/api/edit-application/<int:app_id>', methods=['PUT'])
def edit_application(app_id):
    data = request.get_json() or {}
    app_obj = Application.query.get(app_id)
    if not app_obj:
        return jsonify({'error': 'not found'}), 404
    
    # Update fields if provided
    if 'company' in data:
        app_obj.company = data['company']
    if 'position' in data:
        app_obj.position = data['position']
    if 'source' in data:
        app_obj.source = data['source']
    if 'status' in data:
        app_obj.status = data['status']
    if 'notes' in data:
        app_obj.notes = data['notes']
    
    db.session.commit()
    return jsonify(app_obj.to_dict())

@app.route('/api/delete-application/<int:app_id>', methods=['DELETE'])
def delete_application(app_id):
    app_obj = Application.query.get(app_id)
    if not app_obj:
        return jsonify({'error': 'not found'}), 404
    
    db.session.delete(app_obj)
    db.session.commit()
    return jsonify({'success': True, 'id': app_id})

@app.route('/api/generate-report', methods=['GET'])
def generate_report():
    # Minimal CSV report for MVP
    import csv
    path = os.path.join(BASE_DIR, 'reports')
    os.makedirs(path, exist_ok=True)
    file_path = os.path.join(path, f'report_{datetime.utcnow().strftime("%Y%m%d%H%M%S")}.csv')
    apps = Application.query.order_by(Application.applied_at.desc()).all()
    with open(file_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['id', 'company', 'position', 'source', 'status', 'notes', 'applied_at'])
        for a in apps:
            writer.writerow([a.id, a.company, a.position, a.source, a.status, a.notes or '', a.applied_at.isoformat()])
    return send_file(file_path, as_attachment=True)

# AI-Powered Endpoints
@app.route('/api/ai/parse-job', methods=['POST'])
def parse_job_description():
    """AI endpoint to parse job description and extract structured data"""
    data = request.get_json()
    job_text = data.get('job_description', '')
    
    if not job_text or len(job_text.strip()) < 50:
        return jsonify({'success': False, 'error': 'Job description too short. Please provide more details.'}), 400
    
    ai_service = get_ai_service()
    if not ai_service:
        return jsonify({'success': False, 'error': 'AI service not configured. Please add OPENAI_API_KEY to .env file.'}), 500
    
    result = ai_service.parse_job_description(job_text)
    return jsonify(result)

@app.route('/api/ai/generate-followup', methods=['POST'])
def generate_followup():
    """AI endpoint to generate follow-up email"""
    data = request.get_json()
    app_id = data.get('application_id')
    
    if not app_id:
        return jsonify({'success': False, 'error': 'Application ID required'}), 400
    
    app_obj = Application.query.get(app_id)
    if not app_obj:
        return jsonify({'success': False, 'error': 'Application not found'}), 404
    
    days_since = (datetime.utcnow() - app_obj.applied_at).days
    
    ai_service = get_ai_service()
    if not ai_service:
        return jsonify({'success': False, 'error': 'AI service not configured. Please add OPENAI_API_KEY to .env file.'}), 500
    
    result = ai_service.generate_follow_up_email(app_obj.company, app_obj.position, days_since)
    return jsonify(result)

@app.route('/api/ai/analyze-applications', methods=['GET'])
def analyze_applications():
    """AI endpoint to analyze application patterns and provide insights"""
    apps = Application.query.all()
    apps_data = [app.to_dict() for app in apps]
    
    ai_service = get_ai_service()
    if not ai_service:
        return jsonify({'success': False, 'error': 'AI service not configured. Please add OPENAI_API_KEY to .env file.'}), 500
    
    result = ai_service.analyze_application_success(apps_data)
    return jsonify(result)

@app.route('/api/ai/generate-cover-letter', methods=['POST'])
def generate_cover_letter():
    """AI endpoint to generate personalized cover letter"""
    data = request.get_json()
    app_id = data.get('application_id')
    
    if not app_id:
        return jsonify({'success': False, 'error': 'Application ID required'}), 400
    
    # Get application details
    app_obj = Application.query.get(app_id)
    if not app_obj:
        return jsonify({'success': False, 'error': 'Application not found'}), 404
    
    # Get user profile (get first profile, or create default)
    profile = UserProfile.query.first()
    if not profile:
        return jsonify({'success': False, 'error': 'Please complete your profile first to generate cover letters.'}), 400
    
    # Prepare job details from application and notes
    job_details = {
        'company': app_obj.company,
        'position': app_obj.position,
        'description': '',
        'requirements': ''
    }
    
    # Extract details from notes if available
    if app_obj.notes:
        notes = app_obj.notes
        # Extract description
        if '📝' in notes:
            desc_start = notes.find('📝') + 2
            desc_end = notes.find('✅', desc_start)
            if desc_end > desc_start:
                job_details['description'] = notes[desc_start:desc_end].strip()
        
        # Extract requirements
        if '✅ Requirements:' in notes:
            req_start = notes.find('✅ Requirements:') + len('✅ Requirements:')
            job_details['requirements'] = notes[req_start:].strip()
    
    ai_service = get_ai_service()
    if not ai_service:
        return jsonify({'success': False, 'error': 'AI service not configured. Please add OPENAI_API_KEY to .env file.'}), 500
    
    result = ai_service.generate_cover_letter(profile.to_dict(), job_details)
    return jsonify(result)

# User Profile Endpoints
@app.route('/api/profile', methods=['GET'])
def get_profile():
    """Get user profile"""
    profile = UserProfile.query.first()
    if not profile:
        # Return empty profile structure
        return jsonify({
            'success': True,
            'data': {
                'name': '',
                'email': '',
                'phone': '',
                'current_role': '',
                'years_experience': '',
                'experience': '',
                'projects': '',
                'skills': '',
                'achievements': ''
            }
        })
    return jsonify({'success': True, 'data': profile.to_dict()})

@app.route('/api/profile', methods=['POST', 'PUT'])
def save_profile():
    """Create or update user profile"""
    data = request.get_json()
    
    profile = UserProfile.query.first()
    if not profile:
        # Create new profile
        profile = UserProfile(
            name=data.get('name', ''),
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            current_role=data.get('current_role', ''),
            years_experience=data.get('years_experience', ''),
            experience=data.get('experience', ''),
            projects=data.get('projects', ''),
            skills=data.get('skills', ''),
            achievements=data.get('achievements', '')
        )
        db.session.add(profile)
    else:
        # Update existing profile
        profile.name = data.get('name', profile.name)
        profile.email = data.get('email', profile.email)
        profile.phone = data.get('phone', profile.phone)
        profile.current_role = data.get('current_role', profile.current_role)
        profile.years_experience = data.get('years_experience', profile.years_experience)
        profile.experience = data.get('experience', profile.experience)
        profile.projects = data.get('projects', profile.projects)
        profile.skills = data.get('skills', profile.skills)
        profile.achievements = data.get('achievements', profile.achievements)
        profile.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify({'success': True, 'data': profile.to_dict()})

if __name__ == '__main__':
    app.run(debug=True)
