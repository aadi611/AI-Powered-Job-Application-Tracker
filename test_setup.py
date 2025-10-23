from app import app, db, Application

def seed():
    with app.app_context():
        db.create_all()
        if Application.query.count() == 0:
            demo = Application(company='Demo Co', position='Backend Engineer', source='manual')
            db.session.add(demo)
            db.session.commit()
            print('Seeded demo data')
        else:
            print('DB already seeded')

if __name__ == '__main__':
    seed()
