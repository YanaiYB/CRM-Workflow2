-- ENUMS
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- TABLE: brand_team_members
CREATE TABLE public.brand_team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand public.brand NOT NULL,
  name TEXT NOT NULL,
  role TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.brand_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth all brand_team_members"
ON public.brand_team_members
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_brand_team_members_updated_at
BEFORE UPDATE ON public.brand_team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- TABLE: tasks
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand public.brand NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status public.task_status NOT NULL DEFAULT 'todo',
  priority public.task_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth all tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tasks_brand ON public.tasks(brand);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);

-- TABLE: task_assignees
CREATE TABLE public.task_assignees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.brand_team_members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_id, member_id)
);

ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth all task_assignees"
ON public.task_assignees
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE INDEX idx_task_assignees_task ON public.task_assignees(task_id);

-- TABLE: task_checklist
CREATE TABLE public.task_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth all task_checklist"
ON public.task_checklist
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE INDEX idx_task_checklist_task ON public.task_checklist(task_id);