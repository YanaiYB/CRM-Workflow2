-- Update LORE WEDDINGS checklist for all existing events to match new template
-- New template: קבלת מקדמה, צילום החתונה, עריכת ריל, עריכת קליפ, עריכת סרט ארוך, שליחת תמונות, מסירת גלריה, קבלת תשלום סופי

DO $$
DECLARE
  ev RECORD;
  new_items TEXT[] := ARRAY[
    'קבלת מקדמה',
    'צילום החתונה',
    'עריכת ריל',
    'עריכת קליפ',
    'עריכת סרט ארוך',
    'שליחת תמונות',
    'מסירת גלריה',
    'קבלת תשלום סופי'
  ];
  removed_items TEXT[] := ARRAY[
    'שליחת חוזה',
    'שיחת תיאום לפני החתונה',
    'ביקור בלוקיישן',
    'עריכה ראשונית'
  ];
  item TEXT;
  i INT;
BEGIN
  FOR ev IN SELECT id FROM public.events WHERE brand = 'lore_weddings' LOOP
    -- Delete removed items
    DELETE FROM public.event_checklist
    WHERE event_id = ev.id AND text = ANY(removed_items);

    -- Insert new items that don't already exist
    FOR i IN 1..array_length(new_items, 1) LOOP
      item := new_items[i];
      IF NOT EXISTS (
        SELECT 1 FROM public.event_checklist WHERE event_id = ev.id AND text = item
      ) THEN
        INSERT INTO public.event_checklist (event_id, text, position, is_done)
        VALUES (ev.id, item, i - 1, false);
      END IF;
    END LOOP;

    -- Reorder positions to match template order
    FOR i IN 1..array_length(new_items, 1) LOOP
      UPDATE public.event_checklist
      SET position = i - 1
      WHERE event_id = ev.id AND text = new_items[i];
    END LOOP;
  END LOOP;
END $$;