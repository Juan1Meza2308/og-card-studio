-- Preset privacy: stop leaking author emails and stop forking private presets
-- Created: 2026-10-10
--
-- Two problems in the gallery surface:
--   1. `public_presets` exposed `author_email` to every visitor (anon included),
--      which is a plain PII leak. The card only needs a display name.
--   2. `fork_preset` is SECURITY DEFINER and read from `user_presets` without
--      checking `is_public`, so a caller who knew a private preset's name could
--      fork data they were never allowed to read.

-- Recreate the view without the email column. A plain DROP is required because
-- CREATE OR REPLACE cannot remove a column.
DROP VIEW IF EXISTS public.public_presets;
CREATE VIEW public.public_presets AS
SELECT
  up.user_id,
  p.id AS preset_id,
  p.name,
  p.title,
  p.subtitle,
  p.theme,
  p.template,
  p.created_at,
  u.raw_user_meta_data->>'full_name' AS author_name,
  u.raw_user_meta_data->>'avatar_url' AS author_avatar
FROM public.user_presets up,
LATERAL jsonb_array_elements(up.data) AS p
JOIN auth.users u ON u.id = up.user_id
WHERE up.is_public = true;

GRANT SELECT ON public.public_presets TO authenticated, anon;

-- Fork only from presets that are actually public.
CREATE OR REPLACE FUNCTION public.fork_preset(
  original_user_id uuid,
  original_name text,
  new_name text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  original_data jsonb;
  new_data jsonb;
  preset_exists boolean;
BEGIN
  -- Check if user already has a preset with the new name
  SELECT EXISTS (
    SELECT 1 FROM public.user_presets up,
    LATERAL jsonb_array_elements(up.data) AS p
    WHERE up.user_id = auth.uid()
    AND p->>'name' = new_name
  ) INTO preset_exists;

  IF preset_exists THEN
    RAISE EXCEPTION 'A preset with name "%" already exists', new_name;
  END IF;

  -- Get the original preset data, but only if it was shared publicly.
  SELECT p INTO original_data
  FROM public.user_presets up,
  LATERAL jsonb_array_elements(up.data) AS p
  WHERE up.user_id = original_user_id
  AND up.is_public = true
  AND p->>'name' = original_name
  LIMIT 1;

  IF original_data IS NULL THEN
    RAISE EXCEPTION 'Original preset not found';
  END IF;

  -- Update the name in the forked copy
  new_data := jsonb_set(original_data, '{name}', to_jsonb(new_name));

  -- Insert or update the current user's presets
  INSERT INTO public.user_presets (user_id, data, is_public)
  VALUES (auth.uid(), jsonb_build_array(new_data), false)
  ON CONFLICT (user_id) DO UPDATE SET
    data = up.data || jsonb_build_array(new_data),
    updated_at = now();

  -- Record the fork
  INSERT INTO public.preset_forks (original_user_id, original_preset_name, forked_by, forked_preset_name)
  VALUES (original_user_id, original_name, auth.uid(), new_name);
END;
$$;
