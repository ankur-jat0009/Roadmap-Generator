CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Profiles are viewable by everyone" ON users FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can manage their own profile" ON users FOR ALL USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
