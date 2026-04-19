ALTER TABLE public.client_documents 
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS paid_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;