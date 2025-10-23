"""Minimal bot: generate a small CSV summary from the SQLite DB."""
import os, csv
from datetime import datetime

DB = os.path.join(os.path.dirname(__file__), 'job_applications.db')

def generate():
    import sqlite3
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    try:
        cur.execute('SELECT id, company, position, source, status, applied_at FROM application')
        rows = cur.fetchall()
    except Exception:
        rows = []
    conn.close()

    outdir = os.path.join(os.path.dirname(__file__), 'reports')
    os.makedirs(outdir, exist_ok=True)
    path = os.path.join(outdir, f'summary_{datetime.utcnow().strftime("%Y%m%d%H%M%S")}.csv')
    with open(path, 'w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['id','company','position','source','status','applied_at'])
        for r in rows:
            w.writerow(r)
    print('Report generated at', path)

if __name__ == '__main__':
    generate()
