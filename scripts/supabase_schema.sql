-- ================================================================
-- 個人生活 OS — Supabase Schema
-- 在 Supabase SQL Editor 執行此檔案
-- ================================================================


-- ── 英語學習：單字學習進度 ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS word_progress (
  word           text PRIMARY KEY,
  mastery        smallint    NOT NULL DEFAULT 0,   -- 0～5
  next_review    bigint,                            -- timestamp (ms)
  times_correct  int         NOT NULL DEFAULT 0,
  times_wrong    int         NOT NULL DEFAULT 0,
  last_wrong_date bigint,                           -- timestamp (ms)
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 英語學習：每日統計 ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_daily (
  date              date PRIMARY KEY,
  words_studied     int NOT NULL DEFAULT 0,
  quizzes_taken     int NOT NULL DEFAULT 0,
  todos_completed   int NOT NULL DEFAULT 0,
  interaction_count int NOT NULL DEFAULT 0
);

-- ── 英語學習：角色狀態（好感度 / 精力）──────────────────────────
CREATE TABLE IF NOT EXISTS character_states (
  character_id   text PRIMARY KEY,
  affection      int          NOT NULL DEFAULT 0,
  stamina        int          NOT NULL DEFAULT 50,
  unlocked_lines text[]       NOT NULL DEFAULT '{}'
);

-- ── 英語學習：全域統計（單行）────────────────────────────────────
CREATE TABLE IF NOT EXISTS learning_stats (
  id                    int  PRIMARY KEY DEFAULT 1,  -- 永遠只有一筆
  streak                int  NOT NULL DEFAULT 0,
  last_study_date       date,
  today_studied         int  NOT NULL DEFAULT 0,
  total_studied         int  NOT NULL DEFAULT 0,
  selected_character_id text NOT NULL DEFAULT 'shiHe'
);
INSERT INTO learning_stats (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ── 代辦事項 ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS todos (
  id           text    PRIMARY KEY,    -- 原本 WordMate 用 timestamp string
  text         text    NOT NULL,
  completed    boolean NOT NULL DEFAULT false,
  character_id text,
  created_at   bigint,                 -- timestamp (ms)
  due_date     bigint                  -- timestamp (ms)，可為 NULL
);

-- ── 習慣追蹤 ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habit_logs (
  id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  type      text    NOT NULL,   -- water | exercise | spending | sleep
  value     numeric NOT NULL,
  unit      text    NOT NULL,   -- ml | min | twd | hr
  note      text,
  logged_at timestamptz NOT NULL DEFAULT now()
);

-- ── AI 工具記錄（已存在，確認欄位）─────────────────────────────
CREATE TABLE IF NOT EXISTS ai_tool_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name   text NOT NULL,
  test_date   date NOT NULL,
  description text NOT NULL,
  pros        text,
  cons        text,
  use_cases   text,
  created_at  timestamptz DEFAULT now()
);

-- ── AI 新聞（已存在，確認欄位）──────────────────────────────────
CREATE TABLE IF NOT EXISTS news_articles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source       text NOT NULL,
  title        text NOT NULL,
  url          text NOT NULL UNIQUE,
  published_at timestamptz,
  fetched_at   timestamptz DEFAULT now()
);

-- ── 江途每日任務（Bot 記錄）──────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_tasks (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  content      text    NOT NULL,
  date         date    NOT NULL DEFAULT CURRENT_DATE,
  completed    boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ── 江途對話記憶 ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversation_history (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_channel_id text NOT NULL,
  role               text NOT NULL,   -- user | assistant
  content            text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- ── 索引（加速常用查詢）──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_word_progress_next_review    ON word_progress (next_review);
CREATE INDEX IF NOT EXISTS idx_habit_logs_type_logged       ON habit_logs (type, logged_at);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date             ON daily_tasks (date);
CREATE INDEX IF NOT EXISTS idx_conversation_channel_created ON conversation_history (discord_channel_id, created_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_published      ON news_articles (published_at DESC);
