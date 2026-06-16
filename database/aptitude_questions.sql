CREATE TABLE IF NOT EXISTS aptitude_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID REFERENCES aptitude_topics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of strings
  correct_answer_index INTEGER NOT NULL,
  explanation TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE aptitude_questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Aptitude questions are viewable by everyone" ON aptitude_questions FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RPC Function to get random questions
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
