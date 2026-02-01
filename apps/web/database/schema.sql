-- Physics Tutor App Database Schema
-- Run this SQL in your Neon/PostgreSQL database

-- Problems table
CREATE TABLE IF NOT EXISTS problems (
  id SERIAL PRIMARY KEY,
  problem_text TEXT NOT NULL,
  problem_image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Solutions table
CREATE TABLE IF NOT EXISTS solutions (
  id SERIAL PRIMARY KEY,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  final_answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Solution steps table
CREATE TABLE IF NOT EXISTS solution_steps (
  id SERIAL PRIMARY KEY,
  solution_id INTEGER NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  explanation TEXT NOT NULL,
  formula TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(solution_id, step_number)
);

-- Visuals table (for diagrams and visualizations)
CREATE TABLE IF NOT EXISTS visuals (
  id SERIAL PRIMARY KEY,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  visual_type TEXT NOT NULL, -- e.g., 'free_body_diagram', 'projectile_motion', 'energy_diagram'
  visual_description TEXT,
  svg_data TEXT, -- SVG code for the diagram
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tutor conversations table
CREATE TABLE IF NOT EXISTS tutor_conversations (
  id SERIAL PRIMARY KEY,
  problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tutor messages table
CREATE TABLE IF NOT EXISTS tutor_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES tutor_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_solutions_problem_id ON solutions(problem_id);
CREATE INDEX IF NOT EXISTS idx_solution_steps_solution_id ON solution_steps(solution_id);
CREATE INDEX IF NOT EXISTS idx_visuals_problem_id ON visuals(problem_id);
CREATE INDEX IF NOT EXISTS idx_tutor_conversations_problem_id ON tutor_conversations(problem_id);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_conversation_id ON tutor_messages(conversation_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solutions_updated_at BEFORE UPDATE ON solutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visuals_updated_at BEFORE UPDATE ON visuals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tutor_conversations_updated_at BEFORE UPDATE ON tutor_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
