ALTER TABLE public.events
ADD COLUMN album_photos_sent BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN album_photos_selected BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN album_delivered BOOLEAN NOT NULL DEFAULT false;