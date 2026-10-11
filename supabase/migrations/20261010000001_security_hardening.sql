-- Security hardening
-- Created: 2026-10-10
--
-- Closes two real holes and adds defence in depth:
--   1. The attempt counters were writable by their owner, so anyone could
--      reset their own monthly counter and bypass the plan limit.
--   2. Template themes accepted any string instead of the known vocabulary.

-- 1) Enable RLS on every public table (defence in depth).
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('spatial_ref_sys')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.tablename);
  END LOOP;
END $$;

-- 2) Usage counters are read by the dashboard (SELECT) and written only by the
--    image endpoint through the service role. The per-owner INSERT/UPDATE
--    policies let a caller reset `requests_used` to zero and skip the limit.
DROP POLICY IF EXISTS "usage_stats_insert_own" ON public.usage_stats;
DROP POLICY IF EXISTS "usage_stats_update_own" ON public.usage_stats;
DROP POLICY IF EXISTS "daily_usage_stats_insert_own" ON public.daily_usage_stats;
DROP POLICY IF EXISTS "daily_usage_stats_update_own" ON public.daily_usage_stats;
DROP POLICY IF EXISTS "template_usage_insert_own" ON public.template_usage;
DROP POLICY IF EXISTS "template_usage_update_own" ON public.template_usage;

-- 3) Themes come from a fixed vocabulary; keep the column honest.
UPDATE public.templates
  SET theme = 'violet'
  WHERE theme NOT IN ('violet', 'ocean', 'ember', 'mint');

ALTER TABLE public.templates DROP CONSTRAINT IF EXISTS templates_theme_valid;
ALTER TABLE public.templates
  ADD CONSTRAINT templates_theme_valid
  CHECK (theme IN ('violet', 'ocean', 'ember', 'mint'));

-- 4) Partial index for the API-key lookup hot path (active keys only).
CREATE INDEX IF NOT EXISTS idx_api_keys_active_user
  ON public.api_keys (user_id) WHERE status = 'active';

-- 5) Append-only audit trail for security events. The service role writes it;
--    a user may read only their own rows.
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.security_audit_log TO service_role;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "security_audit_log_select_own" ON public.security_audit_log;
CREATE POLICY "security_audit_log_select_own" ON public.security_audit_log
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "security_audit_log_insert_service" ON public.security_audit_log;
CREATE POLICY "security_audit_log_insert_service" ON public.security_audit_log
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_created
  ON public.security_audit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_type_created
  ON public.security_audit_log (event_type, created_at DESC);
