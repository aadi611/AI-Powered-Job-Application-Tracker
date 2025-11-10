"""
Migration script to add notes column to existing database
"""
import os
import sqlite


BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, 'job_applications.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if notes column exists
    cursor.execute("PRAGMA table_info(application)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'notes' not in columns:
        print("Adding 'notes' column to application table...")
        cursor.execute("ALTER TABLE application ADD COLUMN notes TEXT DEFAULT ''")
        conn.commit()
        print("✓ Migration completed successfully!")
    else:
        print("✓ Notes column already exists. No migration needed.")
    
    conn.close()

if __name__ == '__main__':
    migrate()
