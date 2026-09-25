-- User presets table for cloud sync
-- Created: 2026-09-25

CREATE TABLE public.user_presets (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_presets TO authenticated;
GRANT ALL ON public.user_presets TO service_role;
ALTER TABLE public.user_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_presets_select_own" ON public.user_presets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_presets_insert_own" ON public.user_presets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_presets_update_own" ON public.user_presets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_presets_delete_own" ON public.user_presets FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER user_presets_updated_at BEFORE UPDATE ON public.user_presets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Index for faster lookups
CREATE INDEX idx_user_presets_user_id ON public.user_presets (user_id);