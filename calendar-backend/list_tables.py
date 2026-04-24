import sqlite3

try:
    conn = sqlite3.connect(r'd:\Code\DuAn\CongNghePhanMem\calendar-backend\db.sqlite3')
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cur.fetchall()]
    with open(r'd:\Code\DuAn\CongNghePhanMem\calendar-backend\tables.txt', 'w') as f:
        for t in tables:
            f.write(t + "\n")
except Exception as e:
    with open(r'd:\Code\DuAn\CongNghePhanMem\calendar-backend\tables.txt', 'w') as f:
        f.write(str(e))
