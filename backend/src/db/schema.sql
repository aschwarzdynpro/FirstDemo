-- Nutzer
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  plan TEXT DEFAULT 'free',        -- 'free' | 'pro' | 'business'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Analysen
CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  filename TEXT NOT NULL,
  file_size INTEGER,
  overall_risk TEXT,               -- 'low' | 'medium' | 'high'
  result_json TEXT,                -- Vollständiges AnalysisResult als JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Nutzungs-Tracking (für Freemium-Limits)
CREATE TABLE IF NOT EXISTS usage (
  user_id TEXT REFERENCES users(id),
  month TEXT NOT NULL,             -- Format: '2026-03'
  analysis_count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, month)
);
