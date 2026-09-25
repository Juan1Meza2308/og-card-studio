-- Analytics: daily usage tracking and template usage
-- Created: 2026-09-25

-- Daily usage stats for granular analytics
CREATE TABLE public.daily_usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  requests_count integer NOT NULL DEFAULT 0 CHECK (requests_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_usage_stats TO authenticated;
GRANT ALL ON public.daily_usage_stats TO service_role;
ALTER TABLE public.daily_usage_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_usage_stats_select_own" ON public.daily_usage_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "daily_usage_stats_insert_own" ON public.daily_usage_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_usage_stats_update_own" ON public.daily_usage_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Template usage tracking
CREATE TABLE public.template_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template_id uuid, -- NULL for built-in templates
  template_name text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('builtin', 'custom')),
  requests_count integer NOT NULL DEFAULT 0 CHECK (requests_count >= 0),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_id, template_name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.template_usage TO authenticated;
GRANT ALL ON public.template_usage TO service_role;
ALTER TABLE public.template_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template_usage_select_own" ON public.template_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "template_usage_insert_own" ON public.template_usage FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "template_usage_update_own" ON public.template_usage FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER daily_usage_stats_updated_at BEFORE UPDATE ON public.daily_usage_stats FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER template_usage_updated_at BEFORE UPDATE ON public.template_usage FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes for analytics queries
CREATE INDEX idx_daily_usage_stats_user_date ON public.daily_usage_stats (user_id, date DESC);
CREATE INDEX idx_template_usage_user_requests ON public.template_usage (user_id, requests_count DESC);