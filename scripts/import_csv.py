"""
直接把 CEFR CSV 塞進 Supabase word_progress
用法：python scripts/import_csv.py
"""

import csv
import os
import time
from supabase import create_client

# ── 設定 ──────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")
CSV_PATH     = os.environ.get("CSV_PATH", r"C:\Users\20250702\OneDrive\Desktop\APP\cefrj-vocabulary-zh.csv")
BATCH_SIZE   = 500   # 每批 upsert 幾筆

# ── CEFR 等級對應 ─────────────────────────────────────────────────
CEFR_MAP = {"a1": "A1", "a2": "A2", "b1": "B1", "b2": "B2", "c1": "C1", "c2": "C2"}

# ── 主邏輯 ────────────────────────────────────────────────────────
def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ 請設定環境變數 SUPABASE_URL 和 SUPABASE_KEY")
        return

    db = create_client(SUPABASE_URL, SUPABASE_KEY)

    rows = []
    skipped = 0

    with open(CSV_PATH, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, 1):
            word    = row.get("headword", "").strip().lower()
            meaning = row.get("zh_def", "").strip()
            pos     = row.get("pos", "").strip()
            cefr    = row.get("CEFR", "").strip().lower()
            example = row.get("example_sentence", "").strip()
            inv     = row.get("inventory", "").strip() or None

            if not word or not meaning:
                skipped += 1
                continue

            exams = [CEFR_MAP[cefr]] if cefr in CEFR_MAP else []

            rows.append({
                "word":           word,
                "meaning":        meaning,
                "phonetic":       None,
                "part_of_speech": pos or None,
                "example":        example or None,
                "exams":          exams,
                "inventory":      inv,
                "mastery":        0,
                "next_review":    int(time.time() * 1000),  # now in ms
                "times_correct":  0,
                "times_wrong":    0,
                "last_wrong_date": None,
            })

    print(f"📄 讀取 {len(rows)} 筆，略過 {skipped} 筆")

    # 分批 upsert
    total = 0
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        db.table("word_progress").upsert(batch, on_conflict="word", ignore_duplicates=True).execute()
        total += len(batch)
        print(f"  ✅ 已上傳 {total}/{len(rows)}")

    print(f"\n🎉 完成！共匯入 {total} 筆單字")

if __name__ == "__main__":
    main()
