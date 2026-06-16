-- ========================================================
-- AI ROADMAP GENERATOR - MASTER REPAIR SCRIPT (v4.0)
-- ========================================================
-- RUN THIS SCRIPT TO FIX ALL 404 AND 406 ERRORS.
-- It will delete the old 'resumes' and create a fresh 'user_resumes'.

-- 1. DROP OLD/CONFLICTING TABLES
DROP TABLE IF EXISTS resumes CASCADE;

DROP TABLE IF EXISTS user_resumes CASCADE;

-- 2. CREATE THE NEW TABLE
CREATE TABLE user_resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  summary TEXT,
  education JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  portfolio_template TEXT DEFAULT 'modern-minimalist',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE SECURITY
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES (FORCE RECREATE)
DROP POLICY IF EXISTS "resumes_owner_policy" ON user_resumes;
CREATE POLICY "resumes_owner_policy" ON user_resumes 
FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "resumes_public_view" ON user_resumes;
CREATE POLICY "resumes_public_view" ON user_resumes 
FOR SELECT USING (true);

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
