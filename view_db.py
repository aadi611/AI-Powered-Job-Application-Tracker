import sqlite3, os

DB = os.path.join(os.path.dirname(__file__), 'job_applications.db')

def show():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    try:
        cur.execute('SELECT id, company, position, source, status, applied_at FROM application')
        rows = cur.fetchall()
        for r in rows:
            print(r)
    except Exception as e:
        print('Error reading DB:', e)
    finally:
        conn.close()

if __name__ == '__main__':
    show()
