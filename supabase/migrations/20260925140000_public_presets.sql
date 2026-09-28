-- Public presets gallery
-- Created: 2026-09-25

-- Add is_public to user_presets
ALTER TABLE public.user_presets ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Public presets view (for gallery)
CREATE VIEW public.public_presets AS
SELECT
  up.user_id,
  p.id as preset_id,
  p.name,
  p.title,
  p.subtitle,
  p.theme,
  p.template,
  p.created_at,
  u.email as author_email,
  u.raw_user_meta_data->>'full_name' as author_name,
  u.raw_user_meta_data->>'avatar_url' as author_avatar
FROM public.user_presets up,
LATERAL jsonb_array_elements(up.data) AS p
JOIN auth.users u ON u.id = up.user_id
WHERE up.is_public = true;

GRANT SELECT ON public.public_presets TO authenticated, anon;

-- Fork tracking
CREATE TABLE public.preset_forks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_preset_name text NOT NULL,
  forked_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forked_preset_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.preset_forks TO authenticated;
GRANT ALL ON public.preset_forks TO service_role;
ALTER TABLE public.preset_forks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "preset_forks_select_own" ON public.preset_forks FOR SELECT TO authenticated USING (auth.uid() = forked_by OR auth.uid() = original_user_id);
CREATE POLICY "preset_forks_insert_own" ON public.preset_forks FOR INSERT TO authenticated WITH CHECK (auth.uid() = forked_by);

CREATE INDEX idx_preset_forks_original ON public.preset_forks (original_user_id, original_preset_name);
CREATE INDEX idx_preset_forks_forked ON public.preset_forks (forked_by);

-- Partial index for public presets
CREATE INDEX idx_user_presets_public ON public.user_presets (is_public) WHERE is_public = true;