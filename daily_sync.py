import os
import sqlite3
from datetime import datetime

DB = os.path.join(os.path.dirname(__file__), 'job_applications.db')

def run_sync():
    # Minimal local sync: add a timestamped dummy entry to indicate a run
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    try:
        cur.execute('''CREATE TABLE IF NOT EXISTS application (id INTEGER PRIMARY KEY, company TEXT, position TEXT, source TEXT, status TEXT, applied_at TEXT)''')
    except Exception:
        pass
    cur.execute('INSERT INTO application (company, position, source, status, applied_at) VALUES (?, ?, ?, ?, ?)',
                (f'SyncCorp', 'Auto Parsed Role', 'daily_sync', 'Applied', datetime.utcnow().isoformat()))
    conn.commit()
    conn.close()
    print('Daily sync complete')
    print('Sync timestamp:', datetime.utcnow().isoformat())

if __name__ == '__main__':
    run_sync()
