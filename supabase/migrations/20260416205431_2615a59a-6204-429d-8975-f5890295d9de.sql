-- Profiles for username login
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Public read so login can resolve username -> email server-side via service role,
-- but also allow authenticated users to read their own
CREATE POLICY "Profiles viewable by authenticated"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Brand enum
CREATE TYPE public.brand AS ENUM ('lore_weddings', 'depth_studios');
CREATE TYPE public.event_status AS ENUM ('working', 'delivered', 'finished');
CREATE TYPE public.pipeline_stage AS ENUM ('new_lead', 'contacted', 'negotiation', 'booked', 'delivered', 'finished');
CREATE TYPE public.team_role AS ENUM ('photographer', 'videographer', 'editor', 'assistant');
CREATE TYPE public.file_tag AS ENUM ('contract', 'invoice', 'other');

-- Clients
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  instagram TEXT,
  notes TEXT,
  brand public.brand NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all clients" ON public.clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Events
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand public.brand NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  package_details TEXT,
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  deposit NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.event_status NOT NULL DEFAULT 'working',
  pipeline_stage public.pipeline_stage NOT NULL DEFAULT 'new_lead',
  quick_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all events" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_brand ON public.events(brand);
CREATE INDEX idx_events_client ON public.events(client_id);
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Team per event
CREATE TABLE public.event_team (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role public.team_role NOT NULL,
  payment NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_team ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all team" ON public.event_team FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_team_event ON public.event_team(event_id);

-- Checklist
CREATE TABLE public.event_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all checklist" ON public.event_checklist FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_checklist_event ON public.event_checklist(event_id);

-- Files
CREATE TABLE public.event_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  tag public.file_tag NOT NULL DEFAULT 'other',
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.event_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all files" ON public.event_files FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_files_event ON public.event_files(event_id);

-- Storage bucket for event files
INSERT INTO storage.buckets (id, name, public) VALUES ('event-files', 'event-files', false);

CREATE POLICY "auth read event files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'event-files');
CREATE POLICY "auth upload event files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-files');
CREATE POLICY "auth update event files" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'event-files');
CREATE POLICY "auth delete event files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'event-files');