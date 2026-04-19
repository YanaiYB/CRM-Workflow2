-- Add event_type enum and column for LORE_WEDDINGS distinction
CREATE TYPE public.wedding_event_type AS ENUM ('wedding', 'henna');

ALTER TABLE public.events
ADD COLUMN event_type public.wedding_event_type NULL;
