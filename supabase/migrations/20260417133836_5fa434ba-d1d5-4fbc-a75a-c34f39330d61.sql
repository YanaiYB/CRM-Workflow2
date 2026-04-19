-- Add lead source tracking to clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS lead_source text,
  ADD COLUMN IF NOT EXISTS referred_by text;

-- Create event_notes table for internal timestamped notes per event
CREATE TABLE IF NOT EXISTS public.event_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  content text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_notes_event_id ON public.event_notes(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notes_created_at ON public.event_notes(created_at DESC);

ALTER TABLE public.event_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth all event_notes"
  ON public.event_notes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
