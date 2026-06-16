CREATE TABLE IF NOT EXISTS aptitude_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  study_guide TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE aptitude_topics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Aptitude topics are viewable by everyone" ON aptitude_topics FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Only admins can manage aptitude topics" ON aptitude_topics FOR ALL USING (auth.jwt() ->> 'email' = 'admin@example.com'); -- Replace with actual admin check
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
