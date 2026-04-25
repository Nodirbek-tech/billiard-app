/*
  # Add Session Rounds

  ## Summary
  Adds a `session_rounds` table to track individual game rounds within a session.
  Each session can have many rounds. Only one round can be active at a time per session.

  ## New Table: session_rounds
  - id (uuid pk)
  - session_id (fk → sessions)
  - round_number (integer, 1-based)
  - start_time (timestamptz)
  - end_time (timestamptz, null while active)
  - duration_minutes (integer, stored on close)
  - day_minutes (integer)
  - night_minutes (integer)
  - day_cost (integer UZS)
  - night_cost (integer UZS)
  - calculated_cost (integer UZS)

  ## Security
  - RLS enabled with open anon/authenticated policies (same as rest of app)
*/

CREATE TABLE IF NOT EXISTS session_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  round_number integer NOT NULL DEFAULT 1,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration_minutes integer NOT NULL DEFAULT 0,
  day_minutes integer NOT NULL DEFAULT 0,
  night_minutes integer NOT NULL DEFAULT 0,
  day_cost integer NOT NULL DEFAULT 0,
  night_cost integer NOT NULL DEFAULT 0,
  calculated_cost integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE session_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open read rounds" ON session_rounds FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Open insert rounds" ON session_rounds FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Open update rounds" ON session_rounds FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Open delete rounds" ON session_rounds FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_rounds_session_id ON session_rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_rounds_session_end ON session_rounds(session_id, end_time);
