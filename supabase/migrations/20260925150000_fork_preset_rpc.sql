-- Fork preset RPC function
-- Created: 2026-09-25

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

  -- Get the original preset data
  SELECT p INTO original_data
  FROM public.user_presets up,
  LATERAL jsonb_array_elements(up.data) AS p
  WHERE up.user_id = original_user_id
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

GRANT EXECUTE ON FUNCTION public.fork_preset TO authenticated;