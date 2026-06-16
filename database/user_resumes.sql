CREATE TABLE IF NOT EXISTS user_resumes (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  summary TEXT,
  education JSONB DEFAULT '[]',
  experience JSONB DEFAULT '[]',
  projects JSONB DEFAULT '[]',
  skills JSONB DEFAULT '[]',
  achievements JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  portfolio_template TEXT DEFAULT 'modern-minimalist',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can manage their own resume" ON user_resumes FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
