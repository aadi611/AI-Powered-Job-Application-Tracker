from flask import Flask, jsonify, request, render_template, send_file
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

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

with app.app_context():
    # Ensure tables exist when the app module is imported/run
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

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

if __name__ == '__main__':
    app.run(debug=True)
