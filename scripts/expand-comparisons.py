#!/usr/bin/env python3
"""Generate occupation comparison pages for salary-data"""
import sqlite3, os, time

DB_PATH = os.path.join(os.path.dirname(__file__), "../data/salary.db")

def main():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS comparisons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slugA TEXT NOT NULL, slugB TEXT NOT NULL,
            titleA TEXT NOT NULL, titleB TEXT NOT NULL,
            popularity_score REAL DEFAULT 0,
            UNIQUE(slugA, slugB)
        )
    """)
    # Get all occupations
    occs = conn.execute("SELECT slug, title FROM occupations ORDER BY slug").fetchall()
    print(f"Occupations: {len(occs)}")
    
    t0 = time.time()
    batch = []
    count = 0
    for i in range(len(occs)):
        for j in range(i + 1, len(occs)):
            slugA, titleA = occs[i]
            slugB, titleB = occs[j]
            batch.append((slugA, slugB, titleA, titleB, len(titleA) + len(titleB)))
            count += 1
            if len(batch) >= 5000:
                conn.executemany("INSERT OR IGNORE INTO comparisons (slugA, slugB, titleA, titleB, popularity_score) VALUES (?,?,?,?,?)", batch)
                conn.commit()
                print(f"  Inserted {count} pairs...")
                batch = []
    if batch:
        conn.executemany("INSERT OR IGNORE INTO comparisons (slugA, slugB, titleA, titleB, popularity_score) VALUES (?,?,?,?,?)", batch)
        conn.commit()
    
    final = conn.execute("SELECT COUNT(*) FROM comparisons").fetchone()[0]
    print(f"\nDone! {final} comparisons in {time.time()-t0:.1f}s")
    conn.close()

if __name__ == "__main__":
    main()
