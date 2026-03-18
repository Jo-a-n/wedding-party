-- Admin mode: add hidden column to wishes and gallery_items
ALTER TABLE wishes ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE gallery_items ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- Site settings for configurable datetimes
CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON site_settings FOR SELECT USING (true);

-- Seed with defaults (service role key will handle inserts/updates)
INSERT INTO site_settings (key, value) VALUES
  ('ceremony_start', '2026-03-21T19:30:00+02:00'),
  ('ceremony_end', '2026-03-21T20:00:00+02:00'),
  ('wish_deadline', '2026-03-22T11:00:00+03:00'),
  ('gallery_deadline', '2026-03-22T11:00:00+03:00');

-- Enable realtime for DELETE events on wishes and gallery_items
-- (INSERT is already enabled; this ensures admin hide/show propagates)
-- Note: Supabase realtime needs the table's REPLICA IDENTITY set to FULL
-- for DELETE events to include the old row data
ALTER TABLE wishes REPLICA IDENTITY FULL;
ALTER TABLE gallery_items REPLICA IDENTITY FULL;
