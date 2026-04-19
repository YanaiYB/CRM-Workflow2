-- Set REPLICA IDENTITY FULL so UPDATE/DELETE payloads include full row data
ALTER TABLE public.events REPLICA IDENTITY FULL;
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER TABLE public.event_team REPLICA IDENTITY FULL;
ALTER TABLE public.event_checklist REPLICA IDENTITY FULL;
ALTER TABLE public.event_files REPLICA IDENTITY FULL;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.task_checklist REPLICA IDENTITY FULL;
ALTER TABLE public.task_assignees REPLICA IDENTITY FULL;
ALTER TABLE public.brand_team_members REPLICA IDENTITY FULL;

-- Add tables to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_team;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_checklist;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_files;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_checklist;
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_assignees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_team_members;