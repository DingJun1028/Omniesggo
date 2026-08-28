-- ESG Impact Note Feedback Database Schema
-- Designed for integration with ESG-GO platform
-- 5T Compliance: Traceable | Trackable | Tangible | Transparent | Trustworthy

-- Feedback submissions table
CREATE TABLE IF NOT EXISTS esg_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- User Information
  name TEXT NOT NULL,                          -- 姓名 / Name
  email TEXT NOT NULL,                         -- 電子郵件 / Email
  trip_date DATE NOT NULL,                     -- 旅程日期 / Date
  source TEXT DEFAULT 'esg-impact-note',       -- 來源 / Source
  
  -- Feedback Content
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),  -- 整體評分 / Rating (1-5)
  esg_impact TEXT NOT NULL CHECK (esg_impact IN ('high', 'medium', 'low')),  -- ESG 影響 / ESG Impact
  detailed_feedback TEXT NOT NULL,             -- 詳細回饋 / Detailed Feedback
  recommend BOOLEAN DEFAULT FALSE,             -- 推薦好友 / Recommend
  
  -- Metadata
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- 提交時間 / Timestamp
  ip_address TEXT,                             -- IP 位址 / IP Address
  user_agent TEXT,                             -- 使用者代理 / User Agent
  
  -- Verification
  hash TEXT NOT NULL UNIQUE,                   -- SHA-256 hash for integrity
  verified BOOLEAN DEFAULT FALSE               -- 驗證狀態 / Verified
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_esg_feedback_date ON esg_feedback(trip_date);
CREATE INDEX IF NOT EXISTS idx_esg_feedback_rating ON esg_feedback(overall_rating);
CREATE INDEX IF NOT EXISTS idx_esg_feedback_source ON esg_feedback(source);
CREATE INDEX IF NOT EXISTS idx_esg_feedback_verified ON esg_feedback(verified);

-- Statistics view for dashboard
CREATE VIEW IF NOT EXISTS esg_feedback_stats AS
SELECT 
  COUNT(*) as total_responses,
  AVG(overall_rating) as avg_rating,
  ROUND(AVG(CASE WHEN recommend THEN 1.0 ELSE 0.0 END) * 100, 1) as recommend_rate,
  COUNT(CASE WHEN esg_impact = 'high' THEN 1 END) as high_impact_count,
  COUNT(CASE WHEN esg_impact = 'medium' THEN 1 END) as medium_impact_count,
  COUNT(CASE WHEN esg_impact = 'low' THEN 1 END) as low_impact_count,
  MIN(submitted_at) as first_response,
  MAX(submitted_at) as latest_response
FROM esg_feedback;

-- Monthly trend view
CREATE VIEW IF NOT EXISTS esg_feedback_trend AS
SELECT 
  strftime('%Y-%m', submitted_at) as month,
  COUNT(*) as responses,
  ROUND(AVG(overall_rating), 1) as avg_rating,
  ROUND(AVG(CASE WHEN recommend THEN 1.0 ELSE 0.0 END) * 100, 1) as recommend_rate
FROM esg_feedback
GROUP BY month
ORDER BY month DESC;

-- Insert trigger for hash generation (ensures integrity)
-- Note: SQLite doesn't support computed columns with functions in older versions
-- Hash should be generated application-side before insert

-- Sample insert statement template:
/*
INSERT INTO esg_feedback (
  name, email, trip_date, overall_rating, 
  esg_impact, detailed_feedback, recommend, 
  ip_address, user_agent, hash, verified
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE
);
*/

-- 5T Verification Query Template
-- SELECT hash, verified, submitted_at FROM esg_feedback WHERE id = ?;
