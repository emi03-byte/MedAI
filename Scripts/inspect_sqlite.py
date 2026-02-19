#!/usr/bin/env python3
import sqlite3
import sys
import json
import os

def inspect(db_path, limit=5):
    if not os.path.exists(db_path):
        print(f"ERROR: file not found: {db_path}")
        return 1

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    print(f"Inspecting: {db_path}\n")

    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    tables = [r[0] for r in cur.fetchall()]
    if not tables:
        print("No user tables found.")
        return 0

    for table in tables:
        try:
            cur.execute(f"SELECT COUNT(*) as c FROM '{table}'")
            count = cur.fetchone()[0]
        except Exception as e:
            count = f"ERROR: {e}"

        print(f"Table: {table} (rows: {count})")

        try:
            cur.execute(f"SELECT * FROM '{table}' LIMIT ?", (limit,))
            rows = [dict(r) for r in cur.fetchall()]
        except Exception as e:
            rows = f"ERROR: {e}"

        print("Sample rows:")
        if isinstance(rows, str):
            print(rows)
        else:
            if len(rows) == 0:
                print("  (no rows)")
            else:
                for r in rows:
                    print(json.dumps(r, ensure_ascii=False, indent=2))

        print("\n---\n")

    conn.close()
    return 0

def main():
    if len(sys.argv) < 2:
        print("Usage: inspect_sqlite.py <path-to-db> [limit]")
        return 2
    db_path = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) >= 3 else 5
    return inspect(db_path, limit)

if __name__ == '__main__':
    raise SystemExit(main())
