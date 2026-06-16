-- ========================================================
-- AI ROADMAP GENERATOR - MASTER DATABASE SCHEMA (v4.0)
-- ========================================================
-- This script will create all necessary tables and security policies.
-- IT USES THE CORRECT 'user_resumes' TABLE NAME.
-- Copy and paste this into the Supabase SQL Editor.

-- 1. Table for Public User Profiles
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table for User Resume Data (Correct Name: user_resumes)
CREATE TABLE IF NOT EXISTS user_resumes (
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

-- 3. Table for Saving Roadmaps
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  steps JSONB DEFAULT '[]',
  completed_steps INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table for AI Usage Limits
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE DEFAULT CURRENT_DATE,
  roadmap_count INTEGER DEFAULT 0,
  UNIQUE(user_id, usage_date)
);

-- 5. Table for Feedbacks/Testimonials
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Table for Trial Tracking
CREATE TABLE IF NOT EXISTS user_trials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, trial_type)
);

-- 7. Table for Aptitude Topics
CREATE TABLE IF NOT EXISTS aptitude_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  study_guide TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Table for Aptitude Questions
CREATE TABLE IF NOT EXISTS aptitude_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES aptitude_topics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer_index INTEGER NOT NULL,
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE aptitude_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE aptitude_questions ENABLE ROW LEVEL SECURITY;

-- 10. Create Security Policies (Safe script)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_all') THEN
        CREATE POLICY "users_all" ON users FOR ALL USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'resumes_all') THEN
        CREATE POLICY "resumes_all" ON user_resumes FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'resumes_view_all') THEN
        CREATE POLICY "resumes_view_all" ON user_resumes FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'roadmaps_all') THEN
        CREATE POLICY "roadmaps_all" ON roadmaps FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'usage_all') THEN
        CREATE POLICY "usage_all" ON user_usage FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'feedbacks_view') THEN
        CREATE POLICY "feedbacks_view" ON feedbacks FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'feedbacks_insert') THEN
        CREATE POLICY "feedbacks_insert" ON feedbacks FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'trials_all') THEN
        CREATE POLICY "trials_all" ON user_trials FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'apt_topics_view') THEN
        CREATE POLICY "apt_topics_view" ON aptitude_topics FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'apt_questions_view') THEN
        CREATE POLICY "apt_questions_view" ON aptitude_questions FOR SELECT USING (true);
    END IF;
END $$;

-- 11. RPC Function for Quiz
CREATE OR REPLACE FUNCTION get_random_questions(topic_uuid UUID, num INTEGER)
RETURNS SETOF aptitude_questions AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM aptitude_questions
  WHERE topic_id = topic_uuid
  ORDER BY random()
  LIMIT num;
END;
$$ LANGUAGE plpgsql;

-- 12. FORCE CACHE RELOAD
NOTIFY pgrst, 'reload schema';
